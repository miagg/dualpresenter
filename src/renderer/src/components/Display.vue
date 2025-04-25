<template>
  <div>
    <Card v-if="currentCard" :card="currentCard" :names="names" :config="config" />
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

onMounted(() => {
  window.electron.ipcRenderer.on('display-data', (_, data) => {
    if (data.cards && data.cards.length && data.currentSlideIndex >= 0) {
      names.value = data.names || []
      config.value = data.config
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
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('display-data')
})
</script>
