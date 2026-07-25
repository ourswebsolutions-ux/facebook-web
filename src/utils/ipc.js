/**
 * IPC bridge for Electron window controls.
 * Backend Marketplace APIs will use HTTP (axios) instead of these channels.
 */

const api = window.electronAPI || null

function invoke(channel, ...args) {
  if (!api) {
    console.warn('[IPC] No electronAPI – not in Electron?', channel)
    return Promise.resolve(null)
  }
  return api.invoke(channel, ...args)
}

export const windowAPI = {
  minimize: () => invoke('window:minimize'),
  maximize: () => invoke('window:maximize'),
  close: () => invoke('window:close'),
}
