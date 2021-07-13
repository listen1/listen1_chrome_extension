<template>
  <!-- my platform window-->
  <div class="page page-hot-playlist" ng-controller="PlatformController">
    <div v-show="is_window_hidden == 1" class="source-list">
      <div ng-repeat-start="source in ::platformSourceList" class="source-button" ng-class="{'active':tab === source.name}" ng-click="changeTab(source.name)">
        source.displayText
      </div>
      <div ng-repeat-end ng-if="!$last" class="splitter" />
    </div>
    <div id="hotplaylist" class="site-wrapper-innerd">
      <div id="playlist-content" class="cover-container">
        <ul class="playlist-covers">
          <li ng-repeat="i in myPlatformPlaylists">
            <div class="u-cover">
              <img ng-src="i.cover_img_url" ng-click="showPlaylist(i.id)" />
              <div class="bottom" ng-click="directplaylist(i.id)">
                <svg class="feather">
                  <use href="#play-circle" />
                </svg>
              </div>
            </div>
            <div class="desc">
              <span class="title" ng-click="showPlaylist(i.id)">i.title</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style>
</style>