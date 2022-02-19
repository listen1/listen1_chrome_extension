<template>
  <transition name="modal">
    <component :is="modalType" v-if="show" v-bind="options" @close="show = false"></component>
  </transition>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import AddToPlaylist from './modals/AddToPlaylist.vue';
import CreatePlaylist from './modals/CreatePlaylist.vue';
import DefaultModal from './modals/DefaultModal.vue';
import EditPlaylist from './modals/EditPlaylist.vue';
import GistExport from './modals/GistExport.vue';
import GistImport from './modals/GistImport.vue';
import GithubAuth from './modals/GithubAuth.vue';
import ImportPlaylist from './modals/ImportPlaylist.vue';
import OpenLogin from './modals/OpenLogin.vue';
import ParseUrl from './modals/ParseUrl.vue';

let show = $ref(false);
let modalType = $ref(DefaultModal);
let options = $ref({});

const components: Record<string, any> = {
  DefaultModal,
  CreatePlaylist,
  AddToPlaylist,
  EditPlaylist,
  ParseUrl,
  ImportPlaylist,
  OpenLogin,
  GithubAuth,
  GistExport,
  GistImport
};

const showModal = (type = 'DefaultModal', opt: Record<string, unknown> = {}) => {
  show = true;
  modalType = components[type] || DefaultModal;
  options = opt;
};
provide('showModal', showModal);

defineExpose({
  showModal
});
</script>

<style>
/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.5s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
