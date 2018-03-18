(function() {
  var OAUTH_URL = 'https://github.com/login/oauth';
  var API_URL = 'https://api.github.com';

  var client_id = 'e099a4803bb1e2e773a3';
  var client_secret = '81fbfc45c65af8c0fbf2b4dae6f23f22e656cfb8';

  Storage.prototype.setObject = function(key, value) {
      this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
      var value = this.getItem(key);
      return value && JSON.parse(value);
  }

  var Github = {
    status: 0,
    username: '',
    getOAuthUrl: function(){
      this.status = 1;
      return OAUTH_URL + '/authorize?client_id=' + client_id  + '&scope=gist';
    },

    updateStatus: function(callback){
      var access_token = localStorage.getObject('githubOauthAccessKey');
      if (access_token == null) {
        this.status = 0;
        return;
      }
      var self = this;
      this.api('/user', function(data){
        if (data.login == undefined) {
          self.status = 1;
        }
        else {
          self.status = 2;
          self.username = data.login;
        }
        if(callback != null) {
          callback(self.status);
        }
      });
    },

    getStatus: function(){
      return this.status;
    },

    getStatusText: function(){
      if(this.status == 0) {
        return '未连接';
      }
      if(this.status == 1) {
        return '连接中';
      }
      if(this.status == 2) {
        return this.username + '已登录';
      }
      return '???'
    },

    setStatus: function(newStatus){
      this.status = newStatus;
    },


    handleCallback: function(code, cb){
      var url = OAUTH_URL + '/access_token';
      var data = {
        client_id: client_id,
        client_secret: client_secret,
        code: code
      };
      $.ajax({
        url: url,
        headers: {
          Accept: 'application/json'
        },
        dataType: "json",
        data: data,
        success: function(response) {
          var ak = response.access_token;
          localStorage.setObject('githubOauthAccessKey', ak);
          if(cb != undefined) {
            cb(ak);
          }
        }
      });
    },

    api: function(apiPath, cb){
      var access_token = localStorage.getObject('githubOauthAccessKey') || '';
      var url = API_URL + apiPath + '?access_token=' + access_token;
      $.get(url, function(response){
        cb(response);
      })
    },

    logout: function() {
      localStorage.removeItem('githubOauthAccessKey');
      this.status = 0;
    },

    isLoggedIn: function() {
      return localStorage.getObject('githubOauthAccessKey') != null;
    },

    deparam: function(params) {
      var obj = {};
      $.each(params.split('&'), function() {
        var item = this.split('=');
        obj[item[0]] = item[1];
      });
      return obj;
    }
  };

  window.Github = Github;
})();