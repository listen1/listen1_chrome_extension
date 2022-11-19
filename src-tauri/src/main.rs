#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod proxy_server;

use crate::proxy_server::server;

fn main() {
  tauri::Builder::default()
    .setup(|app| Ok(server::start(app)))
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
