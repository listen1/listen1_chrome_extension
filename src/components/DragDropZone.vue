<template>
  <li
    class="border-t-2 border-b-2 border-transparent cursor-pointer -mb-2px group"
    ref="root"
    :draggable="props.draggable"
    @dragstart="dragstart"
    @dragend="dragend"
    @dragenter="dragenter"
    @dragleave="dragleave"
    @dragover="dragover"
    @drop="drop"
    @mouseenter="$parent?.$emit('mouseenter')"
    @mouseleave="$parent?.$emit('mouseleave')">
    <slot></slot>
  </li>
</template>
<script setup lang="ts">
const props = defineProps<{
  dragobject: any;
  dragtitle: string;
  dragtype: string;
  ondragleave?: any;
  sortable: boolean;
  draggable: boolean;
}>();
const emits = defineEmits(['drop']);
let root: any = $ref(null);

// https://stackoverflow.com/questions/34200023/drag-drop-set-custom-html-as-drag-image
const dragstart = (ev: any) => {
  if (props.dragobject === undefined) {
    return;
  }
  if (props.dragtype === undefined) {
    return;
  }
  ev.dataTransfer.setData(props.dragtype, JSON.stringify(props.dragobject));
  const elem: any = document.createElement('div');
  elem.id = 'drag-ghost';
  elem.innerHTML = props.dragtitle;
  elem.style.position = 'absolute';
  elem.style.top = '-1000px';
  elem.style.padding = '3px';
  elem.style.background = '#eeeeee';
  elem.style.color = '#333';
  elem.style['border-radius'] = '3px';

  document.body.appendChild(elem);
  ev.dataTransfer.setDragImage(elem, 0, 40);
};
const dragend = (ev: any) => {
  const ghost = document.getElementById('drag-ghost');
  if (ghost === null) {
    return;
  }
  if (ghost.parentNode) {
    ghost.parentNode.removeChild(ghost);
  }
};
const dragenter = (event: any) => {
  let dragType = '';
  if (event.dataTransfer.types.length > 0) {
    [dragType] = event.dataTransfer.types;
  }
  if (props.dragtype === 'application/listen1-myplaylist' && dragType === 'application/listen1-song') {
    root.classList.add('dragover');
  }
};
const dragleave = (event: any) => {
  root.classList.remove('dragover');
  if (props.ondragleave !== undefined) {
    props.ondragleave();
  }
  if (props.sortable) {
    const target = root;
    target.style['z-index'] = '0';
    target.style['border-bottom'] = 'solid 2px transparent';
    target.style['border-top'] = 'solid 2px transparent';
  }
};

const dragover = (event: any) => {
  event.preventDefault();
  const dragLineColor = '#FF4444';
  let dragType = '';
  if (event.dataTransfer.types.length > 0) {
    [dragType] = event.dataTransfer.types;
  }

  if (props.dragtype === dragType) {
    if (!props.sortable) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    event.dataTransfer.dropEffect = 'move';
    const bounding = event.target.getBoundingClientRect();
    const offset = bounding.y + bounding.height / 2;

    const direction = event.clientY - offset > 0 ? 'bottom' : 'top';
    const target = root;
    if (direction === 'bottom') {
      target.style['border-bottom'] = `solid 2px ${dragLineColor}`;
      target.style['border-top'] = 'solid 2px transparent';
      target.style['z-index'] = '9';
    } else if (direction === 'top') {
      target.style['border-top'] = `solid 2px ${dragLineColor}`;
      target.style['border-bottom'] = 'solid 2px transparent';
      target.style['z-index'] = '9';
    }
  } else if (props.dragtype === 'application/listen1-myplaylist' && dragType === 'application/listen1-song') {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const drop = (event: any) => {
  const [dragType] = event.dataTransfer.types;
  const jsonString = event.dataTransfer.getData(dragType);
  const data = JSON.parse(jsonString);
  let direction = '';
  const bounding = event.target.getBoundingClientRect();
  const offset = bounding.y + bounding.height / 2;
  direction = event.clientY - offset > 0 ? 'bottom' : 'top';
  // https://stackoverflow.com/questions/19889615/can-an-angular-directive-pass-arguments-to-functions-in-expressions-specified-in
  emits('drop', { data, dragType, direction });

  root.classList.remove('dragover');
  if (props.sortable) {
    const target = root;
    target.style['border-top'] = 'solid 2px transparent';
    target.style['border-bottom'] = 'solid 2px transparent';
  }
};
</script>
