<template>
  <div
    class="aspect-video overflow-hidden slides-content w-full h-full origin-top-left pointer-events-none"
    :style="{
      fontFamily: slideStyles.fontFamilyImportant,
      backgroundColor: backgroundColor,
      color: textColor,
      zoom: zoom
    }"
    ref="cardElement"
  >
    <!-- Blank Card -->
    <div v-if="card.type === CardType.Blank" class="flex flex-col justify-center h-full relative">
      <!-- Background image -->
      <img
        v-if="backgroundImageSrc"
        :src="backgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full"
      />

      <!-- Content container to prevent layout shift -->
      <div class="flex flex-col items-center justify-center flex-1 z-10">
        <!-- Logo based on background -->
        <img v-if="logoSrc" :src="logoSrc" alt="Logo" :style="blankCardLogoStyles" />

        <!-- Name display area (only for "Side Only" Names cards when setting is enabled) -->
        <div
          v-if="
            props.isMainScreen &&
            props.isFromSideOnlyNamesCard &&
            props.config?.audibleNames?.showNamesOnSideOnly
          "
          class="mt-16 text-center min-h-[120px] flex items-center justify-center"
        >
          <Transition name="name-dissolve" mode="out-in">
            <h2 v-if="displayName" :key="displayName" class="text-6xl font-bold text-white">
              {{ displayName }}
            </h2>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Title Card -->
    <div
      v-else-if="card.type === CardType.Title || card.type === CardType.Category"
      class="flex flex-col items-left justify-center h-full relative p-24"
    >
      <!-- Background image -->
      <img
        v-if="backgroundImageSrc"
        :src="backgroundImageSrc"
        alt="Background"
        class="absolute inset-0 object-cover w-full h-full"
      />
      <!-- Logo based on background -->
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="absolute top-16 left-24 w-72 z-10" />
      <h1
        v-if="card.title"
        class="text-7xl z-10"
        :class="{ 'font-bold': props.config.fonts.useBoldTitles }"
        v-text="card.title.replaceAll('\n', '<br />')"
      />
      <h2
        v-if="card.subtitle"
        class="text-5xl mt-4 z-10 leading-tight"
        v-html="card.subtitle.replaceAll('\n', '<br />')"
      />
    </div>

    <!-- Names Card -->
    <div v-else-if="card.type === CardType.Names" class="flex flex-col h-full p-24 relative">
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
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="absolute top-16 left-24 w-72 z-10" />
      <h1
        v-if="card.group || card.title"
        class="text-5xl text-center z-10 -mt-6 px-96"
        v-html="
          card.group ? card.group.replaceAll('\n', '<br />') : card.title.replaceAll('\n', '<br />')
        "
      />

      <div
        class="flex flex-col flex-wrap w-full h-full gap-10 text-5xl pt-30 z-10"
        :class="{
          'justify-center': filteredNames.length < linesPerColumn,
          'pb-20': filteredNames.length !== linesPerColumn + 1,
          'pb-40': filteredNames.length === linesPerColumn + 1
        }"
      >
        <div
          v-if="card.subtitle || (card.group && card.title)"
          v-html="
            card.subtitle
              ? card.subtitle.replaceAll('\n', '<br />')
              : card.title.replaceAll('\n', '<br />')
          "
          class="leading-snug pb-4"
          :class="{
            'mt-10': card.title?.split('\n')?.length > 6
          }"
        />
        <div v-for="name in filteredNames" :key="name.id">
          {{ name.name }}
        </div>
      </div>

      <!-- Spoken name overlay for "Side Only" Names cards -->
      <div
        v-if="card.display === DisplayType.SideOnly && displayName"
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20"
      >
        <Transition name="name-dissolve" mode="out-in">
          <h2 :key="displayName" class="text-8xl font-bold text-white text-center">
            {{ displayName }}
          </h2>
        </Transition>
      </div>
    </div>

    <!-- Unattended Card -->
    <div v-else-if="card.type === CardType.Unattended" class="flex flex-col h-full p-24 relative">
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
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="absolute top-16 left-24 w-72 z-10" />

      <div
        class="flex flex-col flex-wrap w-full h-full gap-10 text-5xl mt-6 pt-30 pb-20 z-10"
        :class="{
          'justify-center': unattendedNames.length < linesPerColumn,
          'pb-20': unattendedNames.length !== linesPerColumn + 1,
          'pb-40': unattendedNames.length === linesPerColumn + 1
        }"
      >
        <div v-for="name in unattendedNames" :key="name.id">
          {{ name.name }}
        </div>
      </div>
    </div>

    <!-- Image Card -->
    <div
      v-else-if="card.type === CardType.Image"
      class="flex items-center justify-center h-full relative"
    >
      <!-- Image content -->
      <img
        v-if="imageCardImageDataUrl"
        :src="imageCardImageDataUrl"
        alt="Full Screen Image"
        class="absolute inset-0 object-cover w-full h-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watchEffect } from 'vue'
import type { PropType } from 'vue'
import { CardType, DisplayType, type Card } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'
import { filterNamesForCard, filterUnattendedNames } from '../../../shared/nameFilters'

// Import default assets
import defaultBg from '../../../../resources/bg.png'
import defaultBg2 from '../../../../resources/bg2.png'
import defaultLogo from '../../../../resources/logo.png'
import defaultLogoWhite from '../../../../resources/logo_white.png'

// Reference to the card DOM element
const cardElement = ref<HTMLElement | null>(null)
const linesPerColumn = 8

// Reactive refs to store loaded image data URLs
const backgroundImageDataUrl = ref<string | null>(null)
const namesBackgroundImageDataUrl = ref<string | null>(null)
const logoImageDataUrl = ref<string | null>(null)
const logoInvertedImageDataUrl = ref<string | null>(null)
const imageCardImageDataUrl = ref<string | null>(null)

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
  zoom: {
    type: Number,
    default: 1
  },
  audioStatus: {
    type: Object,
    default: () => ({
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      totalNames: 0,
      currentName: null
    })
  },
  lastSpokenName: {
    type: String,
    default: null
  },
  isMainScreen: {
    type: Boolean,
    default: false
  },
  isFromSideOnlyNamesCard: {
    type: Boolean,
    default: false
  }
})

// Filter names based on the card group, from, and until properties
const filteredNames = computed(() => {
  return filterNamesForCard(props.names, props.card)
})

// Compute the name to display on blank cards (main screen only)
const displayName = computed(() => {
  // Only show names on main screen AND only for "Side Only" Names cards converted to blank
  // AND only when the setting is enabled
  if (
    !props.isMainScreen ||
    !props.isFromSideOnlyNamesCard ||
    !props.config?.audibleNames?.showNamesOnSideOnly
  ) {
    return null
  }

  // Only show names when there's an active audio session (totalNames > 0)
  // This prevents names from showing when navigating back to slides with no active audio
  if (props.audioStatus.totalNames === 0) {
    return null
  }

  // If audio is currently playing, show the current name
  if (props.audioStatus.isPlaying && props.audioStatus.currentName) {
    return props.audioStatus.currentName
  }

  // If audio is paused and we have a last spoken name, keep showing it
  if (props.audioStatus.isPaused && props.lastSpokenName) {
    return props.lastSpokenName
  }

  // If audio has stopped but we have a last spoken name and there was an active session, keep showing it
  // This covers the case when the last name finishes and audio stops completely
  if (props.lastSpokenName) {
    return props.lastSpokenName
  }

  return null
})

// Unattended names
const unattendedNames = computed(() => {
  return filterUnattendedNames(props.names)
})

// Determine background color based on card type
const backgroundColor = computed(() => {
  if (props.card.type === CardType.Names || props.card.type === CardType.Unattended) {
    return props.config?.colors?.secondaryBackground || '#FFFFFF'
  } else {
    return props.config?.colors?.primaryBackground || '#061D9F'
  }
})

// Determine text color based on card type
const textColor = computed(() => {
  if (props.card.type === CardType.Names || props.card.type === CardType.Unattended) {
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

// Function to load image card image from file path relative to Excel file
const loadImageCardImage = async (): Promise<void> => {
  if (props.card.type === CardType.Image && props.card.title) {
    try {
      // Load the image using the Electron API
      imageCardImageDataUrl.value = await loadImageAsDataUrl(props.card.title)
    } catch (error) {
      console.error('Error loading image card:', error, props.card.title)
      imageCardImageDataUrl.value = null
    }
  } else {
    imageCardImageDataUrl.value = null
  }
}

// Apply selected font to slides
const slideStyles = computed(() => {
  // Force the computed property to react to changes in props.config.fonts.slidesFont
  const fontName = props.config?.fonts?.slidesFont || 'TheWaveSans'

  return {
    fontFamily: fontName,
    // Apply with !important to override any other styles
    fontFamilyImportant: `${fontName} !important`
  }
})

// Computed properties for logo styling on blank cards
const blankCardLogoStyles = computed(() => {
  const maxSize = props.config?.assets?.maxLogoSize ?? 60
  const verticalOffset = props.config?.assets?.logoVerticalPosition ?? 0

  return {
    maxHeight: `${maxSize}%`,
    maxWidth: `${maxSize}%`,
    marginTop: `${verticalOffset}px`
  }
})

// Computed properties for images that use the data URLs
const backgroundImageSrc = computed(() => {
  const defaultAssets = props.config?.assets?.useDefaultAssets
  if (backgroundImageDataUrl.value) {
    return backgroundImageDataUrl.value
  } else if (defaultAssets) {
    return defaultBg
  }
  return null
})

const namesBackgroundImageSrc = computed(() => {
  const defaultAssets = props.config?.assets?.useDefaultAssets
  if (namesBackgroundImageDataUrl.value) {
    return namesBackgroundImageDataUrl.value
  } else if (defaultAssets) {
    return defaultBg2
  }
  return null
})

const logoSrc = computed(() => {
  // Determine which logo to use based on background color
  const isDark =
    props.card.type === CardType.Names || props.card.type === CardType.Unattended
      ? isColorDark(props.config?.colors?.secondaryBackground || '#FFFFFF')
      : isColorDark(props.config?.colors?.primaryBackground || '#061D9F')

  // First try to use custom logos if they exist
  if (isDark && logoInvertedImageDataUrl.value) {
    return logoInvertedImageDataUrl.value
  } else if (logoImageDataUrl.value) {
    return logoImageDataUrl.value
  }

  // Fall back to default logos only if useDefaultAssets is enabled
  if (props.config?.assets?.useDefaultAssets) {
    return isDark ? defaultLogoWhite : defaultLogo
  }

  // Return null if no logo should be used
  return null
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

// Watch for changes in card type and title for Image cards
watchEffect(() => {
  if (props.card.type === CardType.Image) {
    loadImageCardImage()
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

<style scoped>
/* Dissolve animation for name changes */
.name-dissolve-enter-active,
.name-dissolve-leave-active {
  transition: opacity 0.25s ease-in-out;
}

.name-dissolve-enter-from,
.name-dissolve-leave-to {
  opacity: 0;
}

.name-dissolve-enter-to,
.name-dissolve-leave-from {
  opacity: 1;
}
</style>
