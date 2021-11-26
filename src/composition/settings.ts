import { reactive, watch } from 'vue';
import iDB from '../services/DBService';
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
type nameMapping = typeof nameMapping;
type mappingKey = keyof nameMapping;
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
  theme: 'black',
  //lyric settings
  lyricFontSize: 20,
  lyricFontWeight: 500
});
type settingsType = typeof settings;
type settingsKey = keyof settingsType;
type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
type settingEntries = Entries<settingsType>;
async function flushSettings() {
  await iDB.Settings.bulkPut(
    (Object.keys(settings) as settingsKey[]).map((key) => ({
      key,
      value: settings[key]
    }))
  );
}
function setSettings(newValue: Partial<Record<settingsKey, unknown>>) {
  for (const [key, value] of Object.entries(newValue) as settingEntries) {
    settings[key] = value as never;
    iDB.Settings.put({ key, value });
  }
}
async function loadSettings() {
  const dbRes: Record<string, unknown> = (await iDB.Settings.toArray()).reduce((ret: Record<string, unknown>, cur) => {
    ret[cur.key] = cur.value;
    return ret;
  }, {});
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

function useSettings() {
  return { settings, setSettings, loadSettings };
}
loadSettings();
watch(settings, (_, newSetting) => {
  setSettings(newSetting);
});
export default useSettings;
