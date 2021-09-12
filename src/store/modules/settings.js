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
  enableLyricTranslation: 'enable_lyric_translation'
};
export default {
  namespaced: true,
  state() {
    return {
      language: 'zh-CN',
      enableAutoChooseSource: false,
      enableStopWhenClose: true,
      enableNowplayingCoverBackground: false,
      enableNowplayingBitrate: false,
      enableLyricFloatingWindow: false,
      enableLyricFloatingWindowTranslation: false,
      enableGlobalShortCut: false,
      enableNowplayingPlatform: false,
      enableLyricTranslation: false
    };
  },
  mutations: {
    setBySetting(state, newValue) {
      for (const [key, value] of Object.entries(newValue)) {
        state[key] = value;
      }
    }
  },

  actions: {
    saveState({ state }) {
      for (const [key, value] of Object.entries(state)) {
        if (nameMapping[key]) {
          localStorage.setObject(nameMapping[key], value);
        }
      }
    },
    initState({ commit, dispatch, state }) {
      const localSettings = Object.keys(nameMapping).reduce((res, cur) => ({ ...res, [cur]: localStorage.getObject(nameMapping[cur]) }));
      if (Object.values(localSettings).some((value) => value === null)) {
        dispatch('saveState', state);
      } else {
        commit('setBySetting', localSettings);
      }
    },
    setState({ commit, dispatch }, newSetting) {
      commit('setBySetting', newSetting);
      dispatch('saveState');
    }
  }
};
