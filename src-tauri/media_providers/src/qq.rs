use super::playlist::Playlist;
use super::utils::create_url;
use kuchiki::{parse_html, NodeRef};
use serde::Deserialize;
use rand;

pub struct QQService;

#[derive(Deserialize)]
struct Item {
  dissid: String,
  imgurl: String,
  dissname: String
}

#[derive(Deserialize)]
struct ListItem {
  list: Vec<Item>
}


#[derive(Deserialize)]
struct PlaylistResponse {
  data: ListItem
}

#[derive(Debug, Deserialize)]
pub struct PlaylistParams {
  pub category_id: String,
  pub offset: u32,
}

fn build_playlist_url(category_id: &str, offset: u32) -> String {
  let random_num = rand::random::<f64>();
  return format!(
    "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg\
      ?picmid=1&rnd={random_num}&g_tk=732560869\
      &loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8\
      &notice=0&platform=yqq.json&needNewCode=0\
      &categoryId={category_id}&sortId=5&sin={start_offset}&ein={end_offset}
  ",
    random_num = random_num,
    category_id = category_id,
    start_offset = offset,
    end_offset = 29 + offset
  );
}

impl QQService {
  pub async fn get_playlist(params: PlaylistParams) -> Vec<Playlist> {
    let client = reqwest::Client::builder().build().unwrap();

    let url = build_playlist_url(&params.category_id, params.offset);
    let resp = client
      .get(url)
      .header("Referer", "https://y.qq.com")
      .header("Origin", "https://y.qq.com/")
      .send()
      .await
      .unwrap()
      .json::<PlaylistResponse>()
      .await
      .unwrap();

    let mut playlists: Vec<Playlist> = Vec::new();

    for item in resp.data.list {
      let playlist = Playlist {
        id: "qqplaylist_".to_string() + &item.dissid,
        cover_img_url: item.imgurl,
        source_url: format!("https://y.qq.com/n/ryqq/playlist/${dissid}", dissid = item.dissid),
        title: item.dissname,
      };

      playlists.push(playlist);
    }

    return playlists;
  }
}
