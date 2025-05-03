<template>
  <div
    class="excel-structure-panel bg-gray-800 w-full h-full overflow-hidden p-6 text-gray-200 select-none"
  >
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Excel File Structure</h2>
      <button
        @click="closeWindow"
        class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 cursor-pointer"
      >
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div class="content-wrapper overflow-y-auto h-full pr-4">
      <!-- Content sections -->
      <div class="mb-8">
        <p class="mb-4 text-gray-300">
          DualPresenter uses a specific Excel format to organize slides and names. The Excel file
          should contain two sheets: the first sheet for
          <span class="text-yellow-400 font-semibold">SLIDES</span> and the second sheet for
          <span class="text-yellow-400 font-semibold">NAMES</span>.
        </p>
        <p class="text-gray-300">
          The Excel template provides the proper structure for creating presentations that work with
          DualPresenter. You can download the template to get started.
        </p>

        <div class="mt-6 flex justify-center">
          <button
            @click="saveTemplate"
            class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded flex items-center cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"
                clip-rule="evenodd"
              />
            </svg>
            Save Template File
          </button>
        </div>
      </div>

      <!-- SLIDES sheet structure -->
      <div class="structure-section mb-8 bg-gray-700 p-5 rounded-lg">
        <h3 class="text-xl font-semibold text-yellow-400 mb-4">SLIDES Structure</h3>
        <p class="mb-4 text-gray-300">
          The first sheet in your Excel file defines the slides and their properties. Use this exact
          order of columns.
        </p>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-gray-800 text-gray-300 rounded-lg">
            <thead>
              <tr class="border-b border-gray-600">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Column</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Description</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Values</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Required</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">type</td>
                <td class="px-4 py-3 text-sm">Type of slide to display (first column)</td>
                <td class="px-4 py-3 text-sm">Blank, Title, Names, Image, Unattended</td>
                <td class="px-4 py-3 text-sm">Yes</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">title</td>
                <td class="px-4 py-3 text-sm">Title displayed on the slide</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">Yes</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">subtitle</td>
                <td class="px-4 py-3 text-sm">Subtitle displayed below title</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">group</td>
                <td class="px-4 py-3 text-sm">Group for "Names" type slides</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">from</td>
                <td class="px-4 py-3 text-sm">First name in the "Names" slide</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">until</td>
                <td class="px-4 py-3 text-sm">Last name in the "Names" slide</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">main_only</td>
                <td class="px-4 py-3 text-sm">Display only on main screen</td>
                <td class="px-4 py-3 text-sm">Yes/No (Default: auto)</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-sm">precedence</td>
                <td class="px-4 py-3 text-sm">Number of slides before "Names" slide appears</td>
                <td class="px-4 py-3 text-sm">Integer</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 text-sm text-gray-400">
          The first row of the sheet should be the header row.
        </p>
      </div>

      <!-- NAMES sheet structure -->
      <div class="structure-section mb-8 bg-gray-700 p-5 rounded-lg">
        <h3 class="text-xl font-semibold text-yellow-400 mb-4">NAMES Structure</h3>
        <p class="mb-4 text-gray-300">
          The second sheet in your Excel file contains all names to be displayed. Use this exact
          order of columns.
        </p>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-gray-800 text-gray-300 rounded-lg">
            <thead>
              <tr class="border-b border-gray-600">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Column</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Description</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Values</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-200">Required</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">name</td>
                <td class="px-4 py-3 text-sm">Name of the person</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">Yes</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="px-4 py-3 font-mono text-sm">group</td>
                <td class="px-4 py-3 text-sm">Group the person belongs to</td>
                <td class="px-4 py-3 text-sm">Text</td>
                <td class="px-4 py-3 text-sm">Yes</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-sm">attending</td>
                <td class="px-4 py-3 text-sm">Whether the person is attending or not</td>
                <td class="px-4 py-3 text-sm">Yes/No</td>
                <td class="px-4 py-3 text-sm">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 text-sm text-gray-400">
          The first row of the sheet should be the header row.
        </p>
      </div>

      <!-- Card Types section -->
      <div class="structure-section mb-8 bg-gray-700 p-5 rounded-lg">
        <h3 class="text-xl font-semibold text-yellow-400 mb-4">Slide Types</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card-type bg-gray-800 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-blue-400 mb-2">Blank</h4>
            <p class="text-gray-300">
              A blank slide showing only the logo, with no additional content.
            </p>
          </div>
          <div class="card-type bg-gray-800 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-blue-400 mb-2">Title</h4>
            <p class="text-gray-300">
              Displays a large title and optional subtitle in the center of the screen.
            </p>
          </div>
          <div class="card-type bg-gray-800 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-blue-400 mb-2">Names</h4>
            <p class="text-gray-300">
              Displays a list of names from the NAMES sheet that match the specified group.
            </p>
          </div>
          <div class="card-type bg-gray-800 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-blue-400 mb-2">Image</h4>
            <p class="text-gray-300">
              Displays a full-screen image. The title field should contain the path to the image.
            </p>
          </div>
          <div class="card-type bg-gray-800 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-blue-400 mb-2">Unattended</h4>
            <p class="text-gray-300">
              Shows a list of names marked as not attending ("No" in the attending column).
            </p>
          </div>
        </div>
      </div>

      <!-- Side Screen Behavior -->
      <div class="structure-section mb-8 bg-gray-700 p-5 rounded-lg">
        <h3 class="text-xl font-semibold text-yellow-400 mb-4">Side Screen Behavior</h3>
        <p class="mb-3 text-gray-300">
          The side screen displays only <span class="font-semibold">Names</span> slides with an
          offset defined in settings.
        </p>
        <p class="mb-3 text-gray-300">
          For example, if the offset is set to -2, the side screen will show names slides two slides
          earlier than what is currently displayed on the main screen.
        </p>
        <p class="text-gray-300">You can control this behavior:</p>
        <ul class="list-disc pl-5 text-gray-300 space-y-2 mt-2">
          <li>Globally through the app settings</li>
          <li>Per slide using the "precedence" field in the slide sheet</li>
          <li>
            By marking slides as "main_only" to prevent them from appearing on the side screen
          </li>
        </ul>
      </div>

      <!-- Best Practices -->
      <div class="structure-section mb-8">
        <h3 class="text-xl font-semibold text-green-400 mb-4">Best Practices</h3>
        <ul class="list-disc pl-5 text-gray-300 space-y-2">
          <li>Always use a fresh template for a new project</li>
          <li>For image slides, use valid relative or absolute paths to the image files</li>
          <li>The Excel file is automatically monitored for changes and will refresh when saved</li>
          <li>Use the "main_only" option for slides that should not appear on the side screen</li>
          <li>
            When "from" and "until" fields are not specified, all names in the group will be
            displayed
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// Define emits for when component is used within main app
const emit = defineEmits(['close'])

// Check if we're running in standalone mode by checking the URL
const isStandaloneMode = window.location.hash.includes('/excel-structure')

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
  overflow: hidden;
}

.content-wrapper {
  height: calc(100% - 50px);
  padding-right: 20px;
  padding-bottom: 30px;
  margin-right: -20px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Customize scrollbar */
.content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.content-wrapper::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 4px;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.7);
  border-radius: 4px;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8);
}
</style>
