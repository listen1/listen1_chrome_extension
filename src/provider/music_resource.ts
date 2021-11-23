/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
class NotImplementedError extends Error {
  constructor(message = '') {
    super(message);
  }
}

export default class MusicResource {
  static async show_playlist(url: string) {
    throw new NotImplementedError('');
  }
  static async get_playlist_filters() {
    throw new NotImplementedError('');
  }
  static get_playlist(url: string) {
    throw new NotImplementedError('');
  }
  static parse_url(url: string) {
    throw new NotImplementedError('');
  }
  static bootstrap_track(track: any, success: any, failure: any) {
    throw new NotImplementedError('');
  }
  static async search(url: string) {
    throw new NotImplementedError('');
  }

  static async lyric(url: string) {
    throw new NotImplementedError('');
  }
  static async get_user() {
    throw new NotImplementedError('');
  }
  static get_login_url() {
    throw new NotImplementedError('');
  }
  static logout() {
    throw new NotImplementedError('');
  }
}
