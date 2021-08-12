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
      for (const [key, value] of Object.entries(newValue)) {
        state[key] = value;
      }
    }
  },

  actions: {
    saveState({ state }) {
      for (const [key, value] of Object.entries(state)) {
        localStorage.setObject(key, value);
      }
    },
    initState({ commit, dispatch, state }) {
      const localSettings = Object.keys(state).reduce((res, cur) => ({ ...res, [cur]: localStorage.getObject(cur) }), {});
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
