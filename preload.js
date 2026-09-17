const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hardwareAPI', {
  getCpuZInfo: () => ipcRenderer.invoke('get-cpuz-info'),
  getRealtimeMonitor: () => ipcRenderer.invoke('get-realtime-monitor'),
  startStressTest: (opts) => ipcRenderer.invoke('start-stress-test', opts),
  stopStressTest: () => ipcRenderer.invoke('stop-stress-test'),
  runCpuBenchmark: (opts) => ipcRenderer.invoke('run-cpu-benchmark', opts),
  getTemperatures: () => ipcRenderer.invoke('get-temperatures'),
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info')
});
