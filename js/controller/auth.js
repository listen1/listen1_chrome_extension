/* global angular notyf i18next MediaService */
angular.module('listenone').controller('AuthController', [
  '$scope',
  ($scope) => {
    $scope.loginProgress = false;
    $scope.loginType = 'email';

    $scope.setLoginType = (newType) => {
      $scope.loginType = newType;
      if (newType === 'phone') {
        document.getElementById('login-countrycode').value = '+86';
      }
    };
    // valid email/password
    function validateEmail(email_str) {
      const re = /\S+@\S+\.\S+/;
      return re.test(email_str);
    }
    function validatePhone(phone_str) {
      const re = /^[0-9]{7,16}$/;
      return re.test(phone_str);
    }
    function validateCountrycode(countrycode_str) {
      const re = /^\+[0-9]{1,4}$/;
      return re.test(countrycode_str);
    }
    function validatePassword(password_str) {
      return password_str !== '';
    }
    $scope.login = (source) => {
      let options = {};
      if ($scope.loginType === 'email') {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!validateEmail(email)) {
          return notyf.warning(i18next.t('_LOGIN_EMAIL_ERROR'));
        }
        if (!validatePassword(password)) {
          return notyf.warning(i18next.t('_LOGIN_PASSWORD_ERROR'));
        }
        options = {
          type: $scope.loginType,
          email,
          password,
        };
      } else if ($scope.loginType === 'phone') {
        const countrycode = document.getElementById('login-countrycode').value;

        const phone = document.getElementById('login-phone').value;
        const password = document.getElementById('login-password').value;
        if (!validateCountrycode(countrycode)) {
          return notyf.warning(i18next.t('_LOGIN_COUNTRYCODE_ERROR'));
        }
        if (!validatePhone(phone)) {
          return notyf.warning(i18next.t('_LOGIN_PHONE_ERROR'));
        }
        if (!validatePassword(password)) {
          return notyf.warning(i18next.t('_LOGIN_PASSWORD_ERROR'));
        }
        options = {
          type: $scope.loginType,
          phone,
          countrycode: countrycode.slice(1),
          password,
        };
      } else {
        return notyf.error('not support login type');
      }
      $scope.loginProgress = true;
      return MediaService.login(source, options).success((data) => {
        $scope.loginProgress = false;
        if (data.status === 'success') {
          $scope.setMusicAuth(source, data.data);
        } else {
          notyf.error(i18next.t('_LOGIN_ERROR'));
        }
      });
    };

    $scope.logout = (source) => {
      $scope.setMusicAuth(source, {});
      // TODO: clear cookie
    };

    $scope.is_login = (source) =>
      $scope.musicAuth[source] && $scope.musicAuth[source].is_login;

    $scope.musicAuth = localStorage.getObject('music_auth') || {};

    $scope.setMusicAuth = (source, data) => {
      $scope.musicAuth[source] = data;
      localStorage.setObject('music_auth', $scope.musicAuth);
    };
  },
]);
