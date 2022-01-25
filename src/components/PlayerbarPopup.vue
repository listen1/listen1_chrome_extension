<template>
  <div class="menu-modal fixed top-0 right-0 left-0 bg-white bg-opacity-20" :class="{ 'bottom-20': !hidden }" @click="close()" />
  <div
    class="menu bg-theme fixed overflow-hidden border-default rounded-t-lg h-96"
    :class="{ 'bottom-20 opacity-100': !hidden, '-bottom-80 opacity-0': hidden }">
    <div class="menu-header text-sm h-10 border-b border-default flex items-center bg-menu">
      <span class="menu-title flex-1 px-4 border-default border-r">{{ t('_TOTAL_SONG_PREFIX') }} {{ playlist.length }} {{ t('_TOTAL_SONG_POSTFIX') }}</span>
      <a class="add-all pr-4 flex items-center cursor-pointer" @click="showModal('AddToPlaylist', { tracks: playlist })">
        <span class="icon mr-2 li-songlist" />
        <span>{{ t('_ADD_TO_PLAYLIST') }}</span>
      </a>
      <a class="remove-all mr-4 flex items-center cursor-pointer" @click="clearPlaylist()">
        <span class="icon mr-2 li-del" />
        <span>{{ t('_CLEAR_ALL') }}</span>
      </a>

      <a class="close mx-4 cursor-pointer flex items-center" @click="close()">
        <vue-feather size="1.25rem" type="x"></vue-feather>
      </a>
    </div>
    <ul class="menu-list overflow-y-scroll text-sm align-middle">
      <DragDropZone
        v-for="(song, index) in playlist"
        :id="'song_' + song.id"
        :key="song.id"
        :draggable="true"
        :class="{ playing: currentPlaying.id == song.id, even: index % 2 === 0, odd: index % 2 !== 0, 'flex items-center h-10 relative': true }"
        dragtype="application/listen1-song"
        :dragobject="song"
        :dragtitle="song.title"
        :sortable="true"
        @mouseenter="song.highlight = true"
        @mouseleave="song.highlight = undefined"
        @drop="onCurrentPlayingSongDrop(song, $event)">
        <div class="w-8 text-right">
          <span>{{ index + 1 }}</span>
        </div>
        <div class="song-status-icon w-8 text-center">
          <vue-feather v-show="currentPlaying.id == song.id" size="1rem" type="play"></vue-feather>
        </div>
        <div class="song-title flex-2" :class="song.disabled ? 'text-disabled' : ''">
          <a class="cursor-pointer" @click="playFromPlaylist(song)">
            <span v-if="song.source === 'xiami'" style="color: orange; border-radius: 12px; border: solid 1px; padding: 0 4px">⚠️ 🦐</span>
            {{ song.title }}
          </a>
        </div>
        <div class="song-singer truncate cursor-pointer flex-1">
          <a
            @click="
              showPlaylist(song.artist_id);
              close();
            ">
            {{ song.artist }}
          </a>
        </div>
        <div class="tools w-12 mr-4">
          <span v-show="song.highlight" class="icon li-del opacity-50 hover:opacity-100 mr-2" @click="removeTrack(song)" />
          <span v-show="song.highlight" class="icon li-link opacity-50 hover:opacity-100" @click="openUrl(song.source_url)" />
        </div>
        <!-- <div class="song-time">00:00</div> -->
      </DragDropZone>
    </ul>
  </div>
</template>
<script setup lang="ts">
const { hidden } = defineProps<{
  hidden: boolean;
}>();
import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import usePlayer from '../composition/player';
import { l1Player } from '../services/l1_player';
import DragDropZone from './DragDropZone.vue';

const { t } = useI18n();
const { player } = usePlayer();
const router = useRouter();
const showModal = inject('showModal') as CallableFunction;

const showPlaylist = (playlistId: string) => {
  router.push(`/playlist/${playlistId}`);
};

const clearPlaylist = () => {
  l1Player.clearPlaylist();
};

const playFromPlaylist = (song: any) => {
  l1Player.playById(song.id);
};
const removeTrack = (track: any) => {
  l1Player.removeTrack(track);
};
const openUrl = (url: string) => {
  window.open(url, '_blank')?.focus();
};
const onCurrentPlayingSongDrop = (song: any, event: any) => {
  const { data, dragType, direction } = event;
  if (dragType === 'application/listen1-song') {
    // insert song
    l1Player.insertTrack(data, toRaw(song), direction);
  }
};
const emits = defineEmits(['close']);

const close = () => {
  emits('close');
};

let playlist: any = $computed(() => player.playlist.value);
let currentPlaying: any = $computed(() => player.currentPlaying || {});
</script>
<style>
.footer .menu ul.menu-list {
  height: 21.5rem;
}
.footer .menu {
  left: 300px;
  right: 300px;
  -webkit-app-region: no-drag;
}

.footer .menu ul.menu-list li .song-status-icon svg {
  fill: var(--important-color);
  stroke: var(--important-color);
}
</style>
