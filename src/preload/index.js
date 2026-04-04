import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Renderer から呼び出せる API を定義
const api = {
  members: {
    getAll: () => ipcRenderer.invoke('members:getAll'),
    create: (name) => ipcRenderer.invoke('members:create', name),
    update: (id, name) => ipcRenderer.invoke('members:update', id, name),
    delete: (id) => ipcRenderer.invoke('members:delete', id)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (name) => ipcRenderer.invoke('categories:create', name),
    update: (id, name) => ipcRenderer.invoke('categories:update', id, name),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
    getBurdenRatios: (categoryId) => ipcRenderer.invoke('categories:getBurdenRatios', categoryId),
    setBurdenRatios: (categoryId, ratios) =>
      ipcRenderer.invoke('categories:setBurdenRatios', categoryId, ratios)
  },
  expenses: {
    getByMonth: (year, month) => ipcRenderer.invoke('expenses:getByMonth', year, month),
    create: (date, amount, categoryId, paidBy, memo) =>
      ipcRenderer.invoke('expenses:create', date, amount, categoryId, paidBy, memo),
    update: (id, date, amount, categoryId, paidBy, memo) =>
      ipcRenderer.invoke('expenses:update', id, date, amount, categoryId, paidBy, memo),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id)
  },
  settlement: {
    calculate: (year, month) => ipcRenderer.invoke('settlement:calculate', year, month)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
