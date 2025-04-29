# App Description

This app will project slides on an external monitor based on an excel file. Each excel row will represent a slide that can be either a title card or a names card. The main app gui will display the current slide and the side screen slide and then the rest slides in list mode. You can navigate between slides using the mouse or arrow keys from keyboard.

# Technology Stack

- Electron
- Node.js
- Vue.js
- Tailwind CSS
- Vite
- TypeScript

# Features

## Display slides on an external monitor (main screen)

- Slides will be vue components using vh and vw units so that they can be displayed on any screen size including thumbnails
- Automatically detect external monitors and assign them as main and side screens unless already assigned (retrieve from last state). Do not allow selecting the same monitor for both main and side screens.
- Display slides in full screen on main screen

## Display slides on second external monitor when available (side screen)

- Only names slides will be displayed on the side screen using an slides offset defined in the settings. (For example if the user has set an offset of -2, the the side screen will display the name slides two slides earlier than the main screen and not on the same slide)

## Read slides from an excel file

- On first run, parse the excel file in memory and share them to the views
- Constantly read the excel file for changes and update the slides in memory. Also, fire an event to notify the views to update the slides
- Excel must have two sheets: one for the slides and one for the names
- It is not required to name those sheets. First sheet will be used for slides and second sheet for names.

### Slide sheet table structure

- The first row must be the header
- The first column must be the slide type that can be either "Blank", "Title" or "Names"
- The second column must be the slide title. This will be a big title displayed on the center of the screen.
- The third column must be the slide subtitle. This will be a small title below the big title (optional).
- The fourth column must be the slide group. This will be used to group slides of type "Names" (optional).
- The fifth column must be the "from" field. This will be used to indicate the first name of the "Names" slide (optional).
- The sixth column must be the "until" field. This will be used to indicate the last name of the "Names" slide (optional).

### Names sheet table structure

- The first row must be the header
- The first column must be the name of the person.
- The second column must be the group of the person. This will be used to group names in the slides (required).
- The third column must be the attending status. It can be either "Yes" or "No".

## Navigate between slides using mouse or keyboard (arrow keys)

## Display current slide and next slide

## Display rest slides in list mode

- Thumbnail of the slide and text content

## Allow user to choose which monitor to display the slides (main screen)

- Dropdown selector with all available monitors

## Allow user to choose which monitor to display the offset slides (side screen)

- Dropdown selector with all available monitors except the main screen

## Support for four type of slides: blank, title, names and unattended card

- Blank card: no content, just logo
- Title card: big title and small title (optional)
- Names card: list of names
- Unattended card: list of names not attending

## Configure app settings (colors, logos, background images, etc.)

## Remember last state of the app

- Last opened excel file, current slide, main and side screens

## Add button to manually refresh the data (read the excel file)

## Add button to open a new excel file (close current one and open a new one)

## Add toggle button to freeze monitors (stop updating the slides on the monitors)

## Add button to open the app settings
