<template>
  <Modal ref="modalRef"></Modal>
  <div class="background-layer fixed inset-0"></div>
  <div class="wrap flex h-screen flex-col bg-theme">
    <!-- dialog-->
    <!-- <div v-show="is_dialog_hidden !== 1" class="shadow" />
    <div v-show="is_dialog_hidden !== 1" class="dialog" :style="myStyle">
      <div class="dialog-header">
        <span>{{ dialog_title }}</span>
        <span class="dialog-close" @click="closeDialog()">×</span>
      </div>
      <div class="dialog-body">
        <div v-show="dialog_type == 4" class="dialog-connect-lastfm">
          <p>_OPENING_LASTFM_PAGE</p>
          <p>_CONFIRM_NOTICE_LASTFM</p>
          <div class="buttons">
            <button class="btn btn-primary confirm-button" ng-click="lastfm.updateStatus();closeDialog();">_AUTHORIZED_FINISHED</button>
            <button class="btn btn-warning warning-button" ng-click="lastfm.getAuth();">_AUTHORIZED_REOPEN</button>
          </div>
        </div>

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
            ng-click="backupMySettings2Gist(backup.id, backup.public); closeDialog();">
            <img ng-src="../images/mycover.jpg" />
            <h2>
              backup.id
              <br />
              backup.description
            </h2>
          </li>
        </ul>
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
            ng-click="importMySettingsFromGist(backup.id); closeDialog();">
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
    </div> -->

    <div class="main z-10 flex flex-1 overflow-hidden">
      <Sidebar></Sidebar>

      <div class="flex flex-1 flex-col overflow-hidden bg-content">
        <div class="app-region-drag flex h-14 flex-none items-center border-b border-default pr-2" :class="{ 'pt-1': isElectron() }">
          <div class="flex flex-1 items-center">
            <span class="icon li-back ml-4 text-xl text-icon opacity-50 hover:opacity-100" @click="$router.go(-1)" />
            <span class="icon li-advance ml-2 mr-4 text-xl text-icon opacity-50 hover:opacity-100" @click="$router.go(1)" />
            <input
              id="search-input"
              v-model="input_keywords"
              type="text"
              class="form-control search-input h-10 w-80 rounded border-none bg-search-input pl-3 text-default"
              :placeholder="t('_SEARCH_PLACEHOLDER')"
              @input="searchTextChanged" />
          </div>
          <div :class="{ active: route.path === '/login' }" :style="platButtonStyle">
            <router-link to="/login">
              <span class="icon mr-4 opacity-50 hover:opacity-100">
                <vue-feather size="1.25rem" type="users"></vue-feather>
              </span>
            </router-link>
          </div>
          <div :class="{ active: route.path === '/settings' }" :style="settingButtonStyle">
            <router-link to="/settings">
              <span class="icon mr-4 opacity-50 hover:opacity-100">
                <vue-feather size="1.25rem" type="settings"></vue-feather>
              </span>
            </router-link>
          </div>

          <WindowControl></WindowControl>
        </div>

        <div id="browser" class="flex-scroll-wrapper flex-1 overflow-y-scroll" content-selector="'#playlist-content'" @scroll.passive="handleScroll">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" v-if="$route.meta.keepAlive" />
            </keep-alive>
            <component :is="Component" v-if="!$route.meta.keepAlive" />
          </router-view>

          <NowPlaying />
        </div>
      </div>
    </div>
    <Playerbar />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CSSProperties, onMounted, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Modal from '../components/Modal.vue';
import Playerbar from '../components/Playerbar.vue';
import Sidebar from '../components/Sidebar.vue';
import WindowControl from '../components/WindowControl.vue';
import useAuth from '../composition/auth';
import usePlayer from '../composition/player';
import useSearch from '../composition/search';
import useSettings from '../composition/settings';
import { setLocale } from '../i18n';
import EventService from '../services/EventService';
import { initKeymap } from '../services/keymap';
import { l1Player } from '../services/l1_player';
import { isElectron, isWin } from '../utils';
import NowPlaying from '../views/NowPlaying.vue';

const { t } = useI18n();
const { player } = usePlayer();
const router = useRouter();
const { condition } = useSearch();
const { refreshAuthStatus } = useAuth();
let is_dialog_hidden = $ref(1);
let dialog_title = $ref('');
let dialog_type = $ref(0);
let dialog_data = $ref({});
let myStyle = $ref(<CSSProperties>{});
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
let is_favorite = $ref(false);
let playlist_highlight = $ref(false);
let menuHidden = $ref(true);
let playmode = $computed(() => player.playmode);
let input_keywords = $ref('');
let settingButtonStyle = $ref(<CSSProperties>{});
let platButtonStyle = $ref(<CSSProperties>{});
const { settings } = useSettings();
const route = useRoute();

const searchTextChanged = () => {
  condition.keywords = input_keywords;
  router.push('/search');
};
const changePlaymode = () => {
  const playmodeCount = 3;
  const newPlaymode = (playmode + 1) % playmodeCount;
  player.playmode = newPlaymode;
  l1Player.setLoopMode(newPlaymode);
};
const showPlaylist = (playlistId: string) => {
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
const newDialogOption = (option: number) => {
  dialog_type = option;
};
const showDialog = (dialogType: any, dialogData: any) => {
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
const changeProgress = (progress: number) => {
  l1Player.seek(progress);
};

const toggleMuteStatus = () => {
  l1Player.toggleMute();
};
let modalRef = $ref(null);
provide('showModal', (type: any, opt: any) => {
  //@ts-ignore modalRef exists
  modalRef.showModal(type, opt);
});
onMounted(() => {
  refreshAuthStatus();
  initKeymap();
});
const handleScroll = () => {
  const element = document.getElementById('browser') as HTMLElement;
  if (element.scrollHeight - element.scrollTop === element.clientHeight) {
    EventService.emit(`scroll:bottom`);
  }
};
let playlist = $computed(() => player.playlist.value);
let isPlaying = $computed(() => player.isPlaying);
let lyricArray = $computed(() => player.lyricArray.value);
let lyricLineNumber = $computed(() => player.lyricLineNumber);
let lyricLineNumberTrans = $computed(() => player.lyricLineNumberTrans);
let currentPlaying = $computed(() => player.currentPlaying);
let volume = $computed(() => player.volume);
let mute = $computed(() => player.mute);
let lyricFontWeight = $computed(() => settings.lyricFontWeight);
let lyricFontSize = $computed(() => settings.lyricFontSize);
setLocale(settings.language);
</script>
<style>
::placeholder {
  /* Chrome, Firefox, Opera, Safari 10.1+ */
  color: var(--search-input-placeholder-color);
  opacity: 1; /* Firefox */
}
.wrap {
  /* https://stackoverflow.com/questions/28897089/z-index-on-borders */
  outline: solid 1px var(--windows-border-color);
}
html,
body {
  font-size: var(--text-default-size);
  /* font-size: 14px; */
  color: var(--text-default-color);
  font-family: -apple-system, 'Helvetica Neue', Helvetica, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif;
}

/* remove focus highlight */
input:focus,
select:focus,
textarea:focus,
button:focus {
  outline: none;
}

input,
svg,
.icon {
  -webkit-app-region: no-drag;
}

button {
  background-color: var(--button-background-color);
  color: var(--text-default-color);
  /* border: solid 1px var(--button-background-color); */
  border: none;
  border-radius: 0.25rem;
  padding: 0.3rem;
  min-width: 5rem;
  min-height: 2rem;
}
button:hover {
  background-color: var(--button-hover-background-color);
}
img {
  -webkit-user-drag: none;
}
.icon {
  /* default icon settings */
  font-size: 16px;
  cursor: pointer;
}

/* tools utils */
.flex-scroll-wrapper {
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-color) var(--content-background-color);
}

/* scroll bar style */
::-webkit-scrollbar {
  width: 14px;
  height: 18px;
  background: transparent;
}

::-webkit-scrollbar-thumb {
  height: 49px;
  border: 5px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 7px;
  -webkit-border-radius: 7px;
  background-color: var(--scroll-color);
  /*rgba(151, 151, 151, 0.4);*/

  /*    -webkit-box-shadow: inset -1px -1px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 0px rgba(0, 0, 0, 0.05);*/
}

::-webkit-scrollbar-button {
  width: 0;
  height: 0;
  display: none;
}

::-webkit-scrollbar-corner {
  background-color: transparent;
}
</style>
