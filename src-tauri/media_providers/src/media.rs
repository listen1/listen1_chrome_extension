use crate::kugou::KugouSongInPlaylist;
use async_trait::async_trait;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct L1PlaylistInfo {
  pub id: String,
  pub cover_img_url: String,
  pub source_url: String,
  pub title: String,
}

#[derive(Debug, Serialize)]
pub struct L1Track {
  pub id: String,
  pub title: String,
  pub artist: String,
  pub artist_id: String,
  pub album_id: String,
  pub album: String,
  pub source: String,
  pub source_url: String,
  pub img_url: String,
  pub url: Option<String>,
}

impl From<&KugouSongInPlaylist> for L1Track {
  fn from(item: &KugouSongInPlaylist) -> Self {
    L1Track {
      id: format!("kgtrack_{}", item.hash),
      title: String::from(""),
      artist: String::from(""),
      artist_id: String::from(""),
      album: String::from(""),
      album_id: format!("kgalbum_{}", item.album_id),
      source: "".to_string(),
      source_url: item.build_track_source_url(),
      img_url: String::from(""),
      url: None,
      // lyric_url: item.hash
    }
  }
}

#[derive(Debug, Serialize)]
pub struct L1PlaylistDetail {
  pub info: L1PlaylistInfo,
  pub tracks: Vec<L1Track>,
}

#[derive(Debug, Serialize)]
pub struct L1Song {
  pub id: String,
  pub id2: String,
  pub title: String,
  pub artist: String,
  pub artist_id: String,
  pub album: String,
  pub album_id: String,
  pub img_url: String,
  pub source: String,
  pub source_url: String,
  pub url: Option<String>,
}

#[async_trait]
pub trait Provider {
  async fn get_playlists(&self, params: HashMap<String, String>) -> Vec<L1PlaylistInfo>;
  // async fn get_playlist_detail(playlist_id: &str) {}
}
