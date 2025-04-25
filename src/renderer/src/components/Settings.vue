<template>
  <div class="settings-panel bg-gray-800 w-full h-full overflow-hidden p-6 text-gray-200">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Settings</h2>
      <button
        @click="closeSettings"
        class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 cursor-pointer"
      >
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div class="settings-content overflow-y-auto h-full">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Colors Section -->
        <div class="settings-section" @input="settingsChanged">
          <h3 class="text-xl font-semibold mb-4">Colors</h3>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-1 text-gray-300">Primary Background</label>
            <div class="flex">
              <input
                v-model="settings.colors.primaryBackground"
                type="color"
                class="h-10 w-12 rounded"
              />
              <input
                v-model="settings.colors.primaryBackground"
                type="text"
                class="ml-2 flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-1 text-gray-300">Primary Text</label>
            <div class="flex">
              <input v-model="settings.colors.primaryText" type="color" class="h-10 w-12 rounded" />
              <input
                v-model="settings.colors.primaryText"
                type="text"
                class="ml-2 flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-1 text-gray-300">Secondary Background</label>
            <div class="flex">
              <input
                v-model="settings.colors.secondaryBackground"
                type="color"
                class="h-10 w-12 rounded"
              />
              <input
                v-model="settings.colors.secondaryBackground"
                type="text"
                class="ml-2 flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-1 text-gray-300">Secondary Text</label>
            <div class="flex">
              <input
                v-model="settings.colors.secondaryText"
                type="color"
                class="h-10 w-12 rounded"
              />
              <input
                v-model="settings.colors.secondaryText"
                type="text"
                class="ml-2 flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
              />
            </div>
          </div>
        </div>

        <!-- Assets Section -->
        <div class="settings-section">
          <h3 class="text-xl font-semibold mb-4">Assets</h3>

          <div class="mb-5">
            <label class="block text-sm font-medium mb-1 text-gray-300">Background</label>
            <div class="flex">
              <input
                v-model="settings.assets.background"
                type="text"
                class="flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
                placeholder="Path to background image"
              />
              <button
                class="ml-2 px-3 py-2 bg-blue-600 text-gray-200 rounded hover:bg-blue-700"
                @click="selectFile('background')"
              >
                Browse
              </button>
              <button
                v-if="settings.assets.background"
                class="ml-2 px-3 py-2 bg-red-600 text-gray-200 rounded hover:bg-red-700"
                @click="clearAsset('background')"
              >
                Clear
              </button>
            </div>
            <div v-if="imagePreviews.background" class="mt-2">
              <div class="image-preview">
                <img :src="imagePreviews.background" alt="Background Preview" />
              </div>
            </div>
          </div>

          <div class="mb-5">
            <label class="block text-sm font-medium mb-1 text-gray-300">Names Background</label>
            <div class="flex">
              <input
                v-model="settings.assets.backgroundNames"
                type="text"
                class="flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
                placeholder="Path to names background image"
              />
              <button
                class="ml-2 px-3 py-2 bg-blue-600 text-gray-200 rounded hover:bg-blue-700"
                @click="selectFile('backgroundNames')"
              >
                Browse
              </button>
              <button
                v-if="settings.assets.backgroundNames"
                class="ml-2 px-3 py-2 bg-red-600 text-gray-200 rounded hover:bg-red-700"
                @click="clearAsset('backgroundNames')"
              >
                Clear
              </button>
            </div>
            <div v-if="imagePreviews.backgroundNames" class="mt-2">
              <div class="image-preview">
                <img :src="imagePreviews.backgroundNames" alt="Names Background Preview" />
              </div>
            </div>
          </div>

          <div class="mb-5">
            <label class="block text-sm font-medium mb-1 text-gray-300">Logo</label>
            <div class="flex">
              <input
                v-model="settings.assets.logo"
                type="text"
                class="flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
                placeholder="Path to logo image"
              />
              <button
                class="ml-2 px-3 py-2 bg-blue-600 text-gray-200 rounded hover:bg-blue-700"
                @click="selectFile('logo')"
              >
                Browse
              </button>
              <button
                v-if="settings.assets.logo"
                class="ml-2 px-3 py-2 bg-red-600 text-gray-200 rounded hover:bg-red-700"
                @click="clearAsset('logo')"
              >
                Clear
              </button>
            </div>
            <div v-if="imagePreviews.logo" class="mt-2">
              <div class="image-preview">
                <img :src="imagePreviews.logo" alt="Logo Preview" />
              </div>
            </div>
          </div>

          <div class="mb-5">
            <label class="block text-sm font-medium mb-1 text-gray-300">Inverted Logo</label>
            <div class="flex">
              <input
                v-model="settings.assets.logoInverted"
                type="text"
                class="flex-grow p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
                placeholder="Path to inverted logo image"
              />
              <button
                class="ml-2 px-3 py-2 bg-blue-600 text-gray-200 rounded hover:bg-blue-700"
                @click="selectFile('logoInverted')"
              >
                Browse
              </button>
              <button
                v-if="settings.assets.logoInverted"
                class="ml-2 px-3 py-2 bg-red-600 text-gray-200 rounded hover:bg-red-700"
                @click="clearAsset('logoInverted')"
              >
                Clear
              </button>
            </div>
            <div v-if="imagePreviews.logoInverted" class="mt-2">
              <div class="image-preview">
                <img :src="imagePreviews.logoInverted" alt="Inverted Logo Preview" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fonts Section -->
      <div class="mt-6">
        <h3 class="text-xl font-semibold mb-4">Fonts</h3>
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1 text-gray-300">Slides Font</label>
          <select
            v-model="settings.fonts.slidesFont"
            class="w-full p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
            @change="settingsChanged"
          >
            <option value="TheWaveSans-Bold">The Wave Sans Bold</option>
            <option value="CFDin-Bold">CF Din Bold</option>
            <option value="Effra-Heavy">Effra Heavy</option>
            <option value="FreeScript">Free Script</option>
            <option value="ZonaPro-Black">Zona Pro Black</option>
          </select>
          <p class="mt-1 text-xs text-gray-400">This font will be applied to all slides</p>
        </div>
        <div class="font-preview mt-3 p-3 bg-gray-700 rounded">
          <p class="mb-2 text-sm text-gray-300">Font Preview:</p>
          <p :style="{ fontFamily: settings.fonts.slidesFont }" class="text-3xl">
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      </div>

      <!-- Slide Offset -->
      <div class="mt-6">
        <h3 class="text-xl font-semibold mb-4">Side Screen</h3>
        <div class="flex items-center">
          <label class="block text-sm font-medium mr-3 text-gray-300">Precedence Slides:</label>
          <input
            v-model.number="settings.namesPrecedence"
            type="number"
            min="0"
            max="20"
            class="w-16 p-2 border rounded bg-gray-700 text-gray-200 border-gray-600"
            @change="settingsChanged"
          />
        </div>
        <p class="mt-2 text-sm text-gray-400">
          This determines how many slides ahead you want the names to appear in the side screen. For
          example a value of 2 means the names will appear two slides ahead of the current slide.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted, watch, defineEmits } from 'vue'
import type { Config } from '../interfaces/Config'

// Define emits for when component is used within main app
const emit = defineEmits(['save'])

// Check if we're running in standalone mode by checking the URL
const isStandaloneMode = window.location.hash.includes('/settings')

const props = defineProps({
  config: {
    type: Object as () => Config,
    default: () => ({
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
      namesPrecedence: 0
    })
  }
})

// Deep clone the config to avoid direct mutation
const settings = reactive<Config>({
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
  namesPrecedence: 0
})

// Store image previews as data URLs
const imagePreviews = reactive({
  background: '',
  backgroundNames: '',
  logo: '',
  logoInverted: ''
})

onMounted(() => {
  // Initialize with provided config
  initializeSettings()

  // Load image previews
  loadImagePreviews()

  // Add listener for settings data from main process when opened as standalone window
  window.electron.ipcRenderer.on('settings-data', (_, config) => {
    if (config) {
      settings.colors.primaryBackground = config.colors.primaryBackground || '#061D9F'
      settings.colors.primaryText = config.colors.primaryText || '#FFFFFF'
      settings.colors.secondaryBackground = config.colors.secondaryBackground || '#FFFFFF'
      settings.colors.secondaryText = config.colors.secondaryText || '#061D9F'

      settings.assets.background = config.assets.background || ''
      settings.assets.backgroundNames = config.assets.backgroundNames || ''
      settings.assets.logo = config.assets.logo || ''
      settings.assets.logoInverted = config.assets.logoInverted || ''

      settings.fonts.slidesFont = config.fonts?.slidesFont || 'TheWaveSans-Bold'
      settings.namesPrecedence = config.namesPrecedence || 0

      // Load image previews after settings are updated
      loadImagePreviews()
    }
  })

  // If in standalone mode, request initial data
  if (isStandaloneMode) {
    window.electron.ipcRenderer.send('get-settings-data')
  }
})

// Initialize settings from props
const initializeSettings = (): void => {
  settings.colors.primaryBackground = props.config.colors.primaryBackground || '#061D9F'
  settings.colors.primaryText = props.config.colors.primaryText || '#FFFFFF'
  settings.colors.secondaryBackground = props.config.colors.secondaryBackground || '#FFFFFF'
  settings.colors.secondaryText = props.config.colors.secondaryText || '#061D9F'

  settings.assets.background = props.config.assets.background || ''
  settings.assets.backgroundNames = props.config.assets.backgroundNames || ''
  settings.assets.logo = props.config.assets.logo || ''
  settings.assets.logoInverted = props.config.assets.logoInverted || ''

  settings.fonts.slidesFont = props.config.fonts?.slidesFont || 'TheWaveSans-Bold'
  settings.namesPrecedence = props.config.namesPrecedence || 0
}

// Load image previews using the IPC API
const loadImagePreviews = async (): Promise<void> => {
  // Clear existing previews first
  imagePreviews.background = ''
  imagePreviews.backgroundNames = ''
  imagePreviews.logo = ''
  imagePreviews.logoInverted = ''

  // Load each image if path exists
  if (settings.assets.background) {
    imagePreviews.background =
      (await window.api.loadImageAsDataUrl(settings.assets.background)) || ''
  }

  if (settings.assets.backgroundNames) {
    imagePreviews.backgroundNames =
      (await window.api.loadImageAsDataUrl(settings.assets.backgroundNames)) || ''
  }

  if (settings.assets.logo) {
    imagePreviews.logo = (await window.api.loadImageAsDataUrl(settings.assets.logo)) || ''
  }

  if (settings.assets.logoInverted) {
    imagePreviews.logoInverted =
      (await window.api.loadImageAsDataUrl(settings.assets.logoInverted)) || ''
  }
}

// Cleanup event listeners when component is unmounted
onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('settings-data')
})

// File selection dialog
const selectFile = (
  assetType: 'background' | 'backgroundNames' | 'logo' | 'logoInverted'
): void => {
  window.electron.ipcRenderer
    .invoke('select-file', {
      title: 'Select Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
    })
    .then((result) => {
      if (result && !result.canceled && result.filePaths.length > 0) {
        settings.assets[assetType] = result.filePaths[0]
        settingsChanged()
        // Load the preview for this asset
        window.api.loadImageAsDataUrl(result.filePaths[0]).then((dataUrl) => {
          if (dataUrl) {
            imagePreviews[assetType] = dataUrl
          }
        })
      }
    })
}

// Clear an asset
const clearAsset = (
  assetType: 'background' | 'backgroundNames' | 'logo' | 'logoInverted'
): void => {
  settings.assets[assetType] = ''
  imagePreviews[assetType] = ''
  settingsChanged()
}

// Watch for changes to settings and automatically save
watch(
  settings,
  (newValue) => {
    // Only use the emit method when not in standalone mode
    if (!isStandaloneMode) {
      emit('save', newValue)
    }
    // We don't need to do anything here for standalone mode as we handle updates directly in change events
  },
  { deep: true }
)

// Fix for the fonts dropdown to ensure it directly updates config
watch(
  () => props.config,
  (newConfig) => {
    // Update settings with new config values when config prop changes
    settings.colors.primaryBackground = newConfig.colors.primaryBackground || '#061D9F'
    settings.colors.primaryText = newConfig.colors.primaryText || '#FFFFFF'
    settings.colors.secondaryBackground = newConfig.colors.secondaryBackground || '#FFFFFF'
    settings.colors.secondaryText = newConfig.colors.secondaryText || '#061D9F'

    settings.assets.background = newConfig.assets.background || ''
    settings.assets.backgroundNames = newConfig.assets.backgroundNames || ''
    settings.assets.logo = newConfig.assets.logo || ''
    settings.assets.logoInverted = newConfig.assets.logoInverted || ''

    settings.fonts.slidesFont = newConfig.fonts?.slidesFont || 'TheWaveSans-Bold'

    // Load image previews when config changes
    loadImagePreviews()
  },
  { deep: true, immediate: true }
)

const settingsChanged = (): void => {
  // Create a complete deep copy to ensure we're working with a new object
  const settingsCopy = {
    colors: {
      primaryBackground: settings.colors.primaryBackground,
      primaryText: settings.colors.primaryText,
      secondaryBackground: settings.colors.secondaryBackground,
      secondaryText: settings.colors.secondaryText
    },
    assets: {
      background: settings.assets.background,
      backgroundNames: settings.assets.backgroundNames,
      logo: settings.assets.logo,
      logoInverted: settings.assets.logoInverted
    },
    fonts: {
      slidesFont: settings.fonts.slidesFont
    },
    namesPrecedence: settings.namesPrecedence
  }

  // Force an immediate save with the copy
  if (isStandaloneMode) {
    window.electron.ipcRenderer.send('update-config', settingsCopy)
  } else {
    emit('save', settingsCopy)
  }
}

// Close settings handler
const closeSettings = (): void => {
  if (isStandaloneMode) {
    window.electron.ipcRenderer.send('close-settings')
  }
}
</script>

<style scoped>
.settings-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  overflow: hidden;
}

.settings-content {
  height: calc(100% - 50px);
  padding-right: 20px; /* Add padding on right for scrollbar */
  padding-bottom: 30px; /* Add extra padding at the bottom */
  margin-right: -20px; /* Negative margin to keep scrollbar at the edge */
  overflow-y: auto;
  overflow-x: hidden;
}

/* Image preview styling */
.image-preview {
  max-width: 100%;
  margin-top: 4px;
  border: 1px solid rgba(107, 114, 128, 0.7);
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(31, 41, 55, 0.5);
}

.image-preview img {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  padding: 8px;
}

/* Customize scrollbar */
.settings-content::-webkit-scrollbar {
  width: 8px;
}

.settings-content::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5); /* Darker track color */
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.7); /* Gray thumb color */
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8); /* Lighter on hover */
}
</style>
