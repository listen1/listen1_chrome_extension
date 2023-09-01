import { reactive, watch } from 'vue';
import type { Language } from '../i18n';
import SettingModel from '../models/SettingModel';

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
  floatWindowSetting: 'float_window_setting',
  enableGlobalShortCut: 'enable_global_shortcut',
  enableNowplayingPlatform: 'enable_nowplaying_platform',
  enableLyricTranslation: 'enable_lyric_translation',
  autoChooseSourceList: 'auto_choose_source_list',
  playerSettings: 'player_settings',
  theme: 'theme'
};

type nameMapping = typeof nameMapping;
type mappingKey = keyof nameMapping;

const settings = reactive({
  language: 'zh-CN' as Language,
  enableAutoChooseSource: false,
  enableStopWhenClose: true,
  enableNowplayingCoverBackground: false,
  enableNowplayingBitrate: false,
  enableNowplayingComment: false,
  enableLyricFloatingWindow: false,
  enableLyricFloatingWindowTranslation: false,
  enableGlobalShortCut: false,
  enableNowplayingPlatform: false,
  enableLyricTranslation: false,
  floatWindowSetting: { backgroundAlpha: 0.6, fontSize: 22, color: '#ffffff' },
  theme: 'black' as Theme,
  playerSettings: { playmode: 0, volume: 100 },
  //lyric settings
  lyricFontSize: 15,
  lyricFontWeight: 400,
  autoChooseSourceList: ['kuwo', 'qq', 'migu']
});

export type settingsType = typeof settings;
export type settingsKey = keyof settingsType;
type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
export type settingEntries = Entries<settingsType>;

async function flushSettings() {
  await SettingModel.flushSettings(settings);
}
function setSettings(newValue: Partial<Record<settingsKey, unknown>>) {
  for (const [key, value] of Object.entries(newValue) as settingEntries) {
    settings[key] = value as never;
  }
  SettingModel.setSettings(newValue);
}

function saveSettingsToDB(newValue: Partial<Record<settingsKey, unknown>>) {
  SettingModel.setSettings(newValue);
}

async function loadSettings() {
  const dbRes: Record<string, unknown> = await SettingModel.loadSettings();
  if (Object.values(dbRes).some((value) => value === undefined)) {
    flushSettings();
  } else {
    setSettings(dbRes);
  }
}

export function migrateSettings() {
  let lsSettings = (Object.keys(nameMapping) as mappingKey[]).reduce(
    (res, cur) => ({ ...res, [cur]: localStorage.getObject(nameMapping[cur]) }),
    {}
  ) as Partial<settingsType>;
  if (Object.values(lsSettings).some((value) => value === undefined || value === null)) {
    lsSettings = settings;
  }
  setSettings(lsSettings);
}
async function getSettingsAsync() {
  return await SettingModel.loadSettings();
}
export function getSetting(key: settingsKey) {
  return settings[key];
}
function useSettings() {
  return { settings, setSettings, loadSettings, saveSettingsToDB, getSettingsAsync };
}
watch(settings, (_, newSetting) => {
  setSettings(newSetting);
});
export default useSettings;
