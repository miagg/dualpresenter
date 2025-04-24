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
        class="absolute inset-0 object-cover w-full h-full -z-10"
      />
      <!-- Logo based on background -->
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="max-h-1/4 max-w-1/2" />
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
        class="absolute inset-0 object-cover w-full h-full -z-10"
      />
      <!-- Logo based on background -->
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="absolute top-4 left-4 max-h-16" />
      <h1 v-if="card.title" class="text-5xl font-bold text-center mb-4">{{ card.title }}</h1>
      <h2 v-if="card.subtitle" class="text-3xl font-light text-center">{{ card.subtitle }}</h2>
    </div>

    <!-- Names Card -->
    <div v-else-if="card.type === CardType.Names" class="flex flex-col h-full p-8 relative">
      <!-- Background image - prioritize names-specific background if available -->
      <img
        v-if="namesBackgroundImageSrc"
        :src="namesBackgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full -z-10"
      />
      <img
        v-else-if="backgroundImageSrc"
        :src="backgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full -z-10"
      />
      <!-- Logo based on background -->
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="absolute top-4 left-4 max-h-16" />

      <h1 v-if="card.title" class="text-4xl font-bold mb-2">{{ card.title }}</h1>
      <h2 v-if="card.subtitle" class="text-2xl font-light mb-6">{{ card.subtitle }}</h2>

      <div class="flex-grow overflow-auto">
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
import { computed } from 'vue'
import type { PropType } from 'vue'
import { CardType, type Card } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'

// Import default assets
import defaultBg from '../../../../resources/bg.png'
import defaultBg2 from '../../../../resources/bg2.png'
import defaultLogo from '../../../../resources/logo.png'
import defaultLogoWhite from '../../../../resources/logo_white.png'

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

// Determine background image source - returns a URL or asset path
const backgroundImageSrc = computed(() => {
  if (props.config?.assets?.background) {
    console.log('Background image:', props.config.assets.background)
    return props.config.assets.background
  }
  return defaultBg
})

// Specific background for Names cards - returns a URL or asset path
const namesBackgroundImageSrc = computed(() => {
  if (props.config?.assets?.backgroundNames) {
    return props.config.assets.backgroundNames
  }
  return defaultBg2
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

// Determine which logo to use based on background darkness
const logoSrc = computed(() => {
  // For Names card, use secondary colors to determine darkness
  if (props.card.type === CardType.Names) {
    // Check if we have a dark background color or image
    if (
      props.config?.assets?.backgroundNames ||
      props.config?.assets?.background ||
      isColorDark(props.config?.colors?.secondaryBackground || '#FFFFFF')
    ) {
      // Use inverted logo for dark backgrounds
      return props.config?.assets?.logoInverted || props.config?.assets?.logo || defaultLogoWhite
    }
  } else {
    // For other card types, use primary colors to determine darkness
    if (
      props.config?.assets?.background ||
      isColorDark(props.config?.colors?.primaryBackground || '#061D9F')
    ) {
      // Use inverted logo for dark backgrounds
      return props.config?.assets?.logoInverted || props.config?.assets?.logo || defaultLogoWhite
    }
  }

  // Default to regular logo
  return props.config?.assets?.logo || defaultLogo
})

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
</script>

<style scoped>
.max-h-1\/4 {
  max-height: 25%;
}
.max-w-1\/2 {
  max-width: 50%;
}
.-z-10 {
  z-index: -10;
}
</style>
