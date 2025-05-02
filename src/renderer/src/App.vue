<template>
  <div class="app-container bg-gray-900 text-gray-200">
    <!-- Top Navigation Bar -->
    <div class="toolbar bg-gray-800 text-gray-200 p-4 flex items-center justify-between">
      <div class="app-title text-xl font-bold flex items-center">
        <span>DualPresenter</span>
        <span class="text-gray-600 mx-3 font-normal">|</span>
        <span
          class="text-gray-400 text-2xl ml-1 font-normal tabular-nums font-mono flex items-center space-x-4"
        >
          {{ currentTime }}
        </span>
      </div>

      <div class="controls flex space-x-3">
        <button @click="openExcel" class="btn">
          <svg
            class="h-5 w-5 mr-1"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <path
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 8V7C17 6.44772 16.5523 6 16 6H10.4142C10.149 6 9.89464 5.89464 9.70711 5.70711L8.29289 4.29289C8.10536 4.10536 7.851 4 7.58579 4H4C3.44772 4 3 4.44772 3 5V17C3 18.1046 3.89543 19 5 19H19C19.5523 19 20 18.5523 20 18V11C20 10.4477 19.5523 10 19 10H8C7.44772 10 7 10.4477 7 11V17C7 18.1046 6.10457 19 5 19V19"
            />
          </svg>
          Open File
        </button>

        <button
          @click="refreshData"
          class="btn disabled:opacity-50 disabled:pointer-events-none"
          :disabled="!state.isExcelLoaded"
        >
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
          class="btn disabled:opacity-50 disabled:pointer-events-none"
          :class="{ '!bg-red-800 animate-pulse': state.freezeMonitors }"
          :disabled="!state.isExcelLoaded"
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
      <div class="sidebar-left shrink-0 w-1/3 max-w-[500px] bg-gray-800 flex flex-col">
        <div class="sidebar-content overflow-y-auto h-full p-4">
          <h2 class="text-lg font-bold mb-2 text-gray-200">Main Screen</h2>
          <div class="card-preview mb-4">
            <SlidePreview
              v-if="cards.length > 0 && state.currentSlideIndex < cards.length"
              :card="cards[state.currentSlideIndex]"
              :names="names"
              :config="config"
            />
            <div
              v-else
              class="empty-preview bg-gray-700 aspect-video flex items-center justify-center text-gray-400"
            >
              No slide available
            </div>
          </div>

          <h2 class="text-lg font-bold mb-2 text-gray-200">
            Side Screen<span class="ml-2 text-yellow-400">⏺︎</span>
          </h2>
          <div class="card-preview">
            <SlidePreview
              v-if="cards.length > 0 && state.currentSlideIndex < cards.length"
              :card="sideScreenCard"
              :names="names"
              :config="config"
            />
            <div
              v-else
              class="empty-preview bg-gray-700 aspect-video flex items-center justify-center text-gray-400"
            >
              No slide available
            </div>
          </div>

          <!-- Display Selection -->
          <div class="display-selection mt-6">
            <h2 class="text-lg font-bold mb-3 text-gray-200 flex items-center justify-between">
              <span>Output</span>
              <div class="flex space-x-2">
                <button
                  @click="blackOutScreens"
                  class="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 flex items-cente disabled:opacity-50 disabled:pointer-events-none"
                  :class="{ '!bg-red-800 animate-pulse': state.blackOutScreens }"
                  title="Black out all screens"
                  :disabled="!state.isExcelLoaded"
                >
                  <svg
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="transparent"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <button
                  @click="flipScreens"
                  class="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 flex items-center"
                  title="Flip main screen with side screen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
                    />
                  </svg>
                </button>
              </div>
            </h2>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-300">Main Screen</label>
              <select
                v-model="mainScreen"
                class="w-full p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              >
                <option :value="null">None</option>
                <option
                  v-for="monitor in monitors.filter(
                    (m) => !m.isPrimary && m.id.toString() !== sideScreen
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
      <div
        class="content-main flex-grow flex flex-col overflow-hidden bg-gray-900 border-l border-y border-gray-700"
      >
        <div class="flex justify-between items-center mb-4 p-4 pr-4.5">
          <div class="flex items-center">
            <h2 class="text-xl font-bold text-gray-200 mr-3">All Slides</h2>

            <!-- Add slide counter and navigation arrows -->
            <div class="flex items-center bg-gray-800 rounded-lg px-2 py-1">
              <button
                @click="prevSlide"
                class="text-gray-400 hover:text-white p-1 focus:outline-none cursor-pointer disabled:pointer-events-none"
                :class="{ 'opacity-50 cursor-not-allowed': state.currentSlideIndex <= 0 }"
                :disabled="state.currentSlideIndex <= 0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
              </button>
              <span class="text-sm text-gray-300 mx-2"
                >{{ cards.length ? state.currentSlideIndex + 1 : 0 }} / {{ cards.length }}</span
              >
              <button
                @click="nextSlide"
                class="text-gray-400 hover:text-white p-1 focus:outline-none cursor-pointer disabled:pointer-events-none"
                :class="{
                  'opacity-50 cursor-not-allowed': state.currentSlideIndex >= cards.length - 1
                }"
                :disabled="state.currentSlideIndex >= cards.length - 1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative" ref="searchContainerRef">
            <div class="relative">
              <input
                type="text"
                v-model="searchQuery"
                class="w-64 xl:w-96 px-4 py-2 pr-16 border rounded bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="Search slides..."
                @focus="showSearchResults = true"
                @keydown.down.prevent="navigateSearchResults('down')"
                @keydown.up.prevent="navigateSearchResults('up')"
                @keydown.enter.prevent="selectSearchResult(selectedSearchIndex)"
                @keydown.escape="closeSearch()"
                ref="searchInputRef"
              />
              <div
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"
              >
                {{ isMac ? '⌘F' : 'Ctrl+F' }}
              </div>
            </div>

            <!-- Search Results Popup -->
            <div
              v-if="showSearchResults && filteredSearchResults.length > 0"
              class="absolute z-50 top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-gray-800 border border-gray-700 rounded shadow-lg"
            >
              <div
                v-for="(result, index) in filteredSearchResults"
                :key="result.id"
                class="p-2 hover:bg-gray-700 cursor-pointer flex items-center"
                :class="{ 'bg-blue-900': index === selectedSearchIndex }"
                @click="selectSearchResult(index)"
                @mouseover="selectedSearchIndex = index"
              >
                <div
                  class="flex-shrink-0 mr-2 w-10 h-6 bg-gray-700 flex items-center justify-center rounded"
                >
                  {{ result.index + 1 }}
                </div>
                <div class="flex-grow">
                  <div class="font-medium text-gray-200">{{ result.type }}</div>
                  <div class="text-sm text-gray-400" v-if="result.title">
                    {{ result.title }}
                  </div>
                  <!-- Display matched names if any -->
                  <div
                    class="text-xs text-gray-400 mt-1"
                    v-if="result.matchedNames && result.matchedNames.length > 0"
                  >
                    <span>Matched names: {{ result.matchedNames.slice(0, 3).join(', ') }}</span>
                    <span v-if="result.matchedNames.length > 3">
                      + {{ result.matchedNames.length - 3 }} more</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="slides-list flex-grow overflow-y-auto space-y-4 p-4 mr-0.5 select-none focus:outline-0 focus:ring-0"
        >
          <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="slide-item p-3 border rounded flex hover:bg-gray-800 cursor-pointer bg-gray-850 border-gray-700 outline-none transition relative"
            :class="{
              '!bg-blue-900/70 ring-2 ring-blue-700 shadow-[0_0_22px_rgba(20,50,255,0.5)]':
                index === state.currentSlideIndex,
              '!ring-red-700 ring-2': state.freezeMonitors && index === state.frozenSlideIndex
            }"
            @click="goToSlide(index)"
            ref="currentSlideRef"
          >
            <!-- Slide connection visualization -->
            <div
              v-if="showConnectionForSlide(card, index)"
              class="slide-connection absolute left-0 rounded-l top-0 bottom-0 w-1 bg-yellow-400"
            ></div>
            <div
              v-if="card.type === CardType.Names && config.namesPrecedence === 0"
              class="slide-connection absolute left-0 rounded-l top-0 bottom-0 w-1 bg-yellow-400"
            ></div>

            <div
              class="slide-thumbnail w-40 mr-4 relative"
              @mouseenter="startHoverTimer(index)"
              @mouseleave="clearHoverTimer()"
            >
              <SlidePreview
                :card="card"
                :names="names"
                :config="config"
                :class="{
                  'opacity-50': index < state.currentSlideIndex
                }"
              />

              <!-- Large thumbnail preview that appears on hover -->
              <transition name="fade">
                <div
                  v-if="hoveredSlideIndex === index && showLargeThumbnail"
                  class="large-thumbnail-preview absolute z-50"
                  :style="{
                    left: '100%',
                    top: '-20px'
                  }"
                  @mouseenter="keepLargeThumbnail()"
                  @mouseleave="clearHoverTimer()"
                >
                  <div class="bg-gray-800 border border-gray-600 p-2 rounded shadow-xl">
                    <div class="w-[455px] xl:w-[640px]">
                      <SlidePreview :card="card" :names="names" :config="config" />
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <div
              class="slide-info flex-grow"
              :class="{
                'opacity-50': index < state.currentSlideIndex
              }"
            >
              <div class="slide-title font-bold text-gray-200">
                {{ card.type }}
              </div>
              <div class="slide-subtitle mt-1 text-gray-300" v-if="card.title">
                {{ card.title }}
              </div>
              <div class="slide-meta text-sm text-gray-400 mt-1" v-if="card.subtitle || card.group">
                <span v-if="card.subtitle">{{ card.subtitle }}</span>
                <span v-if="card.subtitle && card.group"> | </span>
                <span v-if="card.group">Group: {{ card.group }}</span>
              </div>
            </div>

            <!-- Slide number on right side -->
            <div
              class="slide-number flex justify-center w-14 text-xl font-bold text-gray-600"
              :class="{
                'text-white animate-pulse': index === state.currentSlideIndex,
                'opacity-50': index < state.currentSlideIndex
              }"
            >
              {{ String(index + 1).padStart(2, '0') }}
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
        Slide {{ cards.length ? state.currentSlideIndex + 1 : 0 }} of {{ cards.length }}
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
import { ref, reactive, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import SlidePreview from './components/SlidePreview.vue'
import type { Card as CardInterface } from './interfaces/Card'
import type { Name } from './interfaces/Name'
import type { Config } from './interfaces/Config'
import { CardType } from './interfaces/Card'
import { normalizeForSearch } from './utils/textUtils'

// Global state
const cards = ref<CardInterface[]>([])
const names = ref<Name[]>([])
const currentSlideRef = ref<HTMLElement | null>(null)
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
    logoInverted: '',
    useDefaultAssets: true
  },
  fonts: {
    slidesFont: 'TheWaveSans-Bold'
  },
  namesPrecedence: 0
})
const state = reactive({
  currentSlideIndex: 0,
  freezeMonitors: false,
  blackOutScreens: false,
  frozenSlideIndex: null,
  isExcelLoaded: false
})
const monitors = ref<Electron.Display[]>([])
const mainScreen = ref<string | null>(null)
const sideScreen = ref<string | null>(null)
const regeneratingPreviews = ref(false)
const isScreenFlipping = ref(false) // Flag to prevent infinite loop when flipping screens

// Current time display
const currentTime = ref('')
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
setInterval(updateCurrentTime, 1000)
updateCurrentTime()

// Search functionality
const searchQuery = ref('')
const showSearchResults = ref(false)
const selectedSearchIndex = ref(-1)
const searchContainerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

const filteredSearchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }

  const normalizedQuery = normalizeForSearch(searchQuery.value.trim())

  return cards.value
    .map((card, index) => ({
      ...card,
      index,
      matchedNames: [] as string[] // Add property to store matched names
    }))
    .filter((card) => {
      // Search in card fields using normalized text
      const matchInCardFields =
        normalizeForSearch(card.type).includes(normalizedQuery) ||
        (card.title && normalizeForSearch(card.title).includes(normalizedQuery)) ||
        (card.subtitle && normalizeForSearch(card.subtitle).includes(normalizedQuery)) ||
        (card.group && normalizeForSearch(card.group).includes(normalizedQuery)) ||
        (card.from && normalizeForSearch(card.from).includes(normalizedQuery)) ||
        (card.until && normalizeForSearch(card.until).includes(normalizedQuery))

      // For Names cards, also search in the associated names
      if (card.type === CardType.Names || card.type === CardType.Unattended) {
        // Get all relevant names
        const relevantNames = names.value.filter((name) => {
          if (card.type === CardType.Names) {
            // For Names cards, only include names that are in the right group and attending
            return (
              name.group === card.group &&
              name.attending &&
              // Apply from/until filters if present
              (!card.from || name.name >= card.from) &&
              (!card.until || name.name <= card.until)
            )
          } else if (card.type === CardType.Unattended) {
            // For Unattended cards, include names that are not attending
            return !name.attending
          }
          return false
        })

        // Find names matching the search query using normalized text
        const matchedNames = relevantNames.filter((name) =>
          normalizeForSearch(name.name).includes(normalizedQuery)
        )

        // Store matched names for display
        card.matchedNames = matchedNames.map((name) => name.name)

        // Return true if any names match
        if (matchedNames.length > 0) {
          return true
        }
      }

      return matchInCardFields
    })
})

const navigateSearchResults = (direction: 'up' | 'down') => {
  if (filteredSearchResults.value.length === 0) {
    return
  }
  if (direction === 'up') {
    selectedSearchIndex.value =
      (selectedSearchIndex.value - 1 + filteredSearchResults.value.length) %
      filteredSearchResults.value.length
  } else if (direction === 'down') {
    selectedSearchIndex.value = (selectedSearchIndex.value + 1) % filteredSearchResults.value.length
  }
}

const selectSearchResult = (index: number) => {
  if (index >= 0 && index < filteredSearchResults.value.length) {
    goToSlide(filteredSearchResults.value[index].index)
    // Clear search query and close popup when result is selected
    searchQuery.value = ''
    closeSearch()

    // Set focus to the selected slide element after a small delay to ensure it's rendered
    nextTick(() => {
      const slideElements = document.querySelectorAll('.slide-item')
      const selectedIndex = filteredSearchResults.value[index].index

      if (slideElements && slideElements.length > selectedIndex) {
        const selectedSlide = slideElements[selectedIndex] as HTMLElement
        if (selectedSlide) {
          // Focus on the slide element
          selectedSlide.focus()
          // Ensure it's scrolled into view
          selectedSlide.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    })

    // Remove focus from the search input
    if (searchInputRef.value) {
      searchInputRef.value.blur()
    }
  }
}

const closeSearch = () => {
  showSearchResults.value = false
  selectedSearchIndex.value = -1
  // No longer clearing the search query here as it's now handled in selectSearchResult
}

// Handle data updates from main process
onMounted(() => {
  window.electron.ipcRenderer.on('data-updated', (_, data) => {
    cards.value = data.cards || []
    names.value = data.names || []
    config.value = data.config
    state.currentSlideIndex = data.state.currentSlideIndex || 0
    state.freezeMonitors = data.state.freezeMonitors || false
    state.blackOutScreens = data.state.blackOutScreens || false
    state.frozenSlideIndex =
      typeof data.state.frozenSlideIndex === 'number' ? data.state.frozenSlideIndex : null
    monitors.value = data.monitors || []
    mainScreen.value = data.state.mainScreen
    sideScreen.value = data.state.sideScreen

    // Set isExcelLoaded based on whether we have cards data
    state.isExcelLoaded = Array.isArray(data.cards) && data.cards.length > 0
  })

  // Listen for regenerate-previews events
  window.electron.ipcRenderer.on('regenerate-previews', () => {
    regeneratingPreviews.value = true
    setTimeout(() => {
      regeneratingPreviews.value = false
    }, 5000) // Reset after 5 seconds to avoid unnecessary regenerations
  })

  // Listen for toggle-freeze events from the main process
  window.electron.ipcRenderer.on('toggle-freeze', () => {
    // Toggle the freeze state
    state.freezeMonitors = !state.freezeMonitors
  })

  // Listen for clear-previews command from the application menu
  window.electron.ipcRenderer.on('clear-previews', () => {
    clearPreviews()
  })

  // Listen for flip-screens command from the application menu
  window.electron.ipcRenderer.on('flip-screens', () => {
    flipScreens()
  })

  // Listen for scroll-to-current command from the application menu
  window.electron.ipcRenderer.on('scroll-to-current', () => {
    // Scroll to selected slide when navigating with global shortcuts
    nextTick(() => {
      scrollSelectedSlideIntoView()
    })
  })

  // Load initial data
  window.electron.ipcRenderer.send('get-data')

  // Add keyboard event listeners for navigation
  window.addEventListener('keydown', handleKeyDown)

  // Add click outside listener for search popup
  document.addEventListener('click', handleClickOutside)

  // Add keyboard shortcut for search
  window.addEventListener('keydown', handleSearchShortcut)
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('data-updated')
  window.electron.ipcRenderer.removeAllListeners('regenerate-previews')
  window.electron.ipcRenderer.removeAllListeners('toggle-freeze')
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleSearchShortcut)
})

// Handle clicks outside the search container to close the popup
const handleClickOutside = (event: MouseEvent) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(event.target as Node)) {
    closeSearch()
  }
}

// Handle search shortcut
const handleSearchShortcut = (event: KeyboardEvent) => {
  // Skip if the event target is already an input element to avoid conflicts
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return
  }

  if (
    (isMac && event.metaKey && event.key === 'f') ||
    (!isMac && event.ctrlKey && event.key === 'f')
  ) {
    event.preventDefault()
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      showSearchResults.value = true
    }
  }
}

const sideScreenCard = computed(() => {
  const namesPrecedence = config.value.namesPrecedence
  const namesCard = cards.value.find((card) => {
    return (
      card.type === CardType.Names &&
      state.currentSlideIndex + namesPrecedence >= card.id - 1 &&
      (namesPrecedence > 0 ? state.currentSlideIndex < card.id - 1 : true)
    )
  })
  if (namesCard) {
    return namesCard
  } else {
    return { type: CardType.Blank }
  }
})

// Watch monitor selection changes
watch(mainScreen, (newValue) => {
  // Only send IPC message if not in the middle of a screen flip
  if (!isScreenFlipping.value) {
    window.electron.ipcRenderer.send('set-main-screen', newValue)
  }
})

watch(sideScreen, (newValue) => {
  // Only send IPC message if not in the middle of a screen flip
  if (!isScreenFlipping.value) {
    // Ensure null string is converted to actual null
    const value = newValue === 'null' ? null : newValue
    window.electron.ipcRenderer.send('set-side-screen', value)
  }
})

// Methods
const handleKeyDown = (event: KeyboardEvent) => {
  // Skip if the event target is an input, textarea, or select element
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    event.stopPropagation()
    prevSlide()
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    nextSlide()
  }
}

const nextSlide = () => {
  if (state.currentSlideIndex < cards.value.length - 1) {
    window.electron.ipcRenderer.send('next-slide')
    nextTick(() => {
      scrollSelectedSlideIntoView()
    })
  }
}

const prevSlide = () => {
  if (state.currentSlideIndex > 0) {
    window.electron.ipcRenderer.send('prev-slide')
    nextTick(() => {
      scrollSelectedSlideIntoView()
    })
  }
}

const scrollSelectedSlideIntoView = () => {
  const slideElements = document.querySelectorAll('.slide-item')
  if (slideElements && slideElements.length > state.currentSlideIndex) {
    const selectedSlide = slideElements[state.currentSlideIndex] as HTMLElement
    selectedSlide?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

const clearPreviews = async () => {
  try {
    // Import the utility function
    const { clearAllSlidePreviewImages } = await import('./utils/fileUtils')

    // Call the function to clear previews (this will show confirmation dialog)
    const deletedCount = await clearAllSlidePreviewImages()

    // Notify user of the result
    if (deletedCount > 0) {
      // Trigger regeneration of previews for current visible slides
      regeneratingPreviews.value = true
      setTimeout(() => {
        regeneratingPreviews.value = false
      }, 500)
    }
  } catch (error) {
    console.error('Error clearing preview images:', error)
  }
}

// Hover functionality for large thumbnail preview
const hoveredSlideIndex = ref<number | null>(null)
const showLargeThumbnail = ref(false)
let hoverTimer: number | null = null

const startHoverTimer = (index: number) => {
  clearHoverTimer()
  hoverTimer = window.setTimeout(() => {
    hoveredSlideIndex.value = index
    showLargeThumbnail.value = true
  }, 1000) // 1 second delay
}

const clearHoverTimer = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  showLargeThumbnail.value = false
  hoveredSlideIndex.value = null
}

const keepLargeThumbnail = () => {
  clearHoverTimer()
}

const flipScreens = () => {
  // Only proceed if at least one of the screens is selected
  if (mainScreen.value === null && sideScreen.value === null) {
    return
  }

  // Store current values
  const tempMain = mainScreen.value
  const tempSide = sideScreen.value

  // First, clear both screens to avoid conflicts
  window.electron.ipcRenderer.send('set-main-screen', null)
  window.electron.ipcRenderer.send('set-side-screen', null)

  // Wait for the screens to be cleared
  setTimeout(() => {
    mainScreen.value = tempSide
    window.electron.ipcRenderer.send('set-main-screen', tempSide)
  }, 1000)

  setTimeout(() => {
    sideScreen.value = tempMain
    const sideValue = tempMain === 'null' ? null : tempMain
    window.electron.ipcRenderer.send('set-side-screen', sideValue)
  }, 2000)
}

const blackOutScreens = () => {
  // Toggle the black out state
  state.blackOutScreens = !state.blackOutScreens
  // Send to main process
  window.electron.ipcRenderer.send('toggle-black-out')
}

// Slide connection visualization functions
const showConnectionForSlide = (card: CardInterface, index: number): boolean => {
  const namesPrecedence = config.value.namesPrecedence
  if (namesPrecedence <= 0) return false

  // Find the next Names slide
  const nextNamesSlideIndex = findNextNameSlideIndex(index)

  // Show connection line if this slide is within the precedence range of a Names slide
  if (nextNamesSlideIndex !== -1) {
    const distance = nextNamesSlideIndex - index
    return distance > 0 && distance <= namesPrecedence
  }

  return false
}

const isConnectedToNameSlide = (card: CardInterface, index: number): boolean => {
  const namesPrecedence = config.value.namesPrecedence
  if (namesPrecedence <= 0) return false

  // It's connected if it's the last slide before a Names slide
  const nextSlideIndex = index + 1
  if (nextSlideIndex < cards.value.length) {
    const nextSlide = cards.value[nextSlideIndex]
    return nextSlide.type === CardType.Names
  }

  return false
}

const findNextNameSlideIndex = (currentIndex: number): number => {
  for (let i = currentIndex + 1; i < cards.value.length; i++) {
    if (cards.value[i].type === CardType.Names) {
      return i
    }
  }
  return -1
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
  scrollbar-gutter: 20px;
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
  background-color: #2563eb;
  color: white;
  border-radius: 0.25rem;
  cursor: pointer;
}

.btn:hover {
  background-color: #1d4ed8;
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

.large-thumbnail-preview {
  animation: fadeIn 0.3s ease-in-out;
  opacity: 1 !important; /* Ensure always full opacity */
}

/* Fade transition for the large thumbnail preview */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  opacity: 1 !important; /* Force 100% opacity during transitions */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
