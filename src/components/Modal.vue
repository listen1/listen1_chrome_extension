<template>
  <transition name="modal">
    <component v-if="show" :is="modalType" @close="show = false" v-bind="options"></component>
  </transition>
</template>

<script lang="ts"></script>

<script setup lang="ts">
import { provide } from 'vue';
import AddToPlaylist from './modals/AddToPlaylist.vue';
import CreatePlaylist from './modals/CreatePlaylist.vue';
import DefaultModal from './modals/DefaultModal.vue';
import EditPlaylist from './modals/EditPlaylist.vue';
import ImportPlaylist from './modals/ImportPlaylist.vue';
import OpenLogin from './modals/OpenLogin.vue';
import GithubAuth from './modals/GithubAuth.vue';
import GistExport from './modals/GistExport.vue';
import GistImport from './modals/GistImport.vue';
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
