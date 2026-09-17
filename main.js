const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const { exec } = require('child_process');
const { Worker } = require('worker_threads');

let mainWindow;
let activeWorkers = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 780,
    minWidth: 760,
    minHeight: 700,
    frame: true,
    resizable: true,
    autoHideMenuBar: true,
    backgroundColor: '#0f131a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    stopStressTest();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopStressTest();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Lấy toàn bộ thông số phần cứng
ipcMain.handle('get-cpuz-info', async () => {
  try {
    const [
      cpu,
      cpuFlags,
      cpuSpeed,
      mem,
      memLayout,
      graphics,
      system,
      bios,
      baseboard,
      diskLayout,
      fsSize,
      osInfo
    ] = await Promise.all([
      si.cpu(),
      si.cpuFlags(),
      si.cpuCurrentSpeed(),
      si.mem(),
      si.memLayout(),
      si.graphics(),
      si.system(),
      si.bios(),
      si.baseboard(),
      si.diskLayout(),
      si.fsSize(),
      si.osInfo()
    ]);

    const diskHealthList = await getDisksHealth();

    return {
      success: true,
      data: {
        cpu,
        cpuFlags,
        cpuSpeed,
        mem,
        memLayout,
        graphics,
        system,
        bios,
        baseboard,
        diskLayout,
        fsSize,
        osInfo,
        diskHealthList
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

function getDisksHealth() {
  return new Promise((resolve) => {
    const psCmd = `powershell -NoProfile -Command "Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, MediaType, OperationalStatus, HealthStatus | ConvertTo-Json"`;
    exec(psCmd, (err, stdout) => {
      if (err || !stdout) {
        resolve([]);
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

// Cập nhật realtime CPU, RAM, Uptime
ipcMain.handle('get-realtime-monitor', async () => {
  try {
    const [currentLoad, cpuSpeed, mem] = await Promise.all([
      si.currentLoad(),
      si.cpuCurrentSpeed(),
      si.mem()
    ]);

    const uptimeSec = require('os').uptime();

    return {
      success: true,
      data: {
        currentLoad: Math.round(currentLoad.currentLoad),
        cpus: currentLoad.cpus.map(c => Math.round(c.load)),
        speed: cpuSpeed.avg || cpuSpeed.main || 0,
        coresSpeed: cpuSpeed.cores || [],
        memUsed: mem.used,
        memTotal: mem.total,
        memPercent: Math.round((mem.used / mem.total) * 100),
        uptimeSec
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// NHIỆT ĐỘ CPU / GPU
ipcMain.handle('get-temperatures', async () => {
  try {
    const temp = await si.cpuTemperature();
    // PowerShell fallback nếu si không đọc được
    let cpuTemp = temp.main || temp.max || null;
    if (!cpuTemp || cpuTemp <= 0) {
      cpuTemp = await getPsTemperature();
    }
    return { success: true, data: { cpuTemp: cpuTemp || null, gpuTemp: null } };
  } catch (err) {
    return { success: false, data: { cpuTemp: null, gpuTemp: null } };
  }
});

function getPsTemperature() {
  return new Promise((resolve) => {
    const ps = `powershell -NoProfile -Command "Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi | Select-Object -First 1 CurrentTemperature | ConvertTo-Json"`;
    exec(ps, (err, stdout) => {
      if (err || !stdout) { resolve(null); return; }
      try {
        const obj = JSON.parse(stdout);
        const kelvin = obj.CurrentTemperature;
        if (kelvin && kelvin > 2000) resolve(Math.round((kelvin / 10) - 273.15));
        else resolve(null);
      } catch { resolve(null); }
    });
  });
}

// MẠNG (NETWORK SPEED)
ipcMain.handle('get-network-info', async () => {
  try {
    const [stats, ifaces] = await Promise.all([
      si.networkStats(),
      si.networkInterfaces()
    ]);
    const activeIface = Array.isArray(ifaces)
      ? (ifaces.find(i => i.operstate === 'up' && !i.internal && i.ip4) || ifaces[0])
      : ifaces;
    const activeStat = Array.isArray(stats)
      ? (stats.find(s => s.iface === (activeIface && activeIface.iface)) || stats[0])
      : stats;
    return {
      success: true,
      data: {
        iface: activeIface ? activeIface.iface : 'N/A',
        ip4: activeIface ? activeIface.ip4 : 'N/A',
        mac: activeIface ? activeIface.mac : 'N/A',
        rxSec: activeStat ? Math.round((activeStat.rx_sec || 0) / 1024) : 0,   // KB/s
        txSec: activeStat ? Math.round((activeStat.tx_sec || 0) / 1024) : 0,   // KB/s
        type: activeIface ? (activeIface.type || 'Ethernet') : 'N/A'
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ÉP TẢI KIỂM TRA ĐỘ BỀN (STRESS TEST)
ipcMain.handle('start-stress-test', async (event, { threads }) => {
  stopStressTest();

  const workerScript = `
    const { parentPort } = require('worker_threads');
    let running = true;
    parentPort.on('message', (msg) => { if (msg === 'stop') running = false; });
    function stress() {
      while(running) {
        for (let i = 0; i < 150000; i++) {
          Math.sqrt(Math.random() * 10000000) * Math.sin(Math.random());
        }
      }
    }
    stress();
  `;

  const numWorkers = threads || 12;
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(workerScript, { eval: true });
    activeWorkers.push(worker);
  }

  return { success: true, runningThreads: activeWorkers.length };
});

ipcMain.handle('stop-stress-test', async () => {
  stopStressTest();
  return { success: true };
});

function stopStressTest() {
  activeWorkers.forEach(w => {
    try {
      w.postMessage('stop');
      w.terminate();
    } catch (e) {}
  });
  activeWorkers = [];
}

// BENCHMARK CHẤM ĐIỂM
ipcMain.handle('run-cpu-benchmark', async (event, { type }) => {
  return new Promise((resolve) => {
    const isMulti = type === 'multi';
    const workerCount = isMulti ? require('os').cpus().length : 1;
    let completed = 0;
    let totalOps = 0;

    const benchScript = `
      const { parentPort } = require('worker_threads');
      const start = Date.now();
      let ops = 0;
      while (Date.now() - start < 2000) {
        for (let i = 0; i < 20000; i++) {
          Math.atan2(Math.sin(i), Math.cos(i));
        }
        ops += 20000;
      }
      parentPort.postMessage(ops);
    `;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(benchScript, { eval: true });
      worker.on('message', (ops) => {
        totalOps += ops;
        completed++;
        worker.terminate();
        if (completed === workerCount) {
          const score = isMulti ? Math.round(totalOps / 32000) : Math.round(totalOps / 42000);
          resolve({ success: true, score });
        }
      });
      worker.on('error', () => {
        worker.terminate();
        resolve({ success: false, score: 0 });
      });
    }
  });
});
