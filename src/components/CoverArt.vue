<template>
    <img :src="props.src" @click="emit('click')" />
</template>
<script setup lang="ts">
const props = defineProps<{
    src: string
}>();
const emit = defineEmits([
    'click'
])
</script>
<style scoped>
img {
    height: 136px;
    min-width: 136px;
    max-width: 100%;
    object-fit: cover;
    margin: auto;
    border: solid 1px var(--line-default-color);
    margin-bottom: 2px;
    cursor: pointer;
    transition: filter 0.15s ease-in-out;
}
img:hover {
    filter: brightness(0.75);
}
</style>