import md5 from 'md5'
import { toPng } from 'html-to-image'
import type { Card } from '../interfaces/Card'
import type { Name } from '../interfaces/Name'
import type { Config } from '../interfaces/Config'

/**
 * Generates an MD5 hash for a slide object
 * @param card The card/slide object
 * @param names The names array for names slides
 * @param config The app configuration
 * @returns MD5 hash string
 */
export function generateSlideHash(card: Card, names: Name[], config: Config): string {
  // Create a serializable object containing all relevant data that affects the slide appearance
  const slideData = {
    id: card.id,
    type: card.type,
    title: card.title,
    subtitle: card.subtitle,
    group: card.group,
    from: card.from,
    until: card.until,
    // Include relevant parts of config
    colors: config.colors,
    fonts: config.fonts,
    // For names cards, include the filtered names
    names: card.group
      ? names.filter(
          (name) =>
            name.group === card.group &&
            name.attending &&
            (!card.from || name.name >= card.from) &&
            (!card.until || name.name <= card.until)
        )
      : []
  }

  // Convert to string and generate hash
  return md5(JSON.stringify(slideData))
}

/**
 * Generates a preview image for a slide
 * @param element The DOM element to capture
 * @param hash The MD5 hash to use as the filename
 * @returns Promise that resolves to the image path
 */
export async function generateSlidePreview(element: HTMLElement, hash: string): Promise<string> {
  try {
    console.log('Generating preview for element:', element)

    // Make sure the element is visible and fully rendered
    if (window.getComputedStyle(element).display === 'none') {
      console.warn('Element is not visible, forcing visibility')
      element.style.visibility = 'visible'
      element.style.display = 'block'
    }

    // Force a layout calculation
    element.getBoundingClientRect()

    // Generate a PNG from the element with enhanced settings
    const dataUrl = await toPng(element, {
      width: 1920,
      height: 1080,
      pixelRatio: 1,
      quality: 0.95,
      cacheBust: true, // Add cache busting to ensure we get fresh content
      skipAutoScale: true, // Don't auto-scale which can mess with rendering
      canvasWidth: 1920,
      canvasHeight: 1080,
      backgroundColor: '#FFFFFF', // Default white background
      style: {
        display: 'block',
        width: '1920px',
        height: '1080px'
      },
      filter: (node) => {
        // Skip hidden elements
        return (
          node.nodeName !== 'SCRIPT' &&
          node.nodeName !== 'STYLE' &&
          !(node instanceof Element && window.getComputedStyle(node).display === 'none')
        )
      }
    })

    // Create an Image object to ensure the data URL loads correctly
    await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = dataUrl
    })

    // Save the image using Electron IPC
    const imagePath = await window.api.saveSlidePreview(dataUrl, hash)
    return imagePath
  } catch (error) {
    console.error('Error generating slide preview:', error)
    throw error
  }
}

/**
 * Checks if a slide preview exists
 * @param hash The MD5 hash of the slide
 * @returns Promise that resolves to boolean
 */
export async function slidePreviewExists(hash: string): Promise<boolean> {
  return window.api.checkSlidePreview(hash)
}

/**
 * Gets the path to a slide preview image
 * @param hash The MD5 hash of the slide
 * @returns The file path to the preview image
 */
export function getSlidePreviewPath(hash: string): string {
  return `slide_preview_${hash}.png`
}

/**
 * Clears all slide preview images after confirmation
 * @returns Promise that resolves to number of files deleted
 */
export async function clearAllSlidePreviewImages(): Promise<number> {
  try {
    // Show confirmation dialog
    const confirmed = await window.api.showConfirmDialog(
      'Clear Slide Previews',
      'Are you sure you want to delete all slide preview images? This cannot be undone.',
      ['Cancel', 'Delete All']
    )

    if (!confirmed) {
      return 0
    }

    // Call the main process API to delete all preview images
    const deletedCount = await window.api.clearAllSlidePreviewImages()
    return deletedCount
  } catch (error) {
    console.error('Error clearing slide preview images:', error)
    throw error
  }
}
