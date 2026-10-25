<template>
  <div class="settings-panel ui-root w-full h-full overflow-hidden select-none">
    <!-- Sidebar Navigation -->
    <nav class="tab-navigation">
      <div class="sidebar-heading">Settings</div>
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="nav-item"
        :class="{ 'is-active': activeTab === tab.id }"
      >
        <span class="nav-icon" :style="{ background: tab.color }">
          <!-- Appearance Icon -->
          <svg v-if="tab.icon === 'appearance'" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Assets Icon -->
          <svg v-else-if="tab.icon === 'assets'" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Display Icon -->
          <svg v-else-if="tab.icon === 'display'" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Audio Icon -->
          <svg v-else-if="tab.icon === 'audio'" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Shortcuts Icon -->
          <svg
            v-else-if="tab.icon === 'shortcuts'"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            viewBox="0 0 24 24"
          >
            <rect x="2.5" y="6" width="19" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
          </svg>
        </span>
        <span>{{ tab.name }}</span>
      </button>
    </nav>

    <div class="settings-main">
      <!-- Header -->
      <div class="settings-header">
        <h2 class="settings-title">{{ tabs.find((tab) => tab.id === activeTab)?.name }}</h2>
        <button v-if="isMacOs" @click="closeSettings" class="ui-btn ui-btn-icon" title="Close">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="settings-content ui-scroll">
        <!-- Appearance Tab -->
        <div v-if="activeTab === 'appearance'" class="tab-body">
          <!-- Colors Section -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Colors</h3>
              <p class="section-description">Customize the color scheme for your presentations</p>
            </div>
            <div class="form-group">
              <div class="form-row">
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
                    class="ui-input color-text-input"
                    @change="settingsChanged"
                  />
                </div>
              </div>

              <div class="form-row">
                <label class="input-label">Primary Text</label>
                <div class="color-input-wrapper">
                  <input v-model="settings.colors.primaryText" type="color" class="color-picker" />
                  <input
                    v-model="settings.colors.primaryText"
                    type="text"
                    class="ui-input color-text-input"
                    @change="settingsChanged"
                  />
                </div>
              </div>

              <div class="form-row">
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
                    class="ui-input color-text-input"
                    @change="settingsChanged"
                  />
                </div>
              </div>

              <div class="form-row">
                <label class="input-label">Secondary Text</label>
                <div class="color-input-wrapper">
                  <input
                    v-model="settings.colors.secondaryText"
                    type="color"
                    class="color-picker"
                  />
                  <input
                    v-model="settings.colors.secondaryText"
                    type="text"
                    class="ui-input color-text-input"
                    @change="settingsChanged"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Fonts Section -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Typography</h3>
              <p class="section-description">Choose fonts and text styling options</p>
            </div>
            <div class="form-group">
              <div class="form-row">
                <label class="input-label">Slides Font</label>
                <select
                  v-model="settings.fonts.slidesFont"
                  class="ui-select select-input"
                  @change="settingsChanged"
                >
                  <option value="TheWaveSans">The Wave Sans</option>
                  <option value="CFDin-Bold">CF Din Bold</option>
                  <option value="Effra-Heavy">Effra Heavy</option>
                  <option value="FreeScript">Free Script</option>
                  <option value="ZonaPro-Black">Zona Pro Black</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-row-text">
                  <label for="useBoldTitles" class="input-label">Use bold titles</label>
                  <p class="input-description">Make slide titles appear in bold text</p>
                </div>
                <input
                  type="checkbox"
                  id="useBoldTitles"
                  v-model="settings.fonts.useBoldTitles"
                  class="ui-switch"
                  @change="settingsChanged"
                />
              </div>
            </div>
          </section>

          <!-- Logo Settings Section -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Logo Display</h3>
              <p class="section-description">Configure logo appearance on blank cards</p>
            </div>
            <div class="form-group">
              <div class="form-row">
                <div class="form-row-text">
                  <label class="input-label">Maximum Logo Size</label>
                  <p class="input-description">
                    Controls the maximum width and height of the logo on blank cards
                  </p>
                </div>
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
              </div>

              <div class="form-row">
                <div class="form-row-text">
                  <label class="input-label">Vertical Position Offset</label>
                  <p class="input-description">
                    Adjusts the vertical position of the logo on blank cards (positive moves down,
                    negative moves up)
                  </p>
                </div>
                <div class="number-input-wrapper">
                  <input
                    v-model.number="settings.assets.logoVerticalPosition"
                    type="number"
                    min="-500"
                    max="500"
                    step="10"
                    class="ui-input number-input"
                    @change="settingsChanged"
                  />
                  <span class="number-input-unit">px</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Assets Tab -->
        <div v-if="activeTab === 'assets'" class="tab-body">
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Images & Assets</h3>
              <p class="section-description">
                Upload custom backgrounds and logos for your presentations
              </p>
            </div>

            <div class="form-group">
              <!-- Background -->
              <div class="form-row form-row-stack">
                <label class="input-label">Background Image</label>
                <div class="asset-input-wrapper">
                  <input
                    v-model="settings.assets.background"
                    type="text"
                    class="ui-input asset-text-input"
                    placeholder="Path to background image"
                  />
                  <div class="asset-buttons">
                    <button class="ui-btn" @click="selectFile('background')">Browse…</button>
                    <button
                      v-if="settings.assets.background"
                      class="ui-btn ui-btn-danger"
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
              <div class="form-row form-row-stack">
                <label class="input-label">Names Background</label>
                <div class="asset-input-wrapper">
                  <input
                    v-model="settings.assets.backgroundNames"
                    type="text"
                    class="ui-input asset-text-input"
                    placeholder="Path to names background image"
                  />
                  <div class="asset-buttons">
                    <button class="ui-btn" @click="selectFile('backgroundNames')">Browse…</button>
                    <button
                      v-if="settings.assets.backgroundNames"
                      class="ui-btn ui-btn-danger"
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
              <div class="form-row form-row-stack">
                <label class="input-label">Logo</label>
                <div class="asset-input-wrapper">
                  <input
                    v-model="settings.assets.logo"
                    type="text"
                    class="ui-input asset-text-input"
                    placeholder="Path to logo image"
                  />
                  <div class="asset-buttons">
                    <button class="ui-btn" @click="selectFile('logo')">Browse…</button>
                    <button
                      v-if="settings.assets.logo"
                      class="ui-btn ui-btn-danger"
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
              <div class="form-row form-row-stack">
                <label class="input-label">Inverted Logo</label>
                <div class="asset-input-wrapper">
                  <input
                    v-model="settings.assets.logoInverted"
                    type="text"
                    class="ui-input asset-text-input"
                    placeholder="Path to inverted logo image"
                  />
                  <div class="asset-buttons">
                    <button class="ui-btn" @click="selectFile('logoInverted')">Browse…</button>
                    <button
                      v-if="settings.assets.logoInverted"
                      class="ui-btn ui-btn-danger"
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
              <div class="form-row">
                <div class="form-row-text">
                  <label for="useDefaultAssets" class="input-label">Use default assets</label>
                  <p class="input-description">
                    When enabled, default assets will be used when custom assets are not set
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="useDefaultAssets"
                  v-model="settings.assets.useDefaultAssets"
                  class="ui-switch"
                  @change="settingsChanged"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- Display Tab -->
        <div v-if="activeTab === 'display'" class="tab-body">
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Side Screen</h3>
              <p class="section-description">Configure how names appear on the side screen</p>
            </div>
            <div class="form-group">
              <div class="form-row">
                <div class="form-row-text">
                  <label class="input-label">Precedence Slides</label>
                  <p class="input-description">
                    Number of slides ahead the names will appear on the side screen. For example, a
                    value of 2 means names will appear two slides before their main presentation.
                  </p>
                </div>
                <div class="number-input-wrapper">
                  <input
                    v-model.number="settings.namesPrecedence"
                    type="number"
                    min="0"
                    max="20"
                    class="ui-input number-input"
                    @change="settingsChanged"
                  />
                  <span class="number-input-unit">slides</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Distributed Names Setting -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Names Distribution / Balance</h3>
              <p class="section-description">Automatically distribute or balance names</p>
            </div>
            <div class="form-group">
              <div class="form-row">
                <div class="form-row-text">
                  <label for="distributeNames" class="input-label">
                    Distribute names automatically
                  </label>
                  <p class="input-description">
                    When enabled, names will be distributed equally across all no-range names cards
                    of the same group. Cards with ranges (from/to) will claim their names first,
                    then remaining names are split across cards without ranges.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="distributeNames"
                  v-model="settings.distributeNames"
                  class="ui-switch"
                  @change="settingsChanged"
                />
              </div>

              <div class="form-row">
                <div class="form-row-text">
                  <label for="balanceNamesPages" class="input-label">
                    Avoid last pages with only one or two names
                  </label>
                  <p class="input-description">
                    When a names or unattended card would end with a page holding just one or two
                    names, the previous page shows 13 names and the rest move to the last page (for
                    example, 17 names are split 13 + 4 instead of 16 + 1).
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="balanceNamesPages"
                  v-model="settings.balanceNamesPages"
                  class="ui-switch"
                  @change="settingsChanged"
                />
              </div>
            </div>
          </section>

          <!-- Slide Transitions Setting -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Slide Transitions</h3>
              <p class="section-description">Animate changes between slides on the displays</p>
            </div>
            <div class="form-group">
              <div class="form-row">
                <div class="form-row-text">
                  <label for="slideTransitions" class="input-label">
                    Enable slide transitions
                  </label>
                  <p class="input-description">
                    When enabled, slides crossfade on the main and side screens and the logo glides
                    to its new position (for example from a blank card to a title card). Previews in
                    this window are not animated.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="slideTransitions"
                  v-model="settings.slideTransitions"
                  class="ui-switch"
                  @change="settingsChanged"
                />
              </div>

              <div class="form-row" :class="{ 'is-disabled': !settings.slideTransitions }">
                <div class="form-row-text">
                  <label class="input-label">Transition Duration</label>
                  <p class="input-description">
                    How long the outgoing slide takes to fade out. The incoming slide then waits
                    that long before animating in, so the two never overlap.
                  </p>
                </div>
                <div class="number-input-wrapper">
                  <input
                    v-model.number="settings.transitionDuration"
                    type="number"
                    min="100"
                    max="2000"
                    step="50"
                    class="ui-input number-input"
                    :disabled="!settings.slideTransitions"
                    @change="settingsChanged"
                  />
                  <span class="number-input-unit">ms</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Audio Tab -->
        <div v-if="activeTab === 'audio'" class="tab-body">
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Audible Names</h3>
              <p class="section-description">Configure audio playback for name pronunciation</p>
            </div>

            <!-- Enable Audio -->
            <div class="form-group">
              <div class="form-row">
                <div class="form-row-text">
                  <label for="audibleNamesEnabled" class="input-label">
                    Enable Audible Names Playback
                  </label>
                  <p class="input-description">
                    When enabled, names will be played audibly when a names slide is displayed
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="audibleNamesEnabled"
                  v-model="settings.audibleNames.enabled"
                  class="ui-switch"
                  @change="settingsChanged"
                />
              </div>
            </div>
          </section>

          <!-- Audio Settings (only shown when enabled) -->
          <template v-if="settings.audibleNames.enabled">
            <section class="settings-section">
              <div class="section-header">
                <h3 class="section-title">Timing</h3>
              </div>
              <div class="form-group">
                <div class="form-row">
                  <div class="form-row-text">
                    <label class="input-label">Delay Before Playback</label>
                    <p class="input-description">
                      Delay before starting auto playback when a names slide is displayed
                    </p>
                  </div>
                  <div class="number-input-wrapper">
                    <input
                      v-model.number="settings.audibleNames.delayBeforePlayback"
                      type="number"
                      min="0"
                      max="10000"
                      step="100"
                      class="ui-input number-input"
                      @change="settingsChanged"
                    />
                    <span class="number-input-unit">ms</span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-row-text">
                    <label class="input-label">Gap Between Names</label>
                    <p class="input-description">
                      Silence duration between each name during playback
                    </p>
                  </div>
                  <div class="number-input-wrapper">
                    <input
                      v-model.number="settings.audibleNames.gapBetweenNames"
                      type="number"
                      min="0"
                      max="5000"
                      step="100"
                      class="ui-input number-input"
                      @change="settingsChanged"
                    />
                    <span class="number-input-unit">ms</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Playback Options -->
            <section class="settings-section">
              <div class="section-header">
                <h3 class="section-title">Playback</h3>
              </div>
              <div class="form-group">
                <div class="form-row">
                  <div class="form-row-text">
                    <label for="autoPlayback" class="input-label">Auto Playback</label>
                    <p class="input-description">
                      Automatically start playback when a names slide is displayed
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="autoPlayback"
                    v-model="settings.audibleNames.autoPlayback"
                    class="ui-switch"
                    @change="settingsChanged"
                  />
                </div>

                <div class="form-row">
                  <div class="form-row-text">
                    <label for="continuousPlayback" class="input-label">
                      Continuous Playback
                    </label>
                    <p class="input-description">
                      Play names continuously without pausing between each name. When disabled,
                      playback pauses after each name until manually resumed
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="continuousPlayback"
                    v-model="settings.audibleNames.continuousPlayback"
                    class="ui-switch"
                    @change="settingsChanged"
                  />
                </div>

                <div class="form-row">
                  <div class="form-row-text">
                    <label for="showNamesOnSideOnly" class="input-label">
                      Show Names on "Side Only" Cards
                    </label>
                    <p class="input-description">
                      Display spoken names under the logo on "Side Only" cards during playback
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="showNamesOnSideOnly"
                    v-model="settings.audibleNames.showNamesOnSideOnly"
                    class="ui-switch"
                    @change="settingsChanged"
                  />
                </div>
              </div>
            </section>

            <!-- Setup Instructions -->
            <div class="info-card">
              <div class="info-card-header">
                <svg
                  class="w-5 h-5 text-[var(--ui-accent)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
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
          </template>
        </div>

        <!-- Shortcuts Tab -->
        <div v-if="activeTab === 'shortcuts'" class="tab-body">
          <p class="section-description -mt-2">Quick access keys for common actions</p>

          <!-- Navigation shortcuts -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Navigation</h3>
            </div>
            <div class="form-group">
              <div class="shortcut-item">
                <span class="shortcut-label">Previous Slide</span>
                <kbd class="ui-kbd">←/↑</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Next Slide</span>
                <kbd class="ui-kbd">→/↓/Space</kbd>
              </div>
            </div>
          </section>

          <!-- Pagination shortcuts -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Pagination</h3>
            </div>
            <div class="form-group">
              <div class="shortcut-item">
                <span class="shortcut-label">Previous Page (Names/Unattended)</span>
                <kbd class="ui-kbd">-</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Next Page (Names/Unattended)</span>
                <kbd class="ui-kbd">=</kbd>
              </div>
            </div>
          </section>

          <!-- Display shortcuts -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Display Controls</h3>
            </div>
            <div class="form-group">
              <div class="shortcut-item">
                <span class="shortcut-label">Freeze/Unfreeze Displays</span>
                <kbd class="ui-kbd">Ctrl+Shift+F</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Black Out Screens</span>
                <kbd class="ui-kbd">Ctrl+B</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Flip Screens</span>
                <kbd class="ui-kbd">Ctrl+Shift+X</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Reload Data</span>
                <kbd class="ui-kbd">Ctrl+R</kbd>
              </div>
            </div>
          </section>

          <!-- Settings shortcuts -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Settings</h3>
            </div>
            <div class="form-group">
              <div class="shortcut-item">
                <span class="shortcut-label">Open Settings</span>
                <kbd class="ui-kbd">{{ isMacOs ? 'Cmd+,' : 'Ctrl+,' }}</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Close Settings</span>
                <kbd class="ui-kbd">Esc</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Decrease Precedence</span>
                <kbd class="ui-kbd">Ctrl+[</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Increase Precedence</span>
                <kbd class="ui-kbd">Ctrl+]</kbd>
              </div>
            </div>
          </section>

          <!-- Other shortcuts -->
          <section class="settings-section">
            <div class="section-header">
              <h3 class="section-title">Other</h3>
            </div>
            <div class="form-group">
              <div class="shortcut-item">
                <span class="shortcut-label">Toggle Audible Names</span>
                <kbd class="ui-kbd">Ctrl+Shift+A</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Play/Stop Audible Names</span>
                <kbd class="ui-kbd">Ctrl+P</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Previous Name</span>
                <kbd class="ui-kbd">[</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Next Name</span>
                <kbd class="ui-kbd">]</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Toggle Auto Playback</span>
                <kbd class="ui-kbd">Ctrl+Shift+P</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Search</span>
                <kbd class="ui-kbd">Ctrl+F</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Close Excel File</span>
                <kbd class="ui-kbd">Ctrl+W</kbd>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-label">Display large preview (while hovering thumbnail)</span>
                <kbd class="ui-kbd">/</kbd>
              </div>
            </div>
          </section>

          <div class="info-card">
            <p class="text-[13px] text-[var(--ui-text-2)]">
              <strong class="text-[var(--ui-text)]">Note:</strong> On macOS, use Command (⌘) key
              instead of Control (Ctrl) key.
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
    icon: 'appearance',
    color: '#0a84ff'
  },
  {
    id: 'assets',
    name: 'Assets',
    icon: 'assets',
    color: '#ff9f0a'
  },
  {
    id: 'display',
    name: 'Preferences',
    icon: 'display',
    color: '#5e5ce6'
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: 'audio',
    color: '#ff375f'
  },
  {
    id: 'shortcuts',
    name: 'Shortcuts',
    icon: 'shortcuts',
    color: '#8e8e93'
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
  distributeNames: true,
  balanceNamesPages: false,
  slideTransitions: false,
  transitionDuration: 400
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
      settings.distributeNames =
        config.distributeNames !== undefined ? config.distributeNames : true
      settings.balanceNamesPages = config.balanceNamesPages ?? false
      settings.slideTransitions = config.slideTransitions ?? false
      settings.transitionDuration = config.transitionDuration ?? 400

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
  settings.distributeNames =
    props.config.distributeNames !== undefined ? props.config.distributeNames : true
  settings.balanceNamesPages = props.config.balanceNamesPages ?? false
  settings.slideTransitions = props.config.slideTransitions ?? false
  settings.transitionDuration = props.config.transitionDuration ?? 400
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
    settings.balanceNamesPages = newConfig.balanceNamesPages ?? false
    settings.slideTransitions = newConfig.slideTransitions ?? false
    settings.transitionDuration = newConfig.transitionDuration ?? 400

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
    distributeNames: settings.distributeNames,
    balanceNamesPages: settings.balanceNamesPages,
    slideTransitions: settings.slideTransitions,
    transitionDuration: settings.transitionDuration
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
  height: 100vh;
}

/* Sidebar */
.tab-navigation {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 210px;
  padding: 1rem 0.625rem;
  background: var(--ui-bg-sidebar);
  border-right: 1px solid var(--ui-separator);
}

.sidebar-heading {
  padding: 0 0.5rem 0.75rem;
  font-size: 13px;
  font-weight: 700;
  color: var(--ui-text-2);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: 32px;
  padding: 0 0.5rem;
  border-radius: var(--ui-radius-sm);
  color: var(--ui-text);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  transition: background-color 0.12s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.nav-item.is-active {
  background: var(--ui-accent);
  color: #fff;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: #fff;
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.25);
}

.nav-icon svg {
  width: 13px;
  height: 13px;
}

/* Content */
.settings-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.settings-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1.75rem;
  border-bottom: 1px solid var(--ui-border);
}

.settings-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.75rem 2.5rem;
}

.tab-body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  max-width: 720px;
  margin: 0 auto;
}

/* Section Styling */
.section-header {
  padding: 0 0.25rem;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text);
  margin: 0;
}

.section-description {
  font-size: 12px;
  color: var(--ui-text-2);
  margin: 2px 0 0;
}

/* Grouped rows, like the inset lists in System Settings */
.form-group {
  border-radius: 10px;
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.form-row,
.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 44px;
  padding: 0.625rem 1rem;
}

.form-row + .form-row,
.shortcut-item + .shortcut-item {
  box-shadow: inset 0 0.5px 0 var(--ui-border-strong);
}

.form-row-stack {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.form-row-text {
  min-width: 0;
  flex: 1;
}

.form-row.is-disabled .form-row-text {
  opacity: 0.45;
}

.input-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-text);
}

.input-description {
  font-size: 12px;
  color: var(--ui-text-2);
  margin-top: 2px;
  line-height: 1.4;
}

/* Color Input Styling */
.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  padding: 0;
  outline: none;
  cursor: pointer;
  overflow: hidden;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.color-text-input {
  width: 7.5rem;
  font-family: var(--ui-font-mono);
  font-size: 12px;
  text-transform: uppercase;
}

/* Select Input Styling */
.select-input {
  min-width: 11rem;
  height: 28px;
  font-size: 13px;
}

/* Number Input Styling */
.number-input-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.number-input {
  width: 6.5rem;
  padding: 0 0.5rem 0 0.75rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.number-input::-webkit-inner-spin-button {
  height: 18px;
  margin-left: 0.5rem;
  opacity: 0.6;
  cursor: pointer;
}

.number-input:hover::-webkit-inner-spin-button {
  opacity: 1;
}

.number-input-unit {
  min-width: 2.5rem;
  font-size: 12px;
  color: var(--ui-text-2);
}

/* Range Input Styling */
.range-input-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 15rem;
}

.range-input {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.4),
    0 0 0 0.5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.range-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  border: none;
}

.range-value {
  min-width: 2.75rem;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-text-2);
  font-variant-numeric: tabular-nums;
}

/* Asset Input Styling */
.asset-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.asset-text-input {
  flex: 1;
  min-width: 0;
}

.asset-buttons {
  display: flex;
  gap: 0.375rem;
}

.asset-preview {
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  padding: 0.5rem;
  background:
    repeating-conic-gradient(rgba(255, 255, 255, 0.04) 0% 25%, transparent 0% 50%) 50% / 16px 16px,
    rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.asset-preview img {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  border-radius: 4px;
}

/* Info Card Styling */
.info-card {
  background: rgba(10, 132, 255, 0.1);
  box-shadow: inset 0 0 0 0.5px rgba(10, 132, 255, 0.35);
  border-radius: 10px;
  padding: 1rem 1.125rem;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.info-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text);
  margin: 0;
}

.info-card-list {
  list-style: disc;
  padding-left: 2.5rem;
  margin: 0;
}

.info-card-list li {
  font-size: 12px;
  color: var(--ui-text-2);
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

.info-card-list li:last-child {
  margin-bottom: 0;
}

/* Shortcuts Styling */
.shortcut-item {
  min-height: 40px;
}

.shortcut-label {
  font-size: 13px;
  color: var(--ui-text);
}

/* Responsive Design */
@media (max-width: 768px) {
  .tab-navigation {
    width: 180px;
  }

  .settings-content {
    padding: 1rem;
  }

  .range-input-wrapper {
    width: 11rem;
  }
}
</style>
