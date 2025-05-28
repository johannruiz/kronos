// main.js
const { app, BrowserWindow, ipcMain, Notification, screen } = require('electron');
const path = require('path');

// Constantes para dimensiones de las ventanas y comportamiento
const DEFAULT_SETUP_WINDOW_WIDTH = 900; // Aumentado de 700 para más espacio horizontal para presets
const DEFAULT_SETUP_WINDOW_HEIGHT = 820;
// Para una ventana de configuración de tamaño fijo:
const MIN_SETUP_WINDOW_WIDTH = DEFAULT_SETUP_WINDOW_WIDTH;
const MAX_SETUP_WINDOW_WIDTH = DEFAULT_SETUP_WINDOW_WIDTH;
const MIN_SETUP_WINDOW_HEIGHT = DEFAULT_SETUP_WINDOW_HEIGHT;
const MAX_SETUP_WINDOW_HEIGHT = DEFAULT_SETUP_WINDOW_HEIGHT;
const SETUP_WINDOW_RESIZABLE = false; // La ventana de configuración tendrá un tamaño fijo

const DEFAULT_TIMER_WINDOW_WIDTH = 320;
const DEFAULT_TIMER_WINDOW_HEIGHT = 150;
const MIN_TIMER_WINDOW_WIDTH = 100;
const MIN_TIMER_WINDOW_HEIGHT = 50;
const TIMER_WINDOW_MAX_WIDTH = 0; // 0 significa sin límite máximo
const TIMER_WINDOW_MAX_HEIGHT = 0; // 0 significa sin límite máximo
const TIMER_WINDOW_RESIZABLE = true; // La ventana del temporizador es redimensionable

let Store; 
let store; 
let mainWindow;
let timerViewActive = false;

// Establecer el nombre de la aplicación
app.setName('Kronos');

async function initializeAppModules() {
  try {
    const electronStoreModule = await import('electron-store');
    Store = electronStoreModule.default; 
    store = new Store({
        defaults: {
            setupWindowSize: { width: DEFAULT_SETUP_WINDOW_WIDTH, height: DEFAULT_SETUP_WINDOW_HEIGHT },
            timerWindowSize: { width: DEFAULT_TIMER_WINDOW_WIDTH, height: DEFAULT_TIMER_WINDOW_HEIGHT },
            appSettings: {
                alarmHour: '07',
                alarmMinute: '00',
                alarmAmPm: 'AM',
                opacity: 100,
                showProgressBar: true,
                progressBarType: 'segments', // 'segments' o 'percentage'
                theme: 'default' // Nuevo: 'default' o 'retro'
            }
        }
    });
    console.log("electron-store inicializado correctamente con valores por defecto.");
  } catch (err) {
    console.error("Fallo al inicializar electron-store:", err);
    app.quit(); 
  }
}

function createWindow() {
    if (!store) {
        console.error("Error crítico: 'store' no está inicializado. Saliendo.");
        app.quit();
        return;
    }

    const savedSetupSize = store.get('setupWindowSize');
    const savedAppSettings = store.get('appSettings');
    const savedSetupPosition = store.get('setupWindowPosition');

    mainWindow = new BrowserWindow({
        width: savedSetupSize.width, 
        height: savedSetupSize.height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        frame: false,      
        transparent: true, 
        show: false,        
        backgroundColor: '#00000000', // Fondo completamente transparente (RGBA)
        x: savedSetupPosition ? savedSetupPosition.x : undefined, 
        y: savedSetupPosition ? savedSetupPosition.y : undefined,
        resizable: SETUP_WINDOW_RESIZABLE,
        minWidth: MIN_SETUP_WINDOW_WIDTH,
        minHeight: MIN_SETUP_WINDOW_HEIGHT,
        maxWidth: MAX_SETUP_WINDOW_WIDTH,
        maxHeight: MAX_SETUP_WINDOW_HEIGHT
    });
    
    mainWindow.loadFile('index.html');
    mainWindow.removeMenu();
    // mainWindow.webContents.openDevTools(); 

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (!savedSetupPosition) { // Si no había posición guardada, centrarla.
            mainWindow.center();
        }
        if (savedAppSettings) {
            mainWindow.webContents.send('load-settings', savedAppSettings);
        }
    });

    mainWindow.on('resize', () => {
        if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized() || !store) return;
        const [width, height] = mainWindow.getSize();
        if (timerViewActive) {
            store.set('timerWindowSize', { width, height });
        } else {
            store.set('setupWindowSize', { width, height });
        }
    });
    
    mainWindow.on('moved', () => {
        if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized() || !store || timerViewActive) return;
        const [x, y] = mainWindow.getPosition();
        store.set('setupWindowPosition', { x, y });
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    await initializeAppModules(); 

    if (store) { 
        createWindow();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } else {
        console.error("No se pudo iniciar la aplicación porque 'store' falló al inicializar.");
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('quit-app', () => {
    app.quit();
});

ipcMain.on('show-timer-window', (event, config = {}) => {
    if (mainWindow && store) { 
        timerViewActive = true;
        const storedTimerSize = store.get('timerWindowSize');

        const widthToSet = config.width || (storedTimerSize ? storedTimerSize.width : DEFAULT_TIMER_WINDOW_WIDTH);
        const heightToSet = config.height || (storedTimerSize ? storedTimerSize.height : DEFAULT_TIMER_WINDOW_HEIGHT);
        
        mainWindow.setResizable(TIMER_WINDOW_RESIZABLE);
        mainWindow.setMinimumSize(MIN_TIMER_WINDOW_WIDTH, MIN_TIMER_WINDOW_HEIGHT);
        mainWindow.setMaximumSize(TIMER_WINDOW_MAX_WIDTH, TIMER_WINDOW_MAX_HEIGHT); // 0,0 significa sin límite

        mainWindow.setAlwaysOnTop(true);
        mainWindow.setSize(widthToSet, heightToSet, true);
        mainWindow.setOpacity(1); 
    }
});

ipcMain.on('show-setup-window', () => {
    if (mainWindow && store) { 
        timerViewActive = false;
        const storedSetupSize = store.get('setupWindowSize');
        
        const effectiveSetupWidth = storedSetupSize ? storedSetupSize.width : DEFAULT_SETUP_WINDOW_WIDTH;
        const effectiveSetupHeight = storedSetupSize ? storedSetupSize.height : DEFAULT_SETUP_WINDOW_HEIGHT;

        mainWindow.setResizable(SETUP_WINDOW_RESIZABLE);
        mainWindow.setMinimumSize(MIN_SETUP_WINDOW_WIDTH, MIN_SETUP_WINDOW_HEIGHT);
        mainWindow.setMaximumSize(MAX_SETUP_WINDOW_WIDTH, MAX_SETUP_WINDOW_HEIGHT);

        mainWindow.setAlwaysOnTop(false);
        mainWindow.setSize(
            effectiveSetupWidth,
            effectiveSetupHeight,
            true
        );
        mainWindow.setOpacity(1);
        mainWindow.center(); 
    }
});

ipcMain.on('notify-alarm', (event, { title, body }) => {
    if (Notification.isSupported()) {
        new Notification({
            title,
            body: body,
            icon: path.join(__dirname, 'icon.png')
        }).show();
    }
});

ipcMain.on('save-settings', (event, settings) => {
    if (store && settings) {
        const currentAppSettings = store.get('appSettings', {});
        const newAppSettings = {
            ...currentAppSettings, 
            ...settings 
        };
        store.set('appSettings', newAppSettings);
        console.log('Ajustes guardados:', newAppSettings);
    }
});
