use super::media::{Playlist, Provider};
use super::utils::create_url;
use async_trait::async_trait;
use kuchiki::traits::TendrilSink;
use kuchiki::{parse_html, NodeRef};
use rand;
use rand::Rng;
use reqwest::{cookie, Client};
use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::string::String;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use url::Url;

pub struct Netease<'a> {
  pub client: &'a Client,
}

const HOST: &'static str = "https://music.163.com";
const PLAYLIST_URL: &'static str = "https://music.163.com/discover/playlist";
const SECRET_CHARS: &'static str = "012345679abcdef";

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

fn get_time() -> u64 {
  let start = SystemTime::now();
  let since_the_epoch = start
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards");

  let in_ms = since_the_epoch.as_secs() * 1000 + since_the_epoch.subsec_nanos() as u64 / 1_000_000;

  in_ms
}

impl Netease<'_> {
  fn create_secret_key(size: u8) -> String {
    let mut rng = rand::thread_rng();
    let mut result: Vec<char> = vec![];
    let mut chars = SECRET_CHARS.chars();
    let range = 0..chars.count();

    for i in 0..size {
      let index = rng.gen_range(range.clone());
      result.push(SECRET_CHARS.chars().nth(index).unwrap())
    }

    result.iter().collect()
  }

  pub fn create_cookie_jar() -> cookie::Jar {
    let uid = Netease::create_secret_key(32);
    let time = get_time();
    let nid = format!("{uid},{timestamp}", uid = uid, timestamp = time);

    let expire_at = (time + 1000 * 60 * 60 * 24 * 365 * 100) / 1000;
    println!("nid is {:?}", nid);

    let url = HOST.parse::<Url>().unwrap();
    let uid_cookie = format!(
      "_ntes_nuid={}; expires={}; Domain={}",
      uid,
      expire_at,
      url.domain().unwrap()
    );
    let nid_cookie = format!(
      "_ntes_nnid={}; expires={}; Domain={}",
      uid,
      expire_at,
      url.domain().unwrap()
    );

    let jar = cookie::Jar::default();
    jar.add_cookie_str(&uid_cookie, &url);
    jar.add_cookie_str(&nid_cookie, &url);

    jar
  }

  pub fn create_client() -> Client {
    let jar = Netease::create_cookie_jar();

    Client::builder()
      .cookie_provider(Arc::new(jar))
      .build()
      .unwrap()
  }

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
