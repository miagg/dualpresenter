<template>
  <div class="display-container">
    <Card v-if="currentCard" :card="currentCard" :names="names" :config="config" />
    <div v-if="blackOutActive" class="black-overlay" :class="{ 'fade-in': blackOutActive }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Card from '../components/Card.vue'
import { CardType } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentCard = ref<object | null>(null)
const names = ref<Name[]>([])
const config = ref<Config | null>(null)
const blackOutActive = ref(false)

onMounted(() => {
  window.electron.ipcRenderer.on('display-data', (_, data) => {
    if (data.cards && data.cards.length && data.currentSlideIndex >= 0) {
      names.value = data.names || []
      config.value = data.config

      // Get black out state if provided
      if (data.state && data.state.blackOutScreens !== undefined) {
        blackOutActive.value = data.state.blackOutScreens
      }

      if (route.name === 'mainscreen') {
        currentCard.value = data.cards[data.currentSlideIndex]
      } else {
        const namesPrecedence = data.config.namesPrecedence
        const namesCard = data.cards.find((card) => {
          return (
            card.type === CardType.Names &&
            data.currentSlideIndex + namesPrecedence >= card.id - 1 &&
            (namesPrecedence > 0 ? data.currentSlideIndex < card.id - 1 : true)
          )
        })
        if (namesCard) {
          currentCard.value = namesCard
        } else {
          currentCard.value = { type: CardType.Blank }
        }
      }
    }
  })

  // Listen for black-out state changes
  window.electron.ipcRenderer.on('black-out-changed', (_, isBlackOut) => {
    blackOutActive.value = isBlackOut
  })
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('display-data')
  window.electron.ipcRenderer.removeAllListeners('black-out-changed')
})
</script>

<style scoped>
.display-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.black-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #000000;
  z-index: 1000;
  opacity: 1;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
