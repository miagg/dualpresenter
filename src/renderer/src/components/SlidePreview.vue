<template>
  <div class="slide-preview" :class="{ loading: loading }">
    <!-- Hidden Card component used for generation only -->
    <div class="hidden-card" v-if="needsGeneration">
      <CardComponent
        ref="cardRef"
        :card="card"
        :names="names"
        :config="config"
        :isPreview="true"
        :generatePreview="true"
        @preview-generated="onPreviewGenerated"
      />
    </div>

    <!-- Preview image -->
    <div v-if="previewUrl" class="preview-image" :style="{ backgroundColor: getBackgroundColor() }">
      <img
        :src="previewUrl"
        :alt="`Preview of slide ${card.id}`"
        class="w-full h-full object-contain"
      />
    </div>

    <!-- Loading state or fallback -->
    <div
      v-else
      class="fallback flex items-center justify-center h-full aspect-video"
      :style="{ backgroundColor: getBackgroundColor() }"
    >
      <div v-if="loading" class="loading-spinner"></div>
      <div v-else class="text-gray-400">Preview unavailable</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, nextTick, computed } from 'vue'
import type { PropType } from 'vue'
import type { Card as CardInterface } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'
import { CardType } from '../interfaces/Card'
import CardComponent from './Card.vue'
import { generateSlideHash, slidePreviewExists } from '../utils/fileUtils'

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
  }
})

const cardRef = ref<InstanceType<typeof CardComponent> | null>(null)
const previewUrl = ref<string | null>(null)
const loading = ref(true)
const needsGeneration = ref(true)

// Function to determine background color based on card type
const getBackgroundColor = () => {
  if (props.card.type === CardType.Names || props.card.type === CardType.Unattended) {
    return props.config?.colors?.secondaryBackground || '#FFFFFF'
  } else {
    return props.config?.colors?.primaryBackground || '#061D9F'
  }
}

// Check if a preview exists and load it, or flag for generation
const checkAndLoadPreview = async () => {
  loading.value = true

  try {
    const hash = generateSlideHash(props.card, props.names, props.config)
    const exists = await slidePreviewExists(hash)

    if (exists && !props.forceRegenerate) {
      // If preview exists, load it
      const path = await window.api.getSlidePreviewPath(hash)
      previewUrl.value = await window.api.loadImageAsDataUrl(path)
      needsGeneration.value = false
    } else {
      // Need to generate
      needsGeneration.value = true

      // Wait for the next tick to ensure the card component is rendered
      await nextTick()

      // If the card ref already exists, generate immediately
      if (cardRef.value) {
        await generatePreview()
      }
    }
  } catch (error) {
    console.error('Error checking preview:', error)
    needsGeneration.value = true
  } finally {
    loading.value = false
  }
}

// Use watchEffect instead of watch to ensure immediate reaction to prop changes
watchEffect(async () => {
  if (props.card && props.config) {
    await checkAndLoadPreview()
  }
})

// Generate preview using the Card component
const generatePreview = async () => {
  if (!cardRef.value) {
    console.warn('Card reference is not available yet, cannot generate preview')
    return
  }

  try {
    // Wait for next tick to ensure component is fully rendered
    await nextTick()

    // Double check the ref is still valid
    if (!cardRef.value) {
      console.warn('Card reference was lost after nextTick, cannot generate preview')
      return
    }

    await cardRef.value.generatePreviewImage()
    needsGeneration.value = false
  } catch (error) {
    console.error('Error generating preview:', error)
  }
}

// Handler for when preview is generated
const onPreviewGenerated = async (event: { hash: string; path: string }) => {
  previewUrl.value = await window.api.loadImageAsDataUrl(event.path)
  loading.value = false
  needsGeneration.value = false
}

onMounted(async () => {
  await checkAndLoadPreview()
})
</script>

<style scoped>
.slide-preview {
  position: relative;
  aspect-ratio: 16/9;
  width: 100%;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  width: 100%;
  height: 100%;
  display: block;
}

.hidden-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  transform: scale(0.001);
  transform-origin: top left;
  opacity: 0.01;
  pointer-events: none;
  z-index: -1000;
  overflow: hidden;
}

.loading-spinner {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 3px solid #3b82f6;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
