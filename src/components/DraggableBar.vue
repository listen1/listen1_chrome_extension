<template>
  <div class="playbar-clickable">
    <div :id="id" class="barbg" @mousedown="onMyMouseDown">
      <div class="cur" :style="{ width: changingProgress ? cprogress * 100 + '%' : progress + '%' }">
        <span class="btn"><i /></span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
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
  setup(props, { emit }) {
    const changingProgress = ref(false);
    const cprogress = ref(0);
    return {
      changingProgress,
      cprogress,
      onMyMouseDown: (event) => {
        changingProgress.value = true;
        const containerElem = document.getElementById(props.id);

        const container = containerElem.getBoundingClientRect();
        // Prevent default dragging of selected content
        event.preventDefault();
        const x = event.clientX - container.left;
        cprogress.value = x / (container.right - container.left);

        emit('update-progress', cprogress.value);
        const sync = (event) => {
          const container = document.getElementById(props.id).getBoundingClientRect();
          let x = event.clientX - container.left;

          if (container) {
            if (x < 0) {
              x = 0;
            } else if (x > container.right - container.left) {
              x = container.right - container.left;
            }
          }
          cprogress.value = x / (container.right - container.left);
        };
        const mousemove = (event) => {
          sync(event);
          emit('update-progress', cprogress.value);
        };

        const mouseup = (event) => {
          sync(event);
          emit('commit-progress', cprogress.value);

          document.removeEventListener('mousemove', mousemove);
          document.removeEventListener('mouseup', mouseup);
          changingProgress.value = false;
        };

        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
      }
    };
  }
};
</script>

<style>
</style>