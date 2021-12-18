/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
class NotImplementedError extends Error {
  constructor(message = '') {
    super(message);
  }
}
type PromiseLike<T> = Promise<T> | T;

export default class MusicResource {
  static showPlaylist(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getPlaylistFilters(): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getPlaylist(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static parseUrl(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static bootstrapTrack(track: any, success: any, failure: any): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static search(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }

  static lyric(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getUser(): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getLoginUrl(): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static logout(): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getUserCreatedPlaylist(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getUserFavoritePlaylist(url: string): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getRecommendPlaylist(): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static getCommentList(trackId: string, offset: number, limit: number): PromiseLike<any> {
    throw new NotImplementedError('');
  }
}
