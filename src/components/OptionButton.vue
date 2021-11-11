<template>
    <button @click="emit('click')">{{ props.text }}</button>
</template>
<script setup lang="ts">
const props = defineProps<{
    text: string
}>()
const emit = defineEmits([
    'click'
])
</script>
<style scoped>
button {
    transition: background ease-in-out 0.2s;
    line-height: 1;
    padding: 5px;
    border: none;
    background: var(--button-background-color);
    margin-right: 4px;
    color: var(--text-default-color);
    cursor: pointer;
    border-radius: 4px;
}
button:hover {
    background: var(--button-hover-background-color);
}
</style>