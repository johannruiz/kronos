// main.js
const { app, BrowserWindow, ipcMain, Notification, screen } = require('electron');
const path = require('path');

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
            setupWindowSize: { width: 460, height: 820 }, // Altura aumentada nuevamente para más espacio para presets
            timerWindowSize: { width: 320, height: 150 },
            appSettings: {
                alarmHour: '07',
                alarmMinute: '00',
                alarmAmPm: 'AM',
                opacity: 100,
                showProgressBar: true,
                progressBarType: 'segments' // Nuevo: 'segments' o 'percentage'
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
        resizable: true, // Permitir redimensionar la ventana de configuración
        minWidth: 400,    // Ancho mínimo para la ventana de configuración
        minHeight: 820,   // Alto mínimo aumentado para la ventana de configuración
        maxWidth: 480,    // Ancho máximo ajustado para la ventana de configuración
        maxHeight: 820    // Alto máximo aumentado para la ventana de configuración
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
        const storedSize = store.get('timerWindowSize');
        const defaultTimerWidth = 320;
        const defaultTimerHeight = 150; // La altura puede necesitar ajuste si el % es muy grande

        const widthToSet = config.width || (storedSize ? storedSize.width : defaultTimerWidth);
        const heightToSet = config.height || (storedSize ? storedSize.height : defaultTimerHeight);
        
        // Ajustar el tamaño mínimo para la vista del temporizador
        mainWindow.setMinimumSize(100, 50); // Valores pequeños, ajusta según necesites para el temporizador
        mainWindow.setMaximumSize(0, 0); // 0 significa sin límite máximo para la vista del temporizador
        mainWindow.setAlwaysOnTop(true);
        mainWindow.setResizable(true); 
        mainWindow.setSize(widthToSet, heightToSet, true);
        // mainWindow.setResizable(false); // Permitir que la ventana del temporizador sea redimensionable
        mainWindow.setOpacity(1); 
    }
});

ipcMain.on('show-setup-window', () => {
    if (mainWindow && store) { 
        timerViewActive = false;
        const storedSetupSize = store.get('setupWindowSize');
        const defaultSetupWidth = 460;
        const defaultSetupHeight = store.get('setupWindowSize.height', 820); // Usar la nueva altura por defecto aumentada

        // Restaurar el tamaño mínimo para la vista de configuración
        mainWindow.setMinimumSize(400, 820); // Alto mínimo aumentado
        mainWindow.setMaximumSize(480, 820); // Establecer tamaño máximo aumentado

        mainWindow.setAlwaysOnTop(false);
        mainWindow.setResizable(true); // La ventana de configuración puede ser redimensionable
        mainWindow.setSize(
            storedSetupSize ? storedSetupSize.width : defaultSetupWidth,
            storedSetupSize ? storedSetupSize.height : defaultSetupHeight,
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
