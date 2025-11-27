<template>
  <div class="settings-panel bg-gray-900 w-full h-full overflow-hidden text-gray-200 select-none">
    <!-- Header -->
    <div class="settings-header bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-white">Settings</h2>
          <p class="text-sm text-gray-400 mt-1">Configure your presentation preferences</p>
        </div>
        <button
          v-if="isMacOs"
          @click="closeSettings"
          class="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
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
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation bg-gray-800 border-b border-gray-700 px-6">
      <div class="flex space-x-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-3 text-sm font-medium rounded-t-lg transition-colors"
          :class="
            activeTab === tab.id
              ? 'bg-gray-900 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          "
        >
          <div class="flex items-center space-x-2">
            <!-- Appearance Icon -->
            <svg
              v-if="tab.icon === 'appearance'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z"
                clip-rule="evenodd"
              />
            </svg>
            <!-- Assets Icon -->
            <svg
              v-else-if="tab.icon === 'assets'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd"
              />
            </svg>
            <!-- Display Icon -->
            <svg
              v-else-if="tab.icon === 'display'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <!-- Audio Icon -->
            <svg
              v-else-if="tab.icon === 'audio'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                clip-rule="evenodd"
              />
            </svg>
            <!-- Shortcuts Icon -->
            <svg
              v-else-if="tab.icon === 'shortcuts'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z"
              />
            </svg>
            <span>{{ tab.name }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="settings-content flex-1 overflow-y-auto px-6 py-6">
      <!-- Appearance Tab -->
      <div v-if="activeTab === 'appearance'" class="space-y-8">
        <!-- Colors Section -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Colors</h3>
            <p class="section-description">Customize the color scheme for your presentations</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="color-input-group">
              <label class="input-label">Primary Background</label>
              <div class="color-input-wrapper">
                <input
                  v-model="settings.colors.primaryBackground"
                  type="color"
                  class="color-picker"
                />
                <input
                  v-model="settings.colors.primaryBackground"
                  type="text"
                  class="color-text-input"
                  @change="settingsChanged"
                />
              </div>
            </div>

            <div class="color-input-group">
              <label class="input-label">Primary Text</label>
              <div class="color-input-wrapper">
                <input v-model="settings.colors.primaryText" type="color" class="color-picker" />
                <input
                  v-model="settings.colors.primaryText"
                  type="text"
                  class="color-text-input"
                  @change="settingsChanged"
                />
              </div>
            </div>

            <div class="color-input-group">
              <label class="input-label">Secondary Background</label>
              <div class="color-input-wrapper">
                <input
                  v-model="settings.colors.secondaryBackground"
                  type="color"
                  class="color-picker"
                />
                <input
                  v-model="settings.colors.secondaryBackground"
                  type="text"
                  class="color-text-input"
                  @change="settingsChanged"
                />
              </div>
            </div>

            <div class="color-input-group">
              <label class="input-label">Secondary Text</label>
              <div class="color-input-wrapper">
                <input v-model="settings.colors.secondaryText" type="color" class="color-picker" />
                <input
                  v-model="settings.colors.secondaryText"
                  type="text"
                  class="color-text-input"
                  @change="settingsChanged"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Fonts Section -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Typography</h3>
            <p class="section-description">Choose fonts and text styling options</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="input-group">
              <label class="input-label">Slides Font</label>
              <select
                v-model="settings.fonts.slidesFont"
                class="select-input"
                @change="settingsChanged"
              >
                <option value="TheWaveSans">The Wave Sans</option>
                <option value="CFDin-Bold">CF Din Bold</option>
                <option value="Effra-Heavy">Effra Heavy</option>
                <option value="FreeScript">Free Script</option>
                <option value="ZonaPro-Black">Zona Pro Black</option>
              </select>
            </div>

            <div class="input-group">
              <div class="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="useBoldTitles"
                  v-model="settings.fonts.useBoldTitles"
                  class="checkbox-input"
                  @change="settingsChanged"
                />
                <label for="useBoldTitles" class="checkbox-label"> Use bold titles </label>
              </div>
              <p class="input-description">Make slide titles appear in bold text</p>
            </div>
          </div>
        </div>

        <!-- Logo Settings Section -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Logo Display</h3>
            <p class="section-description">Configure logo appearance on blank cards</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="input-group">
              <label class="input-label">Maximum Logo Size</label>
              <div class="range-input-wrapper">
                <input
                  v-model.number="settings.assets.maxLogoSize"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="range-input"
                  @input="settingsChanged"
                />
                <div class="range-value">{{ settings.assets.maxLogoSize }}%</div>
              </div>
              <p class="input-description">
                Controls the maximum width and height of the logo on blank cards
              </p>
            </div>

            <div class="input-group">
              <label class="input-label">Vertical Position Offset</label>
              <div class="number-input-wrapper">
                <input
                  v-model.number="settings.assets.logoVerticalPosition"
                  type="number"
                  min="-500"
                  max="500"
                  step="10"
                  class="number-input"
                  @change="settingsChanged"
                />
                <span class="number-input-unit">px</span>
              </div>
              <p class="input-description">
                Adjusts the vertical position of the logo on blank cards (positive moves down,
                negative moves up)
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Assets Tab -->
      <div v-if="activeTab === 'assets'" class="space-y-8">
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Images & Assets</h3>
            <p class="section-description">
              Upload custom backgrounds and logos for your presentations
            </p>
          </div>

          <div class="space-y-6">
            <!-- Background -->
            <div class="asset-input-group">
              <label class="input-label">Background Image</label>
              <div class="asset-input-wrapper">
                <input
                  v-model="settings.assets.background"
                  type="text"
                  class="asset-text-input"
                  placeholder="Path to background image"
                />
                <div class="asset-buttons">
                  <button class="btn-secondary" @click="selectFile('background')">Browse</button>
                  <button
                    v-if="settings.assets.background"
                    class="btn-danger"
                    @click="clearAsset('background')"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div v-if="imagePreviews.background" class="asset-preview">
                <img :src="imagePreviews.background" alt="Background Preview" />
              </div>
            </div>

            <!-- Names Background -->
            <div class="asset-input-group">
              <label class="input-label">Names Background</label>
              <div class="asset-input-wrapper">
                <input
                  v-model="settings.assets.backgroundNames"
                  type="text"
                  class="asset-text-input"
                  placeholder="Path to names background image"
                />
                <div class="asset-buttons">
                  <button class="btn-secondary" @click="selectFile('backgroundNames')">
                    Browse
                  </button>
                  <button
                    v-if="settings.assets.backgroundNames"
                    class="btn-danger"
                    @click="clearAsset('backgroundNames')"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div v-if="imagePreviews.backgroundNames" class="asset-preview">
                <img :src="imagePreviews.backgroundNames" alt="Names Background Preview" />
              </div>
            </div>

            <!-- Logo -->
            <div class="asset-input-group">
              <label class="input-label">Logo</label>
              <div class="asset-input-wrapper">
                <input
                  v-model="settings.assets.logo"
                  type="text"
                  class="asset-text-input"
                  placeholder="Path to logo image"
                />
                <div class="asset-buttons">
                  <button class="btn-secondary" @click="selectFile('logo')">Browse</button>
                  <button
                    v-if="settings.assets.logo"
                    class="btn-danger"
                    @click="clearAsset('logo')"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div v-if="imagePreviews.logo" class="asset-preview">
                <img :src="imagePreviews.logo" alt="Logo Preview" />
              </div>
            </div>

            <!-- Inverted Logo -->
            <div class="asset-input-group">
              <label class="input-label">Inverted Logo</label>
              <div class="asset-input-wrapper">
                <input
                  v-model="settings.assets.logoInverted"
                  type="text"
                  class="asset-text-input"
                  placeholder="Path to inverted logo image"
                />
                <div class="asset-buttons">
                  <button class="btn-secondary" @click="selectFile('logoInverted')">Browse</button>
                  <button
                    v-if="settings.assets.logoInverted"
                    class="btn-danger"
                    @click="clearAsset('logoInverted')"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div v-if="imagePreviews.logoInverted" class="asset-preview">
                <img :src="imagePreviews.logoInverted" alt="Inverted Logo Preview" />
              </div>
            </div>

            <!-- Use Default Assets -->
            <div class="input-group">
              <div class="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="useDefaultAssets"
                  v-model="settings.assets.useDefaultAssets"
                  class="checkbox-input"
                  @change="settingsChanged"
                />
                <label for="useDefaultAssets" class="checkbox-label"> Use default assets </label>
              </div>
              <p class="input-description">
                When enabled, default assets will be used when custom assets are not set
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Display Tab -->
      <div v-if="activeTab === 'display'" class="space-y-8">
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Side Screen</h3>
            <p class="section-description">Configure how names appear on the side screen</p>
          </div>
          <div class="input-group">
            <label class="input-label">Precedence Slides</label>
            <div class="number-input-wrapper">
              <input
                v-model.number="settings.namesPrecedence"
                type="number"
                min="0"
                max="20"
                class="number-input"
                @change="settingsChanged"
              />
              <span class="number-input-unit">slides</span>
            </div>
            <p class="input-description">
              Number of slides ahead the names will appear on the side screen. For example, a value
              of 2 means names will appear two slides before their main presentation.
            </p>
          </div>
        </div>

        <!-- Distributed Names Setting -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Names Distribution</h3>
            <p class="section-description">Automatically distribute names across cards</p>
          </div>
          <div class="input-group">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id="distributeNames"
                v-model="settings.distributeNames"
                class="checkbox-input"
                @change="settingsChanged"
              />
              <label for="distributeNames" class="checkbox-label">
                Distribute names automatically
              </label>
            </div>
            <p class="input-description">
              When enabled, names will be distributed equally across all no-range names cards of the same group. Cards with ranges (from/to) will claim their names first, then remaining names are split across cards without ranges.
            </p>
          </div>
        </div>
      </div>

      <!-- Audio Tab -->
      <div v-if="activeTab === 'audio'" class="space-y-8">
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Audible Names</h3>
            <p class="section-description">Configure audio playback for name pronunciation</p>
          </div>

          <!-- Enable Audio -->
          <div class="input-group">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id="audibleNamesEnabled"
                v-model="settings.audibleNames.enabled"
                class="checkbox-input"
                @change="settingsChanged"
              />
              <label for="audibleNamesEnabled" class="checkbox-label">
                Enable Audible Names Playback
              </label>
            </div>
            <p class="input-description">
              When enabled, names will be played audibly when a names slide is displayed
            </p>
          </div>

          <!-- Audio Settings (only shown when enabled) -->
          <div v-if="settings.audibleNames.enabled" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="input-group">
                <label class="input-label">Delay Before Playback</label>
                <div class="number-input-wrapper">
                  <input
                    v-model.number="settings.audibleNames.delayBeforePlayback"
                    type="number"
                    min="0"
                    max="10000"
                    step="100"
                    class="number-input"
                    @change="settingsChanged"
                  />
                  <span class="number-input-unit">ms</span>
                </div>
                <p class="input-description">
                  Delay before starting auto playback when a names slide is displayed
                </p>
              </div>

              <div class="input-group">
                <label class="input-label">Gap Between Names</label>
                <div class="number-input-wrapper">
                  <input
                    v-model.number="settings.audibleNames.gapBetweenNames"
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    class="number-input"
                    @change="settingsChanged"
                  />
                  <span class="number-input-unit">ms</span>
                </div>
                <p class="input-description">Silence duration between each name during playback</p>
              </div>
            </div>

            <!-- Playback Options in a grid layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="input-group">
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="autoPlayback"
                    v-model="settings.audibleNames.autoPlayback"
                    class="checkbox-input"
                    @change="settingsChanged"
                  />
                  <label for="autoPlayback" class="checkbox-label"> Auto Playback </label>
                </div>
                <p class="input-description">
                  Automatically start playback when a names slide is displayed
                </p>
              </div>

              <div class="input-group">
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="continuousPlayback"
                    v-model="settings.audibleNames.continuousPlayback"
                    class="checkbox-input"
                    @change="settingsChanged"
                  />
                  <label for="continuousPlayback" class="checkbox-label">
                    Continuous Playback
                  </label>
                </div>
                <p class="input-description">
                  Play names continuously without pausing between each name. When disabled, playback
                  pauses after each name until manually resumed
                </p>
              </div>

              <div class="input-group">
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="showNamesOnSideOnly"
                    v-model="settings.audibleNames.showNamesOnSideOnly"
                    class="checkbox-input"
                    @change="settingsChanged"
                  />
                  <label for="showNamesOnSideOnly" class="checkbox-label">
                    Show Names on "Side Only" Cards
                  </label>
                </div>
                <p class="input-description">
                  Display spoken names under the logo on "Side Only" cards during playback
                </p>
              </div>
            </div>

            <!-- Setup Instructions -->
            <div class="info-card">
              <div class="info-card-header">
                <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                <h4 class="info-card-title">Setup Instructions</h4>
              </div>
              <ul class="info-card-list">
                <li>Create a folder named "voiceover" in the same directory as your Excel file</li>
                <li>
                  Add audio files (MP3, WAV, M4A, AAC) with names matching exactly the names in your
                  Excel file.
                </li>
                <li>Example: For "John Doe", create "John Doe.mp3"</li>
                <li>If an audio file is missing, that name will be skipped during playback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Shortcuts Tab -->
      <div v-if="activeTab === 'shortcuts'" class="space-y-8">
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">Keyboard Shortcuts</h3>
            <p class="section-description">Quick access keys for common actions</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Navigation shortcuts -->
            <div class="shortcuts-group">
              <h4 class="shortcuts-group-title text-blue-400">Navigation</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-label">Previous Slide</span>
                  <kbd class="shortcut-key">←/↑</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Next Slide</span>
                  <kbd class="shortcut-key">→/↓/Space</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Previous Slide (Global)</span>
                  <kbd class="shortcut-key">Ctrl+Shift+←</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Next Slide (Global)</span>
                  <kbd class="shortcut-key">Ctrl+Shift+→</kbd>
                </div>
              </div>
            </div>

            <!-- Pagination shortcuts -->
            <div class="shortcuts-group">
              <h4 class="shortcuts-group-title text-cyan-400">Pagination</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-label">Previous Page (Names/Unattended)</span>
                  <kbd class="shortcut-key">-</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Next Page (Names/Unattended)</span>
                  <kbd class="shortcut-key">=</kbd>
                </div>
              </div>
            </div>

            <!-- Display shortcuts -->
            <div class="shortcuts-group">
              <h4 class="shortcuts-group-title text-green-400">Display Controls</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-label">Freeze/Unfreeze Displays</span>
                  <kbd class="shortcut-key">Ctrl+Shift+F</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Black Out Screens</span>
                  <kbd class="shortcut-key">Ctrl+B</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Flip Screens</span>
                  <kbd class="shortcut-key">Ctrl+Shift+X</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Reload Data</span>
                  <kbd class="shortcut-key">Ctrl+R</kbd>
                </div>
              </div>
            </div>

            <!-- Settings shortcuts -->
            <div class="shortcuts-group">
              <h4 class="shortcuts-group-title text-yellow-400">Settings</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-label">Open Settings</span>
                  <kbd class="shortcut-key">{{ isMacOs ? 'Cmd+,' : 'Ctrl+P' }}</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Close Settings</span>
                  <kbd class="shortcut-key">Esc</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Decrease Precedence</span>
                  <kbd class="shortcut-key">Ctrl+[</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Increase Precedence</span>
                  <kbd class="shortcut-key">Ctrl+]</kbd>
                </div>
              </div>
            </div>

            <!-- Other shortcuts -->
            <div class="shortcuts-group">
              <h4 class="shortcuts-group-title text-purple-400">Other</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-label">Toggle Audible Names</span>
                  <kbd class="shortcut-key">Ctrl+Shift+A</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Play/Stop Audible Names</span>
                  <kbd class="shortcut-key">Ctrl+P</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Previous Name</span>
                  <kbd class="shortcut-key">[</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Next Name</span>
                  <kbd class="shortcut-key">]</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Toggle Auto Playback</span>
                  <kbd class="shortcut-key">Ctrl+Shift+P</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Search</span>
                  <kbd class="shortcut-key">Ctrl+F</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-label">Close Excel File</span>
                  <kbd class="shortcut-key">Ctrl+W</kbd>
                </div>
                <div class="shortcut-item inline-flex">
                  <span class="shortcut-label"
                    >Display large preview (while hovering thumbnail)</span
                  >
                  <kbd class="shortcut-key">/</kbd>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <p class="text-sm text-gray-400">
              <strong>Note:</strong> On macOS, use Command (⌘) key instead of Control (Ctrl) key.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted, watch, ref, computed } from 'vue'
import type { Config } from '../interfaces/Config'

// Define emits for when component is used within main app
const emit = defineEmits(['save'])

// Check if we're running in standalone mode by checking the URL
const isStandaloneMode = window.location.hash.includes('/settings')

// Check if we're on macOS
const isMacOs = ref(navigator.platform.toUpperCase().indexOf('MAC') >= 0)

// Check if we're on Windows
const isWindows = computed(() => navigator.platform.toLowerCase().includes('win'))

// Active tab state
const activeTab = ref('appearance')

// Tab configuration with string icons for simplicity
const tabs = ref([
  {
    id: 'appearance',
    name: 'Appearance',
    icon: 'appearance'
  },
  {
    id: 'assets',
    name: 'Assets',
    icon: 'assets'
  },
  {
    id: 'display',
    name: 'Preferences',
    icon: 'display'
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: 'audio'
  },
  {
    id: 'shortcuts',
    name: 'Shortcuts',
    icon: 'shortcuts'
  }
])

// Icon component helper
const getTabIcon = (iconType: string) => {
  const icons = {
    appearance: `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z" clip-rule="evenodd" />
      </svg>
    `,
    assets: `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
      </svg>
    `,
    display: `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
      </svg>
    `,
    audio: `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
      </svg>
    `,
    shortcuts: `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
      </svg>
    `
  }
  return icons[iconType] || ''
}

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
        logoInverted: '',
        useDefaultAssets: true,
        maxLogoSize: 60,
        logoVerticalPosition: 0
      },
      fonts: {
        slidesFont: 'TheWaveSans'
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
    delayBeforePlayback: 200,
    gapBetweenNames: 200,
    autoPlayback: true,
    continuousPlayback: true,
    showNamesOnSideOnly: true
  },
  namesPrecedence: 0,
  distributeNames: true
})

// Store image previews as data URLs
const imagePreviews = reactive({
  background: '',
  backgroundNames: '',
  logo: '',
  logoInverted: ''
})

// Tab persistence functions
const loadLastOpenedTab = async (): Promise<void> => {
  try {
    const state = await window.electron.ipcRenderer.invoke('get-state')
    if (state?.lastOpenedTab) {
      activeTab.value = state.lastOpenedTab
    }
  } catch (error) {
    console.error('Failed to load last opened tab:', error)
    // Fall back to default tab if loading fails
    activeTab.value = 'appearance'
  }
}

const saveCurrentTab = async (): Promise<void> => {
  try {
    await window.electron.ipcRenderer.invoke('update-state', {
      lastOpenedTab: activeTab.value
    })
  } catch (error) {
    console.error('Failed to save current tab:', error)
  }
}

// Handle Escape keypress
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape') {
    closeSettings()
  }
}

onMounted(() => {
  // Initialize with provided config
  initializeSettings()

  // Load the last opened tab from state
  loadLastOpenedTab()

  // Load image previews
  loadImagePreviews()

  // Add Escape key event listener
  document.addEventListener('keydown', handleKeyDown)

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
      settings.assets.useDefaultAssets =
        config.assets.useDefaultAssets !== undefined ? config.assets.useDefaultAssets : true
      settings.assets.maxLogoSize = config.assets.maxLogoSize ?? 60
      settings.assets.logoVerticalPosition = config.assets.logoVerticalPosition ?? 0

      settings.fonts.slidesFont = config.fonts?.slidesFont || 'TheWaveSans'
      settings.fonts.useBoldTitles =
        config.fonts.useBoldTitles !== undefined ? config.fonts.useBoldTitles : false

      settings.audibleNames.enabled = config.audibleNames?.enabled || false
      settings.audibleNames.delayBeforePlayback = config.audibleNames?.delayBeforePlayback ?? 200
      settings.audibleNames.gapBetweenNames = config.audibleNames?.gapBetweenNames ?? 200
      settings.audibleNames.autoPlayback =
        config.audibleNames?.autoPlayback !== undefined ? config.audibleNames.autoPlayback : true
      settings.audibleNames.continuousPlayback =
        config.audibleNames?.continuousPlayback !== undefined
          ? config.audibleNames.continuousPlayback
          : true
      settings.audibleNames.showNamesOnSideOnly =
        config.audibleNames?.showNamesOnSideOnly !== undefined
          ? config.audibleNames.showNamesOnSideOnly
          : true

      settings.namesPrecedence = config.namesPrecedence || 0
      settings.distributeNames = config.distributeNames !== undefined ? config.distributeNames : true

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
  settings.assets.useDefaultAssets =
    props.config.assets.useDefaultAssets !== undefined ? props.config.assets.useDefaultAssets : true
  settings.assets.maxLogoSize = props.config.assets.maxLogoSize ?? 60
  settings.assets.logoVerticalPosition = props.config.assets.logoVerticalPosition ?? 0

  settings.fonts.slidesFont = props.config.fonts?.slidesFont || 'TheWaveSans'
  settings.fonts.useBoldTitles =
    props.config.fonts.useBoldTitles !== undefined ? props.config.fonts.useBoldTitles : false

  settings.audibleNames.enabled = props.config.audibleNames?.enabled || false
  settings.audibleNames.delayBeforePlayback = props.config.audibleNames?.delayBeforePlayback ?? 200
  settings.audibleNames.gapBetweenNames = props.config.audibleNames?.gapBetweenNames ?? 200
  settings.audibleNames.autoPlayback =
    props.config.audibleNames?.autoPlayback !== undefined
      ? props.config.audibleNames.autoPlayback
      : true
  settings.audibleNames.continuousPlayback =
    props.config.audibleNames?.continuousPlayback !== undefined
      ? props.config.audibleNames.continuousPlayback
      : true
  settings.audibleNames.showNamesOnSideOnly =
    props.config.audibleNames?.showNamesOnSideOnly !== undefined
      ? props.config.audibleNames.showNamesOnSideOnly
      : true

  settings.namesPrecedence = props.config.namesPrecedence || 0
  settings.distributeNames = props.config.distributeNames !== undefined ? props.config.distributeNames : true
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
  // Remove Escape key event listener
  document.removeEventListener('keydown', handleKeyDown)
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
    settings.assets.useDefaultAssets = newConfig.assets.useDefaultAssets ?? true
    settings.assets.maxLogoSize = newConfig.assets.maxLogoSize ?? 60
    settings.assets.logoVerticalPosition = newConfig.assets.logoVerticalPosition ?? 0

    settings.fonts.slidesFont = newConfig.fonts?.slidesFont || 'TheWaveSans'
    settings.fonts.useBoldTitles = newConfig.fonts?.useBoldTitles ?? false

    settings.audibleNames.enabled = newConfig.audibleNames?.enabled || false
    settings.audibleNames.delayBeforePlayback = newConfig.audibleNames?.delayBeforePlayback ?? 200
    settings.audibleNames.gapBetweenNames = newConfig.audibleNames?.gapBetweenNames ?? 200
    settings.audibleNames.autoPlayback =
      newConfig.audibleNames?.autoPlayback !== undefined
        ? newConfig.audibleNames.autoPlayback
        : true
    settings.audibleNames.continuousPlayback =
      newConfig.audibleNames?.continuousPlayback !== undefined
        ? newConfig.audibleNames.continuousPlayback
        : true
    settings.audibleNames.showNamesOnSideOnly =
      newConfig.audibleNames?.showNamesOnSideOnly !== undefined
        ? newConfig.audibleNames.showNamesOnSideOnly
        : true

    settings.namesPrecedence = newConfig.namesPrecedence ?? 2

    // Load image previews when config changes
    loadImagePreviews()
  },
  { deep: true, immediate: true }
)

// Watch for active tab changes and save to state
watch(activeTab, () => {
  saveCurrentTab()
})

const settingsChanged = async (): Promise<void> => {
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
      logoInverted: settings.assets.logoInverted,
      useDefaultAssets: settings.assets.useDefaultAssets,
      maxLogoSize: settings.assets.maxLogoSize,
      logoVerticalPosition: settings.assets.logoVerticalPosition
    },
    fonts: {
      slidesFont: settings.fonts.slidesFont,
      useBoldTitles: settings.fonts.useBoldTitles
    },
    audibleNames: {
      enabled: settings.audibleNames.enabled,
      delayBeforePlayback: settings.audibleNames.delayBeforePlayback,
      gapBetweenNames: settings.audibleNames.gapBetweenNames,
      autoPlayback: settings.audibleNames.autoPlayback,
      continuousPlayback: settings.audibleNames.continuousPlayback,
      showNamesOnSideOnly: settings.audibleNames.showNamesOnSideOnly
    },
    namesPrecedence: settings.namesPrecedence,
    distributeNames: settings.distributeNames
  }

  // Stop audio playback if audible names are disabled
  if (!settingsCopy.audibleNames.enabled) {
    window.electron.ipcRenderer.send('audio-stop')
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
/* Main Layout */
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.settings-header {
  flex-shrink: 0;
}

.tab-navigation {
  flex-shrink: 0;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 2rem;
}

/* Section Styling */
.settings-section {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.75rem;
  padding: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(75, 85, 99, 0.2);
  padding-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: rgb(156, 163, 175);
  margin: 0;
}

/* Input Styling */
.input-group {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(209, 213, 219);
  margin-bottom: 0.5rem;
}

.input-description {
  font-size: 0.75rem;
  color: rgb(156, 163, 175);
  margin-top: 0.5rem;
  line-height: 1.4;
}

/* Color Input Styling */
.color-input-group {
  margin-bottom: 1.5rem;
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.color-picker {
  width: 3rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  padding: 0;
  outline: none;
}

.color-text-input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.5rem;
  color: rgb(243, 244, 246);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.color-text-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Select Input Styling */
.select-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.5rem;
  color: rgb(243, 244, 246);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.select-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Number Input Styling */
.number-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.number-input {
  width: 6rem;
  padding: 0.625rem 0.75rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.5rem;
  color: rgb(243, 244, 246);
  font-size: 0.875rem;
  text-align: center;
  transition: border-color 0.2s;
}

.number-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.number-input-unit {
  font-size: 0.875rem;
  color: rgb(156, 163, 175);
  font-weight: 500;
}

/* Range Input Styling */
.range-input-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-input {
  flex: 1;
  height: 0.5rem;
  background: rgb(55, 65, 81);
  border-radius: 0.25rem;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  background: rgb(59, 130, 246);
  border-radius: 50%;
  transition: background-color 0.2s;
}

.range-input::-webkit-slider-thumb:hover {
  background: rgb(96, 165, 250);
}

.range-input::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  background: rgb(59, 130, 246);
  border-radius: 50%;
  border: none;
  transition: background-color 0.2s;
}

.range-input::-moz-range-thumb:hover {
  background: rgb(96, 165, 250);
}

.range-value {
  min-width: 3rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(209, 213, 219);
  padding: 0.25rem 0.5rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.25rem;
}

/* Checkbox Styling */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.25rem;
  color: rgb(59, 130, 246);
  transition: all 0.2s;
}

.checkbox-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(209, 213, 219);
}

/* Asset Input Styling */
.asset-input-group {
  margin-bottom: 1.5rem;
}

.asset-input-wrapper {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.asset-text-input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.5rem;
  color: rgb(243, 244, 246);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.asset-text-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.asset-buttons {
  display: flex;
  gap: 0.5rem;
}

.asset-preview {
  max-width: 100%;
  border: 1px solid rgba(75, 85, 99, 0.7);
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(31, 41, 55, 0.5);
  padding: 0.5rem;
}

.asset-preview img {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  border-radius: 0.25rem;
}

/* Button Styling */
.btn-secondary {
  padding: 0.625rem 1rem;
  background: rgb(59, 130, 246);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: rgb(37, 99, 235);
}

.btn-danger {
  padding: 0.625rem 1rem;
  background: rgb(239, 68, 68);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background: rgb(220, 38, 38);
}

/* Info Card Styling */
.info-card {
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(147, 197, 253);
  margin: 0;
}

.info-card-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card-list li {
  font-size: 0.75rem;
  color: rgb(156, 163, 175);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.info-card-list li:last-child {
  margin-bottom: 0;
}

/* Shortcuts Styling */
.shortcuts-group {
  background: rgba(31, 41, 55, 0.3);
  border: 1px solid rgba(75, 85, 99, 0.2);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.shortcuts-group-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.shortcut-item:not(:last-child) {
  margin-bottom: 0.75rem;
}

.shortcut-label {
  font-size: 0.875rem;
  color: rgb(209, 213, 219);
}

.shortcut-key {
  padding: 0.25rem 0.5rem;
  background: rgb(55, 65, 81);
  border: 1px solid rgb(75, 85, 99);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  color: rgb(243, 244, 246);
}

/* Scrollbar Styling */
.settings-content::-webkit-scrollbar {
  width: 8px;
}

.settings-content::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.7);
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8);
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-content {
    padding: 1rem;
  }

  .settings-section {
    padding: 1.5rem;
  }

  .color-input-wrapper,
  .asset-input-wrapper {
    flex-direction: column;
  }

  .asset-buttons {
    justify-content: flex-start;
  }
}
</style>
