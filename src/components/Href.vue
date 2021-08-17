<template>
    <a :href="props.to" target="_blank" rel="noreferrer">{{ displayName }}</a>
</template>
<script setup>
const props = defineProps({
    to: String,
    display: String
})
const displayName = props.display || props.to;
</script>