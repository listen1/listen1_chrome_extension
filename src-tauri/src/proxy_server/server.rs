use crate::media_providers::netease::NeteaseService;
use axum::http::StatusCode;
use axum::{
  error_handling::HandleErrorLayer,
  extract::{Path, Query},
  routing::get,
  BoxError, Json, Router,
};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::time::Duration;
use tauri::{App, AppHandle, Manager};
use tower::ServiceBuilder;
use tower_http::{
  cors::{Any, CorsLayer},
  trace::TraceLayer,
};
use media_providers::{netease, qq};

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

pub fn start(app_handle: &App) {
  tauri::async_runtime::spawn(async move {
    tracing_subscriber::fmt::init();

    let cors = CorsLayer::new().allow_origin(Any);
    let app = Router::new()
      .route("/", get(|| async { "Hello, World!" }))
      .route("/playlist/:provider_name", get(get_playlist))
      .layer(
        ServiceBuilder::new()
          .layer(TraceLayer::new_for_http())
          .layer(cors)
          .layer(HandleErrorLayer::new(handle_timeout_error))
          .timeout(Duration::from_secs(30)),
      );

    // run it with hyper on localhost:3000
    axum::Server::bind(&"0.0.0.0:3030".parse().unwrap())
      .serve(app.into_make_service())
      .await
      .unwrap();
  });
}

async fn get_playlist(
  Path(provider_name): Path<String>,
  Query(params): Query<HashMap<String, String>>,
) -> Json<Value> {
  let playlists = match provider_name.as_str() {
    "netease" => {
      let mut playlist_params = netease::PlaylistParams {
        order: params.get("order").unwrap().to_string(),
        offset: params.get("offset").unwrap().parse().unwrap(),
        category_id: None,
      };
      match params.get("category_id") {
        Some(val) => {
          playlist_params.category_id = Some(val.to_string());
        }
        _ => {}
      }
      NeteaseService::get_playlist(playlist_params).await
    },
    "qq" => {
      let playlist_params = qq::PlaylistParams {
        category_id: params.get("category_id").unwrap().to_string(),
        offset: params.get("offset").unwrap().parse().unwrap(),
      };
      qq::QQService::get_playlist(playlist_params).await
    }
    _ => vec![]
  };
  Json(json!(playlists))
}
