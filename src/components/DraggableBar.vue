<template>
  <div :id="id" class="barbg" @mousedown="onMyMouseDown">
    <div class="cur" :style="{ width: changingProgress ? cprogress * 100 + '%' : progress + '%' }">
      <span class="btn"><i /></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DraggableBar',
  props: {
    id: {
      type: String,
      default: ''
    },
    progress: {
      type: Number,
      default: 0
    }
  },
  emits: ['update-progress', 'commit-progress'],
  data() {
    return {
      changingProgress: false,
      cprogress: 0
    };
  },
  methods: {
    onMyMouseDown(event) {
      this.changingProgress = true;
      const containerElem = document.getElementById(this.id);

      const container = containerElem.getBoundingClientRect();
      // Prevent default dragging of selected content
      event.preventDefault();
      const x = event.clientX - container.left;
      this.cprogress = x / (container.right - container.left);

      this.$emit('update-progress', this.cprogress);
      const self = this;
      function sync(event) {
        const container = document.getElementById(self.id).getBoundingClientRect();
        let x = event.clientX - container.left;

        if (container) {
          if (x < 0) {
            x = 0;
          } else if (x > container.right - container.left) {
            x = container.right - container.left;
          }
        }
        self.cprogress = x / (container.right - container.left);
      }
      function mousemove(event) {
        sync(event);
        self.$emit('update-progress', self.cprogress);
      }

      function mouseup(event) {
        sync(event);
        self.$emit('commit-progress', self.cprogress);

        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
        self.changingProgress = false;
      }

      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
    }
  }
};
</script>

<style>
</style>