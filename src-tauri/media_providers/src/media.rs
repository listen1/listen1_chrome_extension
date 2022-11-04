use async_trait::async_trait;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct Playlist {
    pub id: String,
    pub cover_img_url: String,
    pub source_url: String,
    pub title: String,
}

#[derive(Debug, Serialize)]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub artist_id: String,
    pub album_id: String,
    pub source: String,
    pub source_url: String,
    pub img_url: String,
    pub url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PlaylistDetail {
    pub info: Playlist,
    pub tracks: Vec<Track>,
}

#[derive(Debug, Serialize)]
pub struct Song {
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
    async fn get_playlists(params: HashMap<String, String>) -> Vec<Playlist>;
    // async fn get_playlist_detail(playlist_id: &str) {}
}
