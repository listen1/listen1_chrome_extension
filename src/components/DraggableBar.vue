<template>
  <div class="playbar-clickable">
    <div :id="id" class="barbg" @mousedown="onMyMouseDown">
      <div
        class="cur"
        :style="{ width: changingProgress ? cprogress * 100 + '%' : progress + '%' }"
      >
        <span class="btn">
          <i />
        </span>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  id: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  }
});
const emits = defineEmits(['update-progress', 'commit-progress']);
let changingProgress = $ref(false);
let cprogress = $ref(0);
const onMyMouseDown = (event) => {
  changingProgress = true;
  const containerElem = document.getElementById(props.id);

  const container = containerElem.getBoundingClientRect();
  // Prevent default dragging of selected content
  event.preventDefault();
  const x = event.clientX - container.left;
  cprogress = x / (container.right - container.left);

  emits('update-progress', cprogress);
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
    cprogress = x / (container.right - container.left);
  };
  const mousemove = (event) => {
    sync(event);
    emits('update-progress', cprogress);
  };

  const mouseup = (event) => {
    sync(event);
    emits('commit-progress', cprogress);

    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
    changingProgress = false;
  };

  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
};
</script>

<style>
</style>