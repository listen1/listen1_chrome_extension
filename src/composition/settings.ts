import { reactive } from 'vue';
import { setPrototypeOfLocalStorage } from '../utils';
import iDB from '../services/DBService';

setPrototypeOfLocalStorage();

const nameMapping: Record<string, string> = {
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
const settings: Record<string, unknown> = reactive({
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

async function flushSettings() {
  await iDB.Settings.bulkPut(Object.keys(settings).map((key) => ({
    key: nameMapping[key] || key,
    value: settings[key],
  }))
  );
}
function setSettings(newValue: Record<string, unknown>) {
  for (const [key, value] of Object.entries(newValue)) {
    settings[key] = value;
    iDB.Settings.put({ key: nameMapping[key] || key, value });
  }
}
async function loadSettings() {
  const dbRes: Record<string, unknown> = (await iDB.Settings.toArray()).reduce((ret: Record<string, unknown>, cur) => {
    ret[cur.key] = cur.value;
    return ret;
  }, {});
  const localSettings =
    Object.keys(nameMapping).reduce((res: Record<string, unknown>, cur) => {
      res[cur] = dbRes[nameMapping[cur]];
      return res;
    }, {});
  if (Object.values(localSettings).some((value) => value === undefined)) {
    flushSettings();
  } else {
    setSettings(localSettings);
  }
}

export function migrateSettings() {
  const lsSettings = Object.keys(nameMapping).reduce((res, cur) => ({ ...res, [cur]: localStorage.getObject(nameMapping[cur]) }), {});
  setSettings(lsSettings);
}

function useSettings() {
  return { settings, setSettings, loadSettings };
}
loadSettings();

export default useSettings;
