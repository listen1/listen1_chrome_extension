import { createRouter, createWebHashHistory } from 'vue-router';
import HotPlaylists from '../views/HotPlaylists';
import Settings from '../views/Settings';
import Login from '../views/Login';
import MyPlatform from '../views/MyPlatform';
import Search from '../views/Search';
import Playlist from '../views/Playlist';
const routes = [
  {
    path: '/',
    name: 'HotPlaylists',
    component: HotPlaylists
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/my_platform',
    name: 'MyPlatform',
    component: MyPlatform
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/playlist/:listId',
    name: 'Playlist',
    component: Playlist
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
