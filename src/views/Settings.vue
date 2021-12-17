<template>
  <!-- content page: 设置 -->
  <div class="page" ng-init="lastfm.updateStatus()">
    <div class="site-wrapper-innerd">
      <div class="cover-container leading-normal">
        <SettingTitle :text="t('_LANGUAGE')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <SettingButton text="简体中文" @click="setLocale('zh-CN')" />
          <SettingButton text="繁体中文" @click="setLocale('zh-TC')" />
          <SettingButton text="English" @click="setLocale('en-US')" />
          <SettingButton text="French" @click="setLocale('fr-FR')" />
        </div>
        <SettingTitle :text="t('_BACKUP_PLAYLIST')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <p>{{ t('_BACKUP_WARNING') }}</p>
          <div>
            <SettingButton :text="t('_BACKUP_PLAYLIST')" @click="showModal('GistExport')" />
          </div>
        </div>
        <SettingTitle :text="t('_RECOVER_PLAYLIST')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <p>{{ t('_RECOVER_WARNING') }}</p>
          <SettingButton :text="t('_RECOVER_PLAYLIST')" @click="showModal('GistImport')" />
        </div>
        <SettingTitle :text="t('_NOWPLAYING_DISPLAY')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <div class="shortcut flex items-center">
            <vue-feather
              v-show="!settings.enableNowplayingCoverBackground"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="square"
              @click="toggleCoverBackground"></vue-feather>
            <vue-feather
              v-show="settings.enableNowplayingCoverBackground"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="check-square"
              @click="toggleCoverBackground"></vue-feather>
            {{ t('_NOWPLAYING_COVER_BACKGROUND_NOTICE') }}
          </div>
          <div class="shortcut flex items-center">
            <vue-feather
              v-show="!settings.enableNowplayingBitrate"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="square"
              @click="toggleBitrate"></vue-feather>
            <vue-feather
              v-show="settings.enableNowplayingBitrate"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="check-square"
              @click="toggleBitrate"></vue-feather>
            {{ t('_NOWPLAYING_BITRATE_NOTICE') }}
          </div>
          <div class="shortcut flex items-center">
            <vue-feather
              v-show="!settings.enableNowplayingPlatform"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="square"
              @click="togglePlayingPlatform"></vue-feather>
            <vue-feather
              v-show="settings.enableNowplayingPlatform"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="check-square"
              @click="togglePlayingPlatform"></vue-feather>
            {{ t('_NOWPLAYING_PLATFORM_NOTICE') }}
          </div>
        </div>
        <SettingTitle :text="t('_THEME')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <SettingButton :text="t('_THEME_WHITE')" @click="setTheme('white')" />
          <SettingButton :text="t('_THEME_BLACK')" @click="setTheme('black')" />
          <!-- <SettingButton :text="t('_THEME_WHITE_TRANSPARENT')" @click="setTheme('white_transparent')" />
          <SettingButton :text="t('_THEME_BLACK_TRANSPARENT')" @click="setTheme('black_transparent')" /> -->
          <SettingButton :text="t('_THEME_INFINITE_GRID')" @click="setTheme('infinite_grid')" />
          <SettingButton :text="t('_THEME_GRIDIENT')" @click="setTheme('gridient')" />
        </div>
        <SettingTitle :text="t('_STYLE')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <p>
            {{ `${t('_LYRIC_SIZE')}` }}
            <input class="settings-input w-16 pl-[6px] py-0" v-model.lazy="settings.lyricFontSize" type="number" min="10" max="40" />
            px
          </p>
          <p>
            {{ `${t('_LYRIC_WEIGHT')}` }}
            <select class="settings-input p-1" v-model="settings.lyricFontWeight">
              <option v-for="option in fontWeightOptions" :value="option.value" :key="option.text">
                {{ option.text }}
              </option>
            </select>
          </p>
          <div class="setting-font-preview">
            <p :style="{ fontWeight: settings.lyricFontWeight, fontSize: `${settings.lyricFontSize}px` }">Listen1，自由的享受音乐的乐趣</p>
          </div>
        </div>
        <SettingTitle :text="t('_AUTO_CHOOSE_SOURCE')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <div class="shortcut btn btn-primary confirm-button flex items-center">
            <vue-feather
              v-show="!settings.enableAutoChooseSource"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="square"
              @click="setAutoChooseSource(true)"></vue-feather>
            <vue-feather
              v-show="settings.enableAutoChooseSource"
              class="cursor-pointer mr-2"
              size="1.25rem"
              type="check-square"
              @click="setAutoChooseSource(false)"></vue-feather>
            {{ t('_AUTO_CHOOSE_SOURCE_NOTICE') }}
          </div>
          <div v-show="settings.enableAutoChooseSource" class="search-description mt-8">{{ t('_AUTO_CHOOSE_SOURCE_LIST') }}</div>
          <div v-show="settings.enableAutoChooseSource" class="search-source-list flex items-center flex-wrap leading-10">
            <div v-for="item in sourceList" :key="item.name" class="search-source w-32 flex items-center">
              <vue-feather
                type="square"
                class="cursor-pointer mr-2"
                size="1.25rem"
                v-show="settings.autoChooseSourceList.indexOf(item.name) === -1"
                @click="enableSource(item.name)"></vue-feather>
              <vue-feather
                type="check-square"
                class="cursor-pointer mr-2"
                size="1.25rem"
                v-show="settings.autoChooseSourceList.indexOf(item.name) > -1"
                @click="disableSource(item.name)"></vue-feather>
              {{ t(item.displayId) }}
            </div>
          </div>
        </div>
        <SettingTitle :text="t('_CONNECT_TO_GITHUB')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <div>
            <p>{{ t('_STATUS') }}: {{ githubStatusText }}</p>
            <SettingButton v-show="githubStatus == 0" :text="t('_CONNECT_TO_GITHUB')" @click="openGithubAuth()" />
            <SettingButton v-show="githubStatus == 1" :text="t('_RECONNECT')" @click="showModal('GithubAuth')" />
            <SettingButton v-show="githubStatus == 2" :text="t('_CANCEL_CONNECT')" @click="GithubLogout()" />
          </div>
        </div>
        <!-- <div ng-if="isChrome" class="settings-title">
          <span>{{ $t('_CLOSE_TAB_ACTION') }}({{ $t('_VALID_AFTER_RESTART') }})</span>
        </div>
        <div ng-if="isChrome" class="settings-content mx-7 mb-7 leading-8">
          <div class="shortcut flex items-center">
            <vue-feather v-show="!enableStopWhenClose" type="square" ng-click="setStopWhenClose(true)"></vue-feather>
            <vue-feather v-show="enableStopWhenClose" type="check-square" ng-click="setStopWhenClose(false)"></vue-feather>
            <span style="margin-right: 20px">{{ $t('_QUIT_APPLICATION') }}</span>
            <vue-feather v-show="enableStopWhenClose" type="square" ng-click="setStopWhenClose(false)"></vue-feather>
            <vue-feather v-show="!enableStopWhenClose" type="check-square" ng-click="setStopWhenClose(true)"></vue-feather>
            <span>{{ $t('_MINIMIZE_TO_BACKGROUND') }}</span>
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_NOWPLAYING_DISPLAY') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <div class="shortcut flex items-center">
            <vue-feather v-show="!enableNowplayingCoverBackground" type="square" ng-click="setNowplayingCoverBackground(true)"></vue-feather>
            <vue-feather v-show="enableNowplayingCoverBackground" type="check-square" ng-click="setNowplayingCoverBackground(true)"></vue-feather>
            {{ $t('_NOWPLAYING_COVER_BACKGROUND_NOTICE') }}
          </div>
          <div class="shortcut flex items-center">
            <vue-feather v-show="!enableNowplayingBitrate" type="square" ng-click="setNowplayingBitrate(true)"></vue-feather>
            <vue-feather v-show="enableNowplayingBitrate" type="check-square" ng-click="setNowplayingBitrate(true)"></vue-feather>
            {{ $t('_NOWPLAYING_BITRATE_NOTICE') }}
          </div>
          <div class="shortcut flex items-center">
            <vue-feather v-show="!enableNowplayingPlatform" type="square" ng-click="setNowplayingPlatform(true)"></vue-feather>
            <vue-feather v-show="enableNowplayingPlatform" type="check-square" ng-click="setNowplayingPlatform(true)"></vue-feather>
            {{ $t('_NOWPLAYING_PLATFORM_NOTICE') }}
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_LYRIC_DISPLAY') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <div class="shortcut flex items-center" ng-if="!isChrome">
            <vue-feather v-show="!enableLyricFloatingWindow" type="square" ng-click="openLyricFloatingWindow(true)"></vue-feather>
            <vue-feather v-show="enableLyricFloatingWindow" type="check-square" ng-click="openLyricFloatingWindow(true)"></vue-feather>
            <span v-show="enableLyricFloatingWindow" />
            {{ $t('_SHOW_DESKTOP_LYRIC') }}
          </div>
          <div class="shortcut flex items-center">
            <vue-feather v-show="!enableLyricTranslation" type="square" ng-click="toggleLyricTranslation()"></vue-feather>
            <vue-feather v-show="enableLyricTranslation" type="check-square" ng-click="toggleLyricTranslation()"></vue-feather>
            <span v-show="enableLyricTranslation" />
            {{ $t('_SHOW_LYRIC_TRANSLATION') }}
          </div>
          <div class="shortcut flex items-center" ng-if="!isChrome">
            <vue-feather v-show="!enableLyricFloatingWindowTranslation" type="square" ng-click="toggleLyricFloatingWindowTranslation()"></vue-feather>
            <vue-feather v-show="enableLyricFloatingWindowTranslation" type="check-square" ng-click="toggleLyricFloatingWindowTranslation()"></vue-feather>
            <span v-show="enableLyricFloatingWindowTranslation" />
            {{ $t('_SHOW_DESKTOP_LYRIC_TRANSLATION') }}
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_BACKUP_PLAYLIST') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <p>{{ $t('_BACKUP_WARNING') }}</p>
          <div>
            <button class="btn btn-primary confirm-button" ng-click="backupMySettings()">{{ $t('_EXPORT_TO_LOCAL_FILE') }}</button>
            <button v-show="githubStatus == 2" class="btn btn-primary confirm-button" ng-click="showDialog(8)">{{ $t('_EXPORT_TO_GITHUB_GIST') }}</button>
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_RECOVER_PLAYLIST') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <p>{{ $t('_RECOVER_WARNING') }}</p>
          <label class="upload-button" for="my-file-selector">
            <input id="my-file-selector" type="file" style="display: none" ng-model="myuploadfiles" custom-on-change="importMySettings" />
            {{ $t('_RECOVER_FROM_LOCAL_FILE') }}
          </label>
          <button v-show="githubStatus == 2" class="btn btn-warning confirm-button" ng-click="showDialog(10)">_{{ $t('RECOVER_FROM_GITHUB_GIST') }}</button>
        </div>

        <div class="settings-title">
          <span>{{ $t('_CONNECT_TO_GITHUB') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <div>
            <p>{{ $t('_STATUS') }}： githubStatusText</p>
            <button v-show="githubStatus == 0" class="btn btn-primary confirm-button" ng-click="openGithubAuth(); showDialog(7);">
              {{ $t('_CONNECT_TO_GITHUB') }}
            </button>
            <button v-show="githubStatus == 1" class="btn btn-warning confirm-button" ng-click="showDialog(7);">{{ $t('_RECONNECT') }}</button>
            <button v-show="githubStatus == 2" class="btn btn-primary confirm-button" ng-click="GithubLogout();">{{ $t('_CANCEL_CONNECT') }}</button>
          </div>
        </div>

        <div class="settings-title">
          <span>{{ $t('_CONNECT_TO_LASTFM') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <div>
            <p>{{ $t('_STATUS') }}： lastfm.getStatusText()</p>
            <button class="btn btn-primary confirm-button" ng-show="!lastfm.isAuthRequested()" ng-click="lastfm.getAuth(); showDialog(4);">
              {{ $t('_CONNECT_TO_LASTFM') }}
            </button>
            <button
              class="btn btn-warning confirm-button"
              ng-show="lastfm.isAuthRequested() && !lastfm.isAuthorized()"
              ng-click="lastfm.getAuth(); showDialog(4);"
            >
              {{ $t('_RECONNECT') }}
            </button>
            <button class="btn btn-primary confirm-button" ng-show="lastfm.isAuthRequested()" ng-click="lastfm.cancelAuth();">
              {{ $t('_CANCEL_CONNECT') }}
            </button>
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_SHORTCUTS') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8">
          <div class="shortcut_table">
            <div class="shortcut_table-header">
              <div class="shortcut_table-function">{{ $t('_SHORTCUTS_FUNCTION') }}</div>
              <div class="shortcut_table-key">{{ $t('_SHORTCUTS') }}</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">{{ $t('_GLOBAL_SHORTCUTS') }}</div>
            </div>
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('_PLAY_OR_PAUSE') }}</div>
              <div class="shortcut_table-key">p</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">Ctrl(Cmd) + Alt + {{ $t('_KEYBOARD_SPACE') }}</div>
            </div>
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('_PREVIOUS_TRACK') }}</div>
              <div class="shortcut_table-key">[</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">Ctrl(Cmd) + Alt + ←</div>
            </div>
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('_NEXT_TRACK') }}</div>
              <div class="shortcut_table-key">]</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">Ctrl(Cmd) + Alt + →</div>
            </div>
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('_VOLUME_UP') }}</div>
              <div class="shortcut_table-key">u</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">{{ $t('_SHORTCUTS_NOT_SET') }}</div>
            </div>
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('_VOLUME_DOWN') }}</div>
              <div class="shortcut_table-key">d</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">{{ $t('_SHORTCUTS_NOT_SET') }}</div>
            </div>
           <div class="shortcut_table-line">
                                <div class="shortcut_table-function">
                                  静音/取消静音
                                </div>
                                <div class="shortcut_table-key">m</div>
                                <div ng-if="!isChrome" class="shortcut_table-globalkey">
                                  全局快捷键
                                </div>
                              </div> 
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('_QUICK_SEARCH') }}</div>
              <div class="shortcut_table-key">f</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">{{ $t('_SHORTCUTS_NOT_SET') }}</div>
            </div>
            <div class="shortcut_table-line">
              <div class="shortcut_table-function">{{ $t('ZOOM_IN_OUT') }}</div>
              <div class="shortcut_table-key">Ctrl(Cmd) + +/-</div>
              <div ng-if="!isChrome" class="shortcut_table-globalkey">{{ $t('_SHORTCUTS_NOT_SET') }}</div>
            </div>
            <div class="shortcut_table-line">
                                <div class="shortcut_table-function">
                                  打开/关闭播放列表
                                </div>
                                <div class="shortcut_table-key">l</div>
                                <div ng-if="!isChrome" class="shortcut_table-globalkey">
                                  全局快捷键
                                </div>
                              </div>
                              <div class="shortcut_table-line">
                                <div class="shortcut_table-function">
                                  切换播放模式
                                </div>
                                <div class="shortcut_table-key">s</div>
                                <div ng-if="!isChrome" class="shortcut_table-globalkey">
                                  全局快捷键
                                </div>
                              </div> 
          </div>
          <div ng-if="!isChrome" class="shortcut btn btn-primary confirm-button">
            <vue-feather v-show="!enableGlobalShortCut" type="square" ng-click="applyGlobalShortcut(true)"></vue-feather>
            <vue-feather v-show="enableGlobalShortCut" class="check-square" ng-click="applyGlobalShortcut(true)"></vue-feather>
            {{ $t('_GLOBAL_SHORTCUTS_NOTICE') }}
          </div>
        </div>
        <div class="settings-title" ng-if="!isChrome">
          <span>{{ $t('_PROXY_CONFIG') }}</span>
        </div>
        <div class="settings-content mx-7 mb-7 leading-8" ng-if="!isChrome">
          <span>{{ $t('_PROXY_CONFIG') }}:</span>
          proxyMode.displayText
          <span v-show="proxyMode_name == 'custom'">proxyRules</span>
          <button ng-click="showDialog(12)">{{ $t('_MODIFY') }}</button>
        </div>-->
        <SettingTitle :text="t('_ABOUT')" />
        <div class="settings-content mx-7 mb-7 leading-8">
          <p>
            Listen 1 {{ t('_HOMEPAGE') }}:
            <Href to="https://listen1.github.io/listen1/" />
          </p>
          <p>
            Listen 1 {{ t('_EMAIL') }}:
            <Href to="mailto:githublisten1@gmail.com" display="githublisten1@gmail.com" />
          </p>
          <p>
            {{ t('_FEEDBACK') }}:
            <Href v-if="isChrome" to="https://github.com/listen1/listen1_chrome_extension/issues" />
            <Href v-else to="https://github.com/listen1/listen1_desktop/issues" />
          </p>
          <p>{{ t('_DESIGNER') }}: iparanoid</p>
          <p>{{ `${t('_VERSION')}: v${version}` }} (DEVELOPER VERSION)</p>
          <p>LICENSE: {{ t('_LICENSE_NOTICE') }}</p>
          <!-- <p v-show="lastestVersion != ''">{{ $t('_LATEST_VERSION') }}: lastestVersion</p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { version } from '../../package.json';
import Href from '../components/Href.vue';
import SettingButton from '../components/SettingButton.vue';
import SettingTitle from '../components/SettingTitle.vue';
import useSettings from '../composition/settings';
import { setLocale } from '../i18n';
import { isElectron } from '../utils';
import GithubClient from '../services/GithubService';
import { inject } from 'vue';
import EventService from '../services/EventService';
const { t } = useI18n();
const { settings, setSettings } = useSettings();
const isChrome = !isElectron();

GithubClient.github.updateStatus().then(() => {
  githubStatus = GithubClient.github.getStatus();
  githubStatusText = GithubClient.github.getStatusText();
})

let githubStatus = $ref(0);
let githubStatusText = $ref('???');

const showModal = <CallableFunction>inject('showModal');

const toggleCoverBackground = () => setSettings({ enableNowplayingCoverBackground: !settings.enableNowplayingCoverBackground });
const toggleBitrate = () => setSettings({ enableNowplayingBitrate: !settings.enableNowplayingBitrate });
const togglePlayingPlatform = () => setSettings({ enableNowplayingPlatform: !settings.enableNowplayingPlatform });
const setTheme = (theme: string) => setSettings({ theme });
const setAutoChooseSource = (enabled: boolean) => setSettings({ enableAutoChooseSource: enabled });
const setAutoChooseSourceList = (newList: string[]) => setSettings({ autoChooseSourceList: newList });

const enableSource = (source: string) => {
  if (settings.autoChooseSourceList.indexOf(source) > -1) {
    return;
  }
  const newList = [...settings.autoChooseSourceList, source];
  setAutoChooseSourceList(newList);
};

const openGithubAuth = () => {
  showModal('GithubAuth');
  GithubClient.github.openAuthUrl();
}

const updateGithubStatus = async () => {
  githubStatus = await GithubClient.github.updateStatus();
  githubStatusText = GithubClient.github.getStatusText();
}

const importMySettings = (event: Event) => {
  const target = <HTMLInputElement>event.target;
  console.log(target.value);
}

const disableSource = (source: string) => {
  if (settings.autoChooseSourceList.indexOf(source) === -1) {
    return;
  }
  const newList = settings.autoChooseSourceList.filter((i) => i !== source);
  setAutoChooseSourceList(newList);
};
const fontWeightOptions = [
  {
    text: t('Extra Light'),
    value: 200
  },
  {
    text: t('Light'),
    value: 300
  },
  {
    text: t('Normal'),
    value: 400
  },
  {
    text: t('Medium'),
    value: 500
  },
  {
    text: t('Semi Bold'),
    value: 600
  },
  {
    text: t('Bold'),
    value: 700
  },
  {
    text: t('Extra Bold'),
    value: 800
  }
];

const sourceList = [
  {
    name: 'netease',
    displayId: '_NETEASE_MUSIC'
  },
  {
    name: 'qq',
    displayId: '_QQ_MUSIC'
  },
  {
    name: 'kugou',
    displayId: '_KUGOU_MUSIC'
  },
  {
    name: 'kuwo',
    displayId: '_KUWO_MUSIC'
  },
  {
    name: 'bilibili',
    displayId: '_BILIBILI_MUSIC',
    searchable: false
  },
  {
    name: 'migu',
    displayId: '_MIGU_MUSIC'
  },
  {
    name: 'taihe',
    displayId: '_TAIHE_MUSIC'
  }
];

EventService.on('github:status', updateGithubStatus);
</script>
<style>
.settings-input {
  margin-left: 10px;
  text-align: left;
  background-color: var(--content-background-color);
  border: 1px solid var(--search-input-background-color);
  border-radius: 4px;
  margin-right: 4px;
  color: var(--text-default-color);
  transition: background-color 0.2s;
}
.settings-input:hover {
  background: var(--search-input-background-color);
}
.setting-font-preview {
  color: var(--lyric-default-color);
  display: flex;
  align-items: center;
  height: 40px;
  overflow: hidden;
}

/* .page .settings-content {
  margin: 0 25px 25px 25px;
} */
/* .page .settings-content label.upload-button {
  padding: 5px;
  background: var(--button-background-color);
  margin-right: 4px;
  color: var(--text-default-color);
  cursor: pointer;
}

.page .settings-content label.upload-button:hover {
  background: var(--button-hover-background-color);
} */

/* .page .settings-content .shortcut {
  display: flex;
  margin-top: 10px;
}
.page .settings-content .shortcut svg {
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

.page .settings-content .shortcut_table .shortcut_table-header,
.page .settings-content .shortcut_table .shortcut_table-line {
  display: flex;
  color: var(--text-default-color);
  box-sizing: border-box;
  align-items: center;
  height: 40px;
}
.page .settings-content .shortcut_table .shortcut_table-header {
  color: var(--link-default-color);
  height: 30px;
}
.page .settings-content .shortcut_table .shortcut_table-function {
  flex: 0 140px;
  padding: 0 10px;
  box-sizing: border-box;
}
.page .settings-content .shortcut_table .shortcut_table-key {
  flex: 0 200px;
  margin-right: 20px;
  box-sizing: border-box;
}
.page .settings-content .shortcut_table .shortcut_table-globalkey {
  flex: 0 240px;
  box-sizing: border-box;
}
.page .settings-content .shortcut_table .shortcut_table-line .shortcut_table-key {
  border: solid 1px var(--button-border-color);
  border-radius: 5px;
  padding: 0 10px;
  height: 30px;
  display: flex;
  align-items: center;
}
.page .settings-content .shortcut_table .shortcut_table-line .shortcut_table-globalkey {
  border: solid 1px var(--button-border-color);
  border-radius: 5px;
  height: 30px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.page .settings-content .custom-proxy {
  margin-top: 10px;
}
.page .settings-content .custom-proxy .rule-input {
  margin-top: 8px;
}
.page .settings-content .custom-proxy input {
  margin-right: 15px;
  height: 24px;
  width: 200px;
} */
/* .page .settings-content .search-description {
  margin: 10px 0 5px 0;
}
.page .settings-content .search-source-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  line-height: 30px;
}
.page .settings-content .search-source-list .search-source {
  display: flex;
  align-items: center;
  width: 130px;
}
.page .settings-content .search-source-list .search-source svg {
  width: 18px;
  height: 18px;
  margin-right: 4px;
} */
/* page setting end */
</style>
