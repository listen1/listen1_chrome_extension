/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */

window.vueApp = Vue.createApp({
  computed: {
    windowHidden() {
      return this.$store.state.windowHidden;
    },
    currentTag() {
      return this.$store.state.currentTag;
    }
  }
});

const vstore = Vuex.createStore({
  state() {
    return {
      windowHidden: true,
      currentTag: 2,
    }
  },
  mutations: {
    windowHidden(state, val) {
      state.windowHidden = val;
    },
    currentTag(state, val) {
      state.currentTag = val;
    },
  }
})

vueApp.use(vstore);

window.emitter = mitt();

window.onload = () => {
  window.vm = vueApp.mount('#vue-root');
};