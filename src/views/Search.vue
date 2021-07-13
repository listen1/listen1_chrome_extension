<template>
  <!-- content page: 快速搜索 -->
  <div class="page">
    <div class="site-wrapper-innerd">
      <div class="cover-container">
        <!-- Initialize a new AngularJS app and associate it with a module named "instantSearch"-->
        <div class="searchbox">
          <ul class="source-list">
            <li class="source-button" :class="{ active: searchtab === 'allmusic' }" @click="changeSourceTab('allmusic')">
              <a>{{ $t('_ALL_MUSIC') }}(Beta)</a>
            </li>
            <div class="splitter" />

            <template v-for="(source, index) in sourceList" :key="source.name">
              <div class="source-button" :class="{ active: tab === source.name }" @click="changeSourceTab(source.name)">
                {{ $t(source.name) }}
              </div>
              <div v-if="index != sourceList.length - 1" class="splitter" />
            </template>

            <svg
              v-show="loading"
              id="loader-1"
              class="searchspinner"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              width="40px"
              height="40px"
              viewBox="0 0 40 40"
              enable-background="new 0 0 40 40"
              xml:space="preserve"
            >
              <path
                opacity="0.2"
                fill="#000"
                d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946 s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634 c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"
              />
              <path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32,8.481,24.301,9.057,26.013,10.047z">
                <animateTransform
                  attributeType="xml"
                  attributeName="transform"
                  type="rotate"
                  from="0 20 20"
                  to="360 20 20"
                  dur="0.6s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
            <div class="search-type">
              <li class="source-button" :class="{ active: searchType === 0 }" @click="changeSearchType(0)">
                <a>单曲</a>
              </li>
              <div class="splitter" />
              <li class="source-button" :class="{ active: searchType === 1 }" @click="changeSearchType(1)">
                <a>歌单</a>
              </li>
            </div>
          </ul>
          <ul class="detail-songlist">
            <li v-if="searchType === 0" class="head">
              <div class="title">
                <a>{{ $t('_SONGS') }}</a>
              </div>
              <div class="artist">
                <a>{{ $t('_ARTISTS') }}</a>
              </div>
              <div class="album">
                <a>{{ $t('_ALBUMS') }}</a>
              </div>
              <div class="tools">{{ $t('_OPERATION') }}</div>
            </li>
            <li v-if="searchType === 1" class="head">
              <div class="title">
                <a>{{ $t('_PLAYLIST_TITLE') }}</a>
              </div>
              <div class="artist">
                <a>{{ $t('_PLAYLIST_AUTHOR') }}</a>
              </div>
              <div class="album">
                <a>{{ $t('_PLAYLIST_SONG_COUNT') }}</a>
              </div>
            </li>
            <template v-if="searchType === 0">
              <li
                v-for="song in result"
                :key="song.id"
                ng-class-odd="'odd'"
                ng-class-even="'even'"
                @mouseenter="song.options = true"
                @mouseleave="song.options = undefined"
              >
                <div class="title">
                  <!-- <a ng-if="song.disabled" class="disabled" ng-click="copyrightNotice()"> song.title |limitTo:30</a> -->
                  <a add-and-play="song" @click="play(song)">
                    <!-- <span ng-if="isActiveTab('allmusic')" class="source">{{ song.sourceName }}</span> -->
                    {{ song.title }}
                  </a>
                </div>
                <div class="artist">
                  <a @click="$router.push(`/playlist/${song.artist_id}`)">{{ song.artist }}</a>
                </div>
                <div class="album">
                  <a @click="$router.push(`/playlist/${song.album_id}`)">{{ song.album }}</a>
                </div>

                <div class="tools">
                  <a v-show="song.options" title="_ADD_TO_QUEUE" class="detail-add-button" add-without-play="song"><span class="icon li-add" /></a>
                  <a v-show="song.options" title="_ADD_TO_PLAYLIST" class="detail-fav-button" ng-click="showDialog(0, song)">
                    <span class="icon li-songlist" />
                  </a>
                  <a
                    v-show="song.options && is_mine == '1'"
                    title="_REMOVE_FROM_PLAYLIST"
                    class="detail-delete-button"
                    ng-click="removeSongFromPlaylist(song, list_id)"
                  >
                    <span class="icon li-del" />
                  </a>
                  <a v-show="options" title="_ORIGIN_LINK" class="source-button" open-url="song.source_url"><span class="icon li-link" /></a>
                </div>
              </li>
            </template>
            <template v-if="searchType === 1">
              <li v-for="playlist in result" :key="playlist.id" ng-class-odd="'odd'" ng-class-even="'even'" class="playlist-result">
                <div class="title">
                  <a @click="$router.push(`/playlist/${playlist.id}`)">
                    <img :src="playlist.img_url" err-src="https://y.gtimg.cn/mediastyle/global/img/playlist_300.png" />
                    <div>
                      {{ playlist.title }}
                      <!-- <span ng-if="isActiveTab('allmusic')" class="source playlist">{{playlist.sourceName}}</span> -->
                    </div>
                  </a>
                </div>
                <div class="artist">{{ playlist.author }}</div>
                <div class="album">{{ playlist.count }}</div>
              </li>
            </template>
          </ul>
          <div v-show="totalpage > 1" class="search-pagination">
            <button class="btn btn-sm btn-pagination" :disabled="curpage == 1" @click="changeSearchPage(-1)">上一页</button>
            <label>{{ curpage }}/{{ totalpage }} 页</label>
            <button class="btn btn-sm btn-pagination" :disabled="curpage == totalpage" @click="changeSearchPage(1)">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import MediaService from '@/services/MediaService';
import { l1Player } from '@/services/l1_player';

export default {
  data() {
    return {};
  },

  computed: {
    sourceList() {
      return MediaService.getSourceList();
    },
    ...mapState('search', ['keywords', 'result', 'curpage', 'totalpage', 'searchType', 'tab', 'loading'])
  },
  methods: {
    changeSearchType(newValue) {
      this.$store.commit('search/changeSearchType', newValue);
      this.$store.commit('search/setSearchPage', 1);

      this.$store.dispatch('search/search');
    },
    changeSourceTab(newValue) {
      this.$store.commit('search/changeSearchTab', newValue);
      this.$store.commit('search/setSearchPage', 1);

      this.$store.dispatch('search/search');
    },
    changeSearchPage(offset) {
      this.$store.commit('search/changeSearchPage', offset);
      this.$store.dispatch('search/search');
    },
    play(song) {
      l1Player.addTrack(song);
      l1Player.playById(song.id);
    }
  }
};
</script>

<style>
</style>