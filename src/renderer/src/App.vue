<script setup lang="ts">
import { ref } from 'vue'
import Card from './components/Card.vue'

const loadData = (): void => window.electron.ipcRenderer.send('get-data')

const cards = ref([])

window.electron.ipcRenderer.on('data-updated', (event, message) => {
  cards.value = message.cards
})
loadData()
</script>

<template>
  <Card v-if="cards.length" :card="cards[1]" />
</template>
