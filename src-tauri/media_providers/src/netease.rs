use super::media::{Playlist, PlaylistDetail, Provider};
use super::utils::create_url;
use async_trait::async_trait;
use kuchiki::traits::TendrilSink;
use kuchiki::{parse_html, NodeRef};
use reqwest::Client;
use serde::Serialize;
use std::collections::HashMap;
use url::Url;

pub struct Netease<'a> {
  pub client: &'a Client,
}

const PLAYLIST_URL: &'static str = "https://music.163.com/discover/playlist";

fn build_playlist_url(param: HashMap<String, String>) -> String {
  let mut items: Vec<(String, String)> = vec![];
  let order = param.get("order").unwrap().to_string();
  let offset = param.get("offset").unwrap().parse().unwrap();

  items.push(("order".to_string(), order));
  items.push(("offset".to_string(), offset));

  if let Some(val) = param.get("category_id") {
    items.push(("cat".to_string(), val.to_string()));
  }
  let url = Url::parse_with_params(PLAYLIST_URL, &items).unwrap();

  url.to_string()
}

#[async_trait]
impl Provider for Netease<'_> {
  async fn get_playlists(&self, params: HashMap<String, String>) -> Vec<Playlist> {
    let url = build_playlist_url(params);
    let resp = self
      .client
      .get(url)
      // .header("Referer", "http://music.163.com/")
      // .header("Origin", "http://music.163.com/")
      .send()
      .await
      .unwrap()
      .text()
      .await
      .unwrap();

    let document = parse_html().one(resp);
    let list_element = document.select_first(".m-cvrlst").unwrap();
    let mut playlists: Vec<Playlist> = Vec::new();
    for data in list_element.as_node().select("li").unwrap() {
      let playlist = Netease::create_playlist(&data.as_node());
      playlists.push(playlist);
    }

    return playlists;
  }

  // async fn get_playlist_detail<T>(params: T) -> PlaylistDetail {
  //   todo!()
  // }
}

impl Netease<'_> {
  fn create_playlist(node_ref: &NodeRef) -> Playlist {
    let cover_node = node_ref.select_first("img").unwrap();
    // let cover_node = cover_node.as_node();
    let cover_url = cover_node
      .attributes
      .borrow()
      .get("src")
      .unwrap()
      .replace("140y140", "512y512");

    let title_container = node_ref.select_first("div").unwrap();
    let anchor_el = title_container.as_node().select_first("a").unwrap();
    let anchor_attrs = anchor_el.attributes.borrow();
    let title = anchor_attrs.get("title").unwrap().to_string();
    let href = anchor_attrs.get("href").unwrap();
    let url = create_url(href).unwrap();
    let pair = url
      .query_pairs()
      .find(|(name, value)| name == "id")
      .unwrap();

    let mut id = "neplaylist_".to_string();
    let playlist_id = &pair.1.into_owned();
    id.push_str(playlist_id);
    let mut source_url = "https://music.163.com/#/playlist?id=".to_string();
    source_url.push_str(playlist_id);
    let playlist = Playlist {
      id,
      cover_img_url: cover_url,
      source_url,
      title,
    };

    playlist
  }
}
