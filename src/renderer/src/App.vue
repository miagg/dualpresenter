<template>
  <div class="app-container ui-root select-none">
    <!-- Toolbar -->
    <header class="toolbar">
      <div class="flex items-center gap-3 min-w-0">
        <span class="toolbar-title">DualPresenter</span>
        <span class="toolbar-clock">{{ currentTime }}</span>
      </div>

      <div class="flex items-center gap-1.5">
        <button @click="openExcel" class="ui-btn" title="Open an Excel file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path
              stroke-linejoin="round"
              d="M17 8V7C17 6.44772 16.5523 6 16 6H10.4142C10.149 6 9.89464 5.89464 9.70711 5.70711L8.29289 4.29289C8.10536 4.10536 7.851 4 7.58579 4H4C3.44772 4 3 4.44772 3 5V17C3 18.1046 3.89543 19 5 19H19C19.5523 19 20 18.5523 20 18V11C20 10.4477 19.5523 10 19 10H8C7.44772 10 7 10.4477 7 11V17C7 18.1046 6.10457 19 5 19V19"
            />
          </svg>
          Open File
        </button>

        <button
          @click="reloadData"
          class="ui-btn"
          :disabled="!state.isExcelLoaded"
          title="Reload data from the Excel file"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4" />
          </svg>
          Reload
        </button>

        <div class="toolbar-divider"></div>

        <button
          @click="toggleFreeze"
          class="ui-btn"
          :class="{ 'is-alert': state.freezeMonitors }"
          :disabled="!state.isExcelLoaded"
          :title="state.freezeMonitors ? 'Resume live output' : 'Hold the current output'"
        >
          <span v-if="state.freezeMonitors" class="live-dot animate-pulse"></span>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          {{ state.freezeMonitors ? 'Unfreeze Output' : 'Freeze Output' }}
        </button>

        <div class="toolbar-divider"></div>

        <button @click="openSettings" class="ui-btn" title="Settings">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clip-rule="evenodd"
            />
          </svg>
          Settings
        </button>

        <button
          @click="openExcelStructureWindow"
          class="help-btn"
          title="Excel File Structure – how to set up your Excel file"
        >
          ?
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="main-content flex-grow flex">
      <!-- Left Sidebar - Screen previews and output controls -->
      <aside
        class="sidebar-left shrink-0 flex flex-col relative"
        :class="{ 'transition-all duration-200': !isResizing }"
        :style="{ width: sidebarWidth + 'px' }"
      >
        <div class="sidebar-content overflow-y-auto h-full px-4 pt-4 pb-6">
          <!-- Main Screen -->
          <section class="mb-6">
            <div class="panel-head">
              <h2 class="panel-title">
                <span class="screen-dot screen-dot-main"></span>
                Main Screen
              </h2>
              <select
                v-model="mainScreen"
                @change="focusSlidesList"
                class="ui-select min-w-[110px]"
                title="Display used for the main screen"
              >
                <option :value="null">None</option>
                <option
                  v-for="monitor in monitors.filter(
                    (m) => !m.isPrimary && m.id.toString() !== sideScreen
                  )"
                  :key="monitor.id"
                  :value="monitor.id.toString()"
                >
                  {{ monitor.label || `Display ${monitor.id}` }}
                </option>
              </select>
            </div>
            <div
              class="card-preview preview-frame relative"
              :class="{ 'is-warning': isLastNameSpeaking }"
              ref="mainPreview"
            >
              <Card
                v-if="mainScreenCard"
                ref="mainCardRef"
                :zoom="Math.ceil(($refs.mainPreview.clientWidth / 1920) * 1000) / 1000"
                :card="mainScreenCard"
                :names="names"
                :config="config"
                :all-cards="cards"
                :audio-status="audioStatus"
                :last-spoken-name="previewSpokenName"
                :is-main-screen="true"
                :is-from-side-only-names-card="isMainScreenFromSideOnlyNamesCard"
                :current-names-page="currentMainNamesPage"
                :current-unattended-page="currentMainUnattendedPage"
              />
              <div v-else class="empty-preview aspect-video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path stroke-linecap="round" d="M8 21h8M12 17v4" />
                </svg>
                No slide available
              </div>

              <!-- Warns that playback is about to finish, so play is not hit again by mistake -->
              <div v-if="isLastNameSpeaking" class="last-name-badge">ONE LAST NAME</div>
            </div>

            <!-- Pagination controls for Main Screen Names -->
            <div
              v-if="mainCardRef?.totalNamesPages > 1 && mainScreenCard?.type === CardType.Names"
              class="pager"
            >
              <button
                @click="prevMainNamesPage"
                :disabled="currentMainNamesPage === 0"
                class="pager-btn"
                title="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span class="pager-label">
                Page {{ currentMainNamesPage + 1 }} of {{ mainCardRef.totalNamesPages }}
              </span>
              <button
                @click="nextMainNamesPage"
                :disabled="currentMainNamesPage === mainCardRef.totalNamesPages - 1"
                class="pager-btn"
                title="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <!-- Pagination controls for Main Screen Unattended -->
            <div
              v-if="
                mainCardRef?.totalUnattendedPages > 1 &&
                mainScreenCard?.type === CardType.Unattended
              "
              class="pager"
            >
              <button
                @click="prevMainUnattendedPage"
                :disabled="currentMainUnattendedPage === 0"
                class="pager-btn"
                title="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span class="pager-label">
                Page {{ currentMainUnattendedPage + 1 }} of {{ mainCardRef.totalUnattendedPages }}
              </span>
              <button
                @click="nextMainUnattendedPage"
                :disabled="currentMainUnattendedPage === mainCardRef.totalUnattendedPages - 1"
                class="pager-btn"
                title="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>

          <!-- Side Screen -->
          <section class="mb-6">
            <div class="panel-head">
              <h2 class="panel-title">
                <span class="screen-dot screen-dot-side"></span>
                Side Screen
              </h2>
              <select
                v-model="sideScreen"
                @change="focusSlidesList"
                class="ui-select min-w-[110px]"
                title="Display used for the side screen"
              >
                <option :value="null">None</option>
                <option
                  v-for="monitor in monitors.filter(
                    (m) => !m.isPrimary && m.id.toString() !== mainScreen
                  )"
                  :key="monitor.id"
                  :value="monitor.id.toString()"
                >
                  {{ monitor.label || `Display ${monitor.id}` }}
                </option>
              </select>
            </div>
            <div class="card-preview preview-frame" ref="sidePreview">
              <Card
                v-if="cards.length > 0 && state.currentSlideIndex < cards.length"
                ref="sideCardRef"
                :zoom="Math.ceil(($refs.sidePreview.clientWidth / 1920) * 1000) / 1000"
                :card="sideScreenCard"
                :names="names"
                :config="config"
                :all-cards="cards"
                :audio-status="audioStatus"
                :last-spoken-name="lastSpokenName"
                :is-main-screen="false"
                :is-from-side-only-names-card="false"
                :current-names-page="currentSideNamesPage"
                :current-unattended-page="currentSideUnattendedPage"
              />
              <div v-else class="empty-preview aspect-video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path stroke-linecap="round" d="M8 21h8M12 17v4" />
                </svg>
                No slide available
              </div>
            </div>

            <!-- Pagination controls for Side Screen Names -->
            <div
              v-if="sideCardRef?.totalNamesPages > 1 && sideScreenCard?.type === CardType.Names"
              class="pager"
            >
              <button
                @click="prevSideNamesPage"
                :disabled="currentSideNamesPage === 0"
                class="pager-btn"
                title="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span class="pager-label">
                Page {{ currentSideNamesPage + 1 }} of {{ sideCardRef.totalNamesPages }}
              </span>
              <button
                @click="nextSideNamesPage"
                :disabled="currentSideNamesPage === sideCardRef.totalNamesPages - 1"
                class="pager-btn"
                title="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <!-- Pagination controls for Side Screen Unattended -->
            <div
              v-if="
                sideCardRef?.totalUnattendedPages > 1 &&
                sideScreenCard?.type === CardType.Unattended
              "
              class="pager"
            >
              <button
                @click="prevSideUnattendedPage"
                :disabled="currentSideUnattendedPage === 0"
                class="pager-btn"
                title="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span class="pager-label">
                Page {{ currentSideUnattendedPage + 1 }} of {{ sideCardRef.totalUnattendedPages }}
              </span>
              <button
                @click="nextSideUnattendedPage"
                :disabled="currentSideUnattendedPage === sideCardRef.totalUnattendedPages - 1"
                class="pager-btn"
                title="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>

          <!-- Output controls -->
          <section class="display-selection">
            <div class="panel-head">
              <h2 class="panel-title">Output</h2>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="blackOutScreens"
                class="tile"
                :class="{ 'is-alert': state.blackOutScreens }"
                title="Black out all screens"
                :disabled="!state.isExcelLoaded"
              >
                <span class="tile-icon" :class="{ 'animate-pulse': state.blackOutScreens }">
                  <svg
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                    />
                  </svg>
                </span>
                <span class="tile-text">
                  <span class="tile-label">Blackout</span>
                  <span class="tile-sub">{{ state.blackOutScreens ? 'On' : 'Off' }}</span>
                </span>
              </button>

              <button @click="flipScreens" class="tile" title="Flip main screen with side screen">
                <span class="tile-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
                    />
                  </svg>
                </span>
                <span class="tile-text">
                  <span class="tile-label">Flip Screens</span>
                  <span class="tile-sub">Swap main & side</span>
                </span>
              </button>
            </div>

            <!-- Audible names -->
            <div v-if="config.audibleNames.enabled" class="audio-card mt-2">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <svg
                    class="w-4 h-4 shrink-0 text-[var(--ui-text-2)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="text-[13px] font-semibold">Audible Names</span>
                </div>

                <!-- Auto / manual playback -->
                <div
                  class="segmented"
                  :title="
                    config.audibleNames.autoPlayback
                      ? 'Disable auto playback (manual mode)'
                      : 'Enable auto playback'
                  "
                >
                  <button
                    :class="{ 'is-active': config.audibleNames.autoPlayback }"
                    @click="!config.audibleNames.autoPlayback && toggleAutoPlayback()"
                  >
                    Auto
                  </button>
                  <button
                    :class="{ 'is-active': !config.audibleNames.autoPlayback }"
                    @click="config.audibleNames.autoPlayback && toggleAutoPlayback()"
                  >
                    Manual
                  </button>
                </div>
              </div>

              <!-- Status showing current position and total -->
              <div class="audio-status">
                <div
                  v-if="audioStatus.isPlaying || audioStatus.isPaused"
                  class="flex items-center gap-2 min-w-0"
                >
                  <span
                    v-if="audioStatus.currentIndex < audioStatus.totalNames"
                    class="tabular-nums text-[var(--ui-text-2)] shrink-0"
                  >
                    {{ audioStatus.currentIndex + 1 }}/{{ audioStatus.totalNames }}
                  </span>
                  <span v-else class="text-[var(--ui-text-2)]"> Not playing </span>
                  <span
                    v-if="
                      audioStatus.queuedName && audioStatus.currentIndex < audioStatus.totalNames
                    "
                    class="truncate text-[var(--ui-text)]"
                  >
                    {{ audioStatus.queuedName }}
                  </span>
                  <span
                    v-if="audioStatus.isPaused && audioStatus.currentIndex < audioStatus.totalNames"
                    class="paused-pill"
                    >Paused</span
                  >
                </div>
                <span v-else class="text-[var(--ui-text-3)]">Not playing</span>
              </div>

              <!-- Playback progress (only filled while playing) -->
              <div class="audio-progress">
                <div
                  class="audio-progress-fill"
                  :class="{
                    'transition-all duration-[3s] ease-out':
                      audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames
                  }"
                  :style="{
                    width: `${audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames ? Math.ceil(((audioStatus.currentIndex + 1) / audioStatus.totalNames) * 100) : 0}%`
                  }"
                ></div>
              </div>

              <div class="flex items-center justify-center gap-2">
                <!-- Navigation buttons - only show when continuous playback is disabled and audio is active -->
                <button
                  v-if="
                    !config.audibleNames.continuousPlayback &&
                    (audioStatus.isPlaying || audioStatus.isPaused) &&
                    audioStatus.totalNames > 1
                  "
                  @click="goToPreviousName"
                  :disabled="audioStatus.currentIndex <= 0"
                  class="ui-btn ui-btn-icon"
                  title="Previous name"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 6h2v12H7zM20 6v12l-9-6z" />
                  </svg>
                </button>

                <button
                  :disabled="
                    !currentNamesSlide &&
                    (cards.length === 0 ||
                      state.currentSlideIndex >= cards.length ||
                      cards[state.currentSlideIndex].type !== CardType.Unattended)
                  "
                  class="ui-btn ui-btn-primary flex-1 max-w-48"
                  :title="
                    audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames
                      ? audioStatus.isPaused && !config.audibleNames.continuousPlayback
                        ? 'Resume audible names playback'
                        : config.audibleNames.continuousPlayback
                          ? 'Stop audible names playback'
                          : 'Pause audible names playback'
                      : 'Play audible names for current slide'
                  "
                  @click="toggleAudibleNames"
                >
                  <svg
                    v-if="
                      !(audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames)
                    "
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"
                    />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  <span>{{
                    audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames
                      ? audioStatus.isPaused && !config.audibleNames.continuousPlayback
                        ? 'Resume'
                        : config.audibleNames.continuousPlayback
                          ? 'Stop'
                          : 'Pause'
                      : 'Play'
                  }}</span>
                </button>

                <button
                  v-if="
                    !config.audibleNames.continuousPlayback &&
                    (audioStatus.isPlaying || audioStatus.isPaused) &&
                    audioStatus.totalNames > 1
                  "
                  @click="goToNextName"
                  :disabled="audioStatus.currentIndex >= audioStatus.totalNames - 1"
                  class="ui-btn ui-btn-icon"
                  title="Next name"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 6h2v12h-2zM4 6v12l9-6z" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Resize handle -->
        <div class="resize-handle" @mousedown="startResize">
          <div class="resize-grip"></div>
        </div>
      </aside>

      <!-- Main Content - Slide List -->
      <main class="content-main flex-grow flex flex-col overflow-hidden">
        <div class="list-header">
          <div class="flex items-center gap-3">
            <h2 class="list-title">All Slides</h2>

            <!-- Slide counter and navigation arrows -->
            <div class="stepper">
              <button
                @click="prevSlide"
                :disabled="state.currentSlideIndex <= 0"
                title="Previous slide"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span class="stepper-label"
                >{{ cards.length ? state.currentSlideIndex + 1 : 0 }} / {{ cards.length }}</span
              >
              <button
                @click="nextSlide"
                :disabled="state.currentSlideIndex >= cards.length - 1"
                title="Next slide"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative" ref="searchContainerRef">
            <div class="relative">
              <svg
                class="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4.2-4.2" />
              </svg>
              <input
                type="text"
                v-model="searchQuery"
                class="ui-input search-input w-64 xl:w-96"
                placeholder="Search slides and names"
                @focus="showSearchResults = true"
                @keydown.down.prevent="navigateSearchResults('down')"
                @keydown.up.prevent="navigateSearchResults('up')"
                @keydown.enter.prevent="selectSearchResult(selectedSearchIndex)"
                @keydown.escape="closeSearchAndClear()"
                ref="searchInputRef"
              />
              <kbd class="search-hint">{{ isMac ? '⌘F' : 'Ctrl+F' }}</kbd>
            </div>

            <!-- Search Results Popup -->
            <div
              v-if="showSearchResults && filteredSearchResults.length > 0"
              class="search-popover ui-scroll"
            >
              <div
                v-for="(result, index) in filteredSearchResults"
                :key="result.id"
                class="search-item"
                :class="{ 'is-selected': index === selectedSearchIndex }"
                @click="selectSearchResult(index)"
                @mouseover="selectedSearchIndex = index"
              >
                <div class="search-index">
                  {{ result.index + 1 }}
                </div>
                <div class="flex-grow min-w-0">
                  <div class="search-type">{{ result.type }}</div>
                  <div class="search-title" v-if="result.title">
                    {{ result.title }}
                  </div>
                  <!-- Display matched names if any -->
                  <div
                    class="search-names"
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
          class="slides-list ui-scroll flex-grow overflow-y-auto space-y-2 px-4 pb-4 pt-1 focus:outline-0 focus:ring-0"
          ref="slidesListRef"
          tabindex="0"
        >
          <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="slide-item"
            :class="{
              'is-current': index === state.currentSlideIndex,
              'is-frozen': state.freezeMonitors && index === state.frozenSlideIndex
            }"
            @click="goToSlide(index)"
          >
            <div
              v-if="
                getSideScreen(index) ||
                (card.type === CardType.Names && card.display !== DisplayType.MainOnly)
              "
              class="slide-connection"
              :class="{
                'is-dimmed':
                  card.type === CardType.Names &&
                  (card.display === DisplayType.MainOnly ||
                    card.display === DisplayType.Auto ||
                    card.display === DisplayType.SideOnly) &&
                  (card.precedence !== null ? card.precedence : config.namesPrecedence) > 0
              }"
            ></div>

            <div
              class="slide-thumbnail w-40 mr-4 relative"
              @mouseenter="handleMouseEnter(index)"
              @mouseleave="handleMouseLeave()"
            >
              <div class="thumbnail-frame">
                <Card
                  :zoom="0.0834"
                  :card="card"
                  :names="names"
                  :config="config"
                  :all-cards="cards"
                  :class="{
                    'opacity-50': index < state.currentSlideIndex
                  }"
                />
              </div>

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
                  @mouseleave="handleMouseLeave()"
                >
                  <div class="large-thumbnail-frame">
                    <div class="w-[455px] xl:w-[640px]">
                      <Card
                        :zoom="$el.clientWidth >= 1280 ? 0.33333333 : 0.237"
                        :card="card"
                        :names="names"
                        :config="config"
                        :all-cards="cards"
                      />
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <div
              class="slide-info flex-grow min-w-0"
              :class="{
                'opacity-50': index < state.currentSlideIndex
              }"
            >
              <div class="slide-title">
                {{ card.type }}
              </div>
              <div class="slide-subtitle" style="overflow-wrap: anywhere" v-if="card.title">
                {{
                  card.type === CardType.Image
                    ? card.title.substring(
                        Math.max(card.title.lastIndexOf('/'), card.title.lastIndexOf('\\')) + 1
                      )
                    : card.title
                }}
              </div>
              <div class="slide-meta" v-if="card.subtitle || card.group">
                <span v-if="card.subtitle">{{ card.subtitle }}</span>
                <span v-if="card.subtitle && card.group" class="mx-1.5 opacity-50">·</span>
                <span v-if="card.group">Group: {{ card.group }}</span>
              </div>
            </div>

            <!-- Slide number on right side -->
            <div
              class="slide-number"
              :class="{
                'opacity-50': index < state.currentSlideIndex
              }"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Navigation Buttons -->
    <footer class="navigation-buttons">
      <button class="ui-btn nav-btn" @click="prevSlide" :disabled="state.currentSlideIndex <= 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        Previous
      </button>

      <div class="slide-counter">
        Slide
        <span class="text-[var(--ui-text)] font-semibold tabular-nums">{{
          cards.length ? state.currentSlideIndex + 1 : 0
        }}</span>
        of
        <span class="tabular-nums">{{ cards.length }}</span>
      </div>

      <button
        class="ui-btn ui-btn-primary nav-btn"
        @click="nextSlide"
        :disabled="state.currentSlideIndex >= cards.length - 1"
      >
        Next
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </footer>

    <!-- Excel Structure Modal -->
    <ExcelStructure v-if="showExcelStructure" @close="showExcelStructure = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import ExcelStructure from './components/ExcelStructure.vue'
import type { Card as CardInterface } from './interfaces/Card'
import type { Name } from './interfaces/Name'
import type { Config } from './interfaces/Config'
import { CardType, DisplayType } from './interfaces/Card'
import { normalizeForSearch } from './utils/textUtils'
import { filterNamesForCard, filterUnattendedNames } from '../../shared/nameFilters'
import Card from './components/Card.vue'

// Global state
const cards = ref<CardInterface[]>([])
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
    logoInverted: '',
    useDefaultAssets: true,
    maxLogoSize: 60,
    logoVerticalPosition: 0
  },
  fonts: {
    slidesFont: 'TheWaveSans',
    useBoldTitles: false
  },
  audibleNames: {
    enabled: false,
    delayBeforePlayback: 1000,
    gapBetweenNames: 500,
    autoPlayback: true,
    continuousPlayback: true,
    showNamesOnSideOnly: false
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
// Screen selections as the main process last reported them. Sending one of these straight
// back would trigger another data-updated, and the two sides can then bounce off each other.
let appliedMainScreen: string | null = null
let appliedSideScreen: string | null = null
const initialLoadComplete = ref(false) // Flag to track initial load
const showExcelStructure = ref(false) // Controls visibility of Excel structure modal
const audioPlaybackTimeout = ref<NodeJS.Timeout | null>(null)

// Sidebar resize functionality
const sidebarWidth = ref(parseInt(localStorage.getItem('sidebarWidth') || '400')) // Default width with persistence
const isResizing = ref(false)

// Audio status for audible names
const audioStatus = ref({
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  totalNames: 0,
  currentName: null as string | null,
  queuedName: null as string | null,
  lastSpokenName: null as string | null
})
const lastSpokenName = ref<string | null>(null)
const previewSpokenName = ref<string | null>(null)

// Pagination state for names cards
const currentMainNamesPage = ref(0)
const currentMainUnattendedPage = ref(0)
const currentSideNamesPage = ref(0)
const currentSideUnattendedPage = ref(0)
const mainCardRef = ref(null)
const sideCardRef = ref(null)

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
const slidesListRef = ref<HTMLElement | null>(null) // Add ref for slides-list
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
        card.id.toString().includes(normalizedQuery) ||
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
  // if no index, choose first result
  if (index < 0) {
    index = 0
  }
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

const closeSearchAndClear = () => {
  searchQuery.value = '' // Clear the search input when dismissing with escape
  showSearchResults.value = false
  selectedSearchIndex.value = -1
  focusSlidesList()
}

// Focus back to slides list for arrow key navigation
const focusSlidesList = () => {
  nextTick(() => {
    if (slidesListRef.value) {
      slidesListRef.value.focus()
    }
  })
}

// Watch search query to show results when user types
watch(searchQuery, (newQuery) => {
  if (newQuery.trim() && document.activeElement === searchInputRef.value) {
    showSearchResults.value = true
    selectedSearchIndex.value = 0 // Reset to first result when typing
  }
})

// Watch currentSlideIndex and always center selected slide
watch(
  () => state.currentSlideIndex,
  () => {
    nextTick(() => {
      scrollSelectedSlideIntoView(true)

      // Clear last spoken name when slide changes
      lastSpokenName.value = null

      // Stop any existing audible names playback
      if (config.value.audibleNames.enabled) {
        stopAudibleNames()
      }
      // If no audible names are enabled, or auto playback is disabled, do nothing
      if (
        !config.value.audibleNames.enabled ||
        !config.value.audibleNames.autoPlayback ||
        state.freezeMonitors
      ) {
        return
      }
      // If we're on a names slide, start playback
      if (
        currentNamesSlide.value ||
        (cards.value.length > 0 &&
          state.currentSlideIndex < cards.value.length &&
          cards.value[state.currentSlideIndex].type === CardType.Unattended)
      ) {
        if (audioPlaybackTimeout.value) {
          clearTimeout(audioPlaybackTimeout.value)
        }
        audioPlaybackTimeout.value = setTimeout(() => {
          playAudibleNames()
        }, config.value.audibleNames.delayBeforePlayback)
      }
    })
  }
)

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
    appliedMainScreen = data.state.mainScreen ?? null
    appliedSideScreen = data.state.sideScreen ?? null
    mainScreen.value = data.state.mainScreen
    sideScreen.value = data.state.sideScreen

    // Update pagination state from data
    currentMainNamesPage.value = data.state.currentMainNamesPage ?? 0
    currentMainUnattendedPage.value = data.state.currentMainUnattendedPage ?? 0
    currentSideNamesPage.value = data.state.currentSideNamesPage ?? 0
    currentSideUnattendedPage.value = data.state.currentSideUnattendedPage ?? 0

    // Set isExcelLoaded based on whether we have cards data
    state.isExcelLoaded = Array.isArray(data.cards) && data.cards.length > 0

    // Scroll to the current slide after data is loaded
    if (state.isExcelLoaded && state.currentSlideIndex >= 0 && !initialLoadComplete.value) {
      // Use nextTick to ensure the DOM is updated before scrolling
      nextTick(() => {
        scrollSelectedSlideIntoView(false)
        initialLoadComplete.value = true
      })
    }
  })

  // Listen for toggle-freeze events from the main process
  window.electron.ipcRenderer.on('toggle-freeze', () => {
    // Toggle the freeze state
    state.freezeMonitors = !state.freezeMonitors
  })

  // Listen for flip-screens command from the application menu
  window.electron.ipcRenderer.on('flip-screens', () => {
    flipScreens()
  })

  // Listen for toggle-black-out command from the application menu
  window.electron.ipcRenderer.on('toggle-black-out', () => {
    blackOutScreens()
  })

  // Listen for scroll-to-current command from the application menu
  window.electron.ipcRenderer.on('scroll-to-current', () => {
    // Scroll to selected slide when navigating with global shortcuts
    nextTick(() => {
      scrollSelectedSlideIntoView()
    })
  })

  // Listen for toggle-audio-playback command from global shortcut
  window.electron.ipcRenderer.on('toggle-audio-playback', () => {
    // Only toggle if audible names is enabled and we're on a names or unattended slide
    if (
      config.value.audibleNames.enabled &&
      (currentNamesSlide.value ||
        (cards.value.length > 0 &&
          state.currentSlideIndex < cards.value.length &&
          cards.value[state.currentSlideIndex].type === CardType.Unattended))
    ) {
      toggleAudibleNames()
    }
  })

  // Names page changes requested from the Stream Deck
  // Screen previews wanted by the Stream Deck
  window.electron.ipcRenderer.on('remote-preview-subscribe', (_, screens) => {
    setPreviewWatcher('main', screens.main ? mainPreview.value : null)
    setPreviewWatcher('side', screens.side ? sidePreview.value : null)
  })

  // Search toggled from the Stream Deck: open it ready to type, or close it
  window.electron.ipcRenderer.on('remote-toggle-search', () => {
    if (showSearchResults.value) {
      closeSearchAndClear()
      searchInputRef.value?.blur()
    } else if (searchInputRef.value) {
      searchInputRef.value.focus()
      showSearchResults.value = true
      nextTick(() => searchInputRef.value?.select())
    }
  })

  window.electron.ipcRenderer.on('remote-change-page', (_, { screen, direction }) => {
    const type = screen === 'side' ? sideScreenCard.value?.type : mainScreenCard.value?.type
    const pagers = {
      main: {
        [CardType.Names]: [prevMainNamesPage, nextMainNamesPage],
        [CardType.Unattended]: [prevMainUnattendedPage, nextMainUnattendedPage]
      },
      side: {
        [CardType.Names]: [prevSideNamesPage, nextSideNamesPage],
        [CardType.Unattended]: [prevSideUnattendedPage, nextSideUnattendedPage]
      }
    }
    const pager = type ? pagers[screen === 'side' ? 'side' : 'main'][type] : undefined
    pager?.[direction > 0 ? 1 : 0]()
  })

  // Load initial data
  window.electron.ipcRenderer.send('get-data')

  // Set up audio status polling for audible names
  const audioStatusInterval = setInterval(async () => {
    if (config.value.audibleNames.enabled) {
      updateAudioStatus()
    }
  }, 5)

  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(audioStatusInterval)
  })

  // Add keyboard event listeners for navigation
  window.addEventListener('keydown', handleKeyDown)

  // Add keyboard event listeners for Ctrl/Cmd key detection
  window.addEventListener('keydown', handleKeyboardEvent)
  window.addEventListener('keyup', handleKeyboardEvent)

  // Add window focus listener to reset key state when app regains focus
  window.addEventListener('focus', handleWindowFocus)

  // Add click outside listener for search popup
  document.addEventListener('click', handleClickOutside)

  // Add keyboard shortcut for search
  window.addEventListener('keydown', handleSearchShortcut)
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('data-updated')
  window.electron.ipcRenderer.removeAllListeners('toggle-freeze')
  window.electron.ipcRenderer.removeAllListeners('toggle-black-out')
  window.electron.ipcRenderer.removeAllListeners('flip-screens')
  window.electron.ipcRenderer.removeAllListeners('scroll-to-current')
  window.electron.ipcRenderer.removeAllListeners('remote-change-page')
  window.electron.ipcRenderer.removeAllListeners('remote-toggle-search')
  window.electron.ipcRenderer.removeAllListeners('remote-preview-subscribe')
  setPreviewWatcher('main', null)
  setPreviewWatcher('side', null)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keydown', handleKeyboardEvent)
  window.removeEventListener('keyup', handleKeyboardEvent)
  window.removeEventListener('focus', handleWindowFocus)
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

  // Check for Ctrl+F or Cmd+F using both key and keyCode for international keyboard support
  // KeyCode 70 is the keyCode for 'F' key on standard keyboards regardless of layout
  const isFKey = event.key.toLowerCase() === 'f' || event.keyCode === 70
  const isModifierPressed = (isMac && event.metaKey) || (!isMac && event.ctrlKey)

  // Plain Cmd/Ctrl+F only: Cmd/Ctrl+Shift+F is the Freeze Output menu shortcut
  if (isModifierPressed && isFKey && !event.shiftKey && !event.altKey) {
    event.preventDefault()
    event.stopPropagation() // Stop event propagation to prevent browser's find dialog

    // Focus the search input and show results
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      showSearchResults.value = true

      // Select all existing text if any
      nextTick(() => {
        if (searchInputRef.value) {
          searchInputRef.value.select()
        }
      })
    }
  }

  // Handle names precedence shortcuts

  // Check for [ key (keyCode 219 on standard keyboards)
  const isLeftBracketKey = event.key === '[' || event.keyCode === 219
  if (((isMac && event.metaKey) || (!isMac && event.ctrlKey)) && isLeftBracketKey) {
    event.preventDefault()
    if (config.value.namesPrecedence > 0) {
      const newConfig = JSON.parse(JSON.stringify(config.value))
      newConfig.namesPrecedence = Math.max(0, newConfig.namesPrecedence - 1)
      updateConfig(newConfig)
    }
  }

  // Check for ] key (keyCode 221 on standard keyboards)
  const isRightBracketKey = event.key === ']' || event.keyCode === 221
  if (((isMac && event.metaKey) || (!isMac && event.ctrlKey)) && isRightBracketKey) {
    event.preventDefault()
    const newConfig = JSON.parse(JSON.stringify(config.value))
    newConfig.namesPrecedence = newConfig.namesPrecedence + 1
    updateConfig(newConfig)
    return
  }

  // Handle audio navigation shortcuts: [ for previous name, ] for next name (without modifier keys)
  if (event.key === '[' || event.key === ']') {
    // Only work if audible names is enabled and we're on a Names/Unattended card
    const currentCard = cards.value[state.currentSlideIndex]
    const isNamesCard =
      currentCard &&
      (currentCard.type === CardType.Names || currentCard.type === CardType.Unattended)

    if (config.value.audibleNames.enabled && isNamesCard) {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === '[') {
        goToPreviousName()
      } else if (event.key === ']') {
        goToNextName()
      }
    }
    return
  }
}

const sideScreenCard = computed(() => {
  const namesCard = getSideScreen(state.currentSlideIndex)
  if (namesCard) {
    return namesCard
  } else {
    return {
      id: -1,
      type: CardType.Blank,
      title: null,
      subtitle: null,
      group: null,
      from: null,
      until: null,
      display: DisplayType.Both,
      precedence: null
    }
  }
})

const mainScreenCard = computed(() => {
  if (cards.value.length > 0 && state.currentSlideIndex < cards.value.length) {
    const card = cards.value[state.currentSlideIndex]
    // If card is set as "Side Only" display, show a blank card instead
    if (card.display === DisplayType.SideOnly) {
      return {
        id: -1,
        type: CardType.Blank,
        title: null,
        subtitle: null,
        group: null,
        from: null,
        until: null,
        display: DisplayType.Both,
        precedence: null
      }
    } else {
      return card
    }
  }
  return null
})

const isMainScreenFromSideOnlyNamesCard = computed(() => {
  if (cards.value.length > 0 && state.currentSlideIndex < cards.value.length) {
    const card = cards.value[state.currentSlideIndex]
    return card.display === DisplayType.SideOnly && card.type === CardType.Names
  }
  return false
})

// True while the final name of a "Side Only" card is being spoken. Those cards show nothing
// on the main screen, so there is no other way to see that playback is about to end.
const isLastNameSpeaking = computed(() => {
  if (!isMainScreenFromSideOnlyNamesCard.value) return false
  if (!audioStatus.value.isPlaying && !audioStatus.value.isPaused) return false
  const { currentIndex, totalNames } = audioStatus.value
  return totalNames > 0 && currentIndex === totalNames - 1
})

// Computed property to check if current slide has audible names
const currentNamesSlide = computed(() => {
  if (cards.value.length === 0 || state.currentSlideIndex >= cards.value.length) {
    return null
  }
  const currentCard = cards.value[state.currentSlideIndex]
  return currentCard && currentCard.type === CardType.Names ? currentCard : null
})

// Card type and names page shown on each screen, reported to the main process for the Stream
// Deck keys
const pageInfo = (
  type: CardType | undefined,
  cardRef: { totalNamesPages?: number; totalUnattendedPages?: number } | null,
  namesPage: number,
  unattendedPage: number
): { page: number; total: number; type: CardType | null } => {
  if (type === CardType.Names) {
    return { page: namesPage, total: cardRef?.totalNamesPages ?? 0, type }
  }
  if (type === CardType.Unattended) {
    return { page: unattendedPage, total: cardRef?.totalUnattendedPages ?? 0, type }
  }
  return { page: 0, total: 0, type: type ?? null }
}

const remotePageInfo = computed(() => ({
  main: pageInfo(
    mainScreenCard.value?.type,
    mainCardRef.value,
    currentMainNamesPage.value,
    currentMainUnattendedPage.value
  ),
  side: pageInfo(
    sideScreenCard.value?.type,
    sideCardRef.value,
    currentSideNamesPage.value,
    currentSideUnattendedPage.value
  )
}))

// Screen previews for the Stream Deck. While a preview key is on the deck, its preview panel is
// watched and captured shortly after it changes (slide, names page, highlighted name, finished
// transition, loaded image); there is no polling, and nothing is watched otherwise.
const mainPreview = ref<HTMLElement | null>(null)
const sidePreview = ref<HTMLElement | null>(null)
const PREVIEW_SETTLE_DELAY = 150
const PREVIEW_EVENTS = ['transitionend', 'animationend', 'load']
const previewWatchers: { main?: () => void; side?: () => void } = {}

const watchPreview = (screen: 'main' | 'side', element: HTMLElement): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  const capture = (): void => {
    const rect = element.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    window.electron.ipcRenderer.send('remote-preview-capture', screen, {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    })
  }
  // Wait until changes settle, so one capture covers a burst of them
  const schedule = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(capture, PREVIEW_SETTLE_DELAY)
  }

  const mutations = new MutationObserver(schedule)
  mutations.observe(element, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  })
  const resizes = new ResizeObserver(schedule)
  resizes.observe(element)
  // These don't bubble, so listen while they travel down to their target
  PREVIEW_EVENTS.forEach((name) => element.addEventListener(name, schedule, true))
  schedule()

  return () => {
    mutations.disconnect()
    resizes.disconnect()
    PREVIEW_EVENTS.forEach((name) => element.removeEventListener(name, schedule, true))
    if (timer) clearTimeout(timer)
  }
}

const setPreviewWatcher = (screen: 'main' | 'side', element: HTMLElement | null): void => {
  previewWatchers[screen]?.()
  previewWatchers[screen] = element ? watchPreview(screen, element) : undefined
}

// Whether search is open, for the Stream Deck search key
watch(showSearchResults, (open) => window.electron.ipcRenderer.send('remote-search-open', open))

// Started once mounted: sideScreenCard calls functions defined further down this file
onMounted(() => {
  watch(
    remotePageInfo,
    (info) =>
      window.electron.ipcRenderer.send('remote-page-info', JSON.parse(JSON.stringify(info))),
    { immediate: true }
  )
})

// Watch monitor selection changes
watch(mainScreen, (newValue) => {
  // Ensure null string is converted to actual null
  const value = newValue === 'null' ? null : newValue
  // Don't echo back a value the main process just sent us
  if (value === appliedMainScreen) return
  appliedMainScreen = value
  window.electron.ipcRenderer.send('set-main-screen', value)
})

watch(sideScreen, (newValue) => {
  const value = newValue === 'null' ? null : newValue
  if (value === appliedSideScreen) return
  appliedSideScreen = value
  window.electron.ipcRenderer.send('set-side-screen', value)
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

  // Get the slides list element
  const slidesList = document.querySelector('.slides-list') as HTMLElement

  // Handle pagination shortcuts: - for previous page, = for next page
  if (event.key === '-' || event.key === '=' || event.key === '+' || event.key === '_') {
    event.preventDefault()
    event.stopPropagation()

    // Determine which card is currently displayed and paginate accordingly
    const currentCard = cards.value[state.currentSlideIndex]
    if (!currentCard) return

    if (event.key === '-' || event.key === '_') {
      // Previous page
      if (currentCard.type === CardType.Names) {
        prevMainNamesPage()
      } else if (currentCard.type === CardType.Unattended) {
        prevMainUnattendedPage()
      }
    } else if (event.key === '=' || event.key === '+') {
      // Next page
      if (currentCard.type === CardType.Names) {
        nextMainNamesPage()
      } else if (currentCard.type === CardType.Unattended) {
        nextMainUnattendedPage()
      }
    }
    return
  }

  // Slide navigation uses the plain keys only; combinations like Cmd+Shift+Arrow do nothing
  if (event.metaKey || event.ctrlKey || event.altKey) return

  if (
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowUp' ||
    event.key === 'ArrowRight' ||
    event.key === 'ArrowDown' ||
    event.key === ' '
  ) {
    // Focus on the slides-list first to ensure keyboard navigation works properly
    if (slidesList && document.activeElement !== slidesList) {
      slidesList.focus()
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
}

const nextSlide = () => {
  if (state.currentSlideIndex < cards.value.length - 1) {
    lastSpokenName.value = null // Clear last spoken name when changing slides
    window.electron.ipcRenderer.send('next-slide')
  }
}

const prevSlide = () => {
  if (state.currentSlideIndex > 0) {
    lastSpokenName.value = null // Clear last spoken name when changing slides
    window.electron.ipcRenderer.send('prev-slide')
  }
}

// Pagination functions
const sendPaginationUpdate = () => {
  window.electron.ipcRenderer.send('update-pagination', {
    currentMainNamesPage: currentMainNamesPage.value,
    currentMainUnattendedPage: currentMainUnattendedPage.value,
    currentSideNamesPage: currentSideNamesPage.value,
    currentSideUnattendedPage: currentSideUnattendedPage.value
  })
}

const nextMainNamesPage = () => {
  if (mainCardRef.value && currentMainNamesPage.value < mainCardRef.value.totalNamesPages - 1) {
    currentMainNamesPage.value++
    sendPaginationUpdate()
  }
}

const prevMainNamesPage = () => {
  if (currentMainNamesPage.value > 0) {
    currentMainNamesPage.value--
    sendPaginationUpdate()
  }
}

const nextMainUnattendedPage = () => {
  if (
    mainCardRef.value &&
    currentMainUnattendedPage.value < mainCardRef.value.totalUnattendedPages - 1
  ) {
    currentMainUnattendedPage.value++
    sendPaginationUpdate()
  }
}

const prevMainUnattendedPage = () => {
  if (currentMainUnattendedPage.value > 0) {
    currentMainUnattendedPage.value--
    sendPaginationUpdate()
  }
}

const nextSideNamesPage = () => {
  if (sideCardRef.value && currentSideNamesPage.value < sideCardRef.value.totalNamesPages - 1) {
    currentSideNamesPage.value++
    sendPaginationUpdate()
  }
}

const prevSideNamesPage = () => {
  if (currentSideNamesPage.value > 0) {
    currentSideNamesPage.value--
    sendPaginationUpdate()
  }
}

const nextSideUnattendedPage = () => {
  if (
    sideCardRef.value &&
    currentSideUnattendedPage.value < sideCardRef.value.totalUnattendedPages - 1
  ) {
    currentSideUnattendedPage.value++
    sendPaginationUpdate()
  }
}

const prevSideUnattendedPage = () => {
  if (currentSideUnattendedPage.value > 0) {
    currentSideUnattendedPage.value--
    sendPaginationUpdate()
  }
}

const scrollSelectedSlideIntoView = (smooth: boolean = true) => {
  const slideElements = document.querySelectorAll('.slide-item')
  if (slideElements && slideElements.length > state.currentSlideIndex) {
    const selectedSlide = slideElements[state.currentSlideIndex] as HTMLElement
    selectedSlide?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'center' })
  }
}

const goToSlide = (index: number) => {
  lastSpokenName.value = null // Clear last spoken name when changing slides
  window.electron.ipcRenderer.send('goto-slide', index)
}

const openExcel = () => {
  window.electron.ipcRenderer.send('open-excel')
}

const reloadData = () => {
  window.electron.ipcRenderer.send('reload-data')
}

const toggleFreeze = () => {
  window.electron.ipcRenderer.send('toggle-freeze')
}

const openSettings = () => {
  // Send message to main process to open settings window
  window.electron.ipcRenderer.send('open-settings')
}

const openExcelStructureWindow = () => {
  window.electron.ipcRenderer.send('open-excel-structure')
}

const openExcelStructure = () => {
  // Toggle the modal directly instead of sending to main process
  showExcelStructure.value = true
}

// Sidebar resize functionality
const startResize = (event: MouseEvent): void => {
  isResizing.value = true
  document.body.classList.add('resizing')
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

const handleResize = (event: MouseEvent): void => {
  if (!isResizing.value) return

  const newWidth = event.clientX

  // Constrain width between 300px and 600px
  if (newWidth >= 300 && newWidth <= 600) {
    sidebarWidth.value = newWidth
  }
}

const stopResize = (): void => {
  isResizing.value = false
  document.body.classList.remove('resizing')
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)

  // Save the sidebar width to localStorage for persistence
  localStorage.setItem('sidebarWidth', sidebarWidth.value.toString())
}

const updateConfig = (newConfig: Config) => {
  // Create a deep copy to ensure we're not dealing with reference issues
  const configCopy = JSON.parse(JSON.stringify(newConfig))

  // Update local state
  config.value = configCopy

  // Send to main process to persist and update displays
  window.electron.ipcRenderer.send('update-config', configCopy)
}

// Audio control methods for audible names
const toggleAudibleNames = (): void => {
  // Check if we're actively playing and not completed all names
  const isActivelyPlaying =
    audioStatus.value.isPlaying && audioStatus.value.currentIndex < audioStatus.value.totalNames

  if (isActivelyPlaying) {
    if (config.value.audibleNames.continuousPlayback) {
      // If continuous playback is enabled, stop the audio completely
      stopAudibleNames()
    } else {
      // If continuous playback is disabled, pause/resume
      if (audioStatus.value.isPaused) {
        // Resume playback
        window.electron.ipcRenderer.send('audio-resume')
        // Don't update preview - it should only show actually spoken names
      } else {
        // Pause playback
        window.electron.ipcRenderer.send('audio-pause')
      }
    }
  } else {
    // Always start playing from current slide
    playAudibleNames()
  }
}

const toggleAutoPlayback = () => {
  const newConfig = JSON.parse(JSON.stringify(config.value))
  newConfig.audibleNames.autoPlayback = !newConfig.audibleNames.autoPlayback
  updateConfig(newConfig)
}

const playAudibleNames = (): void => {
  const namesCard = currentNamesSlide.value
  if (namesCard) {
    // Use the same filtering logic as the Card component
    const distributeNames = config.value.distributeNames ?? false
    const namesToPlay = filterNamesForCard(names.value, namesCard, cards.value, distributeNames)

    if (namesToPlay.length > 0) {
      // Convert to plain objects to avoid cloning issues with Vue reactive objects
      const serializedNames = namesToPlay.map((name) => ({
        name: name.name,
        group: name.group,
        attending: name.attending
      }))
      window.electron.ipcRenderer.send('audio-play-names', serializedNames)
      // Don't update preview - it should only show actually spoken names
    }
  }
  // If Unattended card, play all unattended names
  else if (
    cards.value.length > 0 &&
    state.currentSlideIndex < cards.value.length &&
    cards.value[state.currentSlideIndex].type === CardType.Unattended
  ) {
    const unattendedNames = filterUnattendedNames(names.value)
    if (unattendedNames.length > 0) {
      const serializedNames = unattendedNames.map((name) => ({
        name: name.name,
        group: name.group,
        attending: name.attending
      }))
      window.electron.ipcRenderer.send('audio-play-names', serializedNames)
      // Don't update preview - it should only show actually spoken names
    }
  }
}

const stopAudibleNames = (): void => {
  window.electron.ipcRenderer.send('audio-stop')
  // Clear preview when audio stops
  previewSpokenName.value = null
}

const goToNextName = (): void => {
  window.electron.ipcRenderer.send('audio-next')
}

const goToPreviousName = (): void => {
  window.electron.ipcRenderer.send('audio-previous')
}

const updateAudioStatus = async (): Promise<void> => {
  const status = await window.electron.ipcRenderer.invoke('audio-get-status')

  // Use currentName for preview (shows last spoken in manual mode)
  if (status.currentName) {
    lastSpokenName.value = status.currentName
    previewSpokenName.value = status.currentName
  }

  audioStatus.value = status
}

// Hover functionality for large thumbnail preview
const hoveredSlideIndex = ref<number | null>(null)
const showLargeThumbnail = ref(false)
const isSlashKeyPressed = ref(false)

const handleMouseEnter = (index: number) => {
  hoveredSlideIndex.value = index
  if (isSlashKeyPressed.value) {
    showLargeThumbnail.value = true
  }
}

const handleMouseLeave = () => {
  showLargeThumbnail.value = false
  hoveredSlideIndex.value = null
}

const keepLargeThumbnail = () => {
  // Keep the thumbnail visible while hovering over it
}

// Handle keyboard events for slash key detection
const handleKeyboardEvent = (event: KeyboardEvent) => {
  // Check for '/' key (keyCode 191 on standard keyboards)
  const isSlashPressed = event.key === '/' || event.keyCode === 191

  // Only handle keydown events for slash key
  if (event.type === 'keydown' && isSlashPressed) {
    if (!isSlashKeyPressed.value) {
      isSlashKeyPressed.value = true

      // If slash key is pressed and we're hovering over a slide, show thumbnail
      if (hoveredSlideIndex.value !== null) {
        showLargeThumbnail.value = true
      }
    }
  }
  // Handle keyup events for slash key
  else if (event.type === 'keyup' && isSlashPressed) {
    isSlashKeyPressed.value = false
    showLargeThumbnail.value = false
  }
}

// Handle window focus/blur events to reset key state
const handleWindowFocus = () => {
  // Reset key state when window regains focus to prevent stuck modifier keys
  if (isSlashKeyPressed.value) {
    isSlashKeyPressed.value = false
    showLargeThumbnail.value = false
  }
}

const flipScreens = () => {
  // Only proceed if at least one of the screens is selected
  if (mainScreen.value === null && sideScreen.value === null) {
    return
  }

  // The main process swaps both screens in one step and reports the result back. Doing it
  // here instead, one screen at a time, left the two processes disagreeing in between.
  window.electron.ipcRenderer.send('flip-screens')
}

const blackOutScreens = () => {
  // Toggle the black out state
  state.blackOutScreens = !state.blackOutScreens
  // Send to main process
  window.electron.ipcRenderer.send('toggle-black-out')
}

const getSideScreen = (index: number): CardInterface | undefined => {
  return cards.value.find((card) => {
    let namesPrecedence = card.precedence !== null ? card.precedence : config.value.namesPrecedence
    return (
      card.type === CardType.Names &&
      card.display !== DisplayType.MainOnly &&
      index + namesPrecedence >= card.id - 1 &&
      (namesPrecedence === 0 || card.display === DisplayType.Both
        ? index < card.id
        : index < card.id - 1)
    )
  })
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

/* Global styles for focus states - only show outline when using keyboard */
:global(:focus:not(:focus-visible)) {
  outline: none !important;
  box-shadow: none !important;
  ring: 0 !important;
}

/* Text fields draw their own focus ring */
:global(:focus-visible:not(.slides-list):not(.ui-input)) {
  outline: 2px solid rgba(10, 132, 255, 0.8) !important;
  outline-offset: 2px !important;
}

/* Toolbar */
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 52px;
  padding: 0 1rem;
  background: var(--ui-bg-toolbar);
  border-bottom: 1px solid var(--ui-separator);
  box-shadow: inset 0 -0.5px 0 rgba(255, 255, 255, 0.04);
}

.toolbar-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.toolbar-clock {
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
  color: var(--ui-text-2);
  font-family: var(--ui-font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  margin: 0 0.25rem;
  background: var(--ui-border-strong);
}

.ui-btn.is-alert,
.tile.is-alert {
  background: var(--ui-red);
  color: #fff;
}

.ui-btn.is-alert:hover,
.tile.is-alert:hover {
  background: #ff5a50;
}

/* Round help button, as in macOS dialogs */
.help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 0.25rem;
  border-radius: 50%;
  background: var(--ui-control);
  color: var(--ui-text);
  font-size: 14px;
  font-weight: 600;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.1),
    0 0.5px 1px rgba(0, 0, 0, 0.35);
  transition: background-color 0.15s ease;
}

.help-btn:hover {
  background: var(--ui-control-hover);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar-left {
  background: var(--ui-bg-sidebar);
}

.sidebar-content {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.sidebar-content::-webkit-scrollbar {
  width: 0; /* WebKit browsers */
  height: 0;
  display: none;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-2);
}

.screen-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.screen-dot-main {
  background: var(--ui-accent);
  box-shadow: 0 0 6px rgba(10, 132, 255, 0.6);
}

.screen-dot-side {
  background: var(--ui-yellow);
  box-shadow: 0 0 6px rgba(255, 214, 10, 0.5);
}

.preview-frame {
  overflow: hidden;
  border-radius: 10px;
  background: #000;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.09),
    0 6px 18px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.2s ease;
}

.preview-frame.is-warning {
  box-shadow:
    0 0 0 2px var(--ui-red),
    0 0 24px rgba(255, 69, 58, 0.45);
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--ui-surface);
  color: var(--ui-text-3);
  font-size: 12px;
}

.empty-preview svg {
  width: 28px;
  height: 28px;
}

.last-name-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ui-red);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  pointer-events: none;
}

/* Names page controls under a preview */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.625rem;
}

.pager-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  border-radius: var(--ui-radius-sm);
  color: var(--ui-text-2);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.pager-btn:hover {
  background: var(--ui-control);
  color: var(--ui-text);
}

.pager-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: transparent;
}

.pager-btn svg {
  width: 14px;
  height: 14px;
}

.pager-label {
  min-width: 92px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-2);
  font-variant-numeric: tabular-nums;
}

/* Output tiles (Control Center style) */
.tile {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem;
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
  text-align: left;
  transition: background-color 0.15s ease;
}

.tile:hover {
  background: var(--ui-surface-hover);
}

.tile:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.tile-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--ui-control);
}

.tile.is-alert .tile-icon {
  background: rgba(255, 255, 255, 0.25);
}

.tile-icon svg {
  width: 16px;
  height: 16px;
}

.tile-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tile-label {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.tile-sub {
  font-size: 11px;
  color: var(--ui-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile.is-alert .tile-sub {
  color: rgba(255, 255, 255, 0.85);
}

/* Audible names */
.audio-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.75rem;
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.segmented {
  display: inline-flex;
  padding: 2px;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 0 0 0.5px var(--ui-border);
}

.segmented button {
  height: 20px;
  padding: 0 0.6rem;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ui-text-2);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.segmented button:hover {
  color: var(--ui-text);
}

.segmented button.is-active {
  background: rgba(255, 255, 255, 0.18);
  color: var(--ui-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.audio-status {
  display: flex;
  align-items: center;
  min-height: 20px;
  font-size: 12px;
}

.paused-pill {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 159, 10, 0.18);
  color: var(--ui-orange);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.audio-progress {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.audio-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--ui-accent);
}

/* Resize handle */
.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  bottom: 0;
  width: 7px;
  z-index: 10;
  cursor: col-resize;
}

.resize-handle::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 1px;
  background: var(--ui-separator);
  transition: background-color 0.2s ease;
}

.resize-handle:hover::before {
  background: var(--ui-accent);
}

.resize-handle:active::before {
  left: 2px;
  width: 3px;
  background: var(--ui-accent);
}

.resize-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 32px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: var(--ui-accent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.resize-handle:hover .resize-grip {
  opacity: 1;
}

/* Slide list */
.content-main {
  background: var(--ui-bg);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem 0.75rem;
}

.list-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.stepper {
  display: inline-flex;
  align-items: center;
  height: 26px;
  border-radius: var(--ui-radius-sm);
  background: var(--ui-control);
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.08),
    0 0.5px 1px rgba(0, 0, 0, 0.3);
}

.stepper button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 100%;
  color: var(--ui-text-2);
  transition: color 0.15s ease;
}

.stepper button:hover {
  color: var(--ui-text);
}

.stepper button:disabled {
  opacity: 0.35;
  pointer-events: none;
}

.stepper button svg {
  width: 13px;
  height: 13px;
}

.stepper-label {
  min-width: 56px;
  padding: 0 0.25rem;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  border-left: 1px solid var(--ui-border);
  border-right: 1px solid var(--ui-border);
}

/* Search */
.search-icon {
  position: absolute;
  left: 0.55rem;
  top: 50%;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  color: var(--ui-text-3);
  pointer-events: none;
}

.search-input {
  padding-left: 1.75rem;
  padding-right: 3.25rem;
  border-radius: 7px;
}

.search-hint {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--ui-control);
  color: var(--ui-text-2);
  font-family: var(--ui-font);
  font-size: 11px;
  pointer-events: none;
}

.search-popover {
  position: absolute;
  z-index: 50;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  max-height: 20rem;
  overflow-y: auto;
  padding: 5px;
  border-radius: 10px;
  background: rgba(44, 44, 46, 0.97);
  backdrop-filter: blur(20px);
  box-shadow: var(--ui-shadow-popover);
}

.search-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.4rem 0.5rem;
  border-radius: var(--ui-radius-sm);
  cursor: default;
}

.search-item.is-selected {
  background: var(--ui-accent);
}

.search-index {
  flex-shrink: 0;
  min-width: 2.25rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: var(--ui-control);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.search-item.is-selected .search-index {
  background: rgba(255, 255, 255, 0.22);
}

.search-type {
  font-size: 13px;
  font-weight: 600;
}

.search-title {
  font-size: 12px;
  color: var(--ui-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-names {
  margin-top: 2px;
  font-size: 11px;
  color: var(--ui-text-3);
}

.search-item.is-selected .search-title,
.search-item.is-selected .search-names {
  color: rgba(255, 255, 255, 0.85);
}

.slide-item {
  position: relative;
  display: flex;
  padding: 0.625rem;
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border);
  outline: none;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.slide-item:hover {
  background: var(--ui-surface-hover);
}

.slide-item.is-current {
  background: var(--ui-accent-soft);
  box-shadow:
    inset 0 0 0 2px var(--ui-accent),
    0 0 22px rgba(10, 132, 255, 0.3);
}

.slide-item.is-frozen {
  box-shadow: inset 0 0 0 2px var(--ui-red);
}

.slide-item.is-current.is-frozen {
  box-shadow:
    inset 0 0 0 2px var(--ui-red),
    0 0 22px rgba(10, 132, 255, 0.3);
}

/* Marks the slides that show a names card on the side screen */
.slide-connection {
  position: absolute;
  top: 10px;
  bottom: 10px;
  right: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: var(--ui-yellow);
}

.slide-connection.is-dimmed {
  background: rgba(255, 214, 10, 0.28);
}

.slide-thumbnail {
  min-width: 160px;
}

.thumbnail-frame {
  overflow: hidden;
  border-radius: 6px;
  background: #000;
  box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.12);
}

.large-thumbnail-frame {
  padding: 6px;
  border-radius: 12px;
  background: var(--ui-bg-popover);
  box-shadow: var(--ui-shadow-popover);
}

.large-thumbnail-frame > div {
  overflow: hidden;
  border-radius: 7px;
}

.slide-title {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--ui-control);
  color: var(--ui-text-2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.slide-item.is-current .slide-title {
  background: var(--ui-accent);
  color: #fff;
}

.slide-subtitle {
  margin-top: 0.375rem;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ui-text);
}

.slide-meta {
  margin-top: 0.25rem;
  font-size: 12px;
  color: var(--ui-text-2);
}

.slide-number {
  display: flex;
  justify-content: flex-end;
  align-self: flex-start;
  padding: 0 0.25rem 0 0.75rem;
  font-size: 17px;
  font-weight: 700;
  color: var(--ui-text-3);
  font-variant-numeric: tabular-nums;
}

.slide-item.is-current .slide-number {
  color: #fff;
}

/* Bottom navigation */
.navigation-buttons {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  height: 56px;
  background: var(--ui-bg-toolbar);
  border-top: 1px solid var(--ui-separator);
}

.nav-btn {
  height: 32px;
  min-width: 112px;
  font-size: 13px;
}

.slide-counter {
  min-width: 120px;
  text-align: center;
  font-size: 13px;
  color: var(--ui-text-2);
}

.large-thumbnail-preview {
  animation: fadeIn 0.3s ease-in-out;
  opacity: 1 !important;
  /* Ensure always full opacity */
}

/* Fade transition for the large thumbnail preview */
.fade-enter-active {
  transition: opacity 0.3s ease;
  opacity: 1 !important;
  /* Force 100% opacity during transitions */
}

.fade-leave-active {
  transition: none;
  /* Remove transition for immediate hide */
  opacity: 0 !important;
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

/* Add visual feedback when resizing */
body.resizing {
  cursor: col-resize !important;
  user-select: none !important;
}

body.resizing * {
  cursor: col-resize !important;
  user-select: none !important;
}
</style>
