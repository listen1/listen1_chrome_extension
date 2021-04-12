/* global MediaService sourceList vueApp */

vueApp.component('Playlist', {
  data() {
    return {
      result: [],
      tab: sourceList[0].name,
      sourceList,
      playlistFilters: {},
      allPlaylistFilters: {},
      currentFilterId: '',
      loading: true,
      showMore: false,      
    }
  },
  computed: {
    currentFilters() {
      return this.playlistFilters[this.tab] || [];
    }
  },
  mounted() {
    window.dbg_el = this;
    this.loadPlaylist();

    // Global Event
    const self = this;
    document.addEventListener('infinite_scroll:hit_bottom', () => {
      if (this.loading === true) {
        return;
      }
      self.loading = true;
      const offset = self.result.length;
      MediaService.showPlaylistArray(
        self.tab,
        offset,
        self.currentFilterId
      ).success((res) => {
        self.result = self.result.concat(res.result);
        self.loading = false;
      });
    });

  },
  methods: {
    changeTab(newTab) {
      this.tab = newTab;
      this.result = [];
      this.currentFilterId = '';
      this.loadPlaylist();
    },
    changeFilter(filterId) {
      this.result = [];
      this.currentFilterId = filterId;
      this.loadPlaylist();
    },
    toggleMorePlaylists() {
      this.showMore = !this.showMore;
    },
    directplaylist(id) {
      document.dispatchEvent(new CustomEvent('directplaylist', {
        detail: id,
      }));
    },
    showPlaylist(id) {
      document.dispatchEvent(new CustomEvent('show_playlist', {
        detail: id,
      }));
    },
    loadPlaylist() {
      this.showMore = false;
      MediaService.showPlaylistArray(
        this.tab,
        0,
        this.currentFilterId
      ).success((res) => {
        this.result = res.result;
        this.loading = false;
      });
  
      if (
        this.playlistFilters[this.tab] === undefined &&
        this.allPlaylistFilters[this.tab] === undefined
      ) {
        MediaService.getPlaylistFilters(this.tab).success((res) => {
          this.playlistFilters[this.tab] = res.recommend;
          this.allPlaylistFilters[this.tab] = res.all;
        });
      }
    },
  },

  template: `#tpl-playlist`,
});
