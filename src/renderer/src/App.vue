<script setup lang="ts">
const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
</script>

<template>
  <button @click="ipcHandle()">test</button>
</template>
