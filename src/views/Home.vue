<template>
  <Modal ref="modalRef"></Modal>

  <div class="wrap">
    <!-- dialog-->
    <div v-show="is_dialog_hidden !== 1" class="shadow" />
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
    </div>

    <div class="main" ng-controller="MyPlayListController">
      <Sidebar></Sidebar>

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
              @input="searchTextChanged" />
          </div>
          <div ng-class="{ 'active': (current_tag==4) && (window_url_stack.length ==0)}" class="settings" :style="platButtonStyle">
            <router-link to="/login">
              <span class="icon">
                <vue-feather type="users"></vue-feather>
              </span>
            </router-link>
          </div>
          <div ng-class="{ 'active': (current_tag==4) && (window_url_stack.length ==0)}" class="settings" :style="settingButtonStyle">
            <router-link to="/settings">
              <span class="icon">
                <vue-feather type="settings"></vue-feather>
              </span>
            </router-link>
          </div>
          <div v-if="isWin() || isLinux()" class="window-control">
            <vue-feather class="icon" type="minimize-2" @click="sendControl('window_min')" />
            <vue-feather class="icon" type="maximize" @click="sendControl('window_max')" />
            <vue-feather class="icon" type="x" @click="sendControl('window_close')" />
          </div>
        </div>

        <div class="browser flex-scroll-wrapper" id="browser" v-on:scroll.passive="handleScroll" content-selector="'#playlist-content'">
          <router-view :key="$route.path" />
          <NowPlaying />
        </div>
      </div>
    </div>
    <Playerbar />
  </div>
</template>

<script setup>
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'notyf/notyf.min.css';
import { onMounted, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import '../assets/css/common.css';
import '../assets/css/icon.css';
import Modal from '../components/Modal.vue';
import Playerbar from '../components/Playerbar.vue';
import Sidebar from '../components/Sidebar.vue';
import useAuth from '../composition/auth';
import usePlayer from '../composition/player';
import useSearch from '../composition/search';
import useSettings from '../composition/settings';
import { setLocale } from '../i18n';
import { isLinux, isWin } from '../provider/lowebutil';
import EventService from '../services/EventService';
import { l1Player } from '../services/l1_player';
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
let is_favorite = $ref(false);
let playlist_highlight = $ref(false);
let menuHidden = $ref(true);
let playmode = $computed(() => player.playmode);
let input_keywords = $ref('');
let settingButtonStyle = $ref({});
let platButtonStyle = $ref({});
const { settings } = useSettings();

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

const toggleMuteStatus = () => {
  l1Player.toggleMute();
};
const playFromPlaylist = (song) => {
  l1Player.playById(song.id);
};

let modalRef = $ref(null);
provide('showModal', (type, opt) => {
  modalRef.showModal(type, opt);
});
onMounted(() => {
  if ('windowControlsOverlay' in navigator) {
    const { x } = navigator.windowControlsOverlay.getBoundingClientRect();
    //windows
    if (x === 0) {
      //hard coded style. Looking for better solution
      settingButtonStyle = {
        position: 'fixed',
        left: 'calc(env(titlebar-area-width) - 26px)',
        top: 'calc(env(titlebar-area-height)/4)'
      };
      platButtonStyle = {
        position: 'fixed',
        left: 'calc(env(titlebar-area-width) - 62px)',
        top: 'calc(env(titlebar-area-height)/4)'
      };
    }
  }
  refreshAuthStatus();
});
const handleScroll = () => {
  const element = document.getElementById('browser');
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

const sendControl = (message) => {
  window.api?.sendControl(message);
};
</script>
