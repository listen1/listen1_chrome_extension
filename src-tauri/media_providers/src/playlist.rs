use serde::{Serialize};

#[derive(Debug, Serialize)]
pub struct Playlist {
  pub id: String,
  pub cover_img_url: String,
  pub source_url: String,
  pub title: String,
}
