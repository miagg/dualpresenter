<template>
  <div
    class="aspect-video overflow-hidden slides-content w-full h-full"
    :style="{
      fontFamily: slideStyles.fontFamilyImportant,
      backgroundColor: backgroundColor,
      color: textColor
    }"
  >
    <!-- Blank Card -->
    <div
      v-if="card.type === CardType.Blank"
      class="flex items-center justify-center h-full relative"
    >
      <!-- Background image -->
      <img
        v-if="backgroundImageSrc"
        :src="backgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full"
      />
      <!-- Logo based on background -->
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="max-h-1/2 max-w-1/2 z-10" />
    </div>

    <!-- Title Card -->
    <div
      v-else-if="card.type === CardType.Title"
      class="flex flex-col items-center justify-center h-full relative p-8"
    >
      <!-- Background image -->
      <img
        v-if="backgroundImageSrc"
        :src="backgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full"
      />
      <!-- Logo based on background -->
      <img
        v-if="logoSrc"
        :src="logoSrc"
        alt="Logo"
        class="absolute top-[4%] left-[3%] w-[15%] z-10"
      />
      <h1 v-if="card.title" class="text-5xl font-bold text-center mb-4 z-10">
        {{ card.title }}
      </h1>
      <h2 v-if="card.subtitle" class="text-3xl font-light text-center z-10">{{ card.subtitle }}</h2>
    </div>

    <!-- Names Card -->
    <div v-else-if="card.type === CardType.Names" class="flex flex-col h-full p-8 relative">
      <!-- Background image - prioritize names-specific background if available -->
      <img
        v-if="namesBackgroundImageSrc"
        :src="namesBackgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full"
      />
      <img
        v-else-if="backgroundImageSrc"
        :src="backgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full"
      />
      <!-- Logo based on background -->
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="absolute top-4 left-4 max-h-16 z-10" />

      <h1 v-if="card.title" class="text-4xl font-bold mb-2 z-10">{{ card.title }}</h1>
      <h2 v-if="card.subtitle" class="text-2xl font-light mb-6 z-10">{{ card.subtitle }}</h2>

      <div class="flex-grow overflow-auto z-10">
        <div v-if="filteredNames.length > 0" class="grid grid-cols-2 gap-4">
          <div v-for="name in filteredNames" :key="name.id" class="text-xl">
            {{ name.name }}
          </div>
        </div>
        <div v-else class="text-center text-xl italic opacity-70 mt-8">
          No names available for this group
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watchEffect } from 'vue'
import type { PropType } from 'vue'
import { CardType, type Card } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'

// Import default assets
import defaultBg from '../../../../resources/bg.png'
import defaultBg2 from '../../../../resources/bg2.png'
import defaultLogo from '../../../../resources/logo.png'
import defaultLogoWhite from '../../../../resources/logo_white.png'

// Reactive refs to store loaded image data URLs
const backgroundImageDataUrl = ref<string | null>(null)
const namesBackgroundImageDataUrl = ref<string | null>(null)
const logoImageDataUrl = ref<string | null>(null)
const logoInvertedImageDataUrl = ref<string | null>(null)

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true
  },
  names: {
    type: Array as PropType<Name[]>,
    default: () => []
  },
  config: {
    type: Object as PropType<Config>,
    default: null
  },
  isPreview: {
    type: Boolean,
    default: false
  }
})

// Filter names based on the card group, from, and until properties
const filteredNames = computed(() => {
  if (!props.card.group || props.card.type !== CardType.Names) {
    return []
  }

  let filtered = props.names.filter((name) => name.group === props.card.group && name.attending)

  // If from and until are provided, filter by alphabetical range
  if (props.card.from && props.card.until) {
    filtered = filtered.filter(
      (name) => name.name >= props.card.from! && name.name <= props.card.until!
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Determine background color based on card type
const backgroundColor = computed(() => {
  if (props.card.type === CardType.Names) {
    return props.config?.colors?.secondaryBackground || '#FFFFFF'
  } else {
    return props.config?.colors?.primaryBackground || '#061D9F'
  }
})

// Determine text color based on card type
const textColor = computed(() => {
  if (props.card.type === CardType.Names) {
    return props.config?.colors?.secondaryText || '#061D9F'
  } else {
    return props.config?.colors?.primaryText || '#FFFFFF'
  }
})

// Helper function to determine if a color is dark
const isColorDark = (color: string): boolean => {
  // Handle hex colors
  if (color.startsWith('#')) {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    // Calculate relative luminance
    // Formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
  }
  // Default to false for non-hex colors or invalid values
  return false
}

// Function to load image from file path and convert to data URL
const loadImageAsDataUrl = async (filePath: string): Promise<string | null> => {
  if (!filePath) return null

  // If it's already a data URL or a bundled resource (starts with /)
  if (filePath.startsWith('data:') || filePath.startsWith('/@fs')) {
    return filePath
  }

  try {
    // Use the Electron API to load the image from file path
    const dataUrl = await window.api.loadImageAsDataUrl(filePath)
    return dataUrl
  } catch (error) {
    console.error('Error loading image:', error, filePath)
    return null
  }
}

// Apply selected font to slides
const slideStyles = computed(() => {
  // Force the computed property to react to changes in props.config.fonts.slidesFont
  const fontName = props.config?.fonts?.slidesFont || 'TheWaveSans-Bold'

  return {
    fontFamily: fontName,
    // Apply with !important to override any other styles
    fontFamilyImportant: `${fontName} !important`
  }
})

// Computed properties for images that use the data URLs
const backgroundImageSrc = computed(() => {
  return backgroundImageDataUrl.value || defaultBg
})

const namesBackgroundImageSrc = computed(() => {
  return namesBackgroundImageDataUrl.value || defaultBg2
})

const logoSrc = computed(() => {
  // For Names card, use secondary colors to determine darkness
  if (props.card.type === CardType.Names) {
    // Check if we have a dark background color
    if (isColorDark(props.config?.colors?.secondaryBackground || '#FFFFFF')) {
      // Use inverted logo for dark backgrounds
      return logoInvertedImageDataUrl.value || logoImageDataUrl.value || defaultLogoWhite
    }
  } else {
    // For other card types, use primary colors to determine darkness
    if (isColorDark(props.config?.colors?.primaryBackground || '#061D9F')) {
      // Use inverted logo for dark backgrounds
      return logoInvertedImageDataUrl.value || logoImageDataUrl.value || defaultLogoWhite
    }
  }

  // Default to regular logo
  return logoImageDataUrl.value || defaultLogo
})

// Use watchEffect to react to changes in config
watchEffect(async () => {
  // For background image
  if (props.config?.assets?.background) {
    backgroundImageDataUrl.value = await loadImageAsDataUrl(props.config.assets.background)
  } else {
    backgroundImageDataUrl.value = null
  }

  // For names background image
  if (props.config?.assets?.backgroundNames) {
    namesBackgroundImageDataUrl.value = await loadImageAsDataUrl(
      props.config.assets.backgroundNames
    )
  } else {
    namesBackgroundImageDataUrl.value = null
  }

  // For logo
  if (props.config?.assets?.logo) {
    logoImageDataUrl.value = await loadImageAsDataUrl(props.config.assets.logo)
  } else {
    logoImageDataUrl.value = null
  }

  // For inverted logo
  if (props.config?.assets?.logoInverted) {
    logoInvertedImageDataUrl.value = await loadImageAsDataUrl(props.config.assets.logoInverted)
  } else {
    logoInvertedImageDataUrl.value = null
  }
})

// Also load images on mount to ensure they're loaded immediately
onMounted(async () => {
  // For background image
  if (props.config?.assets?.background) {
    backgroundImageDataUrl.value = await loadImageAsDataUrl(props.config.assets.background)
  } else {
    backgroundImageDataUrl.value = null
  }

  // For names background image
  if (props.config?.assets?.backgroundNames) {
    namesBackgroundImageDataUrl.value = await loadImageAsDataUrl(
      props.config.assets.backgroundNames
    )
  } else {
    namesBackgroundImageDataUrl.value = null
  }

  // For logo
  if (props.config?.assets?.logo) {
    logoImageDataUrl.value = await loadImageAsDataUrl(props.config.assets.logo)
  } else {
    logoImageDataUrl.value = null
  }

  // For inverted logo
  if (props.config?.assets?.logoInverted) {
    logoInvertedImageDataUrl.value = await loadImageAsDataUrl(props.config.assets.logoInverted)
  } else {
    logoInvertedImageDataUrl.value = null
  }
})
</script>
