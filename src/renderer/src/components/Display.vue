<template>
  <div class="display-container">
    <Card
      v-if="currentCard"
      :card="currentCard"
      :names="names"
      :config="config"
      :audioStatus="audioStatus"
      :lastSpokenName="lastSpokenName"
      :isMainScreen="isMainScreen"
      :isFromSideOnlyNamesCard="isFromSideOnlyNamesCard"
      :currentNamesPage="currentNamesPage"
      :currentUnattendedPage="currentUnattendedPage"
    />
    <div v-if="blackOutActive" class="black-overlay" :class="{ 'fade-in': blackOutActive }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Card from '../components/Card.vue'
import { CardType, DisplayType } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'
import type { Card as CardInterface } from '../interfaces/Card'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentCard = ref<CardInterface | null>(null)
const names = ref<Name[]>([])
const config = ref<Config | null>(null)
const blackOutActive = ref(false)
const audioStatus = ref({
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  totalNames: 0,
  currentName: null as string | null
})
const lastSpokenName = ref<string | null>(null)
const isMainScreen = route.name === 'mainscreen'
const isFromSideOnlyNamesCard = ref(false)
const currentSlideIndex = ref(-1)
const currentNamesPage = ref(0)
const currentUnattendedPage = ref(0)

onMounted(() => {
  window.electron.ipcRenderer.on('display-data', (_, data) => {
    if (data.cards && data.cards.length && data.currentSlideIndex >= 0) {
      names.value = data.names || []
      config.value = data.config

      // Clear last spoken name when slide changes
      if (currentSlideIndex.value !== data.currentSlideIndex) {
        lastSpokenName.value = null
        currentSlideIndex.value = data.currentSlideIndex
      }

      // Get audio status if provided
      if (data.audioStatus) {
        // Track last spoken name when audio is playing and there's a current name
        if (data.audioStatus.isPlaying && data.audioStatus.currentName) {
          lastSpokenName.value = data.audioStatus.currentName
        }
        audioStatus.value = data.audioStatus
      }

      // Get black out state if provided
      if (data.state && data.state.blackOutScreens !== undefined) {
        blackOutActive.value = data.state.blackOutScreens
      }

      // Get pagination state if provided
      if (data.state) {
        if (route.name === 'mainscreen') {
          currentNamesPage.value = data.state.currentMainNamesPage ?? 0
          currentUnattendedPage.value = data.state.currentMainUnattendedPage ?? 0
        } else {
          currentNamesPage.value = data.state.currentSideNamesPage ?? 0
          currentUnattendedPage.value = data.state.currentSideUnattendedPage ?? 0
        }
      }

      if (route.name === 'mainscreen') {
        // Check bounds before accessing the card
        if (data.cards && data.cards.length > 0 && data.currentSlideIndex < data.cards.length) {
          const card = data.cards[data.currentSlideIndex]
          // If card is set as "Side Only" display, show a blank card instead
          if (card.display === DisplayType.SideOnly) {
            isFromSideOnlyNamesCard.value = card.type === CardType.Names
            currentCard.value = {
              id: -1,
              type: CardType.Blank,
              title: null,
              subtitle: null,
              group: null,
              from: null,
              until: null,
              display: DisplayType.Both,
              precedence: null
            }
          } else {
            isFromSideOnlyNamesCard.value = false
            currentCard.value = card
          }
        } else {
          isFromSideOnlyNamesCard.value = false
          currentCard.value = null
        }
      } else {
        const namesCard = data.cards.find((card) => {
          let namesPrecedence =
            card.precedence !== null ? card.precedence : data.config.namesPrecedence
          return (
            card.type === CardType.Names &&
            card.display !== DisplayType.MainOnly &&
            data.currentSlideIndex + namesPrecedence >= card.id - 1 &&
            (namesPrecedence === 0 || card.display === DisplayType.Both
              ? data.currentSlideIndex < card.id
              : data.currentSlideIndex < card.id - 1)
          )
        })
        if (namesCard) {
          isFromSideOnlyNamesCard.value = namesCard.display === DisplayType.SideOnly
          currentCard.value = namesCard
        } else {
          isFromSideOnlyNamesCard.value = false
          currentCard.value = {
            id: -1,
            type: CardType.Blank,
            title: null,
            subtitle: null,
            group: null,
            from: null,
            until: null,
            display: DisplayType.Both,
            precedence: null
          }
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
