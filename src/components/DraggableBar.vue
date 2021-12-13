<template>
  <div :id="id" class="playbar-clickable cursor-pointer h-3 pt-1" @mousedown="onMyMouseDown">
    <div class="barbg h-1 bg-draggable-bar">
      <div class="cur bg-draggable-bar-current relative h-full" :style="{ width: changingProgress ? cprogress * 100 + '%' : progress + '%' }">
        <span :class="'btn absolute rounded-full ' + (btnClass ? btnClass : '')">
          <i />
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { id, progress, btnClass } = defineProps<{
  id: string;
  progress: number;
  btnClass?: string;
}>();

const emits = defineEmits(['update-progress', 'commit-progress']);
let changingProgress = $ref(false);
let cprogress = $ref(0);
const onMyMouseDown = (event: MouseEvent) => {
  changingProgress = true;
  const containerElem = document.getElementById(id) as HTMLElement;

  const container = containerElem.getBoundingClientRect();
  // Prevent default dragging of selected content
  event.preventDefault();
  const x = event.clientX - container.left;
  let offset = x / (container.right - container.left);
  if (offset > 1) {
    offset = 1;
  }
  if (offset < 0) {
    offset = 0;
  }
  cprogress = offset;
  emits('update-progress', cprogress);
  const sync = (event: MouseEvent) => {
    const container = document.getElementById(id)?.getBoundingClientRect() as DOMRect;
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
  const mousemove = (event: MouseEvent) => {
    sync(event);
    emits('update-progress', cprogress);
  };

  const mouseup = (event: MouseEvent) => {
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

<style></style>
