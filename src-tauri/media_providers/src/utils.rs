use url::{ParseError, Url};
use uuid::Uuid;

const FAKE_WEBSITE: &'static str = "http://localhost:3030";

pub fn create_url(relative_url: &str) -> Result<Url, ParseError> {
  let base = Url::parse(FAKE_WEBSITE).unwrap();
  let url = base.join(relative_url)?;

  Ok(url)
}

pub fn generate_uuid(use_separator: bool) -> String {
  let mut uid = Uuid::new_v4().to_string();
  if !use_separator {
    uid = uid.replace("-", "")
  }

  uid
}
