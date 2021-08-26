<template>
  <!-- content page: 设置 -->
  <div class="page" ng-init="lastfm.updateStatus(); updateGithubStatus();">
    <div class="site-wrapper-innerd">
      <div class="cover-container">
        <div class="settings-title">
          <span>{{ t('_LANGUAGE') }}</span>
        </div>
        <div class="settings-content">
          <button class="language-button" @click="locale = 'zh-CN'">简体中文</button>
          <button class="language-button" @click="locale = 'zh-TC'">繁体中文</button>
          <button class="language-button" @click="locale = 'en-US'">English</button>
          <button class="language-button" @click="locale = 'fr-FR'">French</button>
        </div>
        <div class="settings-title">
          <span>{{ t('_NOWPLAYING_DISPLAY') }}</span>
        </div>
        <div class="settings-content">
          <div class="shortcut">
            <vue-feather
              v-show="!enableNowplayingCoverBackground"
              type="square"
              @click="toggleCoverBackground"
            ></vue-feather>
            <vue-feather
              v-show="enableNowplayingCoverBackground"
              type="check-square"
              @click="toggleCoverBackground"
            ></vue-feather>
            {{ t('_NOWPLAYING_COVER_BACKGROUND_NOTICE') }}
          </div>
          <div class="shortcut">
            <vue-feather v-show="!enableNowplayingBitrate" type="square" @click="toggleBitrate"></vue-feather>
            <vue-feather
              v-show="enableNowplayingBitrate"
              type="check-square"
              @click="toggleBitrate"
            ></vue-feather>
            {{ t('_NOWPLAYING_BITRATE_NOTICE') }}
          </div>
          <div class="shortcut">
            <vue-feather
              v-show="!enableNowplayingPlatform"
              type="square"
              @click="togglePlayingPlatform"
            ></vue-feather>
            <vue-feather
              v-show="enableNowplayingPlatform"
              type="check-square"
              @click="togglePlayingPlatform"
            ></vue-feather>
            {{ t('_NOWPLAYING_PLATFORM_NOTICE') }}
          </div>
        </div>
        <!-- <div class="settings-title">
          <span>{{ $t('_THEME') }}</span>
        </div>
        <div class="settings-content">
          <div>
            <button class="theme-button" ng-click="setTheme('white')">{{ $t('_THEME_WHITE') }}</button>
            <button class="theme-button" ng-click="setTheme('black')">{{ $t('_THEME_BLACK') }}</button>
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_AUTO_CHOOSE_SOURCE') }}</span>
        </div>
        <div class="settings-content">
          <div class="shortcut btn btn-primary confirm-button">
            <vue-feather v-show="!enableAutoChooseSource" type="square" ng-click="setAutoChooseSource(true)"></vue-feather>
            <vue-feather v-show="enableAutoChooseSource" type="check-square" ng-click="setAutoChooseSource(true)"></vue-feather>
            {{ $t('_AUTO_CHOOSE_SOURCE_NOTICE') }}
          </div>
          <div v-show="enableAutoChooseSource" class="search-description">{{ $t('_AUTO_CHOOSE_SOURCE_LIST') }}</div>
          <div v-show="enableAutoChooseSource" class="search-source-list">
            <div ng-repeat="item in sourceList" class="search-source">
              <vue-feather type="square" ng-show="autoChooseSourceList.indexOf(item.name) === -1" ng-click="enableSource(item.name)"></vue-feather>
              <vue-feather type="check-square" ng-show="autoChooseSourceList.indexOf(item.name) > -1" ng-click="disableSource(item.name)"></vue-feather>
              item.displayText
            </div>
          </div>
        </div>
        <div ng-if="isChrome" class="settings-title">
          <span>{{ $t('_CLOSE_TAB_ACTION') }}({{ $t('_VALID_AFTER_RESTART') }})</span>
        </div>
        <div ng-if="isChrome" class="settings-content">
          <div class="shortcut">
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
        <div class="settings-content">
          <div class="shortcut">
            <vue-feather v-show="!enableNowplayingCoverBackground" type="square" ng-click="setNowplayingCoverBackground(true)"></vue-feather>
            <vue-feather v-show="enableNowplayingCoverBackground" type="check-square" ng-click="setNowplayingCoverBackground(true)"></vue-feather>
            {{ $t('_NOWPLAYING_COVER_BACKGROUND_NOTICE') }}
          </div>
          <div class="shortcut">
            <vue-feather v-show="!enableNowplayingBitrate" type="square" ng-click="setNowplayingBitrate(true)"></vue-feather>
            <vue-feather v-show="enableNowplayingBitrate" type="check-square" ng-click="setNowplayingBitrate(true)"></vue-feather>
            {{ $t('_NOWPLAYING_BITRATE_NOTICE') }}
          </div>
          <div class="shortcut">
            <vue-feather v-show="!enableNowplayingPlatform" type="square" ng-click="setNowplayingPlatform(true)"></vue-feather>
            <vue-feather v-show="enableNowplayingPlatform" type="check-square" ng-click="setNowplayingPlatform(true)"></vue-feather>
            {{ $t('_NOWPLAYING_PLATFORM_NOTICE') }}
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_LYRIC_DISPLAY') }}</span>
        </div>
        <div class="settings-content">
          <div class="shortcut" ng-if="!isChrome">
            <vue-feather v-show="!enableLyricFloatingWindow" type="square" ng-click="openLyricFloatingWindow(true)"></vue-feather>
            <vue-feather v-show="enableLyricFloatingWindow" type="check-square" ng-click="openLyricFloatingWindow(true)"></vue-feather>
            <span v-show="enableLyricFloatingWindow" />
            {{ $t('_SHOW_DESKTOP_LYRIC') }}
          </div>
          <div class="shortcut">
            <vue-feather v-show="!enableLyricTranslation" type="square" ng-click="toggleLyricTranslation()"></vue-feather>
            <vue-feather v-show="enableLyricTranslation" type="check-square" ng-click="toggleLyricTranslation()"></vue-feather>
            <span v-show="enableLyricTranslation" />
            {{ $t('_SHOW_LYRIC_TRANSLATION') }}
          </div>
          <div class="shortcut" ng-if="!isChrome">
            <vue-feather v-show="!enableLyricFloatingWindowTranslation" type="square" ng-click="toggleLyricFloatingWindowTranslation()"></vue-feather>
            <vue-feather v-show="enableLyricFloatingWindowTranslation" type="check-square" ng-click="toggleLyricFloatingWindowTranslation()"></vue-feather>
            <span v-show="enableLyricFloatingWindowTranslation" />
            {{ $t('_SHOW_DESKTOP_LYRIC_TRANSLATION') }}
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_BACKUP_PLAYLIST') }}</span>
        </div>
        <div class="settings-content">
          <p>{{ $t('_BACKUP_WARNING') }}</p>
          <div>
            <button class="btn btn-primary confirm-button" ng-click="backupMySettings()">{{ $t('_EXPORT_TO_LOCAL_FILE') }}</button>
            <button v-show="githubStatus == 2" class="btn btn-primary confirm-button" ng-click="showDialog(8)">{{ $t('_EXPORT_TO_GITHUB_GIST') }}</button>
          </div>
        </div>
        <div class="settings-title">
          <span>{{ $t('_RECOVER_PLAYLIST') }}</span>
        </div>
        <div class="settings-content">
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
        <div class="settings-content">
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
        <div class="settings-content">
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
        <div class="settings-content">
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
        <div class="settings-content" ng-if="!isChrome">
          <span>{{ $t('_PROXY_CONFIG') }}:</span>
          proxyMode.displayText
          <span v-show="proxyMode_name == 'custom'">proxyRules</span>
          <button ng-click="showDialog(12)">{{ $t('_MODIFY') }}</button>
        </div>-->
        <div class="settings-title">
          <span>{{ t('_ABOUT') }}</span>
        </div>
        <div class="settings-content">
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

<script setup>
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import Href from '../components/Href.vue'
import { version } from "../../package.json"
const { t, locale } = useI18n();
const store = useStore();
const isChrome = true;
let enableNowplayingCoverBackground = $computed(() => store.state.settings.enableNowplayingCoverBackground)
let enableNowplayingBitrate = $computed(() => store.state.settings.enableNowplayingBitrate)
let enableNowplayingPlatform = $computed(() => store.state.settings.enableNowplayingPlatform)
const toggleCoverBackground = () => store.dispatch("settings/setState", { enableNowplayingCoverBackground: !enableNowplayingCoverBackground })
const toggleBitrate = () => store.dispatch("settings/setState", { enableNowplayingBitrate: !enableNowplayingBitrate })
const togglePlayingPlatform = () => store.dispatch("settings/setState", { enableNowplayingPlatform: !enableNowplayingPlatform })
</script>

<style>
</style>