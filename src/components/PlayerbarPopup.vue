<template>
  <div class="menu-modal fixed left-0 right-0 top-0 bg-white bg-opacity-20" :class="{ 'bottom-20': !hidden }" @click="close()" />
  <div
    class="menu fixed h-96 overflow-hidden rounded-t-lg border-default bg-theme"
    :class="{ 'bottom-20 opacity-100': !hidden, '-bottom-80 opacity-0': hidden }">
    <div class="menu-header flex h-10 items-center border-b border-default bg-menu text-sm">
      <span class="menu-title flex-1 border-r border-default px-4">{{ t('_TOTAL_SONG_PREFIX') }} {{ playlist.length }} {{ t('_TOTAL_SONG_POSTFIX') }}</span>
      <a class="add-all flex cursor-pointer items-center pr-4" @click="showModal('AddToPlaylist', { tracks: playlist })">
        <span class="icon li-songlist mr-2" />
        <span>{{ t('_ADD_TO_PLAYLIST') }}</span>
      </a>
      <a class="remove-all mr-4 flex cursor-pointer items-center" @click="clearPlaylist()">
        <span class="icon li-del mr-2" />
        <span>{{ t('_CLEAR_ALL') }}</span>
      </a>

      <a class="close mx-4 flex cursor-pointer items-center" @click="close()">
        <vue-feather size="1.25rem" type="x"></vue-feather>
      </a>
    </div>
    <ul class="menu-list overflow-y-scroll align-middle text-sm">
      <DragDropZone
        v-for="(song, index) in playlist"
        :id="'song_' + song.id"
        :key="song.id"
        :draggable="true"
        :class="{ playing: currentPlaying.id == song.id, even: index % 2 === 0, odd: index % 2 !== 0, 'relative flex h-10 items-center': true }"
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
        <div class="song-singer flex-1 cursor-pointer truncate">
          <a
            @click="
              showPlaylist(song.artist_id);
              close();
            ">
            {{ song.artist }}
          </a>
        </div>
        <div class="tools mr-4 w-12">
          <span v-show="song.highlight" class="icon li-del mr-2 opacity-50 hover:opacity-100" @click="removeTrack(song)" />
          <span v-show="song.highlight" class="icon li-link opacity-50 hover:opacity-100" @click="openUrl(song.source_url)" />
        </div>
        <!-- <div class="song-time">00:00</div> -->
      </DragDropZone>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import usePlayer from '../composition/player';
import { l1Player } from '../services/l1_player';
import DragDropZone from './DragDropZone.vue';

const { hidden } = defineProps<{
  hidden: boolean;
}>();
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
