<template>
  <div class="wrap">
    <!-- dialog-->
    <div v-show="is_dialog_hidden !== 1" class="shadow" />
    <div v-show="is_dialog_hidden !== 1" class="dialog" :style="myStyle">
      <div class="dialog-header">
        <span>{{ dialog_title }}</span>
        <span class="dialog-close" @click="closeDialog()">×</span>
      </div>
      <div class="dialog-body">
        <!-- choose playlist dialog-->
        <ul v-show="dialog_type == 0" class="dialog-playlist">
          <li class="detail-add" @click="newDialogOption(1)">
            <img src="../images/mycover.jpg" />
            <h2>_CREATE_PLAYLIST</h2>
          </li>
          <li ng-repeat="playlist in myplaylist track by $index" ng-class-odd="'odd'" ng-class-even="'even'" ng-click="chooseDialogOption(playlist.info.id)">
            <img ng-src=" playlist.info.cover_img_url " />
            <h2>playlist.info.title</h2>
          </li>
        </ul>
        <!-- create new playlist dialog-->
        <div v-show="dialog_type == 1" class="dialog-newplaylist">
          <input class="form-control" type="text" placeholder="_INPUT_NEW_PLAYLIST_TITLE" ng-model="newlist_title" />
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="createAndAddPlaylist()">_CONFIRM</button>
            <button class="btn btn-default" ng-click="cancelNewDialog(0)">_CANCEL</button>
          </div>
        </div>
        <!-- edit playlist dialog-->
        <div v-show="dialog_type == 3" class="dialog-editplaylist">
          <div class="form-group">
            <label>_PLAYLIST_TITLE</label>
            <input class="form-control" type="text" placeholder="_INPUT_PLAYLIST_TITLE" ng-model="dialog_playlist_title" />
          </div>
          <div class="form-group">
            <label>_PLAYLIST_COVER_IMAGE_URL</label>
            <input class="form-control" type="text" placeholder="_INPUT_PLAYLIST_COVER_IMAGE_URL" ng-model="dialog_cover_img_url" />
          </div>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="editMyPlaylist(list_id)">_CONFIRM</button>
            <button class="btn btn-default" ng-click="closeDialog()">_CANCEL</button>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-danger remove-button" ng-click="removeMyPlaylist(list_id)">_REMOVE_PLAYLIST</button>
          </div>
        </div>
        <div v-show="dialog_type == 4" class="dialog-connect-lastfm">
          <p>_OPENING_LASTFM_PAGE</p>
          <p>_CONFIRM_NOTICE_LASTFM</p>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="lastfm.updateStatus();closeDialog();">_AUTHORIZED_FINISHED</button>
            <button class="btn btn-warning warning-button" ng-click="lastfm.getAuth();">_AUTHORIZED_REOPEN</button>
          </div>
        </div>
        <!-- open playlist dialog-->
        <div v-show="dialog_type == 5" class="dialog-open-url">
          <div class="form-group">
            <label>{{ t('_PLAYLIST_LINK') }}</label>
            <input class="form-control" type="text" :placeholder="t('_EXAMPLE') + 'https://www.xiami.com/collect/198267231'" ng-model="dialog_url" />
          </div>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="openUrl(dialog_url);closeDialog();dialog_url='';">{{ t('_CONFIRM') }}</button>
            <button class="btn btn-default" ng-click="closeDialog()">{{ t('_CANCEL') }}</button>
          </div>
        </div>
        <ul v-show="dialog_type == 6" class="dialog-merge-playlist">
          <li ng-repeat="playlist in myplaylist track by $index" ng-class-odd="'odd'" ng-class-even="'even'" ng-click="mergePlaylist(playlist.info.id)">
            <img ng-src=" playlist.info.cover_img_url " />
            <h2>playlist.info.title</h2>
          </li>
        </ul>
        <div v-show="dialog_type == 7" class="dialog-connect-github">
          <p>_OPENING_GITHUB_PAGE</p>
          <p>_CONFIRM_NOTICE_GITHUB</p>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="updateGithubStatus();closeDialog();">_AUTHORIZED_FINISHED</button>
            <button class="btn btn-warning warning-button" ng-click="openGithubAuth();">_AUTHORIZED_REOPEN</button>
          </div>
        </div>
        <ul v-show="dialog_type == 8" class="dialog-backuplist">
          <li class="detail-add" ng-click="newDialogOption(9)">
            <img src="../images/mycover.jpg" />
            <h2>_CREATE_PLAYLIST_BACKUP</h2>
          </li>
          <li
            ng-repeat="backup in myBackup track by $index"
            ng-class-odd="'odd'"
            ng-class-even="'even'"
            ng-click="backupMySettings2Gist(backup.id, backup.public); closeDialog();"
          >
            <img ng-src="../images/mycover.jpg" />
            <h2>
              backup.id
              <br />
              backup.description
            </h2>
          </li>
        </ul>
        <!-- create new backup dialog-->
        <div v-show="dialog_type == 9" class="dialog-newbackup">
          <button class="btn btn-primary confirm-button" ng-click="backupMySettings2Gist(null, true);closeDialog();">_CREATE_PUBLIC_BACKUP</button>
          <button class="btn btn-primary confirm-button" ng-click="backupMySettings2Gist(null, false);closeDialog();">_CREATE_PRIVATE_BACKUP</button>
          <button class="btn btn-default" ng-click="cancelNewDialog(8)">_CANCEL</button>
        </div>
        <ul v-show="dialog_type == 10" class="dialog-backuplist">
          <li
            ng-repeat="backup in myBackup track by $index"
            ng-class-odd="'odd'"
            ng-class-even="'even'"
            ng-click="importMySettingsFromGist(backup.id); closeDialog();"
          >
            <img ng-src="../images/mycover.jpg" />
            <h2>backup.id backup.description</h2>
          </li>
        </ul>
        <div v-show="dialog_type == 11" class="dialog-open-login">
          <p>_LOGIN_DIALOG_NOTICE</p>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="closeDialog();refreshAuthStatus();">_LOGIN_SUCCESS</button>
            <button class="btn btn-warning warning-button" ng-click="openLogin(dialog_data);">_LOGIN_FAIL_RETRY</button>
          </div>
        </div>
        <div v-show="dialog_type == 12" class="dialog-proxy">
          <select ng-options="mode.displayText for mode in proxyModes" ng-model="proxyModeInput" ng-change="changeProxyMode(proxyModeInput)" />
          <div ng-show="proxyModeInput_name == 'custom'" class="custom-proxy">
            <div class="rule-input">
              <div class="field-name">_PROTOCOL</div>
              <select ng-options="protocol for protocol in proxyProtocols" ng-model="proxyProtocol" ng-change="changeProxyProtocol(proxyProtocol)" />
              <div class="field-name">_HOST</div>
              <input id="proxy-rules-host" type="text" />
              <div class="field-name">_PORT</div>
              <input id="proxy-rules-port" type="text" />
            </div>
          </div>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="setProxyConfig();closeDialog();">_CONFIRM</button>
            <button class="btn btn-warning warning-button" ng-click="closeDialog();">_CANCEL</button>
          </div>
        </div>
      </div>
    </div>

    <div class="main" ng-controller="MyPlayListController">
      <div class="sidebar">
        <div class="flex-scroll-wrapper">
          <div class="menu-control" />
          <div class="menu-title">
            <div class="title">{{ t('_PLATFORM_UNION') }}</div>
          </div>
          <ul class="nav masthead-nav">
            <li :class="{ active: $route.name === 'HotPlaylists' }" @click="$router.push('/')">
              <div class="sidebar-block">
                <span class="icon li-featured-list" />
                <a>{{ t('_PLAYLISTS') }}</a>
              </div>
            </li>
          </ul>
          <div v-if="!isChrome || is_login('netease') || is_login('qq')" class="menu-title">
            <div class="title">{{ t('_MY_MUSIC') }}</div>
          </div>
          <ul class="nav masthead-nav">
            <li
              v-if="!isChrome"
              ng-click="showPlaylist('lmplaylist_reserve')"
              ng-class="{ 'active':window_type=='list' && ( '/playlist?list_id=lmplaylist_reserve' === getCurrentUrl() ) }"
            >
              <div class="sidebar-block">
                <span class="icon li-featured-list" />
                <a>{{ t('_LOCAL_MUSIC') }}</a>
              </div>
            </li>
            <li
              v-if="is_login('netease')"
              ng-click="showTag(6, {platform:'netease', user: musicAuth.netease});"
              ng-class="{ 'active':(current_tag==6 && tag_params.platform=='netease') && (window_url_stack.length ==0) }"
            >
              <div class="sidebar-block">
                <svg class="feather">
                  <use href="#globe" />
                </svg>
                <a>{{ t('_MY_NETEASE') }}</a>
              </div>
            </li>
            <li
              v-if="is_login('qq')"
              ng-click="showTag(6, {platform:'qq', user: musicAuth.qq});"
              ng-class="{ 'active':(current_tag==6 && tag_params.platform=='qq') && (window_url_stack.length ==0) }"
            >
              <div class="sidebar-block">
                <svg class="feather">
                  <use href="#globe" />
                </svg>
                <a>{{ t('_MY_QQ') }}</a>
              </div>
            </li>
          </ul>
          <!-- <div class="menu-title" ng-init="loadMyPlaylist();">
                    <div class="title">
                      {{ t('_CREATED_PLAYLIST') }}
                    </div>
                    <svg class="feather icon" @click="showDialog(5)">
                      <use href="#plus-square" />
                    </svg>
                  </div>
                  <ul class="nav masthead-nav">
                    <li
                      ng-repeat="i in myplaylists track by $index"
                      ng-class="{ 'active':window_type=='list' && ( ('/playlist?list_id='+i.info.id) === getCurrentUrl() ) }"
                      ng-click="showPlaylist(i.info.id)"
                      drag-drop-zone
                      drag-zone-type="'application/listen1-myplaylist'"
                      drop-zone-ondrop="onSidebarPlaylistDrop('my', i.info.id, arg1, arg2, arg3)"
                      draggable="true"
                      sortable="true"
                      drag-zone-object="i"
                      drag-zone-title="i.info.title"
                    >
                      <div class="sidebar-block">
                        <svg class="feather">
                          <use href="#disc" />
                        </svg>
                        <a>i.info.title</a>
                      </div>
                    </li>
          </ul>-->
          <!-- <div class="menu-title" ng-init="loadFavoritePlaylist();">
                    <div class="title">
                      {{ $t('_FAVORITED_PLAYLIST') }}
                    </div>
                  </div>
                  <ul class="nav masthead-nav">
                    <li
                      ng-repeat="i in favoriteplaylists track by $index"
                      ng-class="{ 'active':window_type=='list' && ( ('/playlist?list_id='+i.info.id) === getCurrentUrl() ) }"
                      ng-click="showPlaylist(i.info.id, {useCache: false})"
                      drag-drop-zone
                      drag-zone-type="'application/listen1-favoriteplaylist'"
                      drop-zone-ondrop="onSidebarPlaylistDrop('favorite', i.info.id, arg1, arg2, arg3)"
                      draggable="true"
                      sortable="true"
                      drag-zone-object="i"
                      drag-zone-title="i.info.title"
                    >
                      <div class="sidebar-block">
                        <svg class="feather">
                          <use href="#disc" />
                        </svg>
                        <a>i.info.title</a>
                      </div>
                    </li>
          </ul>-->
        </div>
      </div>

      <div class="content" ng-controller="InstantSearchController">
        <div class="navigation">
          <div class="backfront">
            <span class="icon li-back" @click="$router.go(-1)" />
            <span class="icon li-advance" @click="$router.go(1)" />
          </div>
          <div class="search">
            <input
              id="search-input"
              v-model="input_keywords"
              type="text"
              class="form-control search-input"
              :placeholder="t('_SEARCH_PLACEHOLDER')"
              ng-model-options="{debounce: 500}"
              @input="searchTextChanged"
            />
          </div>
          <!-- <div ng-class="{ 'active': (current_tag==4) && (window_url_stack.length ==0)}" ng-click="showTag(5)" class="settings">
                    <router-link to="/login">
                      <span class="icon">
                        <vue-feather type="users"></vue-feather>
                      </span>
                    </router-link>
          </div>-->
          <div ng-class="{ 'active': (current_tag==4) && (window_url_stack.length ==0)}" class="settings">
            <router-link to="/settings">
              <span class="icon li-setting" />
            </router-link>
          </div>
          <div v-if="!isChrome && !isMac" class="window-control">
            <svg class="icon" window-control="window_min">
              <use href="#minimize-2" />
            </svg>
            <svg class="icon" window-control="window_max">
              <use href="#maximize" />
            </svg>
            <svg class="icon" window-control="window_close">
              <use href="#x" />
            </svg>
          </div>
        </div>
        <div class="browser flex-scroll-wrapper" infinite-scroll="scrolling()" content-selector="'#playlist-content'">
          <!-- hot playlist window-->
          <router-view :key="$route.name + ($route.params.listId || '')" />

          <!-- track list window-->
          <div class="page">
            <div v-show="is_window_hidden != 1 && window_type == 'list'" class="playlist-detail">
              <div class="detail-head">
                <div class="detail-head-cover">
                  <img ng-src=" cover_img_url " err-src="https://y.gtimg.cn/mediastyle/global/img/singer_300.png" />
                </div>
                <div class="detail-head-title">
                  <h2>playlist_title</h2>
                  <div class="playlist-button-list">
                    <div class="playlist-button playadd-button">
                      <div class="play-list" ng-click="playMylist(list_id)">
                        <span class="icon li-play-s" />
                        _PLAY_ALL
                      </div>
                      <div class="add-list" ng-click="addMylist(list_id)">
                        <span class="icon li-add" />
                      </div>
                    </div>
                    <div v-show="is_local" class="playlist-button clone-button" ng-click="addLocalMusic(list_id)">
                      <div class="play-list">
                        <span class="icon li-songlist" />
                        <span>_ADD_LOCAL_SONGS</span>
                      </div>
                    </div>
                    <div v-show="!is_mine && !is_local" class="playlist-button clone-button" ng-click="clonePlaylist(list_id)">
                      <div class="play-list">
                        <span class="icon li-songlist" />
                        <span>_ADD_TO_PLAYLIST</span>
                      </div>
                    </div>
                    <div
                      v-show="is_mine && !is_local"
                      class="playlist-button edit-button"
                      ng-click="showDialog(3, {list_id: list_id, playlist_title: playlist_title, cover_img_url: cover_img_url})"
                    >
                      <div class="play-list">
                        <svg class="feather">
                          <use href="#edit" />
                        </svg>
                        <span>_EDIT</span>
                      </div>
                    </div>
                    <div v-show="!is_mine && !is_local" class="playlist-button fav-button" ng-click="favoritePlaylist(list_id)">
                      <div class="play-list" ng-class="{'favorited':is_favorite,'notfavorite':!is_favorite}">
                        <svg class="feather">
                          <use href="#star" />
                        </svg>
                        <span>is_favorite?_FAVORITED:_FAVORITE</span>
                      </div>
                    </div>
                    <div v-show="isChrome && is_favorite && !is_local" class="playlist-button edit-button" ng-click="closeWindow();showPlaylist(list_id)">
                      <div class="play-list">
                        <span class="icon li-loop" />
                        <span>_REFRESH_PLAYLIST</span>
                      </div>
                    </div>
                    <div v-show="!is_mine && !is_local" class="playlist-button edit-button" open-url="playlist_source_url">
                      <div class="play-list">
                        <span class="icon li-link" />
                        <span>_ORIGIN_LINK</span>
                      </div>
                    </div>
                    <div v-show="is_mine && !is_local" class="playlist-button edit-button" ng-click="showDialog(6)">
                      <div class="play-list">
                        <svg class="feather">
                          <use href="#git-merge" />
                        </svg>
                        <span>_IMPORT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ul class="detail-songlist">
                <div class="playlist-search">
                  <svg class="feather playlist-search-icon">
                    <use href="#search" />
                  </svg>
                  <svg class="feather playlist-clear-icon" ng-show="playlistFilter.key!=''" ng-click="clearFilter()">
                    <use href="#x" />
                  </svg>
                  <input class="playlist-search-input" type="text" ng-model="playlistFilter.key" placeholder="_SEARCH_PLAYLIST" />
                </div>
                <li class="head">
                  <div class="title">
                    <a>_SONGS + '(' + songs.length + ')'</a>
                  </div>
                  <div class="artist">
                    <a>_ARTISTS</a>
                  </div>
                  <div class="album">
                    <a>_ALBUMS</a>
                  </div>
                  <div class="tools">_OPERATION</div>
                </li>
                <li
                  ng-repeat="song in songs | filter: fieldFilter track by $index"
                  ng-class-odd="'odd'"
                  ng-class-even="'even'"
                  ng-mouseenter="options=true"
                  ng-mouseleave="options=false"
                  draggable="true"
                  drag-drop-zone
                  drag-zone-object="song"
                  drag-zone-title="song.title"
                  sortable="is_mine || is_local"
                  drag-zone-type="'application/listen1-song'"
                  drop-zone-ondrop="onPlaylistSongDrop(list_id, song, arg1, arg2, arg3)"
                >
                  <div class="title">
                    <!-- <a class="disabled" ng-if="song.disabled" ng-click="copyrightNotice()"> song.title </a> -->
                    <a add-and-play="song">song.title</a>
                  </div>
                  <div class="artist">
                    <a ng-click="showPlaylist(song.artist_id)">song.artist</a>
                  </div>
                  <div class="album">
                    <a ng-click="showPlaylist(song.album_id)">song.album</a>
                  </div>
                  <div class="tools">
                    <a ng-show="options" title="_ADD_TO_QUEUE" class="detail-add-button" add-without-play="song">
                      <span class="icon li-add" />
                    </a>
                    <a ng-show="options" title="_ADD_TO_PLAYLIST" class="detail-fav-button" ng-click="showDialog(0, song)">
                      <span class="icon li-songlist" />
                    </a>
                    <a
                      ng-show="options && (is_mine == '1' || is_local)"
                      title="_REMOVE_FROM_PLAYLIST"
                      class="detail-delete-button"
                      ng-click="removeSongFromPlaylist(song, list_id)"
                    >
                      <span class="icon li-del" />
                    </a>
                    <a ng-show="options && !is_local" title="_ORIGIN_LINK" class="source-button" open-url="song.source_url">
                      <span class="icon li-link" />
                    </a>
                  </div>
                </li>
              </ul>
            </div>
            <!-- now playing window-->
            <div
              class="songdetail-wrapper"
              :class="{
                slidedown: window_type !== 'track',
                coverbg: settings.enableNowplayingCoverBackground
              }"
            >
              <div class="draggable-zone" />
              <div v-if="settings.enableNowplayingCoverBackground" class="bg" :style="{ backgroundImage: `url(${currentPlaying.img_url}` }" />
              <div class="translate-switch" ng-click="toggleLyricTranslation()" ng-class="{selected: settings.enableLyricTranslation}">译</div>
              <div class="close" :class="isMac ? 'mac' : ''" @click="toggleNowPlaying()">
                <vue-feather type="chevron-down"></vue-feather>
              </div>

              <!-- <div v-if="!isChrome && !isMac" class="window-control">
                        <svg class="icon" window-control="window_min">
                          <use href="#minimize-2" />
                        </svg>
                        <svg class="icon" window-control="window_max">
                          <use href="#maximize" />
                        </svg>
                        <svg class="icon" window-control="window_close">
                          <use href="#x" />
                        </svg>
              </div>-->

              <div class="playsong-detail">
                <div class="detail-head">
                  <div class="detail-head-cover">
                    <img :src="currentPlaying.img_url" err-src="https://y.gtimg.cn/mediastyle/global/img/album_300.png" />
                  </div>
                  <div class="detail-head-title">
                    <!--<a title="加入收藏" class="clone" ng-click="showDialog(0, currentPlaying)">收藏</a>
                    <a open-url="currentPlaying.source_url" title="原始链接" class="link">原始链接</a>-->
                  </div>
                </div>
                <div class="detail-songinfo">
                  <div class="title">
                    <h2>{{ currentPlaying.title }}</h2>
                    <span v-if="settings.enableNowplayingBitrate && currentPlaying.bitrate !== undefined" class="badge">{{ currentPlaying.bitrate }}</span>
                    <span v-if="settings.enableNowplayingPlatform && currentPlaying.platform !== undefined" class="badge platform">
                      {{ t(currentPlaying.platform) }}
                    </span>
                  </div>
                  <div class="info">
                    <div class="singer">
                      <span>{{ t('_ARTIST') }}：</span>
                      <a ng-click="showPlaylist(currentPlaying.artist_id)" title="currentPlaying.artist">{{ currentPlaying.artist }}</a>
                    </div>
                    <div class="album">
                      <span>{{ t('_ALBUM') }}：</span>
                      <a ng-click="showPlaylist(currentPlaying.album_id)" title="currentPlaying.album">{{ currentPlaying.album }}</a>
                    </div>
                  </div>
                  <div class="lyric">
                    <div class="placeholder" />
                    <p
                      v-for="line in lyricArray"
                      :key="line.lineNumber"
                      :data-line="line.lineNumber"
                      :class="{
                        highlight: line.lineNumber == lyricLineNumber || line.lineNumber == lyricLineNumberTrans,
                        hide: line.translationFlag && !settings.enableLyricTranslation,
                        translate: line.translationFlag
                      }"
                    >
                      {{ line.content }}
                    </p>
                    <div class="placeholder" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="left-control">
        <span class="icon li-previous" @click="prevTrack()" />
        <span class="icon li-play play" :class="isPlaying ? 'li-pause' : 'li-play'" @click="playPauseToggle()" />
        <span class="icon li-next" @click="nextTrack()" />
      </div>
      <div class="main-info">
        <div v-if="playlist.length == 0" class="logo-banner">
          <svg
            class="logo"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#666666"
            stroke="#666666"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="7 4 7 19 16 19 16 16 10 16 10 4" />
            <polygon points="13 4 13 13 16 13 16 4" />
          </svg>
        </div>
        <div v-if="playlist.length > 0" class="cover" @click="toggleNowPlaying()">
          <img :src="currentPlaying.img_url" err-src="https://y.gtimg.cn/mediastyle/global/img/album_300.png" />
          <div class="mask">
            <svg class="feather">
              <use href="#chevrons-up" />
            </svg>
          </div>
        </div>
        <div v-if="playlist.length > 0" class="detail">
          <div class="ctrl">
            <!-- <a ng-click="showDialog(0, currentPlaying)" title="_ADD_TO_PLAYLIST">
                      <span class="icon li-songlist" />
            </a>-->
            <a title @click="changePlaymode()">
              <span v-show="playmode == 0" class="icon li-loop" />
              <span v-show="playmode == 1" class="icon li-random-loop" />
              <span v-show="playmode == 2" class="icon li-single-cycle" />
            </a>
          </div>

          <div class="title">
            <span v-if="currentPlaying.source === 'xiami'" style="color: orange; font-size: medium">⚠️</span>
            {{ currentPlaying.title }}
          </div>
          <div class="more-info">
            <div class="current">{{ currentPosition }}</div>
            <div class="singer">
              <a @click="showPlaylist(currentPlaying.artist_id)">{{ currentPlaying.artist }}</a>
              -
              <a @click="showPlaylist(currentPlaying.album_id)">{{ currentPlaying.album }}</a>
            </div>
            <div class="total">{{ currentDuration }}</div>
          </div>
          <div class="playbar">
            <draggable-bar id="progressbar" :progress="myProgress" @commit-progress="changeProgress"></draggable-bar>
          </div>
        </div>
      </div>
      <div class="right-control">
        <div class="playlist-toggle">
          <span class="icon li-list" @click="togglePlaylist()" />
        </div>
        <div class="volume-ctrl" volume-wheel>
          <span class="icon" :class="mute ? 'li-mute' : 'li-volume'" @click="toggleMuteStatus()" />
          <div class="m-pbar volume">
            <draggable-bar id="volumebar" :progress="volume" @update-progress="changeVolume" @commit-progress="commitVolume"></draggable-bar>
          </div>
        </div>
        <div v-if="!isChrome" class="lyric-toggle">
          <div ng-click="openLyricFloatingWindow(true)" class="lyric-icon" ng-class="{'selected': settings.enableLyricFloatingWindow}">词</div>
        </div>
      </div>
      <div class="menu-modal" :class="{ slideup: !menuHidden }" @click="togglePlaylist()" />
      <div class="menu" :class="{ slideup: !menuHidden }">
        <div class="menu-header">
          <span class="menu-title">{{ t('_TOTAL_SONG_PREFIX') }} {{ playlist.length }} {{ t('_TOTAL_SONG_POSTFIX') }}</span>
          <!-- <a class="add-all" ng-click="showDialog(0, playlist)">
                    <span class="icon li-songlist" ng-click="togglePlaylist()" />
                    <span>{{ t('_ADD_TO_PLAYLIST') }}</span>
          </a>-->
          <a class="remove-all" @click="clearPlaylist()">
            <span class="icon li-del" ng-click="togglePlaylist()" />
            <span>{{ t('_CLEAR_ALL') }}</span>
          </a>

          <a class="close" @click="togglePlaylist()">
            <vue-feather type="x"></vue-feather>
          </a>
        </div>
        <ul class="menu-list">
          <li
            v-for="song in playlist"
            id="song song.id "
            :key="song.id"
            ng-class="{ playing: currentPlaying.id == song.id }"
            ng-mouseenter="playlist_highlight=true"
            ng-mouseleave="playlist_highlight=false"
            ng-class-odd="'odd'"
            ng-class-even="'even'"
            draggable="true"
            drag-drop-zone
            drag-zone-object="song"
            drag-zone-title="song.title"
            sortable="true"
            drag-zone-type="'application/listen1-song'"
            drop-zone-ondrop="onCurrentPlayingSongDrop(song, arg1, arg2, arg3)"
          >
            <div class="song-status-icon">
              <vue-feather v-show="currentPlaying.id == song.id" type="play"></vue-feather>
            </div>
            <div class="song-title" :class="song.disabled ? 'disabled' : ''">
              <a @click="playFromPlaylist(song)">
                <span v-if="song.source === 'xiami'" style="color: orange; border-radius: 12px; border: solid 1px; padding: 0 4px">⚠️ 🦐</span>
                {{ song.title }}
              </a>
            </div>
            <div class="song-singer">
              <a ng-click="showPlaylist(song.artist_id); togglePlaylist();">{{ song.artist }}</a>
            </div>
            <div class="tools">
              <span v-show="playlist_highlight" remove-from-playlist="song" data-index="$index" class="icon li-del" />
              <span v-show="playlist_highlight" open-url="song.source_url" class="icon li-link" />
            </div>
            <!-- <div class="song-time">00:00</div> -->
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'notyf/notyf.min.css';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import '../assets/css/common.css';
import '../assets/css/icon.css';
import DraggableBar from '../components/DraggableBar.vue';
import useSearch from '../composition/search';
import useSettings from '../composition/settings';
import { setLocale } from '../i18n';
import { l1Player } from '../services/l1_player';


const { t } = useI18n();
const store = useStore();
const router = useRouter();
const { condition } = useSearch();

let is_dialog_hidden = $ref(1);
let dialog_title = $ref('');
let dialog_type = $ref(0);
let dialog_data = $ref({});
let myStyle = $ref({});
let current_tag = $ref(2);
let is_window_hidden = $ref(1);
let window_type = $ref('');
let lastTrackId = $ref('');
let loading = $ref(false);
let options = $ref('');
let githubStatus = $ref({});
let proxyMode_name = $ref('');
let lastestVersion = $ref('');
let is_local = $ref(false);
let is_mine = $ref(false);
let isMac = $ref(false);
let isChrome = $ref(true);
let is_favorite = $ref(false);
let playlist_highlight = $ref(false);
let menuHidden = $ref(true);
let playmode = $computed(() => store.state.player.playmode);
let input_keywords = $ref('');
const searchTextChanged = () => {
  condition.keywords = input_keywords;
  router.push('/search');
};
const changePlaymode = () => {
  const playmodeCount = 3;
  const newPlaymode = (playmode + 1) % playmodeCount;
  store.dispatch('player/changePlaymode', { mode: newPlaymode });
};
const showPlaylist = (playlistId) => {
  router.push('/playlist/' + playlistId);
};
const playPauseToggle = () => {
  l1Player.togglePlayPause();
};
const prevTrack = () => {
  l1Player.prev();
};
const nextTrack = () => {
  l1Player.next();
};
const toggleNowPlaying = () => {
  if (window_type != 'track') {
    window_type = 'track';
  } else {
    window_type = '';
  }
};
const is_login = (platform) => {
  return false;
};
const newDialogOption = (option) => {
  dialog_type = option;
};
const showDialog = (dialogType, dialogData) => {
  is_dialog_hidden = 0;
  dialog_data = dialogData;
  const dialogWidth = 400;
  const dialogHeight = 430;
  const left = window.innerWidth / 2 - dialogWidth / 2;
  const top = window.innerHeight / 2 - dialogHeight / 2;
  myStyle = {
    left: `${left}px`,
    top: `${top}px`
  };
  dialog_type = dialogType;

  if (dialog_type === 5) {
    dialog_title = t('_OPEN_PLAYLIST');
  }
};
const closeDialog = () => {
  is_dialog_hidden = 1;
  dialog_type = 0;
};
const togglePlaylist = () => {
  menuHidden = !menuHidden;
};
const clearPlaylist = () => {
  l1Player.clearPlaylist();
};
const changeProgress = (progress) => {
  l1Player.seek(progress);
};
const changeVolume = (progress) => {
  l1Player.setVolume(progress * 100);
  l1Player.unmute();
};
const commitVolume = (progress) => {
  const current = localStorage.getObject('player-settings');
  current.volume = progress * 100;
  localStorage.setObject('player-settings', current);
};
const toggleMuteStatus = () => {
  l1Player.toggleMute();
};
const playFromPlaylist = (song) => {
  l1Player.playById(song.id);
};
onMounted(() => {
  if ('windowControlsOverlay' in navigator) {
    const { x } = navigator.windowControlsOverlay.getBoundingClientRect();
    const { style } = document.getElementsByClassName('settings')[0];
    //windows
    if (x === 0) {
      //hard coded style. Looking for better solution
      style.flex = "0 0 170px";
      style.height = "30px"
    }
  }
})
let playlist = $computed(() => store.state.player.playlist);
let isPlaying = $computed(() => store.state.player.isPlaying);
let lyricArray = $computed(() => store.state.player.lyricArray);
let lyricLineNumber = $computed(() => store.state.player.lyricLineNumber);
let lyricLineNumberTrans = $computed(() => store.state.player.lyricLineNumberTrans);
let myProgress = $computed(() => store.state.player.myProgress);
let changingProgress = $computed(() => store.state.player.changingProgress);
let currentDuration = $computed(() => store.state.player.currentDuration);
let currentPosition = $computed(() => store.state.player.currentPosition);
let currentPlaying = $computed(() => store.state.player.currentPlaying);
let volume = $computed(() => store.state.player.volume);
let mute = $computed(() => store.state.player.mute);

const { settings } = useSettings();

setLocale(settings.language);
</script>
