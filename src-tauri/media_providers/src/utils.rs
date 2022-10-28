use url::{ParseError, Url};

const FAKE_WEBSITE: &'static str = "http://localhost:3030";

pub fn create_url(relative_url: &str) -> Result<Url, ParseError> {
  let base = Url::parse(FAKE_WEBSITE).unwrap();
  let url = base.join(relative_url)?;

  Ok(url)
}
