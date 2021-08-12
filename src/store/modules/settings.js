export default {
  namespaced: true,
  state() {
    return {
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
      for (let k in newValue) {
        state[k] = newValue[k];
      }
    }
  },

  actions: {
    saveState({ state }) {
      const settings = {
        enable_nowplaying_cover_background: state.enableNowplayingCoverBackground,
        enable_nowplaying_bitrate: state.enableNowplayingBitrate,
        enable_nowplaying_platform: state.enableNowplayingPlatform
      };
      for (const [key, value] of Object.entries(settings)) {
        localStorage.setObject(key, value);
      }
    },
    initState({ commit, dispatch }) {
      const settingKeys = ['enable_nowplaying_cover_background', 'enable_nowplaying_bitrate', 'enable_nowplaying_platform'];
      const localSettings = settingKeys.map((key) => localStorage.getObject(key));
      if (localSettings.some((value) => value === null)) {
        dispatch('saveState');
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
