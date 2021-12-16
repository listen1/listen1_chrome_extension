/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
class NotImplementedError extends Error {
  constructor(message = '') {
    super(message);
  }
}

export default class MusicResource {
  static async showPlaylist(url: string) {
    throw new NotImplementedError('');
  }
  static async getPlaylistFilters() {
    throw new NotImplementedError('');
  }
  static getPlaylist(url: string) {
    throw new NotImplementedError('');
  }
  static parseUrl(url: string) {
    throw new NotImplementedError('');
  }
  static bootstrapTrack(track: any, success: any, failure: any) {
    throw new NotImplementedError('');
  }
  static async search(url: string) {
    throw new NotImplementedError('');
  }

  static async lyric(url: string) {
    throw new NotImplementedError('');
  }
  static async getUser() {
    throw new NotImplementedError('');
  }
  static getLoginUrl() {
    throw new NotImplementedError('');
  }
  static logout() {
    throw new NotImplementedError('');
  }
  static getUserCreatedPlaylist(url: string) {
    throw new NotImplementedError('');
  }
  static getUserFavoritePlaylist(url: string) {
    throw new NotImplementedError('');
  }
  static getRecommendPlaylist() {
    throw new NotImplementedError('');
  }
  static getCommentList(trackId: string, offset: number, limit: number) {
    throw new NotImplementedError('');
  }
}
