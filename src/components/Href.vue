<template>
    <a :href="props.to" target="_blank" rel="noreferrer">{{ displayName }}</a>
</template>
<script setup lang="ts">
const props = defineProps<{
    to: string
    display?: string
}>()

const displayName = props.display || props.to;
</script>
<style scoped>
a {
    color: var(--text-default-color);
}
</style>