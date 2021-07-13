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
  actions: {
    initState({ commit, state }) {}
  }
};
