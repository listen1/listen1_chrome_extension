use axum::http::StatusCode;
use axum::{
  error_handling::HandleErrorLayer,
  extract::{Path, Query, State},
  routing::{get, post},
  BoxError, Form, Json, Router,
};
use listen1::{
  kugou::Kugou,
  kuwo::Kuwo,
  media::Provider,
  migu,
  netease::{Netease, NeteaseFormData},
  qq::QQ,
};
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tauri::App;
use tower::ServiceBuilder;
use tower_http::{
  cors::{Any, CorsLayer},
  trace::TraceLayer,
};

async fn handle_timeout_error(err: BoxError) -> (StatusCode, String) {
  if err.is::<tower::timeout::error::Elapsed>() {
    (
      StatusCode::REQUEST_TIMEOUT,
      "Request took too long".to_string(),
    )
  } else {
    (
      StatusCode::INTERNAL_SERVER_ERROR,
      format!("Unhandled internal error: {}", err),
    )
  }
}

#[derive(Debug)]
struct AppState {
  clients: HashMap<String, Client>,
}

pub fn start(_app_handle: &App) {
  tauri::async_runtime::spawn(async move {
    tracing_subscriber::fmt::init();

    let netease_client = Netease::create_client();
    let qq_client = Client::builder().build().unwrap();
    let kugou_client = Kugou::create_client();
    let kuwo_client = Kuwo::create_client();
    let migu_client = migu::Migu::create_client();

    let mut clients = HashMap::new();
    clients.insert(String::from("netease"), netease_client);
    clients.insert(String::from("qq"), qq_client);
    clients.insert(String::from("kuwo"), kuwo_client);
    clients.insert(String::from("kugou"), kugou_client);
    clients.insert(String::from("migu"), migu_client);

    let app_state = Arc::new(AppState { clients });

    let cors = CorsLayer::new().allow_origin(Any);
    let app = Router::new()
      .route("/", get(|| async { "Hello, World!" }))
      .route("/:provider_name/playlists", get(get_playlists))
      .route(
        "/:provider_name/playlist/:playlist_id",
        get(get_playlist).post(get_playlist_with_params),
      )
      .route("/:provider_name/search", get(search))
      .route("/:provider_name/song/:song_id", get(get_song))
      .route("/:provider_name/song", post(get_song_with_params))
      .route(
        "/:provider_name/song/lyrics",
        post(get_song_lyrics_with_params),
      )
      .layer(
        ServiceBuilder::new()
          .layer(TraceLayer::new_for_http())
          .layer(cors)
          .layer(HandleErrorLayer::new(handle_timeout_error))
          .timeout(Duration::from_secs(30)),
      )
      .with_state(app_state);

    // run it with hyper on localhost:3000
    axum::Server::bind(&"0.0.0.0:3030".parse().unwrap())
      .serve(app.into_make_service())
      .await
      .unwrap();
  });
}

async fn get_playlists(
  State(state): State<Arc<AppState>>,
  Path(provider_name): Path<String>,
  Query(params): Query<HashMap<String, String>>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let playlists = match provider_name.as_str() {
    "netease" => {
      let netease = Netease { client: client };
      netease.get_playlists(params).await
    }
    "qq" => {
      let qq = QQ { client: client };
      qq.get_playlists(params).await
    }
    "kugou" => {
      let kugou = Kugou { client: client };
      kugou.get_playlists(params).await
    }
    _ => vec![],
  };
  Json(json!(playlists))
}

async fn get_playlist(
  State(state): State<Arc<AppState>>,
  Path((provider_name, playlist_id)): Path<(String, String)>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let playlist = match provider_name.as_str() {
    "qq" => {
      let qq = QQ { client };
      qq.get_playlist_detail(&playlist_id).await
    }
    "kugou" => {
      let kugou = Kugou { client };
      kugou.get_playlist_detail(&playlist_id).await
    }
    _ => {
      let qq = QQ { client };
      qq.get_playlist_detail(&playlist_id).await
    }
  };
  Json(json!(playlist))
}

async fn get_playlist_with_params(
  State(state): State<Arc<AppState>>,
  Path((provider_name, _playlist_id)): Path<(String, String)>,
  Form(payload): Form<NeteaseFormData>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let playlist = match provider_name.as_str() {
    "netease" => {
      let netease = Netease { client };
      netease.get_playlist_detail(payload).await
    }
    _ => {
      let netease = Netease { client };
      netease.get_playlist_detail(payload).await
    }
  };
  Json(json!(playlist))
}

async fn search(
  State(state): State<Arc<AppState>>,
  Path(provider_name): Path<String>,
  Query(params): Query<HashMap<String, String>>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let json_result = match provider_name.as_str() {
    // "netease" => Netease::get_playlists(params).await,
    "kuwo" => {
      let kuwo = Kuwo { client };
      let result = kuwo.search(params).await;

      json!(result)
    }
    "kugou" => {
      let kugou = Kugou { client };
      let result = kugou.search(params.clone()).await;

      json!(result)
    }
    "migu" => {
      let client = state.clients.get("migu").unwrap();
      let migu = migu::Migu { client: client };
      let search_params = migu::SearchParams::from_query(&params);
      let result = migu.search(search_params).await;

      json!(result)
    }
    _ => {
      let kuwo = Kuwo { client };
      let result = kuwo.search(params).await;

      json!(result)
    }
  };
  Json(json_result)
}

async fn get_song(
  State(state): State<Arc<AppState>>,
  Path((provider_name, song_id)): Path<(String, String)>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let kuwo = Kuwo { client };
  let response = kuwo.get_track(&song_id).await;
  Json(json!(response))
}

async fn get_song_with_params(
  State(state): State<Arc<AppState>>,
  Path(provider_name): Path<String>,
  Form(payload): Form<NeteaseFormData>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let netease = Netease { client };
  let response = netease.get_song(payload).await;
  Json(json!(response))
}

async fn get_song_lyrics_with_params(
  State(state): State<Arc<AppState>>,
  Path(provider_name): Path<String>,
  Form(payload): Form<NeteaseFormData>,
) -> Json<Value> {
  let client = state.clients.get(provider_name.as_str()).unwrap();
  let netease = Netease { client };
  let response = netease.get_song_lyrics(payload).await;
  Json(json!(response))
}
