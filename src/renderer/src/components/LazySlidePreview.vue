<template>
  <div ref="containerRef" class="lazy-slide-preview">
    <template v-if="isVisible">
      <SlidePreview
        :card="card"
        :names="names"
        :config="config"
        :forceRegenerate="forceRegenerate"
        v-bind="$attrs"
      />
    </template>
    <div v-else class="placeholder" :style="{ backgroundColor: getBackgroundColor() }">
      <div class="loading-placeholder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, type PropType, nextTick } from 'vue'
import SlidePreview from './SlidePreview.vue'
import type { Card as CardInterface } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'
import { CardType } from '../interfaces/Card'

const props = defineProps({
  card: {
    type: Object as PropType<CardInterface>,
    required: true
  },
  names: {
    type: Array as PropType<Name[]>,
    default: () => []
  },
  config: {
    type: Object as PropType<Config>,
    required: true
  },
  forceRegenerate: {
    type: Boolean,
    default: false
  },
  rootMargin: {
    type: String,
    default: '400px 0px 400px 0px'
  }
})

const isVisible = ref(false)
const containerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Function to determine background color based on card type
const getBackgroundColor = () => {
  if (props.card.type === CardType.Names || props.card.type === CardType.Unattended) {
    return props.config?.colors?.secondaryBackground || '#FFFFFF'
  } else {
    return props.config?.colors?.primaryBackground || '#061D9F'
  }
}

// Check if element is in viewport or close to it
const checkVisibility = () => {
  if (!containerRef.value) return false

  const rect = containerRef.value.getBoundingClientRect()
  const margin = 400 // Same as rootMargin in pixels

  // Consider the element "visible" if:
  // 1. It's partially in the viewport OR
  // 2. It's within the margin area above or below the viewport
  const isInViewportOrMargin =
    // Element is partially in viewport
    (rect.top < window.innerHeight && rect.bottom > 0) ||
    // Element is within margin above viewport
    (rect.bottom < 0 && rect.bottom > -margin) ||
    // Element is within margin below viewport
    (rect.top > window.innerHeight && rect.top < window.innerHeight + margin)

  return isInViewportOrMargin
}

// Set up polling for checking visibility (as a fallback to make sure we catch all slides)
let visibilityTimer: number | null = null
const setupVisibilityPolling = () => {
  // Clear any existing timer
  if (visibilityTimer !== null) {
    window.clearInterval(visibilityTimer)
  }

  // Only set up polling if the slide isn't already visible
  if (!isVisible.value) {
    visibilityTimer = window.setInterval(() => {
      if (checkVisibility()) {
        isVisible.value = true
        // Stop polling once visible
        if (visibilityTimer !== null) {
          window.clearInterval(visibilityTimer)
          visibilityTimer = null
        }
      }
    }, 500) // Check every 500ms
  }
}

// Watch for changes in the card prop to reset visibility if the card changes
watch(
  () => props.card.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      if (!isVisible.value) {
        // If the card changed and not visible, re-check visibility
        nextTick(() => {
          if (checkVisibility()) {
            isVisible.value = true
          } else if (containerRef.value && observer) {
            // Re-observe with Intersection Observer
            observer.observe(containerRef.value)
            // Also set up polling as backup
            setupVisibilityPolling()
          }
        })
      }
    }
  }
)

onMounted(() => {
  // Immediately check if the element is in or near viewport using getBoundingClientRect
  nextTick(() => {
    if (checkVisibility()) {
      isVisible.value = true
      return // No need to observe if already visible
    }
  })

  // Create the intersection observer as backup
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isVisible.value = true
          // Once visible, no need to observe anymore
          if (observer && containerRef.value) {
            observer.unobserve(containerRef.value)
          }

          // Also clear any polling timer
          if (visibilityTimer !== null) {
            window.clearInterval(visibilityTimer)
            visibilityTimer = null
          }
        }
      }
    },
    {
      root: null,
      rootMargin: props.rootMargin,
      threshold: 0
    }
  )

  // Start observing the container if not already visible
  if (containerRef.value && !isVisible.value) {
    observer.observe(containerRef.value)
    // Also set up polling as backup
    setupVisibilityPolling()
  }

  // Set up scroll event listener to catch any missed slides
  window.addEventListener('scroll', handleScroll, { passive: true })
})

const handleScroll = () => {
  if (!isVisible.value && checkVisibility()) {
    isVisible.value = true

    // Clean up once visible
    if (observer && containerRef.value) {
      observer.unobserve(containerRef.value)
    }

    if (visibilityTimer !== null) {
      window.clearInterval(visibilityTimer)
      visibilityTimer = null
    }
  }
}

onBeforeUnmount(() => {
  // Clean up all observers and timers
  if (observer && containerRef.value) {
    observer.unobserve(containerRef.value)
    observer.disconnect()
  }

  if (visibilityTimer !== null) {
    window.clearInterval(visibilityTimer)
    visibilityTimer = null
  }

  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.lazy-slide-preview {
  position: relative;
  aspect-ratio: 16/9;
  width: 100%;
  height: 100%;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333;
}

.loading-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.2) 100%);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.3;
  }
}
</style>
