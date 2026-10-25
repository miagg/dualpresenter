<template>
  <div class="excel-structure-panel ui-root w-full h-full overflow-hidden select-none">
    <div v-if="isMacOs" class="panel-header">
      <h2 class="panel-title">Excel File Structure</h2>
      <button @click="closeWindow" class="ui-btn ui-btn-icon" title="Close">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="content-wrapper ui-scroll">
      <div class="content-inner">
        <!-- Introduction -->
        <div class="intro-card">
          <div class="intro-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
              <path d="M3.5 9h17M3.5 14.5h17M9.5 9v11.5" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="body-text mb-2">
              DualPresenter uses a specific Excel format to organize slides and names. The Excel
              file should contain two sheets: the first sheet for
              <span class="sheet-tag">SLIDES</span> and the second sheet for
              <span class="sheet-tag">NAMES</span>.
            </p>
            <p class="body-text">
              The Excel template provides the proper structure for creating presentations that work
              with DualPresenter. You can download the template to get started.
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <button @click="saveTemplate" class="ui-btn ui-btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"
                    clip-rule="evenodd"
                  />
                </svg>
                Save Template
              </button>
              <button @click="saveClientTemplate" class="ui-btn">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"
                    clip-rule="evenodd"
                  />
                </svg>
                Save Client Template
              </button>
            </div>
          </div>
        </div>

        <!-- SLIDES sheet structure -->
        <section class="structure-section">
          <h3 class="section-title">SLIDES Structure</h3>
          <p class="section-description">
            The first sheet in your Excel file defines the slides and their properties. Use this
            exact order of columns.
          </p>
          <div class="table-wrapper">
            <table class="structure-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Description</th>
                  <th>Values</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="col-name">order</td>
                  <td>
                    This can be used as a slide number. You might want to sort the slides using this
                    column
                  </td>
                  <td>Number</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td class="col-name">type</td>
                  <td>Type of slide to display</td>
                  <td>Blank, Category, Title, Names, Image, Unattended</td>
                  <td class="is-required">Yes</td>
                </tr>
                <tr>
                  <td class="col-name">title</td>
                  <td>Title displayed on the slide</td>
                  <td>Text</td>
                  <td class="is-required">Yes</td>
                </tr>
                <tr>
                  <td class="col-name">subtitle</td>
                  <td>Subtitle displayed below title</td>
                  <td>Text</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td class="col-name">group</td>
                  <td>Group for "Names" type slides</td>
                  <td>Text</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td class="col-name">from</td>
                  <td>First name in the "Names" slide</td>
                  <td>Text</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td class="col-name">until</td>
                  <td>Last name in the "Names" slide</td>
                  <td>Text</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td class="col-name">display</td>
                  <td>Target display for names slide</td>
                  <td>Auto, Main Only, Side Only, Both</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td class="col-name">precedence</td>
                  <td>Number of slides before "Names" slide appears</td>
                  <td>Integer</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="footnote">The first row of the sheet should be the header row.</p>
        </section>

        <!-- NAMES sheet structure -->
        <section class="structure-section">
          <h3 class="section-title">NAMES Structure</h3>
          <p class="section-description">
            The second sheet in your Excel file contains all names to be displayed. Use this exact
            order of columns.
          </p>
          <div class="table-wrapper">
            <table class="structure-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Description</th>
                  <th>Values</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="col-name">name</td>
                  <td>Name of the person</td>
                  <td>Text</td>
                  <td class="is-required">Yes</td>
                </tr>
                <tr>
                  <td class="col-name">group</td>
                  <td>Group the person belongs to</td>
                  <td>Text</td>
                  <td class="is-required">Yes</td>
                </tr>
                <tr>
                  <td class="col-name">attending</td>
                  <td>Whether the person is attending or not</td>
                  <td>Yes/No</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="footnote">The first row of the sheet should be the header row.</p>
        </section>

        <!-- Card Types section -->
        <section class="structure-section">
          <h3 class="section-title">Slide Types</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3">
            <div class="card-type">
              <h4 class="card-type-title">Blank</h4>
              <p class="card-type-text">
                A blank slide showing only the logo, with no additional content.
              </p>
            </div>
            <div class="card-type">
              <h4 class="card-type-title">Category</h4>
              <p class="card-type-text">
                Displays a large title and optional subtitle in the center of the screen.
              </p>
            </div>
            <div class="card-type">
              <h4 class="card-type-title">Title</h4>
              <p class="card-type-text">
                Displays a large title and optional subtitle in the center of the screen.
              </p>
            </div>
            <div class="card-type">
              <h4 class="card-type-title">Names</h4>
              <p class="card-type-text">
                Displays a list of names from the NAMES sheet that match the specified group.
              </p>
            </div>
            <div class="card-type">
              <h4 class="card-type-title">Image</h4>
              <p class="card-type-text">
                Displays a full-screen image. The title field should contain the path to the image.
              </p>
            </div>
            <div class="card-type">
              <h4 class="card-type-title">Unattended</h4>
              <p class="card-type-text">
                Shows a list of names marked as not attending ("No" in the attending column).
              </p>
            </div>
          </div>
        </section>

        <!-- Side Screen Behavior -->
        <section class="structure-section">
          <h3 class="section-title">Side Screen Behavior</h3>
          <div class="text-card">
            <p class="body-text mb-2">
              The side screen displays only <span class="font-semibold">Names</span> slides with an
              offset defined in settings.
            </p>
            <p class="body-text mb-2">
              For example, if the offset is set to -2, the side screen will show names slides two
              slides earlier than what is currently displayed on the main screen.
            </p>
            <p class="body-text">You can control this behavior:</p>
            <ul class="bullet-list mt-1.5">
              <li>Globally through the app settings</li>
              <li>Per slide using the "precedence" field in the slide sheet</li>
              <li>
                By setting display to "Main Only" to prevent them from appearing on the side screen
              </li>
            </ul>
          </div>
        </section>

        <!-- Best Practices -->
        <section class="structure-section">
          <h3 class="section-title">Best Practices</h3>
          <div class="text-card tip-card">
            <ul class="bullet-list">
              <li>Always use a fresh template for a new project</li>
              <li>For image slides, use valid relative or absolute paths to the image files</li>
              <li>
                The Excel file is automatically monitored for changes and will reload when saved
              </li>
              <li>
                Use the "display" option for slides that should only appear on main or side screen
              </li>
              <li>
                When "from" and "until" fields are not specified, all names in the group will be
                displayed
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

// Define emits for when component is used within main app
const emit = defineEmits(['close'])

// Check if we're running in standalone mode by checking the URL
const isStandaloneMode = window.location.hash.includes('/excel-structure')

// Check if we're on macOS
const isMacOs = ref(navigator.platform.toUpperCase().indexOf('MAC') >= 0)

// Function to close the window
const closeWindow = () => {
  if (isStandaloneMode) {
    // If in standalone mode, use window.close()
    window.close()
  } else {
    // If in modal mode, emit close event
    emit('close')
  }
}

// Function to save the template file
const saveTemplate = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('save-excel-template')

    if (result.success) {
      alert(`Template saved successfully to: ${result.filePath}`)
    } else {
      alert(`Failed to save template: ${result.message}`)
    }
  } catch (error) {
    alert('An error occurred while saving the template')
    console.error(error)
  }
}

const saveClientTemplate = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('save-excel-client-template')

    if (result.success) {
      alert(`Template saved successfully to: ${result.filePath}`)
    } else {
      alert(`Failed to save template: ${result.message}`)
    }
  } catch (error) {
    alert('An error occurred while saving the template')
    console.error(error)
  }
}

// Handle Escape keypress
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape') {
    closeWindow()
  }
}

onMounted(() => {
  // Add event listener for Escape key to close window
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Clean up event listener when component is unmounted
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.excel-structure-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1.75rem;
  background: var(--ui-bg-toolbar);
  border-bottom: 1px solid var(--ui-separator);
}

.panel-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-inner {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1.75rem 2.5rem;
}

.body-text {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ui-text-2);
}

.intro-card {
  display: flex;
  gap: 1rem;
  padding: 1.125rem;
  border-radius: 12px;
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.intro-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(180deg, #34c759, #248a3d);
  color: #fff;
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3);
}

.intro-icon svg {
  width: 22px;
  height: 22px;
}

.sheet-tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 214, 10, 0.15);
  color: var(--ui-yellow);
  font-family: var(--ui-font-mono);
  font-size: 11px;
  font-weight: 600;
}

.section-title {
  padding: 0 0.25rem;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text);
}

.section-description {
  padding: 0 0.25rem;
  margin-top: 2px;
  font-size: 12px;
  color: var(--ui-text-2);
}

.footnote {
  padding: 0 0.25rem;
  margin-top: 0.5rem;
  font-size: 11px;
  color: var(--ui-text-3);
}

.table-wrapper {
  margin-top: 0.625rem;
  overflow-x: auto;
  border-radius: 10px;
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.structure-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: var(--ui-text-2);
}

.structure-table th {
  padding: 0.5rem 0.875rem;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-text-3);
  border-bottom: 0.5px solid var(--ui-border-strong);
}

.structure-table td {
  padding: 0.5rem 0.875rem;
  vertical-align: top;
  line-height: 1.45;
}

.structure-table tbody tr + tr td {
  border-top: 0.5px solid var(--ui-border);
}

.structure-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.col-name {
  font-family: var(--ui-font-mono);
  color: var(--ui-text);
  white-space: nowrap;
}

.is-required {
  color: var(--ui-green);
  font-weight: 600;
}

.card-type {
  padding: 0.875rem 1rem;
  border-radius: 10px;
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.card-type-title {
  margin-bottom: 0.25rem;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text);
}

.card-type-text {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ui-text-2);
}

.text-card {
  margin-top: 0.625rem;
  padding: 1rem 1.125rem;
  border-radius: 10px;
  background: var(--ui-surface);
  box-shadow: inset 0 0 0 0.5px var(--ui-border-strong);
}

.tip-card {
  background: rgba(48, 209, 88, 0.08);
  box-shadow: inset 0 0 0 0.5px rgba(48, 209, 88, 0.3);
}

.bullet-list {
  list-style: disc;
  padding-left: 1.25rem;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ui-text-2);
}

.bullet-list li + li {
  margin-top: 0.25rem;
}
</style>
