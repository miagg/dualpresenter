<template>
  <div class="aspect-video bg-blue-900 text-white">
    <div v-if="card.type === CardType.Blank"></div>
    <div v-else-if="card.type === CardType.Title" class="flex items-center justify-start h-full">
      CARD
    </div>
    <div v-else-if="card.type === CardType.Names">NAMES</div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { CardType, type Card } from '../interfaces/Card'
defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true
  }
})
</script>

<style></style>
