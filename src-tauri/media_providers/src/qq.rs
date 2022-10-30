use super::media::Playlist;
use crate::media::Provider;
use async_trait::async_trait;
use rand;
use serde::Deserialize;
use std::collections::HashMap;

pub struct QQ;

#[derive(Deserialize)]
struct Item {
    dissid: String,
    imgurl: String,
    dissname: String,
}

#[derive(Deserialize)]
struct ListItem {
    list: Vec<Item>,
}

#[derive(Deserialize)]
struct PlaylistResponse {
    data: ListItem,
}

fn build_playlist_url(params: HashMap<String, String>) -> String {
    let category_id = params.get("category_id").unwrap().to_string();
    let offset: u32 = params.get("offset").unwrap().parse().unwrap();

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

#[async_trait]
impl Provider for QQ {
    async fn get_playlists(params: HashMap<String, String>) -> Vec<Playlist> {
        let client = reqwest::Client::builder().build().unwrap();

        let url = build_playlist_url(params);
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
                source_url: format!(
                    "https://y.qq.com/n/ryqq/playlist/${dissid}",
                    dissid = item.dissid
                ),
                title: item.dissname,
            };

            playlists.push(playlist);
        }

        return playlists;
    }
}
