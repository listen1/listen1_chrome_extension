use crate::media::{L1PlaylistDetail, L1PlaylistInfo, L1Track, Provider};
use async_trait::async_trait;
use futures;
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;

const HOST: &'static str = "https://www.kuwo.cn";

fn build_playlist_url(params: HashMap<String, String>) -> String {
  let page: u32 = params.get("page").unwrap().parse().unwrap();

  format!(
    "http://m.kugou.com/plist/index&json=true&page={page}",
    page = page,
  )
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
pub struct KugouSongInPlaylist {
  pub hash: String,
  pub album_id: String,
}

impl KugouSongInPlaylist {
  pub fn build_track_source_url(&self) -> String {
    format!(
      "https://www.kugou.com/song/#hash={hash}&album_id={album_id}",
      hash = self.hash,
      album_id = self.album_id
    )
  }

  async fn get_album(&self, client: &Client) -> AlbumData {
    let url = format!(
      "http://mobilecdnbj.kugou.com/api/v3/album/info?albumid={}",
      self.album_id
    );

    let result = client
      .get(&url)
      .header("Referer", "https://www.kugou.com/")
      .header("Origin", "https://www.kugou.com/")
      .send()
      .await
      .unwrap()
      .json::<AlbumResponse>()
      .await;

    match result {
      Ok(album_response) => album_response.data,
      Err(e) => {
        println!("get_album failed for url {}", url);
        println!("Error is {}", e);
        AlbumData {
          albumname: String::from(""),
        }
      }
    }
  }

  async fn get_song_info(&self, client: &Client) -> SongInfo {
    let url = format!(
      "http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash={}",
      self.hash
    );

    let result = client
      .get(&url)
      .header("Referer", "https://www.kugou.com/")
      .header("Origin", "https://www.kugou.com/")
      .send()
      .await
      .unwrap()
      .json::<SongInfo>()
      .await;

    result.unwrap_or_else(|e| {
      println!("get_song_info error: {}", e);

      SongInfo {
        song_name: "".to_string(),
        singer_name: "".to_string(),
        singer_id: 0,
        album_img: "".to_string(),
      }
    })
  }
}

#[derive(Debug, Deserialize)]
pub struct KugouPlaylist {
  info: Vec<KugouPlaylistDetail>,
}

#[derive(Debug, Deserialize)]
pub struct KugouPlaylistListInfo {
  info: Vec<KugouSongInPlaylist>,
}

#[derive(Debug, Deserialize)]
pub struct Plist {
  pub list: KugouPlaylist,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistsResponse {
  plist: Plist,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistInfo {
  list: KugouPlaylistDetail,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistList {
  list: KugouPlaylistListInfo,
}

#[derive(Debug, Deserialize)]
pub struct AlbumSong {
  list: KugouPlaylistListInfo,
}

#[derive(Debug, Deserialize)]
struct PlaylistResponse {
  info: PlaylistInfo,
  list: PlaylistList,
}

#[derive(Debug, Deserialize)]
struct SongInfo {
  #[serde(rename(deserialize = "songName"))]
  song_name: String,
  #[serde(rename(deserialize = "singerName"))]
  singer_name: String,
  #[serde(rename(deserialize = "singerId"))]
  singer_id: u64,
  album_img: String,
}

#[derive(Debug, Deserialize)]
struct AlbumData {
  albumname: String,
}

#[derive(Debug, Deserialize)]
struct AlbumResponse {
  data: AlbumData,
}

#[async_trait]
impl Provider for Kugou<'_> {
  async fn get_playlists(&self, params: HashMap<String, String>) -> Vec<L1PlaylistInfo> {
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

    let mut playlists: Vec<L1PlaylistInfo> = Vec::new();

    for item in resp.plist.list.info {
      let playlist = L1PlaylistInfo {
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

impl Kugou<'_> {
  fn to_playlist(&self, playlist: &KugouPlaylistDetail) -> L1PlaylistInfo {
    L1PlaylistInfo {
      cover_img_url: playlist.imgurl.replace("{size}", "400"),
      title: playlist.specialname.to_string(),
      id: playlist.specialid.to_string(),
      source_url: format!(
        "https://www.kugou.com/yy/special/single/{}.html",
        playlist.specialid
      ),
    }
  }

  async fn get_tracks(&self, items: &KugouPlaylistListInfo) -> Vec<L1Track> {
    let tasks: Vec<_> = items
      .info
      .iter()
      .map(move |playlist_song| async {
        let mut track: L1Track = playlist_song.into();
        let album_data = playlist_song.get_album(self.client).await;
        let song_info = playlist_song.get_song_info(self.client).await;

        track.album = album_data.albumname;
        track.title = song_info.song_name;
        if song_info.singer_id == 0 {
          track.artist = String::from("未知")
        } else {
          track.artist = song_info.singer_name;
        }
        track.artist_id = format!("kgartist_{}", song_info.singer_id);
        if song_info.album_img != "" {
          track.img_url = song_info.album_img.replace("{size}", "400");
        } else {
        }

        track
      })
      .collect();

    futures::future::join_all(tasks).await
  }

  pub async fn get_playlist_detail(&self, playlist_id: &str) -> L1PlaylistDetail {
    let url = format!(
      "http://m.kugou.com/plist/list/{playlist_id}?json=true",
      playlist_id = playlist_id
    );

    let builder = self
      .client
      .get(url)
      .header("Referer", "https://www.kugou.com/")
      .header("Origin", "https://www.kugou.com/");

    let resp = builder
      .send()
      .await
      .unwrap()
      .json::<PlaylistResponse>()
      .await
      .unwrap();

    let playlist = self.to_playlist(&resp.info.list);

    let tracks = self.get_tracks(&resp.list.list).await;
    let detail = L1PlaylistDetail {
      info: playlist,
      tracks: tracks,
    };

    return detail;
  }
}
