use axum::http::StatusCode;
use axum::{
  error_handling::HandleErrorLayer,
  extract::{Path, Query},
  routing::get,
  BoxError, Extension, Json, Router,
};
use media_providers::{media::Provider, netease::Netease, qq::QQ};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tauri::{App, AppHandle, Manager};
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
struct State {
  clients: HashMap<String, reqwest::Client>,
}

pub fn start(app_handle: &App) {
  tauri::async_runtime::spawn(async move {
    tracing_subscriber::fmt::init();

    let netease_client = reqwest::Client::builder().build().unwrap();
    let qq_client = reqwest::Client::builder().build().unwrap();

    let mut clients = HashMap::new();
    clients.insert(String::from("netease"), netease_client);
    clients.insert(String::from("qq"), qq_client);

    let shared_state = Arc::new(State { clients });

    let cors = CorsLayer::new().allow_origin(Any);
    let app = Router::new()
      .route("/", get(|| async { "Hello, World!" }))
      .route("/:provider_name/playlists", get(get_playlists))
      .route("/:provider_name/playlist/:playlist_id", get(get_playlist))
      .layer(
        ServiceBuilder::new()
          .layer(TraceLayer::new_for_http())
          .layer(cors)
          .layer(HandleErrorLayer::new(handle_timeout_error))
          .layer(Extension(shared_state))
          .timeout(Duration::from_secs(30)),
      );

    // run it with hyper on localhost:3000
    axum::Server::bind(&"0.0.0.0:3030".parse().unwrap())
      .serve(app.into_make_service())
      .await
      .unwrap();
  });
}

async fn get_playlists(
  Path(provider_name): Path<String>,
  Query(params): Query<HashMap<String, String>>,
  Extension(state): Extension<Arc<State>>,
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
    _ => vec![],
  };
  Json(json!(playlists))
}

async fn get_playlist(
  Path((provider_name, playlist_id)): Path<(String, String)>,
  Query(params): Query<HashMap<String, String>>,
) -> Json<Value> {
  let playlist = match provider_name.as_str() {
    // "netease" => Netease::get_playlists(params).await,
    "qq" => QQ::get_playlist_detail(&playlist_id).await,
    _ => QQ::get_playlist_detail(&playlist_id).await,
  };
  Json(json!(playlist))
}
