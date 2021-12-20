<template>
  <div class="volume-ctrl flex flex-1 items-center">
    <vue-feather class="icon cursor-pointer ml-6 mr-2" :type="volumeIcon" size="1.5rem" stroke-width="1" @click="toggleMuteStatus()" />
    <div class="m-pbar volume flex-1">
      <DraggableBar
        id="volumebar"
        :progress="volume * 100"
        @update-progress="changeVolume"
        @commit-progress="commitVolume"
        btn-class="h-4 w-4 bg-white border border-gray-200"></DraggableBar>
    </div>
  </div>
</template>

<script setup lang="ts">
import DraggableBar from '../components/DraggableBar.vue';
import usePlayer from '../composition/player';
import useSettings from '../composition/settings';

import { l1Player } from '../services/l1_player';
const { player } = usePlayer();

const { saveSettingsToDB, getSettingsAsync } = useSettings();

let volume = $computed(() => player.volume);

const changeVolume = (progress: number) => {
  l1Player.setVolume(progress);
  l1Player.unmute();
};
const commitVolume = (progress: number) => {
  changeVolume(progress);
  // TODO: use settings.playerSettings will get old init value
  // must use getSettings to fetch recent value
  const task = async () => {
    const settings = await getSettingsAsync();
    saveSettingsToDB({ playerSettings: { ...(settings.playerSettings as Record<string, unknown>), volume: progress * 100 } });
  };
  task();
};
const toggleMuteStatus = () => {
  player.mute = !player.mute;
  l1Player.toggleMute();
};
let volumeIcon = $computed(() => {
  if (player.mute) {
    return 'volume-x';
  } else if (volume > 0.5) {
    return 'volume-2';
  } else if (volume > 0) {
    return 'volume-1';
  } else {
    return 'volume';
  }
});
</script>
<style>
.footer .right-control .volume-ctrl .barbg .cur .btn {
  right: -13px;
  top: -6px;
}
</style>
