/* eslint-disable no-param-reassign */
/* global angular i18next MediaService sourceList */
angular.module('listenone').controller('InstantSearchController', [
  '$scope',
  '$timeout',
  '$rootScope',
  ($scope, $timeout, $rootScope) => {
    $scope.originpagelog = { allmusic: 1 };
    sourceList.forEach((i) => {
      $scope.originpagelog[i.name] = 1;
    });
    $scope.sourceList = sourceList.filter((i) => i.searchable !== false);
    $scope.tab = sourceList[0].name;
    $scope.keywords = '';
    $scope.loading = false;
    $scope.curpagelog = { ...$scope.originpagelog };
    $scope.totalpagelog = { ...$scope.originpagelog };
    $scope.curpage = 1;
    $scope.totalpage = 1;
    $scope.searchType = 0;

    function updateCurrentPage(cp) {
      if (cp === -1) {
        // when search words changes,pagenums should be reset.
        $scope.curpagelog = { ...$scope.originpagelog };
        $scope.curpage = 1;
      } else if (cp >= 0) {
        $scope.curpagelog[$scope.tab] = cp;
        $scope.curpage = $scope.curpagelog[$scope.tab];
      } else {
        // only tab changed
        $scope.curpage = $scope.curpagelog[$scope.tab];
      }
    }

    function updateTotalPage(totalItem) {
      if (totalItem === -1) {
        $scope.totalpagelog = { ...$scope.originpagelog };
        $scope.totalpage = 1;
      } else if (totalItem >= 0) {
        $scope.totalpage = Math.ceil(totalItem / 20);
        $scope.totalpagelog[$scope.tab] = $scope.totalpage;
      } else {
        // just switch tab
        $scope.totalpage = $scope.totalpagelog[$scope.tab];
      }
    }

    function performSearch() {
      $rootScope.$broadcast('search:keyword_change', $scope.keywords);
      MediaService.search($scope.tab, {
        keywords: $scope.keywords,
        curpage: $scope.curpage,
        type: $scope.searchType,
      }).success((data) => {
        // update the textarea
        data.result.forEach((r) => {
          r.sourceName = i18next.t(r.source);
        });
        $scope.result = data.result;
        updateTotalPage(data.total);
        $scope.loading = false;
        // scroll back to top when finish searching
        document.querySelector('.site-wrapper-innerd').scrollTo({ top: 0 });
      });
    }

    $scope.changeSourceTab = (newTab) => {
      $scope.loading = true;
      $scope.tab = newTab;
      $scope.result = [];
      updateCurrentPage();
      updateTotalPage();

      if ($scope.keywords === '') {
        $scope.loading = false;
      } else {
        performSearch();
      }
    };

    $scope.changeSearchType = (newSearchType) => {
      $scope.loading = true;
      $scope.searchType = newSearchType;
      $scope.result = [];
      updateCurrentPage();
      updateTotalPage();

      if ($scope.keywords === '') {
        $scope.loading = false;
      } else {
        performSearch();
      }
    };
    $scope.isActiveTab = (tab) => $scope.tab === tab;

    $scope.isSearchType = (searchType) => $scope.searchType === searchType;

    // eslint-disable-next-line consistent-return
    function renderSearchPage() {
      updateCurrentPage(-1);
      updateTotalPage(-1);
      if (!$scope.keywords || $scope.keywords.length === 0) {
        $scope.result = [];
        return 0;
      }

      performSearch();
    }

    $scope.$watch('keywords', (tmpStr) => {
      if (tmpStr === $scope.keywords) {
        // if searchStr is still the same..
        // go ahead and retrieve the data
        renderSearchPage();
      }
    });

    $scope.enterEvent = (e) => {
      const keycode = window.event ? e.keyCode : e.which;
      if (keycode === 13) {
        // enter key
        renderSearchPage();
      }
    };

    $scope.nextPage = () => {
      $scope.curpagelog[$scope.tab] += 1;
      $scope.curpage = $scope.curpagelog[$scope.tab];
      performSearch();
    };

    $scope.previousPage = () => {
      $scope.curpagelog[$scope.tab] -= 1;
      $scope.curpage = $scope.curpagelog[$scope.tab];
      performSearch();
    };
  },
]);
