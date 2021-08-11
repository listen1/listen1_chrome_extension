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
        enableNowplayingCoverBackground: state.enableNowplayingCoverBackground,
        enableNowplayingBitrate: state.enableNowplayingBitrate,
        enableNowplayingPlatform: state.enableNowplayingPlatform
      };
      localStorage.setObject('listen1-settings', settings);
    },
    initState({ commit, dispatch }) {
      const localSettings = localStorage.getObject('listen1-settings');
      if (localSettings === null) {
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
