/* eslint-disable no-shadow */
/* global l1Player require */
/* global angular isElectron i18next i18nextHttpBackend Notyf notyf */
/* global setPrototypeOfLocalStorage  */
/* eslint-disable global-require */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-unresolved */

const sourceList = [
  {
    name: 'netease',
    displayId: '_NETEASE_MUSIC',
  },
  {
    name: 'qq',
    displayId: '_QQ_MUSIC',
  },
  {
    name: 'kugou',
    displayId: '_KUGOU_MUSIC',
  },
  {
    name: 'kuwo',
    displayId: '_KUWO_MUSIC',
  },
  {
    name: 'bilibili',
    displayId: '_BILIBILI_MUSIC',
    searchable: false,
  },
  {
    name: 'migu',
    displayId: '_MIGU_MUSIC',
  },
  {
    name: 'taihe',
    displayId: '_TAIHE_MUSIC',
  },
];

const main = () => {
  const app = angular.module('listenone', ['lastfmClient', 'githubClient']);
  setPrototypeOfLocalStorage();
  app.config([
    '$compileProvider',
    ($compileProvider) => {
      $compileProvider.imgSrcSanitizationWhitelist(
        /^\s*(https?|ftp|mailto|chrome-extension|moz-extension|file):/
      );
    },
  ]);

  app.config((lastfmProvider) => {
    lastfmProvider.setOptions({
      apiKey: '6790c00a181128dc7c4ce06cd99d17c8',
      apiSecret: 'd68f1dfc6ff43044c96a79ae7dfb5c27',
    });
  });

  app.run([
    '$q',
    ($q) => {
      axios.Axios.prototype.request_original = axios.Axios.prototype.request;
      axios.Axios.prototype.request = function new_req(config) {
        return $q.when(this.request_original(config));
      };
      window.notyf = new Notyf({
        duration: 5000,
        ripple: true,
        position: { x: 'center', y: 'top' },
        types: [
          {
            type: 'warning',
            background: 'darkorange',
            icon: false,
          },
          {
            type: 'info',
            background: 'deepskyblue',
            icon: false,
          },
        ],
      });
      window.notyf.warning = (msg, replace) => {
        if (replace) {
          notyf.dismissAll();
        }
        window.notyf.open({
          type: 'warning',
          message: msg,
        });
      };
      window.notyf.info = (msg, replace) => {
        if (replace) {
          notyf.dismissAll();
        }
        window.notyf.open({
          type: 'info',
          message: msg,
        });
      };
      axios.get('/images/feather-sprite.svg').then((res) => {
        document.getElementById('feather-container').innerHTML = res.data;
      });
    },
  ]);

  l1Player.injectDirectives(app);

  app.filter('playmode_title', () => (input) => {
    switch (input) {
      case 0:
        return '顺序';
      case 1:
        return '随机';
      case 2:
        return '单曲循环';
      default:
        return '';
    }
  });

  app.directive('customOnChange', () => {
    const ret = {
      restrict: 'A',
      link: (scope, element, attrs) => {
        const onChangeHandler = scope.$eval(attrs.customOnChange);
        element.bind('change', onChangeHandler);
      },
    };
    return ret;
  });

  app.directive('volumeWheel', () => (scope, element, attrs) => {
    element.bind('mousewheel', () => {
      l1Player.adjustVolume(window.event.wheelDelta > 0);
    });
  });

  app.directive('pagination', () => ({
    restrict: 'EA',
    replace: false,
    template: ` <button class="btn btn-sm btn-pagination" ng-click="previousPage()" ng-disabled="curpage==1"> 上一页</button>
    <label> {{curpage}}/{{totalpage}} 页 </label>
    <button class="btn btn-sm btn-pagination" ng-click="nextPage()" ng-disabled="curpage==totalpage"> 下一页</button>`,
  }));

  app.directive('errSrc', () => ({
    // http://stackoverflow.com/questions/16310298/if-a-ngsrc-path-resolves-to-a-404-is-there-a-way-to-fallback-to-a-default
    link: (scope, element, attrs) => {
      element.bind('error', () => {
        if (attrs.src !== attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
      attrs.$observe('ngSrc', (value) => {
        if (!value && attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    },
  }));

  app.directive('resize', ($window) => (scope, element) => {
    const w = angular.element($window);
    const changeHeight = () => {
      const headerHeight = 90;
      const footerHeight = 90;
      element.css('height', `${w.height() - headerHeight - footerHeight}px`);
    };
    w.bind('resize', () => {
      changeHeight(); // when window size gets changed
    });
    changeHeight(); // when page loads
  });

  app.directive('addAndPlay', [
    () => ({
      restrict: 'EA',
      scope: {
        song: '=addAndPlay',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          l1Player.addTrack(scope.song);
          l1Player.playById(scope.song.id);
        });
      },
    }),
  ]);

  app.directive('addWithoutPlay', [
    () => ({
      restrict: 'EA',
      scope: {
        song: '=addWithoutPlay',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          l1Player.addTrack(scope.song);
          notyf.success(i18next.t('_ADD_TO_QUEUE_SUCCESS'));
        });
      },
    }),
  ]);

  app.directive('openUrl', [
    '$window',
    ($window) => ({
      restrict: 'EA',
      scope: {
        url: '=openUrl',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          if (isElectron()) {
            const { shell } = require('electron');
            shell.openExternal(scope.url);
          } else {
            $window.open(scope.url, '_blank');
          }
        });
      },
    }),
  ]);

  app.directive('windowControl', [
    '$window',
    ($window) => ({
      restrict: 'EA',
      scope: {
        action: '@windowControl',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          if (isElectron()) {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('control', scope.action);
          }
        });
      },
    }),
  ]);

  app.directive('infiniteScroll', [
    '$window',
    '$rootScope',
    ($window, $rootScope) => ({
      restrict: 'EA',
      scope: {
        infiniteScroll: '&',
        contentSelector: '=contentSelector',
      },
      link(scope, elements, attrs) {
        elements.bind('scroll', (event) => {
          if (scope.loading) {
            return;
          }
          const containerElement = elements[0];
          const contentElement = document.querySelector(scope.contentSelector);

          const baseTop = containerElement.getBoundingClientRect().top;
          const currentTop = contentElement.getBoundingClientRect().top;
          const baseHeight = containerElement.offsetHeight;
          const offset = baseTop - currentTop;

          const bottom = offset + baseHeight;
          const height = contentElement.offsetHeight;

          const remain = height - bottom;
          if (remain < 0) {
            // page not shown
            return;
          }
          const offsetToload = 10;
          if (remain <= offsetToload) {
            $rootScope.$broadcast('infinite_scroll:hit_bottom', '');
          }
        });
      },
    }),
  ]);

  app.directive('draggable', [
    '$document',
    '$rootScope',
    ($document, $rootScope) => (scope, element, attrs) => {
      let x;
      let container;
      const { mode } = attrs;

      function onMyMousedown() {
        if (mode === 'play') {
          scope.changingProgress = true;
        }
      }

      function onMyMouseup() {
        if (mode === 'play') {
          scope.changingProgress = false;
        }
      }

      function onMyUpdateProgress(progress) {
        if (mode === 'play') {
          $rootScope.$broadcast('track:myprogress', progress * 100);
        }
        if (mode === 'volume') {
          l1Player.setVolume(progress * 100);
          l1Player.unmute();
        }
      }

      function onMyCommitProgress(progress) {
        if (mode === 'play') {
          l1Player.seek(progress);
        }
        if (mode === 'volume') {
          const current = localStorage.getObject('player-settings');
          current.volume = progress * 100;
          localStorage.setObject('player-settings', current);
        }
      }

      function commitProgress(progress) {
        onMyCommitProgress(progress);
      }

      function updateProgress() {
        if (container) {
          if (x < 0) {
            x = 0;
          } else if (x > container.right - container.left) {
            x = container.right - container.left;
          }
        }
        const progress = x / (container.right - container.left);
        onMyUpdateProgress(progress);
      }

      function mousemove(event) {
        x = event.clientX - container.left;
        updateProgress();
      }

      function mouseup() {
        const progress = x / (container.right - container.left);
        commitProgress(progress);
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
        onMyMouseup();
      }

      element.on('mousedown', (event) => {
        onMyMousedown();
        container = document.getElementById(attrs.id).getBoundingClientRect();
        // Prevent default dragging of selected content
        event.preventDefault();
        x = event.clientX - container.left;
        updateProgress();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });
    },
  ]);
};

i18next.use(i18nextHttpBackend).init({
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  supportedLngs: ['zh-CN', 'zh-TC', 'en-US', 'fr-FR'],
  preload: ['zh-CN', 'zh-TC', 'en-US', 'fr-FR'],
  debug: false,
  backend: {
    loadPath: 'i18n/{{lng}}.json',
  },
});

main();
