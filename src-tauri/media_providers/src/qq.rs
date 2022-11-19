use super::media::Playlist;
use crate::media::{PlaylistDetail, Provider, Track};
use async_trait::async_trait;
use rand;
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;

pub struct QQ<'a> {
  pub client: &'a Client,
}

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
struct PlaylistsResponse {
  data: ListItem,
}

#[derive(Debug, Deserialize)]
struct Singer {
  name: String,
  mid: String,
}

#[derive(Debug, Deserialize)]
struct SongData {
  songmid: String,
  songid: u32,
  songname: String,
  singer: Vec<Singer>,
  albumname: String,
  albummid: String,
}

impl SongData {}

#[derive(Debug, Deserialize)]
struct CDItem {
  logo: String,
  desc: String,
  dissname: String,
  songlist: Vec<SongData>,
}

#[derive(Debug, Deserialize)]
struct DetailResponse {
  cdlist: Vec<CDItem>,
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

fn build_playlist_detail_url(list_id: &str) -> String {
  format!(
    "https://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?\
            type=1&json=1&utf8=1&onlysong=0\
            &nosign=1&disstid={list_id}&g_tk=5381&loginUin=0&hostUin=0\
            &format=json&inCharset=GB2312&outCharset=utf-8&notice=0\
            &platform=yqq&needNewCode=0",
    list_id = list_id
  )
}

#[async_trait]
impl Provider for QQ<'_> {
  async fn get_playlists(&self, params: HashMap<String, String>) -> Vec<Playlist> {
    let url = build_playlist_url(params);
    let resp = self
      .client
      .get(url)
      .header("Referer", "https://y.qq.com")
      .header("Origin", "https://y.qq.com/")
      .send()
      .await
      .unwrap()
      .json::<PlaylistsResponse>()
      .await
      .unwrap();

    let mut playlists: Vec<Playlist> = Vec::new();

    for item in resp.data.list {
      let playlist = Playlist {
        id: "qqplaylist_".to_string() + &item.dissid,
        cover_img_url: item.imgurl,
        source_url: format!(
          "https://y.qq.com/n/ryqq/playlist/{dissid}",
          dissid = item.dissid
        ),
        title: item.dissname,
      };

      playlists.push(playlist);
    }

    return playlists;
  }
}

impl QQ<'_> {
  fn convert_to_listen1_song(song_data: &SongData) -> Track {
    let source_url = format!(
      "https://y.qq.com/#type=song&mid={}&tpl=yqq_song_detail",
      song_data.songmid
    );
    let first_singer = &song_data.singer[0];
    Track {
      id: format!("qqtrack_{}", song_data.songmid),
      // id2: format!("qqtrack_{}", songData.songid),
      // title: htmlDecode(songData.songname),
      title: song_data.songname.to_string(),
      // artist: htmlDecode(songData.singer[0].name),
      artist: first_singer.name.to_string(),
      artist_id: format!("qqartist_{}", first_singer.mid),
      // album: htmlDecode(songData.albumname),
      // album: songData.albumname.to_string(),
      // album_id: `qqalbum_{songData.albummid}`,
      album_id: format!("qqalbum_{}", song_data.albummid),
      // img_url: this.qq_get_image_url(songData.albummid, 'album'),
      img_url: "".to_string(),
      source: "qq".to_string(),
      source_url: source_url,
      // url: `qqtrack_{songData.songmid}`,
      // url: !qq.qq_is_playable(song) ? '' : undefined
      url: Some("".to_string()),
    }
  }

  pub async fn get_playlist_detail(playlist_id: &str) -> PlaylistDetail {
    let url = build_playlist_detail_url(playlist_id);
    println!("get_playlist_detail, {}", url);
    let client = reqwest::Client::builder().build().unwrap();

    let resp = client
      .get(url)
      .header("Referer", "http://y.qq.com")
      .header("Origin", "http://y.qq.com/")
      .send()
      .await
      .unwrap()
      .json::<DetailResponse>()
      .await
      .unwrap();

    let first = &resp.cdlist[0];
    let playlist = Playlist {
      cover_img_url: first.logo.to_string(),
      title: first.dissname.to_string(),
      id: format!("qqplaylist_{}", playlist_id),
      source_url: format!("https://y.qq.com/n/ryqq/playlist/{}", playlist_id),
    };
    let tracks = first
      .songlist
      .iter()
      .map(|x| QQ::convert_to_listen1_song(&x))
      .collect::<Vec<Track>>();
    let detail = PlaylistDetail {
      info: playlist,
      tracks: tracks,
    };

    return detail;
  }
}
