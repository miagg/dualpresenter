<script setup lang="ts">
import { reactive } from 'vue'

const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
let cards = reactive([])
let names = reactive([])
window.electron.ipcRenderer.on('dataUpdated', (event, message) => {
  Object.assign(cards, message.cards)
  Object.assign(names, message.names)
})
</script>

<template>
  <div class="text-2xl">{{ names[0]?.name }}</div>
  <button class="bg-gray-200 text-black p-2" @click="ipcHandle()">Ping</button>
</template>
