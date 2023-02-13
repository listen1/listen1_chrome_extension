use crate::utils::generate_uuid;
use chrono::Utc;
use md5::{Digest, Md5};
use reqwest::{header, Client};
use serde::{Deserialize, Serialize};
use serde_qs;
use std::collections::HashMap;
use std::fmt::{format, Display, Formatter};
use url::Url;

#[derive(Debug, Serialize)]
#[serde(untagged)]
enum SearchSwitch {
  Song,
  SongList,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchParams {
  #[serde(rename = "text")]
  keyword: String,
  page: u64,
  sid: String,
  is_correct: u8,
  is_copyright: u8,
  #[serde(skip_serializing)]
  search_switch: SearchSwitch,
  page_size: u8,
  feature: String,
  sort: u8,
}

#[derive(Debug, Serialize)]
struct SongInPlaylist {
  id: String,
  id2: String,
  title: String,
  artist: String,
  artist_id: String,
  album: String,
  album_id: String,
  source: String,
  source_url: String,
  img_url: String,
  lyric_url: String,
  tlyric_url: String,
  quality: String,
  url: Option<String>,
  song_id: String,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
  total: u32,
  result: Vec<SongInPlaylist>,
}

impl Default for SongInPlaylist {
  fn default() -> Self {
    Self {
      id: "".to_string(),
      id2: "".to_string(),
      title: "".to_string(),
      artist: "".to_string(),
      artist_id: "".to_string(),
      album: "".to_string(),
      album_id: "".to_string(),
      source: "migu".to_string(),
      source_url: "".to_string(),
      img_url: "".to_string(),
      lyric_url: "".to_string(),
      tlyric_url: "".to_string(),
      quality: "".to_string(),
      url: None,
      song_id: "".to_string(),
    }
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AlbumImage {
  img: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Artist {
  id: String,
  name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchItem {
  album: String,
  album_id: String,
  album_imgs: Vec<AlbumImage>,
  artists: Option<Vec<Artist>>,
  copyright: String,
  copyright_id: String,
  singer: String,
  singer_id: String,
  song_id: String,
  song_name: String,
  id: String,
  lrc_url: Option<String>,
  trc_url: Option<String>,
  tone_control: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchResultData {
  total_count: String,
  result: Vec<SearchItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchResponse {
  code: String,
  result_num: u32,
  info: String,
  song_result_data: SearchResultData,
}

impl Default for SearchParams {
  fn default() -> Self {
    Self {
      keyword: "".to_string(),
      page: 0,
      sid: generate_uuid(false) + &generate_uuid(false),
      is_correct: 1,
      is_copyright: 1,
      search_switch: SearchSwitch::Song,
      page_size: 20,
      feature: "1000000000".to_string(),
      sort: 1,
    }
  }
}

impl SearchParams {
  pub fn build_url(&self) -> Url {
    let mut url = Url::parse("https://jadeite.migu.cn/music_search/v2/search/searchAll").unwrap();

    let switch_kind = match self.search_switch {
      SearchSwitch::Song => r#"{"song":1}"#,
      SearchSwitch::SongList => r#"{"songlist":1}"#,
    };
    let query = serde_qs::to_string(&self).unwrap();
    let query = format!("{}&searchSwitch={}", query, switch_kind);
    url.set_query(Some(query.as_str()));

    url
  }

  pub fn from_query(query: &HashMap<String, String>) -> Self {
    let mut params: SearchParams = Default::default();

    for (key, value) in query.iter() {
      match key.as_str() {
        "keyword" => {
          params.keyword = value.to_string();
        }
        "page" => {
          params.page = value.parse().unwrap();
        }
        _ => {}
      }
    }

    params
  }
}

pub struct Migu<'a> {
  pub client: &'a Client,
}

fn create_md5(data: impl AsRef<[u8]>) -> String {
  let mut hasher = Md5::new();
  hasher.update(data);
  let hasher_output = hasher.finalize();

  format!("{:x}", hasher_output)
}

impl Migu<'_> {
  pub fn create_client() -> Client {
    let mut headers = header::HeaderMap::new();
    // let origin =
    //   header::HeaderValue::from_static("http://music.migu.cn/v3/music/player/audio?from=migu");
    // headers.insert("Origin", origin.clone());
    // headers.insert("Refer", origin);
    headers.insert(
      "uiVersion",
      header::HeaderValue::from_static("A_music_3.3.0"),
    );

    Client::builder()
      .http1_title_case_headers()
      .default_headers(headers)
      .build()
      .unwrap()
  }

  fn build_search_headers(keyword: &str) -> header::HeaderMap {
    let mut headers = header::HeaderMap::new();
    headers.insert("appId", header::HeaderValue::from_static("yyapp2"));
    headers.insert(
      "uiVersion",
      header::HeaderValue::from_static("A_music_3.3.0"),
    );

    headers.insert("version", header::HeaderValue::from_static("7.0.4"));

    let now = Utc::now();
    let timestamp = now.timestamp_millis().to_string();
    headers.insert(
      "timestamp",
      header::HeaderValue::from_str(&timestamp).unwrap(),
    );

    let device_id = create_md5(generate_uuid(false)).to_uppercase();
    headers.insert(
      "deviceId",
      header::HeaderValue::from_str(&device_id).unwrap(),
    );

    let signature_md5 = "6cdc72a439cef99a3418d2a78aa28c73";
    let sign = create_md5(format!(
      "{keyword}{signature_md5}yyapp2d16148780a1dcc7408e06336b98cfd50{device_id}{timestamp}"
    ))
    .to_lowercase();
    headers.insert("sign", header::HeaderValue::from_str(&sign).unwrap());

    headers
  }

  pub async fn search(&self, params: SearchParams) -> SearchResult {
    let url = params.build_url();
    let headers = Migu::build_search_headers(&params.keyword);

    let response = self
      .client
      .get(url)
      .headers(headers)
      .send()
      .await
      .unwrap()
      .json::<SearchResponse>()
      .await
      .unwrap();

    let result = response
      .song_result_data
      .result
      .iter()
      .map(|x: &SearchItem| {
        let mut song: SongInPlaylist = Default::default();
        song.id = format!("mgtrack_{}", x.copyright_id);
        song.id2 = format!("mgtrack_{}", x.song_id);
        song.title = x.song_name.to_string();

        match x.artists {
          Some(ref artists) => {
            song.artist = artists[0].name.to_string();
            song.artist_id = artists[0].id.to_string();
          }
          _ => {
            song.artist = x.singer.to_string();
            song.artist_id = x.singer_id.to_string();
          }
        }

        if x.album_id != "1" {
          song.album = x.album.to_string();
          song.album_id = format!("mgalbum_{}", x.album_id);
        } else {
          song.album = "".to_string();
          song.album_id = "mgalbum_".to_string();
        }

        song.source_url = format!("https://music.migu.cn/v3/music/song/{}", x.copyright_id);
        song.img_url = x.album_imgs[0].img.to_string();
        if let Some(ref lyric_url) = x.lrc_url {
          song.lyric_url = lyric_url.to_string();
        }
        if let Some(ref tlyric_url) = x.trc_url {
          song.tlyric_url = tlyric_url.to_string();
        }

        song.quality = x.tone_control.to_string();

        let result: i8 = x.copyright.parse().unwrap();
        if result == 0 {
          song.url = Some("".to_string());
        } else {
          song.url = None;
        }

        song.song_id = x.song_id.to_string();

        song
      })
      .collect::<Vec<SongInPlaylist>>();

    // println!("migu search with {:#?}", result);

    SearchResult {
      total: response.song_result_data.total_count.parse().unwrap(),
      result,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::migu::{Migu, SearchParams};
  use std::collections::HashMap;

  #[test]
  fn build_search_url() {
    let client = Migu::create_client();
    let migu = Migu { client: &client };

    let mut query = HashMap::new();
    query.insert("keyword".to_string(), "song_name".to_string());
    query.insert("page".to_string(), "1".to_string());

    let params = SearchParams::from_query(&query);

    let url = params.build_url();

    let pairs = url.query_pairs();

    let xy = format!(
      r#"text=song_name&page=1&sid={}&isCorrect=1&isCopyright=1&pageSize=20&feature=1000000000&sort=1&searchSwitch={{%22song%22:1}}"#,
      params.sid
    );
    let x = xy.as_str();
    assert_eq!(url.query(), Some(x));

    println!("{:?}", Migu::build_search_headers(&params.keyword));
  }
}
