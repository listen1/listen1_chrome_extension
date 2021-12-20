/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
class NotImplementedError extends Error {
  constructor(message = '') {
    super(message);
  }
}
type PromiseLike<T> = Promise<T> | T;

export class MusicResource {
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
  static login(url: string): PromiseLike<any> {
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

export interface MusicProvider {
  showPlaylist(url: string): PromiseLike<any>,
  getPlaylistFilters(): PromiseLike<any>,
  getPlaylist(url: string): PromiseLike<any>,
  parseUrl(url: string): PromiseLike<any>,
  bootstrapTrack(track: any, success: any, failure: any): PromiseLike<any>,
  search(url: string): PromiseLike<any>
  lyric(url: string): PromiseLike<any>
  getUser(): PromiseLike<any>
  getLoginUrl(): PromiseLike<any>
  login(url: string): PromiseLike<any>
  logout(): PromiseLike<any>
  getUserCreatedPlaylist(url: string): PromiseLike<any>
  getUserFavoritePlaylist(url: string): PromiseLike<any>
  getRecommendPlaylist(): PromiseLike<any>
  getCommentList(trackId: string, offset: number, limit: number): PromiseLike<any>
}
