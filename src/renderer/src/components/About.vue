<template>
  <div class="about-panel ui-root select-none">
    <div class="about-hero">
      <img :src="appIcon" alt="DualPresenter" class="app-icon" draggable="false" />
      <h1 class="app-name">DualPresenter</h1>
      <p class="app-version">Version {{ version }}</p>
      <p class="app-tagline">
        Dual-screen presentation for ceremonies and events: slides on the main screen, names on the
        side.
      </p>
    </div>

    <div class="developer-card">
      <div class="developer-avatar">AM</div>
      <div class="min-w-0">
        <div class="developer-label">Developed by</div>
        <div class="developer-name">Angelos S. Michalopoulos</div>
        <div class="developer-company">Apptime</div>
      </div>
    </div>

    <div class="about-footer">
      <p>© {{ year }} Apptime. All rights reserved.</p>
      <button class="ui-btn ui-btn-primary about-close" @click="closeWindow">OK</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import appIcon from '../../../../build/icon.png'

// The app version is passed by the main process in the window URL
const version = new URLSearchParams(window.location.hash.split('?')[1] || '').get('version') || ''
const year = new Date().getFullYear()

const closeWindow = (): void => {
  window.close()
}

// Close on Escape or Enter, like a native About panel
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape' || e.key === 'Enter') {
    closeWindow()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.about-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 2.25rem 1.5rem 1.25rem;
  overflow: hidden;
  background:
    radial-gradient(120% 60% at 50% 0%, rgba(10, 132, 255, 0.16), transparent 70%), var(--ui-bg);
  /* Lets the window be dragged by its background (the title bar is hidden on macOS) */
  -webkit-app-region: drag;
}

.about-panel button {
  -webkit-app-region: no-drag;
}

.about-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.app-icon {
  width: 96px;
  height: 96px;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5));
}

.app-name {
  margin-top: 0.875rem;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.app-version {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ui-text-2);
  font-variant-numeric: tabular-nums;
}

.app-tagline {
  margin-top: 0.75rem;
  max-width: 270px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ui-text-2);
}

.developer-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 0.75rem 0.875rem;
  border-radius: 12px;
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.developer-avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(180deg, #3d9bff, #0a64d6);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3);
}

.developer-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-3);
}

.developer-name {
  margin-top: 1px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text);
}

.developer-company {
  font-size: 12px;
  color: var(--ui-text-2);
}

.about-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  font-size: 11px;
  color: var(--ui-text-3);
}

.about-close {
  min-width: 96px;
}
</style>
