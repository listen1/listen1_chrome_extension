<template>
  <div class="footer">
    <div class="left-control">
      <span class="icon li-previous" @click="prevTrack()" />
      <span
        class="icon li-play play"
        :class="isPlaying ? 'li-pause' : 'li-play'"
        @click="playPauseToggle()"
      />
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
        <img
          :src="currentPlaying.img_url"
          err-src="https://y.gtimg.cn/mediastyle/global/img/album_300.png"
        />
        <div class="mask">
          <svg class="feather">
            <use href="#chevrons-up" />
          </svg>
        </div>
      </div>
      <div v-if="playlist.length > 0" class="detail">
        <div class="ctrl">
          <a @click="showModal('AddToPlaylist', { tracks: [currentPlaying] })" :title="t('_ADD_TO_PLAYLIST')">
                    <span class="icon li-songlist" />
          </a>
          <a title @click="changePlaymode()">
            <span v-show="playmode == 0" class="icon li-loop" />
            <span v-show="playmode == 1" class="icon li-single-cycle" />
            <span v-show="playmode == 2" class="icon li-random-loop" />
          </a>
        </div>

        <div class="title">
          <span
            v-if="currentPlaying.source === 'xiami'"
            style="color: orange; font-size: medium"
          >⚠️</span>
          {{ currentPlaying.title }}
        </div>
        <div class="more-info">
          <div class="current">{{ currentPosition }}</div>
          <div class="singer">
            <a @click="showPlaylist(currentPlaying.artist_id)">{{ currentPlaying.artist }}</a>
            -
            <a
              @click="showPlaylist(currentPlaying.album_id)"
            >{{ currentPlaying.album }}</a>
          </div>
          <div class="total">{{ currentDuration }}</div>
        </div>
        <div class="playbar">
          <draggable-bar
            id="progressbar"
            :progress="myProgress"
            @commit-progress="changeProgress"
          ></draggable-bar>
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
          <draggable-bar
            id="volumebar"
            :progress="volume"
            @update-progress="changeVolume"
            @commit-progress="commitVolume"
          ></draggable-bar>
        </div>
      </div>
      <div v-if="!isChrome" class="lyric-toggle">
        <div
          ng-click="openLyricFloatingWindow(true)"
          class="lyric-icon"
          ng-class="{'selected': settings.enableLyricFloatingWindow}"
        >词</div>
      </div>
    </div>
    <div class="menu-modal" :class="{ slideup: !menuHidden }" @click="togglePlaylist()" />
    <div class="menu" :class="{ slideup: !menuHidden }">
      <div class="menu-header">
        <span
          class="menu-title"
        >{{ t('_TOTAL_SONG_PREFIX') }} {{ playlist.length }} {{ t('_TOTAL_SONG_POSTFIX') }}</span>
        <a class="add-all" @click="showModal('AddToPlaylist', { tracks: playlist })">
                  <span class="icon li-songlist" ng-click="togglePlaylist()" />
                  <span>{{ t('_ADD_TO_PLAYLIST') }}</span>
        </a>
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
          v-for="(song, index) in playlist"
          id="song song.id "
          :key="song.id"
          ng-class="{ playing: currentPlaying.id == song.id }"
          ng-mouseenter="playlist_highlight=true"
          ng-mouseleave="playlist_highlight=false"
          :class="{'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
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
              <span
                v-if="song.source === 'xiami'"
                style="color: orange; border-radius: 12px; border: solid 1px; padding: 0 4px"
              >⚠️ 🦐</span>
              {{ song.title }}
            </a>
          </div>
          <div class="song-singer">
            <a @click="showPlaylist(song.artist_id); togglePlaylist();">{{ song.artist }}</a>
          </div>
          <div class="tools">
            <span
              v-show="playlist_highlight"
              remove-from-playlist="song"
              data-index="$index"
              class="icon li-del"
            />
            <span v-show="playlist_highlight" open-url="song.source_url" class="icon li-link" />
          </div>
          <!-- <div class="song-time">00:00</div> -->
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>

import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DraggableBar from '../components/DraggableBar.vue';
import usePlayer from '../composition/player';
import { l1Player } from '../services/l1_player';

const { t } = useI18n();
const { player } = usePlayer();
const router = useRouter();

let window_type = $ref('');
let isChrome = $ref(true);
let playlist_highlight = $ref(false);
let menuHidden = $ref(true);
let playmode = $computed(() => player.playmode);

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

const showModal = inject('showModal');

let playlist = $computed(() => player.playlist);
let isPlaying = $computed(() => player.isPlaying);
let myProgress = $computed(() => player.myProgress);
let currentDuration = $computed(() => player.currentDuration);
let currentPosition = $computed(() => player.currentPosition);
let currentPlaying = $computed(() => player.currentPlaying);
let volume = $computed(() => player.volume);
let mute = $computed(() => player.mute);

</script>
