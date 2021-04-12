/* eslint-disable no-undef */

window.vueApp = Vue.createApp({
  data() {
    return {
      windowHidden: true,
      currentTag: 2,
    }
  },
  provide() {
    return {
      currentTag: this.currentTag,
      windowHidden: this.windowHidden,
    };
  },
});

window.onload = () => {
  window.vm = vueApp.mount('#vue-root');
};