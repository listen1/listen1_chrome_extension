import { reactive } from 'vue';
import { setPrototypeOfLocalStorage } from '../utils';

setPrototypeOfLocalStorage();

const nameMapping = {
  language: 'language',
  enableAutoChooseSource: 'enable_auto_choose_source',
  enableStopWhenClose: 'enable_stop_when_close',
  enableNowplayingCoverBackground: 'enable_nowplaying_cover_background',
  enableNowplayingBitrate: 'enable_nowplaying_bitrate',
  enableLyricFloatingWindow: 'enable_lyric_floating_window',
  enableLyricFloatingWindowTranslation: 'enable_lyric_floating_window_translation',
  enableGlobalShortCut: 'enable_global_shortcut',
  enableNowplayingPlatform: 'enable_nowplaying_platform',
  enableLyricTranslation: 'enable_lyric_translation',
  theme: 'theme'
};
const settings = reactive({
  language: 'zh-CN',
  enableAutoChooseSource: false,
  enableStopWhenClose: true,
  enableNowplayingCoverBackground: false,
  enableNowplayingBitrate: false,
  enableLyricFloatingWindow: false,
  enableLyricFloatingWindowTranslation: false,
  enableGlobalShortCut: false,
  enableNowplayingPlatform: false,
  enableLyricTranslation: false,
  theme: 'black'
});

function flushSettings() {
  for (const [key, value] of Object.entries(settings)) {
    if (nameMapping[key]) {
      localStorage.setObject(nameMapping[key], value);
    }
  }
}
function setSettings(newValue) {
  for (const [key, value] of Object.entries(newValue)) {
    settings[key] = value;
  }
  flushSettings();
}
function loadSettings() {
  const localSettings = Object.keys(nameMapping).reduce((res, cur) => ({ ...res, [cur]: localStorage.getObject(nameMapping[cur]) }));
  if (Object.values(localSettings).some((value) => value === null)) {
    flushSettings();
  } else {
    setSettings(localSettings);
  }
}

function useSettings() {
  return { settings, setSettings, loadSettings };
}

export default useSettings;
