import { createRouter, createWebHashHistory } from 'vue-router';
import HotPlaylists from '../views/HotPlaylists.vue';
import Login from '../views/Login.vue';
import MyPlatform from '../views/MyPlatform.vue';
import Playlist from '../views/Playlist.vue';
import Search from '../views/Search.vue';
import Settings from '../views/Settings.vue';
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
