<template>
  <div :id="id" class="playbar-clickable" @mousedown="onMyMouseDown">
    <div  class="barbg" >
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
<script setup lang="ts">
const props = defineProps<{
  id: string;
  progress: number;
}>();

const emits = defineEmits(['update-progress', 'commit-progress']);
let changingProgress = $ref(false);
let cprogress = $ref(0);
const onMyMouseDown = (event: MouseEvent) => {
  changingProgress = true;
  const containerElem = document.getElementById(props.id) as HTMLElement;

  const container = containerElem.getBoundingClientRect();
  // Prevent default dragging of selected content
  event.preventDefault();
  const x = event.clientX - container.left;
  cprogress = x / (container.right - container.left);

  emits('update-progress', cprogress);
  const sync = (event: MouseEvent) => {
    const container = document.getElementById(props.id)?.getBoundingClientRect() as DOMRect;
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

<style>
.playbar-clickable {
    cursor: pointer;
    height: 15px;
    padding-top: 6px;
    box-sizing: border-box;
}
.playbar-clickable .barbg {
  margin-top:0;
}
</style>