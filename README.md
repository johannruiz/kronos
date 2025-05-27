# Kronos - Minimalist Desktop Alarm

Kronos is a minimalist and elegant desktop alarm application built with Electron. It's designed to be "always on top" during timer mode, providing a discreet yet effective way to manage your time without interrupting your workflow.

![image](https://github.com/user-attachments/assets/a6c008b9-5b68-4312-83f9-87e6376d6d9f)

## Table of Contents

1.  [Main Features](#main-features)
2.  [Application Views](#application-views)
    * [Setup View](#setup-view)
    * [Timer View](#timer-view)
3.  [Use Cases](#use-cases)
4.  [How It Works](#how-it-works)
    * [Main Process (main.js)](#main-process-mainjs)
    * [Renderer Process (index.html)](#renderer-process-indexhtml)
    * [Preload Script (preload.js)](#preload-script-preloadjs)
    * [Settings Persistence](#settings-persistence)
5.  [Technologies Used](#technologies-used)
6.  [Installation and Execution](#installation-and-execution)
7.  [Packaging the Application](#packaging-the-application)
8.  [Project Structure](#project-structure)
9.  [Contributions](#contributions)
10. [Author](#author)
11. [License](#license)
12. [Release](#release)

## Main Features

* **Configurable Alarm:** Easily set alarms using a 12-hour format (AM/PM).
* **Adjustable Opacity:** Customize the timer window's transparency (from 20% to 100%) for non-intrusive viewing.
* **Visual Progress Bar:**
    * Option to show or hide the progress bar.
    * Two progress bar styles:
        * **Segments:** Displays the remaining time in hourly blocks.
        * **Percentage:** Shows progress as a percentage of the total elapsed time.
* **Native Notifications:** Receive desktop notifications when the alarm activates.
* **Alarm Sound:**
    * Option to enable or disable the alarm sound.
    * Uses `Tone.js` to generate a pleasant alarm sound.
* **Two Main Views:**
    * **Setup View:** Intuitive interface for setting alarm parameters.
    * **Timer View:** Displays the countdown; it's compact and can remain always on top.
* **Settings Persistence:** The application remembers your settings (alarm time, opacity, progress bar settings, sound status) between sessions thanks to `electron-store`.
* **Intuitive Controls:** Buttons to start/stop the timer, dismiss the alarm, and close the application.
* **Minimalist and Modern Design:** Clean interface developed with Tailwind CSS.
* **Portability:** Thanks to Electron, it can be packaged for Windows, macOS, and Linux.

## Application Views

The application has two main interfaces:

### Setup View

This is the initial view where you can configure your alarm.

* **Title:** "Configurar Alarma" (Configure Alarm).
* **Time Selection:**
    * Dropdowns for Hour (01-12), Minutes (00-59), and AM/PM.
* **Timer Opacity:**
    * A slider to adjust the opacity of the timer window when active (from 20% to 100%). The value is displayed numerically.
* **Progress Bar:**
    * A switch for "Mostrar Barra de Progreso" (Show Progress Bar).
    * If enabled, buttons appear to select the type: "Segmentos" (Segments) or "Porcentaje" (Percentage).
* **Alarm Sound:**
    * A switch for "Activar Sonido de Alarma" (Enable Alarm Sound).
* **"Iniciar Temporizador" (Start Timer) Button:** Saves current settings and starts the countdown, switching to the Timer View.
* **"Cerrar Aplicación" (Close Application) Button (X Icon):** Closes the application.

### Timer View

This view is activated after starting the timer. It's designed to be minimalist and stay on top of other windows.

* **Time Display:** Shows the remaining time in `HH:MM:SS` format. When the alarm activates, it displays "¡ALARMA!".
* **Progress Bar (Optional):**
    * If enabled in settings, it displays a progress bar below the time.
    * **Segments Style:** Divides the total duration into segments (usually representing hours) and fills the current segment.
    * **Percentage Style:** Shows a single bar that fills up and an overlaid text with the completed percentage.
* **"Descartar Alarma" (Dismiss Alarm) Button:** Appears when the alarm sounds, allowing you to silence it.
* **"Volver a Configuración" (Back to Setup) Button (Gear Icon):** Stops the timer and alarm (if sounding) and returns to the Setup View.
* **Draggable:** The timer window can be moved around the screen.
* **Opacity Applied:** The opacity selected in the settings is applied to this view.

## Use Cases

Kronos is ideal for:

* **Pomodoro Technique:** Set timers for your work sessions and breaks.
* **Quick Reminders:** For meetings, short tasks, or active breaks.
* **Cooking:** As a simple timer while cooking or doing other household chores.
* **Study:** To manage study blocks and ensure regular breaks.
* **Presentations or Speeches:** To discreetly keep track of time.
* **Any task requiring a visible but non-obstructive timer.**

## How It Works

Kronos is an Electron application conceptually divided into a main process and a renderer process.

### Main Process (`main.js`)

* **Window Management:** Creates and manages the application's main window (`BrowserWindow`).
* **App Lifecycle:** Handles Electron application lifecycle events (e.g., `ready`, `window-all-closed`).
* **IPC (Inter-Process Communication):**
    * Listens for events from the renderer process through defined channels (`quit-app`, `show-timer-window`, `show-setup-window`, `notify-alarm`, `save-settings`).
    * Responds to these events, for example, by changing window size, making it always on top, showing native notifications, or saving settings.
* **Native Notifications:** Uses Electron's `Notification` module to display system alerts when an alarm ends.
* **Settings Persistence:** Uses `electron-store` to save and load user preferences (window size, alarm time, opacity, etc.). Settings are saved automatically when modified in the setup view.

### Renderer Process (`index.html` and inline `<script>`)

* **User Interface (UI):** Defines the HTML structure and styles (with Tailwind CSS) for the setup and timer views.
* **Interface Logic:**
    * Handles user interactions (button clicks, changes in selectors, opacity slider).
    * Dynamically updates the DOM to reflect the current state (e.g., timer display, progress bar filling).
    * Populates time and minute selectors.
* **Timer Logic:**
    * Calculates the remaining time until the set alarm time.
    * Updates the display every second.
    * Activates the alarm (sound and visual notification) when time reaches zero.
* **Sound Playback:**
    * Uses `Tone.js` to generate and control the alarm sound.
    * Initializes the audio context and synthesizer.
    * Creates a sound loop for the alarm.
* **Communication with Main Process:** Sends messages to the main process using the API exposed via `preload.js` (`window.electronAPI.send`). Receives messages from the main process (e.g., to load settings) via `window.electronAPI.receive`.

### Preload Script (`preload.js`)

* **Secure Bridge:** Acts as a secure bridge between the renderer process (with DOM access) and the main process (with Node.js and Electron APIs access).
* **Selective API Exposure:** Uses `contextBridge.exposeInMainWorld` to securely expose specific `ipcRenderer` functionalities to the renderer process under the `window.electronAPI` object.
* **Channel Whitelist:** Defines valid channels for sending (`validChannelsSend`) and receiving (`validChannelsReceive`) IPC messages, enhancing security by restricting communication to known channels.

### Settings Persistence

* The application uses the `electron-store` module to store user preferences.
* Saved settings include:
    * Last configured alarm time (hour, minute, AM/PM).
    * Opacity value for the timer window.
    * Preference to show/hide the progress bar.
    * Selected progress bar type (segments or percentage).
    * Preference to enable/disable alarm sound.
    * Dimensions of setup and timer windows.
* These settings are loaded when the application starts and are automatically saved whenever the user makes a change in the setup view.

## Technologies Used

* **Electron:** Framework for creating cross-platform desktop applications with web technologies (JavaScript, HTML, CSS).
* **Node.js:** Server-side JavaScript runtime environment, used by Electron.
* **HTML5:** For the user interface structure.
* **Tailwind CSS:** Utility-first CSS framework for rapid and modern design.
* **JavaScript (ES6+):** For application logic.
* **Tone.js:** Library for creating interactive music in the browser, used here for the alarm sound.
* **Electron-Store:** Module for simple data persistence (JSON) in Electron applications.
* **Font Awesome:** For icons.

## Installation and Execution

### Prerequisites

* Node.js (which includes npm). You can download it from [nodejs.org](https://nodejs.org/).

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/kronos.git](https://github.com/your-username/kronos.git) # Replace with the actual repo URL
    cd kronos
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```
    This will install Electron, electron-store, and other dependencies listed in `package.json`.

3.  **Run the Application in Development Mode:**
    ```bash
    npm start
    ```
    This will start the application using `electron .`.

## Packaging the Application

The project uses `electron-forge` to package and distribute the application.

* **To package the application (without creating an installer):**
    ```bash
    npm run package
    ```
    This will generate the packaged files in the `out` folder.

* **To create distributables/installers:**
    ```bash
    npm run make
    ```
    This will generate platform-specific installers in the `out/make` folder.
    * **Windows:** Creates a Squirrel installer (`.exe`) and a portable ZIP.
    * **macOS:** Creates a ZIP.
    * **Linux:** Creates a ZIP and potentially .deb/.rpm if the necessary tools are installed.

The `electron-forge` configuration is located in `package.json` and specifies icons and output formats.

## Project Structure
```
kronos/
├── assets/
│   ├── icon.ico          # Icon for Windows installer
│   └── icon.png          # Icon used for notifications
├── main.js               # Electron main process logic
├── index.html            # HTML file for the user interface
├── preload.js            # Preload script for secure IPC communication
├── package.json          # Project metadata, dependencies, and scripts
├── package-lock.json     # Exact record of dependency versions
└── README.md             # This file
```
## Contributions

Contributions are welcome. If you wish to improve Kronos, please consider:

1.  Forking the project.
2.  Creating a new branch for your feature (`git checkout -b feature/new-feature`).
3.  Making your changes and committing them (`git commit -am 'Add new feature'`).
4.  Pushing to the branch (`git push origin feature/new-feature`).
5.  Creating a new Pull Request.

## Author

Johann Ruiz (sebiches1@gmail.com)

## License

This project is under the MIT License. Check the `LICENSE` file (if it exists) for more details, or review the "license" entry in `package.json`.

## Release

[Download](https://github.com/johannruiz/kronos/releases)







