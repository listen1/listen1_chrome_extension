use crate::media::{L1PlaylistDetail, L1PlaylistInfo, L1Track, Provider};
use async_trait::async_trait;
use futures;
use reqwest::{header, Client};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use url::Url;

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

#[derive(Debug, Deserialize)]
struct Singer {
  id: u64,
  name: String,
  ip_id: u64,
}

#[derive(Debug, Deserialize)]
struct SearchResultItems {
  #[serde(rename(deserialize = "FileHash"))]
  file_hash: String,
  #[serde(rename(deserialize = "SongName"))]
  song_name: String,
  #[serde(rename(deserialize = "AlbumName"))]
  album_name: String,
  #[serde(rename(deserialize = "AlbumID"))]
  album_id: String,
  #[serde(rename(deserialize = "Singers"))]
  singers: Vec<Singer>,
  #[serde(rename(deserialize = "SingerId"))]
  singer_id: Vec<u64>,
  #[serde(rename(deserialize = "SingerName"))]
  singer_name: String,
}

#[derive(Debug, Deserialize)]
struct SearchResponseData {
  total: u64,
  lists: Vec<SearchResultItems>,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
  data: SearchResponseData,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
  total: u64,
  lists: Vec<L1Track>,
}

#[derive(Debug, Deserialize)]
struct Song {
  hash: Option<String>,
  img: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SongResponse {
  status: u32,
  err_code: u32,
  data: Song,
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
  pub fn create_client() -> Client {
    let mut headers = header::HeaderMap::new();
    headers.insert(
      "Referer",
      header::HeaderValue::from_static("https://www.kugou.com/"),
    );
    headers.insert(
      "Origin",
      header::HeaderValue::from_static("https://www.kugou.com/"),
    );

    Client::builder().default_headers(headers).user_agent("Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30").build().unwrap()
  }
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
    let url = format!("http://m.kugou.com/plist/list/{playlist_id}?json=true");

    let resp = self
      .client
      .get(url)
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

  async fn get_song(&self, file_hash: &str) -> Song {
    let url = format!(
      "https://www.kugou.com/yy/index.php?r=play/getdata&hash={}",
      file_hash
    );
    let response = self
      .client
      .get(&url)
      .header(header::COOKIE, "kg_mid=3333")
      .send()
      .await
      .unwrap()
      .json::<SongResponse>()
      .await
      .unwrap();

    // let response1 = self
    //   .client
    //   .get(&url)
    //   .header(header::COOKIE, "kg_mid=3333")
    //   .send()
    //   .await
    //   .unwrap()
    //   .text()
    //   .await
    //   .unwrap();

    println!("get song {:?}", response);

    response.data
  }

  pub async fn search(&self, params: HashMap<String, String>) -> SearchResult {
    let search_url = Url::parse_with_params(
      "https://songsearch.kugou.com/song_search_v2",
      Vec::from_iter(params.iter()),
    )
    .unwrap();

    let response = self
      .client
      .get(search_url)
      .send()
      .await
      .unwrap()
      .json::<SearchResponse>()
      .await
      .unwrap();

    let tasks: Vec<_> = response
      .data
      .lists
      .into_iter()
      .map(|item| async move {
        let mut track = L1Track {
          id: format!("kgtrack_{}", item.file_hash),
          title: item.song_name,
          artist: "".to_string(),
          artist_id: "".to_string(),
          album_id: format!("kgalbum_{}", item.album_id),
          album: item.album_name,
          source: "kugou".to_string(),
          source_url: format!(
            "https://www.kugou.com/song/#hash={}&album_id={}",
            item.file_hash, item.album_id
          ),
          img_url: "".to_string(),
          // url: format!("kgtrack_{}", item.file_hash),
          url: None,
          // lyric_url: item.file_hash,
        };
        let singer_id = item.singer_id;
        let singer_name = item.singer_name;
        // if (item.SingerId instanceof Array) {
        //   [singer_id] = singer_id;
        //   [singer_name] = singer_name.split('、');
        // }
        track.artist = singer_name;
        track.artist_id = format!("kgartist_{}", singer_id[0]);

        let song = self.get_song(&item.file_hash).await;
        track.img_url = song.img.unwrap_or_else(|| "".into());

        track
      })
      .collect();

    let tracks = futures::future::join_all(tasks).await;

    println!("kugou searched tracks length is {:?}", tracks.len());

    SearchResult {
      total: response.data.total,
      lists: tracks,
    }
  }
}
