/* global getParameterByName async */
/* global netease xiami qq kugou kuwo bilibili migu localmusic myplaylist */
const PROVIDERS = [{
  name: 'netease',
  instance: netease,
  searchable: true,
  id: 'ne',
}, {
  name: 'xiami',
  instance: xiami,
  searchable: true,
  id: 'xm',
}, {
  name: 'qq',
  instance: qq,
  searchable: true,
  id: 'qq',
}, {
  name: 'kugou',
  instance: kugou,
  searchable: true,
  id: 'kg',
}, {
  name: 'kuwo',
  instance: kuwo,
  searchable: true,
  id: 'kw',
}, {
  name: 'bilibili',
  instance: bilibili,
  searchable: false,
  id: 'bi',
}, {
  name: 'migu',
  instance: migu,
  searchable: true,
  id: 'mg',
}, {
  name: 'localmusic',
  instance: localmusic,
  searchable: false,
  hidden: true,
  id: 'lm',
}, {
  name: 'myplaylist',
  instance: myplaylist,
  searchable: false,
  hidden: true,
  id: 'my',
}];

function getProviderByName(sourceName) {
  return (PROVIDERS.find((i) => i.name === sourceName) || {}).instance;
}

function getAllProviders() {
  return PROVIDERS.filter((i) => !i.hidden).map((i) => i.instance);
}

function getAllSearchProviders() {
  return PROVIDERS.filter((i) => i.searchable).map((i) => i.instance);
}

function getProviderByItemId(itemId) {
  const prefix = itemId.slice(0, 2);
  return (PROVIDERS.find((i) => i.id === prefix) || {}).instance;
}

// eslint-disable-next-line no-unused-vars
const MediaService = {
  get(url) {
    const path = url.split('?')[0];
    if (path === '/show_playlist') {
      const source = getParameterByName('source', url);
      const provider = getProviderByName(source);
      return provider.show_playlist(url);
    }
    if (path === '/playlist') {
      const list_id = getParameterByName('list_id', url);
      const provider = getProviderByItemId(list_id);
      return provider.get_playlist(url);
    }
    if (path === '/search') {
      const source = getParameterByName('source', url);
      if (source === 'allmusic') {
        // search all platform and merge result
        const callbackArray = getAllSearchProviders().map((p) => (fn) => {
          p.search(url).success((r) => {
            fn(null, r);
          });
        });
        return {
          success: (fn) => async.parallel(callbackArray, (err, platformResultArray) => {
            // TODO: nicer pager, playlist support
            const result = { result: [], total: 1000, type: platformResultArray[0].type };
            const maxLength = Math.max(...platformResultArray.map((elem) => elem.result.length));
            for (let i = 0; i < maxLength; i += 1) {
              platformResultArray.forEach((elem) => {
                if (i < elem.result.length) {
                  result.result.push(elem.result[i]);
                }
              });
            }
            return fn(result);
          }),
        };
      }
      const provider = getProviderByName(source);
      return provider.search(url);
    }
    if (path === '/lyric') {
      const track_id = getParameterByName('track_id', url);
      const provider = getProviderByItemId(track_id);
      return provider.lyric(url);
    }
    if (path === '/show_myplaylist') {
      return myplaylist.show_myplaylist('my');
    }
    if (path === '/show_favoriteplaylist') {
      return myplaylist.show_myplaylist('favorite');
    }

    if (path === '/playlist_contains') {
      const list_id = getParameterByName('list_id', url);
      const playlist_type = getParameterByName('type', url);
      const result = myplaylist.myplaylist_containers(playlist_type, list_id);
      return {
        success: (fn) => fn({ result }),
      };
    }
    return null;
  },
  post(request) {
    const path = request.url.split('?')[0];
    if (path === '/clone_playlist') {
      const playlist_type = getParameterByName('playlist_type', `${request.url}?${request.data}`);
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      const provider = getProviderByItemId(list_id);
      const url = `/playlist?list_id=${list_id}`;
      return {
        success: (fn) => {
          provider.get_playlist(url).success((data) => {
            myplaylist.save_myplaylist(playlist_type, data);
            fn();
          });
        },
      };
    }
    if (path === '/remove_myplaylist') {
      const playlist_type = getParameterByName('playlist_type', `${request.url}?${request.data}`);
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      myplaylist.remove_myplaylist(playlist_type, list_id);
      return {
        success: (fn) => fn(),
      };
    }
    if (path === '/add_myplaylist') {
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      const track_json = getParameterByName('track', `${request.url}?${request.data}`);
      const track = JSON.parse(track_json);
      myplaylist.add_myplaylist(list_id, track);
      return {
        success: (fn) => fn(),
      };
    }
    if (path === '/add_playlist') {
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      const provider = getProviderByItemId(list_id);
      const tracks_json = getParameterByName('tracks', `${request.url}?${request.data}`);
      const tracks = JSON.parse(tracks_json);
      return provider.add_playlist(list_id, tracks);
    }
    if (path === '/remove_track_from_myplaylist') {
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      const track_id = getParameterByName('track_id', `${request.url}?${request.data}`);
      myplaylist.remove_from_myplaylist(list_id, track_id);
      return {
        success: (fn) => fn(),
      };
    }
    if (path === '/remove_track_from_playlist') {
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      const track_id = getParameterByName('track_id', `${request.url}?${request.data}`);
      const provider = getProviderByItemId(list_id);
      return provider.remove_from_playlist(list_id, track_id);
    }
    if (path === '/create_myplaylist') {
      const list_title = getParameterByName('list_title', `${request.url}?${request.data}`);
      const track_json = getParameterByName('track', `${request.url}?${request.data}`);
      const track = JSON.parse(track_json);
      myplaylist.create_myplaylist(list_title, track);
      return {
        success: (fn) => {
          fn();
        },
      };
    }
    if (path === '/edit_myplaylist') {
      const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
      const title = getParameterByName('title', `${request.url}?${request.data}`);
      const cover_img_url = getParameterByName('cover_img_url', `${request.url}?${request.data}`);
      myplaylist.edit_myplaylist(list_id, title, cover_img_url);
      return {
        success: (fn) => fn(),
      };
    }
    if (path === '/parse_url') {
      const url = getParameterByName('url', `${request.url}?${request.data}`);
      const providers = getAllProviders();
      let result;
      providers.forEach((provider) => {
        const r = provider.parse_url(url);
        if (r !== undefined) {
          result = r;
        }
      });
      return {
        success: (fn) => fn({ result }),
      };
    }
    if (path === '/merge_playlist') {
      const source = getParameterByName('source', `${request.url}?${request.data}`);
      const target = getParameterByName('target', `${request.url}?${request.data}`);
      const tarData = (localStorage.getObject(target)).tracks;
      const srcData = (localStorage.getObject(source)).tracks;
      tarData.forEach((tarTrack) => {
        if (!srcData.find((srcTrack) => srcTrack.id === tarTrack.id)) {
          myplaylist.add_myplaylist(source, tarTrack);
        }
      });
      return {
        success: (fn) => fn(),
      };
    }
    return null;
  },
  bootstrapTrack(sound, track, playerSuccessCallback, playerFailCallback) {
    const successCallback = playerSuccessCallback;

    function failureCallback() {
      if (localStorage.getObject('enable_auto_choose_source') === false) {
        playerFailCallback();
        return;
      }
      const failover_source_list = ['kuwo', 'qq', 'migu'];

      const getUrlPromises = failover_source_list.map((source) => new Promise((resolve, reject) => {
        if (track.source === source) {
          // come from same source, no need to check
          resolve();
          return;
        }
        // TODO: better query method
        const keyword = `${track.title} ${track.artist}`;
        const curpage = 1;
        const url = `/search?keywords=${keyword}&curpage=${curpage}`;
        const provider = getProviderByName(source);
        provider.search(url).success((data) => {
          for (let i = 0; i < data.result.length; i += 1) {
            const searchTrack = data.result[i];
            // compare search track and track to check if they are same
            // TODO: better similar compare method (duration, md5)
            if (!searchTrack.disable
              && (searchTrack.title === track.title)
              && (searchTrack.artist === track.artist)) {
              const soundInfo = {};
              provider.bootstrap_track(soundInfo, searchTrack, () => {
                reject(soundInfo.url); // Use Reject to return immediately
              }, resolve);
              return;
            }
          }
          resolve();
        });
      }));
      // TODO: Use Promise.any() in ES2021 replace the tricky workaround
      Promise.all(getUrlPromises).catch((url) => {
        // eslint-disable-next-line no-param-reassign
        sound.url = url;
        playerSuccessCallback();
      }).then(playerFailCallback);
    }

    const provider = getProviderByName(track.source);

    provider.bootstrap_track(sound, track, successCallback,
      failureCallback);
  },
};

// eslint-disable-next-line no-unused-vars
const loWeb = MediaService;
