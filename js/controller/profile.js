/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* global angular i18next sourceList platformSourceList */
angular.module('listenone').controller('ProfileController', [
  '$scope',
  ($scope) => {
    let defaultLang = 'zh-CN';
    const supportLangs = ['zh-CN', 'en-US'];
    if (supportLangs.indexOf(navigator.language) !== -1) {
      defaultLang = navigator.language;
    }
    if (supportLangs.indexOf(localStorage.getObject('language')) !== -1) {
      defaultLang = localStorage.getObject('language');
    }
    $scope.lastestVersion = '';

    $scope.proxyModes = [
      { name: 'system', displayId: '_PROXY_SYSTEM' },
      { name: 'direct', displayId: '_PROXY_DIRECT' },
      { name: 'custom', displayId: '_PROXY_CUSTOM' },
    ];
    [$scope.proxyMode] = $scope.proxyModes;
    $scope.proxyRules = '';

    $scope.modifyProxyRules = () => {
      if (isElectron()) {
        const message = 'update_proxy_config';
        $scope.proxyRules = document.getElementById('proxy-rules').value;
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('control', message, {
          proxyRules: $scope.proxyRules,
        });
      }
    };
    $scope.changeProxyMode = (option) => {
      const mode = option.name;
      if (isElectron()) {
        if (mode === 'system' || mode === 'direct') {
          const message = 'update_proxy_config';
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('control', message, { mode });
        } else {
          $scope.proxyRules = '';
        }
      }
    };

    $scope.initProfile = () => {
      const url = `https://api.github.com/repos/listen1/listen1_chrome_extension/releases/latest`;
      axios.get(url).then((response) => {
        $scope.lastestVersion = response.data.tag_name;
      });
      if (isElectron()) {
        // proxy config
        const message = 'get_proxy_config';
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('control', message);
      }
    };

    if (isElectron()) {
      const { ipcRenderer } = require('electron');

      ipcRenderer.on('proxyConfig', (event, config) => {
        // parse config
        if (config.mode === 'system' || config.mode === 'direct') {
          [$scope.proxyMode] = $scope.proxyModes.filter(
            (i) => i.name === config.mode
          );
          $scope.proxyRules = '';
        } else {
          [$scope.proxyMode] = $scope.proxyModes.filter(
            (i) => i.name === 'custom'
          );
          $scope.proxyRules = config.proxyRules;
        }
      });
    }
    $scope.setLang = (langKey) => {
      // You can change the language during runtime
      i18next.changeLanguage(langKey).then((t) => {
        axios.get('i18n/zh-CN.json').then((res) => {
          Object.keys(res.data).forEach((key) => {
            $scope[key] = t(key);
          });
          sourceList.forEach((item) => {
            item.displayText = t(item.displayId);
          });
          platformSourceList.forEach((item) => {
            item.displayText = t(item.displayId);
          });
          $scope.proxyModes.forEach((item) => {
            item.displayText = t(item.displayId);
          });
        });
        localStorage.setObject('language', langKey);
      });
    };
    $scope.setLang(defaultLang);

    let defaultTheme = 'white';
    if (localStorage.getObject('theme') !== null) {
      defaultTheme = localStorage.getObject('theme');
    }
    $scope.setTheme = (theme) => {
      const themeFiles = {
        white: 'css/iparanoid.css',
        black: 'css/origin.css',
      };
      // You can change the language during runtime
      if (themeFiles[theme] !== undefined) {
        document.getElementById('theme').href = themeFiles[theme];
        localStorage.setObject('theme', theme);
      }
    };
    $scope.setTheme(defaultTheme);
  },
]);
