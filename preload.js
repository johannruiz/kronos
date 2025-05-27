// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        // Lista blanca de canales permitidos para enviar
        const validChannelsSend = [
            'quit-app',
            'show-timer-window',
            'show-setup-window',
            'notify-alarm',
            'save-settings' // Canal añadido para guardar ajustes
        ];
        if (validChannelsSend.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        // Lista blanca de canales permitidos para recibir
        const validChannelsReceive = [
            'load-settings' // Canal añadido para cargar ajustes
        ];
        if (validChannelsReceive.includes(channel)) {
            // Deliberadamente invocar func con los argumentos originales de ipcRenderer.on
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeListener: (channel, func) => {
        const validChannelsReceive = ['load-settings'];
        if (validChannelsReceive.includes(channel)) {
            ipcRenderer.removeListener(channel, func);
        }
    },
    removeAllListeners: (channel) => {
        const validChannelsReceive = ['load-settings'];
        if (validChannelsReceive.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    }
});
