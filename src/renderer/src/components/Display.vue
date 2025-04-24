<template>
  <div class="fullscreen-display">
    <Card v-if="currentCard" :card="currentCard" :names="names" :config="config" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Card from '../components/Card.vue'
import type { Card as CardType } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'

const currentCard = ref<CardType | null>(null)
const names = ref<Name[]>([])
const config = ref<Config | null>(null)

onMounted(() => {
  window.electron.ipcRenderer.on('display-data', (_, data) => {
    if (data.cards && data.cards.length && data.currentSlideIndex >= 0) {
      currentCard.value = data.cards[data.currentSlideIndex]
      names.value = data.names || []
      config.value = data.config
    }
  })
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('display-data')
})
</script>

<style scoped>
.fullscreen-display {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
