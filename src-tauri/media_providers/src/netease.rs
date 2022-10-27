use super::playlist::Playlist;
use super::utils::create_url;
use kuchiki::traits::TendrilSink;
use kuchiki::{parse_html, NodeRef};
use serde::Serialize;
use url::Url;

pub struct NeteaseService;

const PLAYLIST_URL: &'static str = "https://music.163.com/discover/playlist";

fn build_playlist_url(data: PlaylistParams) -> String {
  let mut params: Vec<(String, String)> = vec![];
  params.push(("order".to_string(), data.order));
  params.push(("offset".to_string(), data.offset.to_string()));
  match data.category_id {
    Some(x) => {
      params.push(("cat".to_string(), x));
    },
    _ => {}
  }
  let url = Url::parse_with_params(PLAYLIST_URL, &params).unwrap();

  url.to_string()
}

pub struct PlaylistParams {
  pub order: String,
  pub offset: u32,
  pub category_id: Option<String>,
}

impl NeteaseService {
  pub async fn get_playlist(params: PlaylistParams) -> Vec<Playlist> {
    let client = reqwest::Client::builder().build().unwrap();

    let url = build_playlist_url(params);
    let resp = client.get(url)
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
      let playlist = NeteaseService::create_playlist(&data.as_node());
      playlists.push(playlist);
    }

    return playlists;
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
