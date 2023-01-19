use crate::media::{Playlist, Provider, Track};
use async_trait::async_trait;
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;

const HOST: &'static str = "https://www.kuwo.cn";

fn build_playlist_url(params: HashMap<String, String>) -> String {
  let page: u32 = params.get("page").unwrap().parse().unwrap();

  return format!(
    "http://m.kugou.com/plist/index&json=true&page={page}",
    page = page,
  );
}

#[derive(Debug)]
pub struct Kugou<'a> {
  pub client: &'a Client,
}

#[derive(Debug, Deserialize)]
pub struct KugouPlaylistDetail {
  imgurl: String,
  specialname: String,
  specialid: i64,
}

#[derive(Debug, Deserialize)]
pub struct KugouPlaylist {
  info: Vec<KugouPlaylistDetail>,
}

#[derive(Debug, Deserialize)]
pub struct Plist {
  pub list: KugouPlaylist,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistsResponse {
  plist: Plist,
}

#[async_trait]
impl Provider for Kugou<'_> {
  async fn get_playlists(&self, params: HashMap<String, String>) -> Vec<Playlist> {
    let url = build_playlist_url(params);
    let resp = self
      .client
      .get(url)
      .send()
      .await
      .unwrap()
      .json::<PlaylistsResponse>()
      .await
      .unwrap();

    let mut playlists: Vec<Playlist> = Vec::new();

    for item in resp.plist.list.info {
      let playlist = Playlist {
        id: "kgplaylist_".to_string() + &item.specialid.to_string(),
        cover_img_url: {
          item.imgurl.replace("{size}", "400")
          // if item.imgurl.parse().unwrap() {
          // } else {
          //   String::from("")
          // }
        },
        source_url: format!(
          "https://www.kugou.com/yy/special/single/{specialid}.html",
          specialid = item.specialid
        ),
        title: item.specialname,
      };

      playlists.push(playlist);
    }

    return playlists;
  }
}
