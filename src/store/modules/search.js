import MediaService from '../../services/MediaService';

export default {
  namespaced: true,
  state() {
    return {
      keywords: '',
      result: [],
      curpage: 1,
      totalpage: 0,
      searchType: 0,
      tab: 'netease',
      loading: false
    };
  },
  mutations: {
    setSearchResult(state, { result, loading, totalpage }) {
      state.totalpage = totalpage;
      state.result = result;
      state.loading = loading;
    },
    changeSearchType(state, searchType) {
      state.searchType = searchType;
    },
    changeSearchTab(state, tab) {
      state.tab = tab;
    },
    changeSearchKeywords(state, keywords) {
      state.keywords = keywords;
    },
    changeSearchPage(state, offset) {
      state.curpage += offset;
    },
    setSearchPage(state, page) {
      state.curpage = page;
    }
  },
  actions: {
    search({ commit, state }) {
      commit('setSearchResult', { result: [], loading: true, totalpage: 0 });

      MediaService.search(state.tab, {
        keywords: state.keywords,
        curpage: state.curpage,
        type: state.searchType
      }).success((data) => {
        // update the textarea
        data.result.forEach((r) => {
          //   r.sourceName = $t(r.source);
        });

        commit('setSearchResult', { result: data.result, loading: false, totalpage: Math.ceil(data.total / 20) });

        // scroll back to top when finish searching
        document.querySelector('.site-wrapper-innerd').scrollTo({ top: 0 });
      });
    }
  }
};
