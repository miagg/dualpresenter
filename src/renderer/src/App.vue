<template>
  <div class="app-container bg-gray-900 text-gray-200 select-none">
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
          @click="reloadData"
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
          Reload
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
      <div
        class="sidebar-left shrink-0 bg-gray-800 flex flex-col relative"
        :class="{ 'transition-all duration-200': !isResizing }"
        :style="{ width: sidebarWidth + 'px' }"
      >
        <div class="sidebar-content overflow-y-auto h-full p-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-bold text-gray-200">Main Screen</h2>
            <div class="flex items-center space-x-2 bg-gray-700 rounded-sm px-2 py-1">
              <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM1 17a1 1 0 011-1h16a1 1 0 110 2H2a1 1 0 01-1-1z"
                />
              </svg>
              <select
                v-model="mainScreen"
                @change="focusSlidesList"
                class="p-1 text-xs border rounded-sm bg-gray-700 text-gray-200 border-gray-700 min-w-[90px] focus:outline-none"
              >
                <option :value="null" class="text-gray-400">None</option>
                <option
                  v-for="monitor in monitors.filter(
                    (m) => !m.isPrimary && m.id.toString() !== sideScreen
                  )"
                  :key="monitor.id"
                  :value="monitor.id.toString()"
                  class="text-gray-200"
                >
                  {{ monitor.label || `Display ${monitor.id}` }}
                </option>
              </select>
            </div>
          </div>
          <div
            class="card-preview mb-4 border border-gray-600/90 rounded-md overflow-hidden"
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
            <div
              v-else
              class="empty-preview bg-gray-700 aspect-video flex items-center justify-center text-gray-400 rounded-md"
            >
              No slide available
            </div>
          </div>

          <!-- Pagination controls for Main Screen Names -->
          <div
            v-if="mainCardRef?.totalNamesPages > 1 && mainScreenCard?.type === CardType.Names"
            class="flex gap-2 mb-4 justify-center"
          >
            <button
              @click="prevMainNamesPage"
              :disabled="currentMainNamesPage === 0"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ‹
            </button>
            <span class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded">
              {{ currentMainNamesPage + 1 }} / {{ mainCardRef.totalNamesPages }}
            </span>
            <button
              @click="nextMainNamesPage"
              :disabled="currentMainNamesPage === mainCardRef.totalNamesPages - 1"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ›
            </button>
          </div>

          <!-- Pagination controls for Main Screen Unattended -->
          <div
            v-if="
              mainCardRef?.totalUnattendedPages > 1 && mainScreenCard?.type === CardType.Unattended
            "
            class="flex gap-2 mb-4 justify-center"
          >
            <button
              @click="prevMainUnattendedPage"
              :disabled="currentMainUnattendedPage === 0"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ‹
            </button>
            <span class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded">
              {{ currentMainUnattendedPage + 1 }} / {{ mainCardRef.totalUnattendedPages }}
            </span>
            <button
              @click="nextMainUnattendedPage"
              :disabled="currentMainUnattendedPage === mainCardRef.totalUnattendedPages - 1"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ›
            </button>
          </div>

          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-bold text-gray-200">Side Screen</h2>
            <div class="flex items-center space-x-2 bg-gray-700 rounded-sm px-2 py-1">
              <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM1 17a1 1 0 011-1h16a1 1 0 110 2H2a1 1 0 01-1-1z"
                />
              </svg>
              <select
                v-model="sideScreen"
                @change="focusSlidesList"
                class="p-1 text-xs border rounded-sm bg-gray-700 text-gray-200 border-gray-700 min-w-[90px] focus:outline-none"
              >
                <option :value="null" class="text-gray-400">None</option>
                <option
                  v-for="monitor in monitors.filter(
                    (m) => !m.isPrimary && m.id.toString() !== mainScreen
                  )"
                  :key="monitor.id"
                  :value="monitor.id.toString()"
                  class="text-gray-200"
                >
                  {{ monitor.label || `Display ${monitor.id}` }}
                </option>
              </select>
            </div>
          </div>
          <div
            class="card-preview border border-gray-600/90 rounded-md overflow-hidden"
            ref="sidePreview"
          >
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
            <div
              v-else
              class="empty-preview bg-gray-700 aspect-video flex items-center justify-center text-gray-400 rounded-md"
            >
              No slide available
            </div>
          </div>

          <!-- Pagination controls for Side Screen Names -->
          <div
            v-if="sideCardRef?.totalNamesPages > 1 && sideScreenCard?.type === CardType.Names"
            class="flex gap-2 mt-4 mb-4 justify-center"
          >
            <button
              @click="prevSideNamesPage"
              :disabled="currentSideNamesPage === 0"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ‹
            </button>
            <span class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded">
              {{ currentSideNamesPage + 1 }} / {{ sideCardRef.totalNamesPages }}
            </span>
            <button
              @click="nextSideNamesPage"
              :disabled="currentSideNamesPage === sideCardRef.totalNamesPages - 1"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ›
            </button>
          </div>

          <!-- Pagination controls for Side Screen Unattended -->
          <div
            v-if="
              sideCardRef?.totalUnattendedPages > 1 && sideScreenCard?.type === CardType.Unattended
            "
            class="flex gap-2 mt-4 mb-4 justify-center"
          >
            <button
              @click="prevSideUnattendedPage"
              :disabled="currentSideUnattendedPage === 0"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ‹
            </button>
            <span class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded">
              {{ currentSideUnattendedPage + 1 }} / {{ sideCardRef.totalUnattendedPages }}
            </span>
            <button
              @click="nextSideUnattendedPage"
              :disabled="currentSideUnattendedPage === sideCardRef.totalUnattendedPages - 1"
              class="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ›
            </button>
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

                <!-- Audio Settings Toggle Buttons -->
                <button
                  v-if="config.audibleNames.enabled"
                  class="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 flex items-center"
                  :title="
                    config.audibleNames.autoPlayback
                      ? 'Disable auto playback (manual mode)'
                      : 'Enable auto playback'
                  "
                  @click="toggleAutoPlayback"
                >
                  <!-- Simple text letters for auto/manual -->
                  <span class="text-sm font-bold w-5 h-5 flex items-center justify-center">
                    {{ config.audibleNames.autoPlayback ? 'A' : 'M' }}
                  </span>
                </button>

                <div v-if="config.audibleNames.enabled" class="flex space-x-2 font-normal text-sm">
                  <button
                    :disabled="
                      !currentNamesSlide &&
                      (cards.length === 0 ||
                        state.currentSlideIndex >= cards.length ||
                        cards[state.currentSlideIndex].type !== CardType.Unattended)
                    "
                    class="btn !px-2 !py-1 min-w-18 justify-center items-center disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden"
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
                    <!-- Progress bar background (only visible when playing) -->
                    <div
                      class="absolute inset-0 bg-slate-500"
                      :class="{
                        'transition-all duration-[3s] ease-out':
                          audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames
                      }"
                      :style="{
                        width: `${audioStatus.isPlaying && audioStatus.currentIndex < audioStatus.totalNames ? Math.ceil(((audioStatus.currentIndex + 1) / audioStatus.totalNames) * 100) : 0}%`
                      }"
                    ></div>

                    <!-- Button content -->
                    <div class="relative z-10 flex items-center">
                      <svg
                        v-if="
                          !(
                            audioStatus.isPlaying &&
                            audioStatus.currentIndex < audioStatus.totalNames
                          )
                        "
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                          clip-rule="evenodd"
                        />
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
                    </div>
                  </button>
                </div>
              </div>
            </h2>

            <!-- Status indicator showing current position and total - on its own line -->
            <div
              v-if="config.audibleNames.enabled"
              class="text-sm text-gray-400 flex items-center justify-between mb-4 bg-gray-700/50 px-3 py-2 rounded min-h-10"
            >
              <div class="flex items-center space-x-2">
                <span>🔊</span>
                <div
                  v-if="audioStatus.isPlaying || audioStatus.isPaused"
                  class="flex items-center space-x-2"
                >
                  <span v-if="audioStatus.currentIndex < audioStatus.totalNames">
                    {{ audioStatus.currentIndex + 1 }}/{{ audioStatus.totalNames }}
                  </span>
                  <span v-else> Not playing </span>
                  <span
                    v-if="
                      audioStatus.queuedName && audioStatus.currentIndex < audioStatus.totalNames
                    "
                    class="text-gray-300"
                  >
                    {{ audioStatus.queuedName }}
                  </span>
                  <span
                    v-if="audioStatus.isPaused && audioStatus.currentIndex < audioStatus.totalNames"
                    class="text-yellow-400"
                    >(Paused)</span
                  >
                </div>
                <span v-else class="text-gray-400">Not playing</span>
              </div>

              <!-- Navigation buttons - only show when continuous playback is disabled and audio is active -->
              <div
                v-if="
                  !config.audibleNames.continuousPlayback &&
                  (audioStatus.isPlaying || audioStatus.isPaused) &&
                  audioStatus.totalNames > 1
                "
                class="flex items-center space-x-1"
              >
                <button
                  @click="goToPreviousName"
                  :disabled="audioStatus.currentIndex <= 0"
                  class="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous name"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  @click="goToNextName"
                  :disabled="audioStatus.currentIndex >= audioStatus.totalNames - 1"
                  class="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next name"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resize handle -->
        <div
          class="resize-handle absolute top-0 right-0 bottom-0 w-px bg-gray-700 hover:bg-blue-500 cursor-col-resize group"
          @mousedown="startResize"
        >
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-gray-500 group-hover:bg-blue-400 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
          ></div>
        </div>
      </div>

      <!-- Main Content - Slide List -->
      <div
        class="content-main flex-grow flex flex-col overflow-hidden bg-gray-900 border-y border-gray-700"
      >
        <div class="flex justify-between items-center p-4 pr-4.5">
          <div class="flex items-center">
            <h2 class="text-xl font-bold text-gray-200 mr-3">All Slides</h2>

            <!-- Add slide counter and navigation arrows -->
            <div class="flex items-center bg-gray-800 rounded-lg px-2 py-1">
              <button
                @click="prevSlide"
                class="text-gray-400 hover:text-white p-1 focus:outline-none disabled:pointer-events-none"
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
                class="text-gray-400 hover:text-white p-1 focus:outline-none disabled:pointer-events-none"
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
                class="w-64 xl:w-96 px-4 py-2 pr-16 border rounded bg-gray-800 text-gray-200 border-gray-700 focus:outline-none"
                placeholder="Search slides..."
                @focus="showSearchResults = true"
                @keydown.down.prevent="navigateSearchResults('down')"
                @keydown.up.prevent="navigateSearchResults('up')"
                @keydown.enter.prevent="selectSearchResult(selectedSearchIndex)"
                @keydown.escape="closeSearchAndClear()"
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
                class="p-2 hover:bg-gray-700 flex items-center"
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
          class="slides-list flex-grow overflow-y-auto space-y-4 p-4 mr-0.5 focus:outline-0 focus:ring-0"
          ref="slidesListRef"
          tabindex="0"
        >
          <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="slide-item p-3 border rounded flex bg-gray-850 border-gray-700 outline-none transition relative"
            :class="{
              '!bg-blue-900/70 ring-2 ring-blue-700 shadow-[0_0_22px_rgba(20,50,255,0.5)]':
                index === state.currentSlideIndex,
              '!ring-red-700 ring-2': state.freezeMonitors && index === state.frozenSlideIndex
            }"
            @click="goToSlide(index)"
          >
            <div
              v-if="
                getSideScreen(index) ||
                (card.type === CardType.Names && card.display !== DisplayType.MainOnly)
              "
              class="slide-connection absolute right-0 rounded-r top-0 bottom-0 w-1 bg-yellow-600"
              :class="{
                '!bg-yellow-700/30':
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
                  <div class="bg-gray-800 border border-gray-600 p-2 rounded shadow-xl">
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
              class="slide-info flex-grow"
              :class="{
                'opacity-50': index < state.currentSlideIndex
              }"
            >
              <div class="slide-title font-bold text-gray-200">
                {{ card.type }}
              </div>
              <div
                class="slide-subtitle mt-1 text-gray-300"
                style="overflow-wrap: anywhere"
                v-if="card.title"
              >
                {{
                  card.type === CardType.Image
                    ? card.title.substring(
                        Math.max(card.title.lastIndexOf('/'), card.title.lastIndexOf('\\')) + 1
                      )
                    : card.title
                }}
              </div>
              <div class="slide-meta text-sm text-gray-400 mt-1" v-if="card.subtitle || card.group">
                <span v-if="card.subtitle">{{ card.subtitle }}</span>
                <span v-if="card.subtitle && card.group"> | </span>
                <span v-if="card.group">Group: {{ card.group }}</span>
              </div>
            </div>

            <!-- Slide number on right side -->
            <div
              class="slide-number flex justify-end text-xl font-bold text-gray-600 tabular-nums"
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
      <button class="nav-btn" @click="prevSlide" :disabled="state.currentSlideIndex <= 0">
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
        class="nav-btn"
        @click="nextSlide"
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
const isScreenFlipping = ref(false) // Flag to prevent infinite loop when flipping screens
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

  if (isModifierPressed && isFKey) {
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

// Computed property to check if current slide has audible names
const currentNamesSlide = computed(() => {
  if (cards.value.length === 0 || state.currentSlideIndex >= cards.value.length) {
    return null
  }
  const currentCard = cards.value[state.currentSlideIndex]
  return currentCard && currentCard.type === CardType.Names ? currentCard : null
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
  }, 100)

  setTimeout(() => {
    sideScreen.value = tempMain
    const sideValue = tempMain === 'null' ? null : tempMain
    window.electron.ipcRenderer.send('set-side-screen', sideValue)
  }, 200)
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

:global(:focus-visible:not(.slides-list)) {
  outline: 2px solid #3b82f6 !important;
  outline-offset: 2px !important;
}

.main-content {
  flex: 1;
  overflow: hidden;
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
  background-color: #334155;
  color: white;
  border-radius: 0.25rem;
}

.btn:hover {
  background-color: #475569;
}

.nav-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #374151;
  color: white;
  border-radius: 0.25rem;
}

.nav-btn:hover {
  background-color: #475569;
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

/* Resize handle styles */
.resize-handle {
  z-index: 10;
  transition:
    background-color 0.2s ease,
    width 0.2s ease;
}

.resize-handle:hover {
  background-color: rgb(59 130 246) !important;
  width: 3px;
}

.resize-handle:active {
  background-color: rgb(37 99 235) !important;
  width: 4px;
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
