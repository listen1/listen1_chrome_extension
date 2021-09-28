import MediaService from '../../services/MediaService';
type State = {
  keywords: string;
  result: any[];
  curpage: number;
  totalpage: number;
  searchType: number;
  tab: string;
  loading: boolean;
};
export default {
  namespaced: true,
  state(): State {
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
    setSearchResult(state: State, { result, loading, totalpage }) {
      state.totalpage = totalpage;
      state.result = result;
      state.loading = loading;
    },
    changeSearchType(state: State, searchType: number) {
      state.searchType = searchType;
    },
    changeSearchTab(state: State, tab: string) {
      state.tab = tab;
    },
    changeSearchKeywords(state: State, keywords: string) {
      state.keywords = keywords;
    },
    changeSearchPage(state: State, offset: number) {
      state.curpage += offset;
    },
    setSearchPage(state: State, page: number) {
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
      }).then((data) => {
        // update the textarea
        // data.result.forEach((r) => {
        //   //   r.sourceName = $t(r.source);
        // });
        commit('setSearchResult', { result: data.result, loading: false, totalpage: Math.ceil(data.total / 20) });
        // scroll back to top when finish searching
        document.querySelector('.site-wrapper-innerd').scrollTo({ top: 0 });
      });
    }
  }
};
