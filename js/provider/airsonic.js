/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
/* global getParameterByName i18next forge threadPlayer */

class airsonic {
    static sn_server() {
        if (!this.server_info) {
            this.server_info = localStorage.getObject('sn_server_info');
        }
        return this.server_info;
    }

    static sn_svrurl() {
        return this.sn_server()?.server??'';
    }

    static sn_user() {
        return this.sn_server()?.user??'';
    }

    static sn_credential() {
        return this.sn_server()?.password??'';
    }

    static sn_params(extra={}, jsonfmt=true) {
        const u = this.sn_user();
        if (!u) {
            throw new Error('server info not set!');
        }
        const s = 'listen1' + Math.round(Math.random() * 1000);
        const t = forge.md5.create().update(forge.util.encodeUtf8(this.sn_credential() + s)).digest().toHex();
        const params = { u, t, s, v: '1.15.0', c: 'listen1'};
        if (jsonfmt) {
            params.f = 'json';
        }
        return Object.assign(params, extra);
    }

    static sn_allreachable_playlists() {
        try {
            const params = this.sn_params();
            const target_url = `${this.sn_svrurl()}rest/getPlaylists?${new URLSearchParams(params)}`;
            return axios.get(target_url, {timeout: 5000}).then(res => res.data["subsonic-response"]?.playlists?.playlist).then(playlists => {
                if (!playlists) {
                    return [];
                }
                return playlists.map(item => ({
                    cover_img_url: `${this.sn_svrurl()}rest/getCoverArt?${new URLSearchParams(this.sn_params({id: item.coverArt, size: 300}))}`,
                    title: item.name,
                    id: 'snplaylist_' + item.id,
                    img_url: `${this.sn_svrurl()}rest/getCoverArt?${new URLSearchParams(this.sn_params({id: item.coverArt, size: 300}))}`,
                    snid: item.id,
                    author: item.owner,
                    count: item.songCount,
                }));
            })
        } catch (err) {
            return Promise.resolve([]);
        }
    }

    static search(url) {
        const keyword = getParameterByName('keywords', url);
        const curpage = getParameterByName('curpage', url);
        const searchType = getParameterByName('type', url);
        if (searchType === '1') {
            return {
                success: fn => {
                    this.sn_allreachable_playlists().then(result => {
                        return fn ({result, total: result.length, type: searchType});
                    });
                }
            }
        }

        try {
            let target_url = '';
            const params = this.sn_params({
                query: keyword,
                albumCount: 20,
                artistCount: 20,
                songCount: 20,
                albumOffset: 0,
                artistOffset: 0,
                songOffset: 0,
            });
            target_url = `${this.sn_svrurl()}rest/search3?${new URLSearchParams(params)}`;
            return {
                success: fn => {
                    axios.get(target_url).then(res => res.data['subsonic-response']?.searchResult3).then(data => {
                        const result = data?.song?.map(s => {
                            return Object.assign(s, {id: 'sntrack_' + s.id, snid: s.id, source: 'airsonic', img_url: '',});
                        }) ?? [];
                        return fn({result, total: result.length, type: searchType});
                    });
                }
            };
        } catch (e) {
            return {
                success: fn => {
                    return fn({result: [], total: 0, searchType});
                }
            }
        }
    }

    static bootstrap_track(track, success, failure) {
        try {
            const params = this.sn_params({id: track.snid}, false);
            const url = `${this.sn_svrurl()}rest/stream?${new URLSearchParams(params)}`;
            success({url, platform: 'airsonic'});
        } catch (e) {
            failure({});
        }
    }

    static lyric(url) {
        const track_id = getParameterByName('track_id');
        const track = threadPlayer.playlist.find(x=>x.id === track_id);

        try {
            console.log('airsonic lyric');
            const params = this.sn_params({title: track.title, artist: track.artist});
            const target_url = `${this.sn_svrurl()}rest/getLyrics?${new URLSearchParams(params)}`;
            return {
                success: fn => {
                    axios.get(target_url).then(res => res.data["subsonic-response"]).then(data => {
                        console.log(data);
                        return fn({ lyric: data?.lyrics??'',})
                    });
                }
            };
        } catch (e) {
            return {success: fn => fn({lyric: ''})};
        }
    }

    static show_playlist(url) {
        return {
            success: fn => {
                this.sn_allreachable_playlists().then(result => {
                    return fn({ result, });
                }).catch(err => {
                    console.log(err);
                    return fn({ result: [] });
                });
            }
        }
    }

    static add_playlist(list_id, tracks) {
        console.log('airsonic add_playlist');

    }

    static parse_url(url) {
        console.log('airsonic parse_url');
        console.log(url);
    }

    static get_playlist(url) {
        try {
            const list_id = getParameterByName('list_id', url).split('_').pop();
            const params = this.sn_params({id: list_id});
            const target_url = `${this.sn_svrurl()}rest/getPlaylist?${new URLSearchParams(params)}`
            console.log(url);
            return {
                success: fn => {
                    axios.get(target_url).then(res => res.data['subsonic-response']).then(data => {
                        const {playlist: {id: snid, coverArt, name: title, entry}} = data;
                        const cvrparams = this.sn_params({id: coverArt, size: 300});
                        const info = {
                            id: 'snplaylist_' + snid,
                            cover_img_url: `${this.sn_svrurl()}rest/getCoverArt?${new URLSearchParams(cvrparams)}`,
                            title,
                            snid,
                        }
                        const tracks = entry.map(s => {return Object.assign(s, {id: 'sntrack_' + s.id, snid: s.id, source: 'airsonic', img_url: '',});});
                        return fn({tracks, info});
                    });
                }
            };
        } catch (e) {
            return {
                success: fn => {
                    return fn({tracks: [], info: {}});
                }
            }
        }
    }

    static get_playlist_filters() {
        console.log('airsonic get_playlist_filters');
        return {
            success: (fn) => fn({ recommend: [], all: [] }),
        };
    }

    static get_recommend_playlist() {
        console.log('airsonic get_recommend_playlist');
    }

    static get_user_favorite_playlist(url) {
        console.log('airsonic get_user_favorite_playlist');
    }

    static get_user_created_playlist(url) {
        console.log('airsonic get_user_created_playlist');
        console.log(url);
    }

    static get_user() {
        if (!this.sn_server()) {
            const injInterval = setInterval(() => {
                if (this.sn_inject_login_form()) {
                    clearInterval(injInterval);
                }
            }, 1000);

            return {
                success: fn => {
                return fn({ status: 'fail', data: {}});
            }};
        }

        const params = this.sn_params();
        const url = `${this.sn_svrurl()}rest/ping?${new URLSearchParams(params)}`;
        return {
            success: (fn) => {
                axios.get(url, {timeout: 5000}).then(res => res.data['subsonic-response']).then(data => {
                    let result = { is_login: false };
                    let status = 'fail';
                    if (data.status === 'ok') {
                        status = 'success';
                        result = {
                            is_login: true,
                            user_id: this.sn_user(),
                            user_name: this.sn_user(),
                            platform: 'airsonic',
                            data,
                        };
                    }
                    return fn({ status, data: result });
                }).catch(err => {
                    console.log(err);
                    return fn({ status: 'fail', data: {}});
                });
            },
        };
    }

    static get_login_url() {
    }

    static logout() {
    }

    static sn_inject_login_form() {
        const snucard = Array.from(document.querySelectorAll('div[ng-show="!is_login(source)"]>div.usercard')).filter(x=>x.textContent.includes('airsonic')).pop();
        if (!snucard) {
            return false;
        }

        const ucard_title = snucard.querySelector('div.usercard-title');
        let cart_t1 = ucard_title.firstElementChild;
        cart_t1.style.width = '58px';
        while (cart_t1.nextElementSibling) {
            cart_t1 = cart_t1.nextElementSibling;
            cart_t1.style.width = '58px';
        }
        snucard.querySelector('button').style.display = 'none';
        const login_form = document.createElement('div');
        login_form.innerHTML = `<form id="airsonic_login_form">
            <input name="server" type="text" placeholder="${i18next.t('_SERVER')}">
            <input name="username" type="text" placeholder="${i18next.t('_USERNAME')}">
            <input name="password" type="password" placeholder="${i18next.t('_PASSWORD')}">
        </form>`;
        snucard.appendChild(login_form);
        const logbtn = document.createElement('button');
        logbtn.textContent = i18next.t('_LOGIN');
        snucard.appendChild(logbtn);
        logbtn.onclick = () => {
            const form = document.querySelector('#airsonic_login_form');
            this.server_info = {
                server: form.elements.server.value,
                user: form.elements.username.value,
                password: form.elements.password.value
            }
            if (!this.server_info.server.endsWith('/')) {
                this.server_info.server += '/';
            }
            this.get_user().success(r => {
                if (r.status === 'success') {
                    localStorage.setObject('sn_server_info', this.server_info);
                    snucard.parentElement.classList.add('ng-hide');
                    snucard.parentElement.previousElementSibling.classList.remove('ng-hide');
                }
            });
        }
        return true;
    }
}

