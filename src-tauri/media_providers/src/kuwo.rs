use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use url::Url;

const HOST: &'static str = "https://www.kuwo.cn";
const SONG_URL: &'static str = "https://antiserver.kuwo.cn/anti.s";

pub struct Kuwo<'a> {
  pub client: &'a Client,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SearchedSong {
  pub rid: i32,
  pub name: String,
  pub artist: String,
  pub artistid: i32,
  pub album: String,
  pub albumid: String,
  pub pic: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SearchResult {
  pub total: String,
  pub list: Vec<SearchedSong>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SearchResponse {
  pub data: SearchResult,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UrlResponse {
  pub data: String,
}

impl Kuwo<'_> {
  pub async fn get_cookie(&self) -> String {
    let resp: HashMap<String, String> = self
      .client
      .head("https://www.kuwo.cn")
      .send()
      .await
      .unwrap()
      .cookies()
      .map(|i| (i.name().to_string(), i.value().to_string()))
      .collect();

    println!("refreshed kw_token is {}", resp.get("kw_token").unwrap());
    resp.get("kw_token").unwrap().to_string()
  }

  pub async fn search(&self, params: HashMap<String, String>) -> SearchResponse {
    match params.get("api") {
      Some(val) => {
        if val == "searchMusicBykeyWord" {
          self.search_song_by_keyword(params).await
        } else {
          self.search_song_by_keyword(params).await
        }
      }
      _ => self.search_song_by_keyword(params).await,
    }
  }

  pub async fn search_song_by_keyword(&self, params: HashMap<String, String>) -> SearchResponse {
    let token = self.get_cookie().await;

    let mut items: Vec<(String, String)> = vec![];
    let keyword = params.get("keyword").unwrap().to_string();
    let page_number = params.get("curpage").unwrap().parse().unwrap();
    items.push(("key".to_string(), keyword));
    items.push(("pn".to_string(), page_number));

    let url = format!("{}/api/www/search/searchMusicBykeyWord", HOST);
    let url = Url::parse_with_params(&url, &items).unwrap();
    let response = self
      .client
      .get(url)
      .header("Referer", HOST)
      .header("CSRF", token)
      .send()
      .await
      .unwrap()
      .json::<SearchResponse>()
      .await
      .unwrap();

    response
  }

  pub async fn get_track(&self, song_id: &str) -> String {
    let url = Kuwo::build_track_url(song_id);
    let token = self.get_cookie().await;

    let song_url = self
      .client
      .get(url)
      .header("Referer", HOST)
      .header("CSRF", token)
      .send()
      .await
      .unwrap()
      .text()
      .await
      .unwrap();

    song_url
  }

  pub fn build_track_url(song_id: &str) -> String {
    let mut params: HashMap<String, String> = HashMap::new();
    params.insert("type".to_string(), "convert_url".to_string());
    params.insert("format".to_string(), "mp3".to_string());
    params.insert("response".to_string(), "url".to_string());
    params.insert("rid".to_string(), song_id.to_string());

    let url = Url::parse_with_params(SONG_URL, &params).unwrap();

    return url.to_string();
  }
}
