import { reactive } from 'vue';
import MediaService from '../services/MediaService';

const musicAuth: any = reactive({});

const setMusicAuth = (source: string, data: any) => {
  musicAuth[source] = data;
};

const getMusicAuth = (source: string) => {
  return musicAuth[source];
};

const is_login = (source: string) => musicAuth[source] && musicAuth[source].is_login;

const getLoginUrl = (source: string) => MediaService.getLoginUrl(source);

const openLogin = (source: string) => {
  const url = getLoginUrl(source);
  // if (isElectron()) {
  //   const { ipcRenderer } = require('electron');
  //   return ipcRenderer.send('openUrl', url);
  // }
  return window.open(url, '_blank');
};

const loginSourceList = MediaService.getLoginProviders().map((i) => i.name);

const refreshAuthStatus = async () => {
  loginSourceList.map(async (source) => {
    const data = await MediaService.getUser(source);
    if (data.status === 'success') {
      setMusicAuth(source, data.data);
    } else {
      setMusicAuth(source, {});
    }
  });
};
const logout = (source: string) => {
  setMusicAuth(source, {});
  MediaService.logout(source);
};
function useAuth() {
  return { getMusicAuth, musicAuth, is_login, openLogin, refreshAuthStatus, loginSourceList, logout };
}

export default useAuth;
