/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
class NotImplementedError extends Error {
  constructor(message = '') {
    super(message);
  }
}

type PromiseLike<T> = Promise<T> | T;
type SearchResult = {
  result: any;
  total: number;
  type?: string | null;
};
type LyricResult = {
  lyric: string;
  tlyric?: string;
};
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
  static init(track: any): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static bootstrapTrack(track: any, success: any, failure: any): PromiseLike<any> {
    throw new NotImplementedError('');
  }
  static search(url: string): PromiseLike<SearchResult> {
    throw new NotImplementedError('');
  }

  static lyric(url: string): PromiseLike<LyricResult> {
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
export type Comment = {
  id: string;
  content: string;
  time: string;
  nickname: string;
  avatar: string;
  user_id: string;
  like: string;
  reply: { avatar: string; nickname: string; content: string }[];
};
export type Track = {
  id: string;
  album: string;
  album_id: string;
  artist: string;
  artist_id: string;
  img_url: string;
  options?: string;
  source: string;
  source_url: string;
  title: string;
  disabled?: boolean;
  bitrate?: string;
  platform?: string;
  url?: string;
};
export interface MusicProvider {
  id: string;
  Name: string;
  searchable: boolean;
  displayId: string;
  support_login: boolean;
  hidden: boolean;
  showPlaylist(url: string): PromiseLike<any>;
  getPlaylistFilters(): PromiseLike<any>;
  getPlaylist(url: string): PromiseLike<any>;
  parseUrl(url: string): PromiseLike<any>;
  init(track: any): PromiseLike<any>;
  bootstrapTrack(track: any, success: any, failure: any): PromiseLike<any>;
  search(url: string): PromiseLike<SearchResult>;
  lyric(url: string): PromiseLike<LyricResult>;
  getUser(): PromiseLike<any>;
  getLoginUrl(): PromiseLike<any>;
  login(url: string): PromiseLike<any>;
  logout(): PromiseLike<any>;
  getUserCreatedPlaylist(url: string): PromiseLike<any>;
  getUserFavoritePlaylist(url: string): PromiseLike<any>;
  getRecommendPlaylist(): PromiseLike<any>;
  getCommentList(
    trackId: string,
    offset: number,
    limit: number
  ): PromiseLike<{
    comments: Comment[];
    total: any;
    offset: number;
    limit: number;
  }>;
}
