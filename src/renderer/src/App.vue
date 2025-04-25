<template>
  <div class="app-container bg-gray-900 text-gray-200">
    <!-- Top Navigation Bar -->
    <div class="toolbar bg-gray-800 text-gray-200 p-4 flex items-center justify-between">
      <div class="app-title text-xl font-bold">DualPresenter</div>

      <div class="controls flex space-x-3">
        <button @click="openExcel" class="btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8.342a2 2 0 00-.602-1.43l-4.44-4.342A2 2 0 0011.56 2H6a2 2 0 00-2 2zm5 9a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z"
              clip-rule="evenodd"
            />
          </svg>
          Open File
        </button>

        <button @click="refreshData" class="btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd"
            />
          </svg>
          Refresh
        </button>

        <button
          @click="toggleFreeze"
          class="btn"
          :class="{ '!bg-red-500 animate-pulse': state.freezeMonitors }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clip-rule="evenodd"
            />
          </svg>
          {{ state.freezeMonitors ? 'Unfreeze Output' : 'Freeze Output' }}
        </button>

        <button @click="openSettings" class="btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clip-rule="evenodd"
            />
          </svg>
          Settings
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content flex-grow flex">
      <!-- Left Sidebar - Current and Next Slide -->
      <div class="sidebar-left w-1/4 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
        <div class="sidebar-content overflow-y-auto h-full">
          <h2 class="text-lg font-bold mb-2 text-gray-200">Main Screen</h2>
          <div class="card-preview mb-4">
            <Card
              v-if="cards.length > 0 && state.currentSlideIndex < cards.length"
              :card="cards[state.currentSlideIndex]"
              :names="names"
              :config="config"
              :isPreview="true"
            />
            <div
              v-else
              class="empty-preview bg-gray-700 aspect-video flex items-center justify-center text-gray-400"
            >
              No slide available
            </div>
          </div>

          <h2 class="text-lg font-bold mb-2 text-gray-200">Side Screen</h2>
          <div class="card-preview">
            <Card
              v-if="cards.length > 0 && state.currentSlideIndex + 1 < cards.length"
              :card="cards[state.currentSlideIndex + 1]"
              :names="names"
              :config="config"
              :isPreview="true"
            />
            <div
              v-else
              class="empty-preview bg-gray-700 aspect-video flex items-center justify-center text-gray-400"
            >
              No next slide
            </div>
          </div>

          <!-- Display Selection -->
          <div class="display-selection mt-6">
            <h2 class="text-lg font-bold mb-3 text-gray-200">Display Screens</h2>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-300">Main Screen</label>
              <select
                v-model="mainScreen"
                class="w-full p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              >
                <option :value="null">None</option>
                <option
                  v-for="monitor in monitors.filter((m) => !m.isPrimary)"
                  :key="monitor.id"
                  :value="monitor.id.toString()"
                >
                  {{
                    monitor.label ||
                    `Display ${monitor.id} (${monitor.size.width}x${monitor.size.height})`
                  }}
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-300">Side Screen</label>
              <select
                v-model="sideScreen"
                class="w-full p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              >
                <option :value="null">None</option>
                <option
                  v-for="monitor in monitors.filter(
                    (m) => !m.isPrimary && m.id.toString() !== mainScreen
                  )"
                  :key="monitor.id"
                  :value="monitor.id.toString()"
                >
                  {{
                    monitor.label ||
                    `Display ${monitor.id} (${monitor.size.width}x${monitor.size.height})`
                  }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content - Slide List -->
      <div class="content-main flex-grow p-4 flex flex-col overflow-hidden bg-gray-900">
        <h2 class="text-xl font-bold mb-4 text-gray-200">All Slides</h2>

        <div class="slides-list flex-grow overflow-y-auto space-y-4 pr-2">
          <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="slide-item p-3 border rounded flex hover:bg-gray-800 cursor-pointer bg-gray-850 border-gray-700"
            :class="{ 'bg-blue-900 border-blue-700': index === state.currentSlideIndex }"
            @click="goToSlide(index)"
          >
            <div class="slide-thumbnail w-40 mr-4">
              <Card :card="card" :names="names" :config="config" :isPreview="true" />
            </div>

            <div class="slide-info flex-grow">
              <div class="slide-title font-bold text-gray-200">{{ card.type }} {{ index + 1 }}</div>
              <div class="slide-subtitle mt-1 text-gray-300" v-if="card.title">
                {{ card.title }}
              </div>
              <div class="slide-meta text-sm text-gray-400 mt-1" v-if="card.subtitle || card.group">
                <span v-if="card.subtitle">{{ card.subtitle }}</span>
                <span v-if="card.subtitle && card.group"> | </span>
                <span v-if="card.group">Group: {{ card.group }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="navigation-buttons bg-gray-800 p-3 flex items-center justify-center space-x-6">
      <button @click="prevSlide" class="nav-btn" :disabled="state.currentSlideIndex <= 0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>

      <div class="slide-counter font-medium text-gray-200">
        Slide {{ state.currentSlideIndex + 1 }} of {{ cards.length }}
      </div>

      <button
        @click="nextSlide"
        class="nav-btn"
        :disabled="state.currentSlideIndex >= cards.length - 1"
      >
        Next
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import Card from './components/Card.vue'
import Settings from './components/Settings.vue'
import type { Card as CardType } from './interfaces/Card'
import type { Name } from './interfaces/Name'
import type { Config } from './interfaces/Config'

// Global state
const cards = ref<CardType[]>([])
const names = ref<Name[]>([])
const config = ref<Config>({
  colors: {
    primaryBackground: '#061D9F',
    primaryText: '#FFFFFF',
    secondaryBackground: '#FFFFFF',
    secondaryText: '#061D9F'
  },
  assets: {
    background: '',
    backgroundNames: '',
    logo: '',
    logoInverted: ''
  },
  fonts: {
    slidesFont: 'TheWaveSans-Bold'
  },
  slideOffset: 0
})
const state = reactive({
  currentSlideIndex: 0,
  freezeMonitors: false
})
const monitors = ref<Electron.Display[]>([])
const mainScreen = ref<string | null>(null)
const sideScreen = ref<string | null>(null)

// Handle data updates from main process
onMounted(() => {
  window.electron.ipcRenderer.on('data-updated', (_, data) => {
    cards.value = data.cards || []
    names.value = data.names || []
    config.value = data.config
    state.currentSlideIndex = data.state.currentSlideIndex || 0
    state.freezeMonitors = data.state.freezeMonitors || false
    monitors.value = data.monitors || []
    mainScreen.value = data.state.mainScreen
    sideScreen.value = data.state.sideScreen
  })

  // Load initial data
  window.electron.ipcRenderer.send('get-data')

  // Add keyboard event listeners for navigation
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('data-updated')
  window.removeEventListener('keydown', handleKeyDown)
})

// Watch monitor selection changes
watch(mainScreen, (newValue) => {
  window.electron.ipcRenderer.send('set-main-screen', newValue)
})

watch(sideScreen, (newValue) => {
  // Ensure null string is converted to actual null
  const value = newValue === 'null' ? null : newValue
  window.electron.ipcRenderer.send('set-side-screen', value)
})

// Methods
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    prevSlide()
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
    nextSlide()
  }
}

const nextSlide = () => {
  if (state.currentSlideIndex < cards.value.length - 1) {
    window.electron.ipcRenderer.send('next-slide')
  }
}

const prevSlide = () => {
  if (state.currentSlideIndex > 0) {
    window.electron.ipcRenderer.send('prev-slide')
  }
}

const goToSlide = (index: number) => {
  window.electron.ipcRenderer.send('goto-slide', index)
}

const openExcel = () => {
  window.electron.ipcRenderer.send('open-excel')
}

const refreshData = () => {
  window.electron.ipcRenderer.send('refresh-data')
}

const toggleFreeze = () => {
  window.electron.ipcRenderer.send('toggle-freeze')
}

const openSettings = () => {
  // Send message to main process to open settings window
  window.electron.ipcRenderer.send('open-settings')
}

const updateConfig = (newConfig: Config) => {
  // Create a deep copy to ensure we're not dealing with reference issues
  const configCopy = JSON.parse(JSON.stringify(newConfig))

  // Update local state
  config.value = configCopy

  // Send to main process to persist and update displays
  window.electron.ipcRenderer.send('update-config', configCopy)
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

.sidebar-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.slides-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  padding-right: 4px;
}

.slides-list::-webkit-scrollbar {
  width: 6px;
}

.slides-list::-webkit-scrollbar-track {
  background: transparent;
}

.slides-list::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  cursor: pointer;
}

.btn:hover {
  background-color: #2563eb;
}

.nav-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #4b5563;
  color: white;
  border-radius: 0.25rem;
  cursor: pointer;
}

.nav-btn:hover {
  background-color: #374151;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-thumbnail {
  min-width: 160px;
}
</style>
