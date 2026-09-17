// State
let rawData = null;
let isStressRunning = false;
let stressStartTime = null;
let stressInterval = null;

// Realtime history (30 points = 30 seconds)
const CPU_HISTORY = new Array(30).fill(0);
const RAM_HISTORY = new Array(30).fill(0);
let netRxPeak = 0;
let netTxPeak = 0;

// Hằng số tính chu vi vòng cung SVG Arc: R=42, góc ~240 độ => length xấp xỉ 176
const ARC_TOTAL_LENGTH = 176;

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTabs();
  initCpuZData();
  startRealtimeTick();
  initStressAndBenchmark();
  initFooterControls();
  initNetworkTab();
});

// ===== TOAST NOTIFICATION =====
function showToast(msg, icon = '✅') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fadeout');
    setTimeout(() => toast.remove(), 350);
  }, 2200);
}

// ===== COPY VALUE TO CLIPBOARD =====
function copyVal(elemId) {
  const el = document.getElementById(elemId);
  if (!el) return;
  const text = el.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Đã sao chép: ${text.slice(0, 40)}`);
  }).catch(() => showToast('Không thể sao chép', '⚠️'));
}

// ===== SIDEBAR TOGGLE =====
function initSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (!sidebar || !toggleBtn) return;

  // Restore saved state
  const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (savedCollapsed) sidebar.classList.add('collapsed');

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  });
}

// Chuyển Tab kiểu CPU-Z
function initTabs() {
  const tabs = document.querySelectorAll('.tab-item');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });
}

// Nạp dữ liệu cấu hình máy tính
async function initCpuZData() {
  try {
    const res = await window.hardwareAPI.getCpuZInfo();
    if (res.success) {
      rawData = res.data;
      renderCpuZ(res.data);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderCpuZ(data) {
  const { cpu, cpuSpeed, mem, memLayout, graphics, baseboard, bios, diskLayout, fsSize, diskHealthList } = data;

  // Header banner
  document.getElementById('bannerSubtitle').textContent = `${cpu.brand} • 16GB RAM • NVIDIA GPU`;

  // TAB CPU
  document.getElementById('cpuName').textContent = cpu.brand;
  document.getElementById('cpuSpec').textContent = cpu.brand;
  document.getElementById('cpuCodename').textContent = `${cpu.vendor} Zen+ (${cpu.family || 'Pinnacle Ridge'})`;
  document.getElementById('cpuSocket').textContent = cpu.socket || 'Socket AM4';
  document.getElementById('coreCount').textContent = cpu.physicalCores;
  document.getElementById('threadCount').textContent = cpu.cores;

  // Nhận diện hãng CPU để cập nhật vòng tròn Logo
  const isAmd = cpu.brand.toLowerCase().includes('amd') || cpu.vendor.toLowerCase().includes('amd');
  const cpuTitle = document.getElementById('cpuBrandTitle');
  const cpuTag = document.getElementById('cpuBrandTag');
  const cpuDesc = document.getElementById('cpuBrandDesc');
  const cpuImg = document.getElementById('cpuBrandImg');
  const cpuRing = document.getElementById('cpuPortalRing');
  const tabCircleCpu = document.getElementById('tabCircleCpu');

  if (isAmd) {
    document.getElementById('cpuBrandText').textContent = 'AMD RYZEN';
    cpuTitle.textContent = 'AMD RYZEN™';
    cpuTag.textContent = 'AMD Official Series';
    cpuDesc.textContent = 'Pinnacle Ridge • 12nm FinFET';
    cpuImg.src = '../assets/brand_amd.jpg';
    cpuRing.className = 'circle-portal amd';
    tabCircleCpu.className = 'tab-badge-circle amd';
    tabCircleCpu.textContent = 'AMD';
  } else {
    document.getElementById('cpuBrandText').textContent = 'INTEL CORE';
    cpuTitle.textContent = 'INTEL® CORE™';
    cpuTag.textContent = 'Intel Architecture';
    cpuDesc.textContent = 'High Performance Processor';
    cpuImg.src = '../assets/cpu_chip.jpg';
    cpuRing.className = 'circle-portal ssd';
    tabCircleCpu.className = 'tab-badge-circle mb';
    tabCircleCpu.textContent = 'INTEL';
  }

  const currentMhz = Math.round((cpuSpeed.avg || cpu.speed) * 1000);
  document.getElementById('cpuCoreSpeed').textContent = `${currentMhz} MHz`;
  document.getElementById('cpuMultiplier').textContent = `x ${(currentMhz / 100).toFixed(1)}`;

  if (cpu.cache) {
    document.getElementById('cacheL1d').textContent = cpu.cache.l1d ? `${cpu.physicalCores} x ${(cpu.cache.l1d / 1024 / cpu.physicalCores).toFixed(0)} KB` : '6 x 32 KB';
    document.getElementById('cacheL2').textContent = cpu.cache.l2 ? `${cpu.physicalCores} x ${(cpu.cache.l2 / 1024 / cpu.physicalCores).toFixed(0)} KB` : '6 x 512 KB';
    document.getElementById('cacheL3').textContent = cpu.cache.l3 ? `1 x ${(cpu.cache.l3 / (1024 * 1024)).toFixed(0)} MB` : '16 MB';
  }

  // TAB MAINBOARD
  document.getElementById('mbVendor').textContent = baseboard.manufacturer || 'MSI / Gigabyte / ASUS';
  document.getElementById('mbModel').textContent = baseboard.model || 'B450M / A320M Gaming';
  document.getElementById('mbSerial').textContent = baseboard.serial || 'Default string';
  document.getElementById('biosVendor').textContent = bios.vendor || 'American Megatrends Inc.';
  document.getElementById('biosVersion').textContent = bios.version || 'F50';
  document.getElementById('biosDate').textContent = bios.releaseDate || '2022/2023';

  // TAB MEMORY (Khởi tạo giá trị RAM tĩnh)
  const totalGb = (mem.total / (1024 ** 3)).toFixed(1);
  document.getElementById('ramSize').textContent = `${Math.round(totalGb)} GBytes`;
  document.getElementById('ramSlots').textContent = `${memLayout.length} / 4 Slots`;
  document.getElementById('ramGaugeTotal').textContent = `${totalGb} GB`;
  if (memLayout[0]) {
    document.getElementById('ramType').textContent = memLayout[0].type || 'DDR4';
    document.getElementById('ramFreq').textContent = `${memLayout[0].clockSpeed} MHz`;
  }

  // Cập nhật vòng cung RAM ban đầu
  const usedGb = (mem.used / (1024 ** 3)).toFixed(1);
  const availGb = (mem.available / (1024 ** 3)).toFixed(1);
  const ramPercent = Math.round((mem.used / mem.total) * 100);
  updateRamGauge(ramPercent, usedGb, availGb);

  // TAB SPD (Slots)
  const spdSelect = document.getElementById('spdSlotSelect');
  spdSelect.innerHTML = '';
  memLayout.forEach((slot, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `Khe #${idx + 1} - ${slot.type || 'DDR4'} ${(slot.size / (1024 ** 3)).toFixed(0)}GB - ${slot.manufacturer || 'Module'}`;
    spdSelect.appendChild(opt);
  });

  const renderSpdSlot = (slotIdx) => {
    const slot = memLayout[slotIdx];
    if (!slot) return;
    document.getElementById('spdSize').textContent = `${(slot.size / (1024 ** 3)).toFixed(0)} GBytes`;
    document.getElementById('spdSpeed').textContent = `${slot.type || 'DDR4'} (${slot.clockSpeed} MHz)`;
    document.getElementById('spdManuf').textContent = slot.manufacturer || 'Kingston / Corsair / Samsung';
    document.getElementById('spdPart').textContent = slot.partNum || 'N/A';
    document.getElementById('spdSerial').textContent = slot.serialNum || 'N/A';
  };

  spdSelect.addEventListener('change', (e) => renderSpdSlot(e.target.value));
  if (memLayout.length > 0) renderSpdSlot(0);

  // TAB GRAPHICS
  const gpuSelect = document.getElementById('gpuSelect');
  gpuSelect.innerHTML = '';
  (graphics.controllers || []).forEach((gpu, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = gpu.model;
    gpuSelect.appendChild(opt);
  });

  const renderGpu = (idx) => {
    const gpu = (graphics.controllers || [])[idx];
    if (!gpu) return;
    document.getElementById('gpuModel').textContent = gpu.model;
    document.getElementById('gpuVendorText').textContent = gpu.vendor || 'NVIDIA';
    document.getElementById('gpuVram').textContent = gpu.vram ? `${gpu.vram} MBytes` : 'Shared';
    document.getElementById('gpuDriver').textContent = gpu.driverVersion || 'Game Ready Driver';
    document.getElementById('gpuBus').textContent = gpu.bus || 'PCI-Express 3.0 x16';

    const isNvidia = (gpu.model + ' ' + gpu.vendor).toLowerCase().includes('nvidia') || (gpu.model + ' ' + gpu.vendor).toLowerCase().includes('geforce');
    const gpuImg = document.getElementById('gpuBrandImg');
    const gpuTitle = document.getElementById('gpuBrandTitle');
    const gpuTag = document.getElementById('gpuBrandTag');
    const gpuDesc = document.getElementById('gpuBrandDesc');
    const gpuRing = document.getElementById('gpuPortalRing');
    const tabCircleGpu = document.getElementById('tabCircleGpu');

    if (isNvidia) {
      gpuTitle.textContent = 'NVIDIA GEFORCE';
      gpuTag.textContent = 'GeForce Game Ready';
      gpuTag.className = 'brand-badge-tag nvidia';
      gpuDesc.textContent = `${gpu.model} • Dedicated GPU`;
      gpuImg.src = '../assets/brand_nvidia.jpg';
      gpuRing.className = 'circle-portal nvidia';
      tabCircleGpu.className = 'tab-badge-circle nvidia';
      tabCircleGpu.textContent = 'NV';
    } else {
      gpuTitle.textContent = 'RADEON GRAPHICS';
      gpuTag.textContent = 'AMD Radeon GPU';
      gpuTag.className = 'brand-badge-tag amd';
      gpuDesc.textContent = `${gpu.model} • Graphics`;
      gpuImg.src = '../assets/gpu_card.jpg';
      gpuRing.className = 'circle-portal amd';
      tabCircleGpu.className = 'tab-badge-circle amd';
      tabCircleGpu.textContent = 'AMD';
    }
  };

  gpuSelect.addEventListener('change', (e) => renderGpu(e.target.value));
  if ((graphics.controllers || []).length > 0) renderGpu(0);

  // TAB STORAGE & HEALTH
  const healthContainer = document.getElementById('diskHealthContainer');
  healthContainer.innerHTML = '';
  const disks = (diskHealthList && diskHealthList.length > 0) ? diskHealthList : diskLayout;

  disks.forEach(d => {
    const card = document.createElement('div');
    card.className = 'disk-health-card';
    const name = d.FriendlyName || d.name;
    const mediaType = d.MediaType || d.type || 'SSD';
    const status = d.HealthStatus || 'Healthy';
    const isGood = status.toLowerCase() === 'healthy' || status === 'OK';

    card.innerHTML = `
      <div class="disk-card-header">
        <span>💾 ${name}</span>
        <span class="health-badge ${isGood ? 'good' : 'warn'}">Độ bền S.M.A.R.T: ${status}</span>
      </div>
      <div class="spec-row compact">
        <span class="spec-label">Loại ổ đĩa:</span>
        <span class="spec-val">${mediaType}</span>
        <span class="spec-label mini">Trạng thái:</span>
        <span class="spec-val mini text-green bold">Hoạt động tốt 100%</span>
      </div>
    `;
    healthContainer.appendChild(card);
  });

  // Phân vùng ổ cứng dạng VÒNG CUNG TRÒN
  const partContainer = document.getElementById('partitionsContainer');
  partContainer.innerHTML = '';
  (fsSize || []).forEach(p => {
    const use = Math.round(p.use);
    const strokeDash = (use / 100) * ARC_TOTAL_LENGTH;

    const card = document.createElement('div');
    card.className = 'part-arc-card';
    card.innerHTML = `
      <div class="part-drive-name">Ổ [${p.fs}] (${p.type})</div>
      <div class="gauge-arc-wrapper mini">
        <svg class="circular-chart mini" viewBox="0 0 100 100">
          <path class="circle-bg" d="M 15 80 A 42 42 0 1 1 85 80" />
          <path class="circle-arc disk" stroke-dasharray="${strokeDash}, 200" d="M 15 80 A 42 42 0 1 1 85 80" />
        </svg>
        <div class="gauge-center-info mini">
          <span class="gauge-percent text-blue">${use}%</span>
          <span class="gauge-sublabel">Đã dùng</span>
        </div>
      </div>
      <div class="part-usage-sub">
        ${(p.used / (1024**3)).toFixed(1)} / ${(p.size / (1024**3)).toFixed(1)} GB
      </div>
    `;
    partContainer.appendChild(card);
  });

  document.getElementById('footerStatus').textContent = `Hardware Inspector • by AliStudio Lab • ${cpu.brand}`;
}

// Cập nhật vòng cung tròn RAM
function updateRamGauge(percent, usedGb, availGb) {
  const dashLength = (percent / 100) * ARC_TOTAL_LENGTH;
  const arcPath = document.getElementById('ramArcPath');
  if (arcPath) arcPath.setAttribute('stroke-dasharray', `${dashLength}, 200`);

  const percentElem = document.getElementById('ramGaugePercent');
  if (percentElem) percentElem.textContent = `${percent}%`;

  const usedElem = document.getElementById('ramGaugeUsed');
  if (usedElem) usedElem.textContent = `${usedGb} GB`;

  const availElem = document.getElementById('ramGaugeAvail');
  if (availElem) availElem.textContent = `${availGb} GB`;
}

// Realtime Monitor Tick (1.0s)
function startRealtimeTick() {
  // Temperature (slower poll - every 5s)
  let tempCounter = 0;
  setInterval(async () => {
    try {
      const res = await window.hardwareAPI.getRealtimeMonitor();
      if (res.success) {
        const { currentLoad, speed, memUsed, memTotal, memPercent, uptimeSec } = res.data;

        // === Sidebar mini bar ===
        const sidebarBar = document.getElementById('sidebarCpuBar');
        const sidebarPct = document.getElementById('sidebarCpuPct');
        if (sidebarBar) sidebarBar.style.width = `${currentLoad}%`;
        if (sidebarPct) sidebarPct.textContent = `${currentLoad}%`;

        // === Header Uptime ===
        if (uptimeSec != null) {
          const h = Math.floor(uptimeSec / 3600);
          const m = Math.floor((uptimeSec % 3600) / 60);
          const uptimeEl = document.getElementById('headerUptime');
          if (uptimeEl) uptimeEl.textContent = `${h}h ${m}m`;
        }

        // === CPU Core Speed @ CPU tab ===
        const mhz = Math.round(speed * 1000);
        const clockElem = document.getElementById('cpuCoreSpeed');
        if (clockElem) clockElem.textContent = `${mhz} MHz`;

        // === RAM gauge @ Memory tab ===
        const usedGb = (memUsed / (1024 ** 3)).toFixed(1);
        const availGb = ((memTotal - memUsed) / (1024 ** 3)).toFixed(1);
        updateRamGauge(memPercent, usedGb, availGb);

        // === Stress test arcs ===
        document.getElementById('stressLiveClock').textContent = `${speed.toFixed(2)} GHz`;
        document.getElementById('stressLiveLoad').textContent = `${currentLoad}%`;
        document.getElementById('stressLiveRam').textContent = `${memPercent}%`;
        const cpuDash = (currentLoad / 100) * ARC_TOTAL_LENGTH;
        const cpuArc = document.getElementById('stressCpuArcPath');
        if (cpuArc) cpuArc.setAttribute('stroke-dasharray', `${cpuDash}, 200`);
        const ramDash = (memPercent / 100) * ARC_TOTAL_LENGTH;
        const ramArc = document.getElementById('stressRamArcPath');
        if (ramArc) ramArc.setAttribute('stroke-dasharray', `${ramDash}, 200`);

        // === HOME PAGE: mini arc gauges ===
        const homeCpuArc = document.getElementById('homeCpuArc');
        if (homeCpuArc) homeCpuArc.setAttribute('stroke-dasharray', `${cpuDash}, 200`);
        const homeCpuPercent = document.getElementById('homeCpuPercent');
        if (homeCpuPercent) homeCpuPercent.textContent = `${currentLoad}%`;
        const homeCpuClock = document.getElementById('homeCpuClock');
        if (homeCpuClock) homeCpuClock.textContent = `${speed.toFixed(2)} GHz`;
        const homeRamArc = document.getElementById('homeRamArc');
        if (homeRamArc) homeRamArc.setAttribute('stroke-dasharray', `${ramDash}, 200`);
        const homeRamPercent = document.getElementById('homeRamPercent');
        if (homeRamPercent) homeRamPercent.textContent = `${memPercent}%`;
        const homeRamUsed = document.getElementById('homeRamUsed');
        if (homeRamUsed) homeRamUsed.textContent = `${usedGb} GB / ${(memTotal/(1024**3)).toFixed(0)} GB`;

        // === History sparkline ===
        CPU_HISTORY.push(currentLoad); CPU_HISTORY.shift();
        RAM_HISTORY.push(memPercent); RAM_HISTORY.shift();
      }
    } catch (e) {}

    // Temperature every 5s
    tempCounter++;
    if (tempCounter % 5 === 0) {
      try {
        const tempRes = await window.hardwareAPI.getTemperatures();
        if (tempRes.success && tempRes.data.cpuTemp) {
          const t = tempRes.data.cpuTemp;
          const el = document.getElementById('headerCpuTemp');
          const chip = document.getElementById('headerTempChip');
          if (el) el.textContent = `${t}°C`;
          if (chip) {
            chip.className = 'header-stat-chip';
            if (t < 70) chip.classList.add('temp-ok');
            else if (t < 85) chip.classList.add('temp-warm');
            else chip.classList.add('temp-hot');
          }
        }
      } catch(e) {}
    }
  }, 1000);
}

// ===== NETWORK TAB =====
function initNetworkTab() {
  // Poll network every 2 seconds
  setInterval(async () => {
    try {
      const res = await window.hardwareAPI.getNetworkInfo();
      if (!res.success) return;
      const { rxSec, txSec, iface, ip4, mac, type } = res.data;

      // Update arc gauges (cap scale at 10240 KB/s = 10 MB/s)
      const rxPct = Math.min(rxSec / 10240, 1);
      const txPct = Math.min(txSec / 10240, 1);

      const rxArc = document.getElementById('netRxArc');
      const txArc = document.getElementById('netTxArc');
      if (rxArc) rxArc.setAttribute('stroke-dasharray', `${rxPct * ARC_TOTAL_LENGTH}, 200`);
      if (txArc) txArc.setAttribute('stroke-dasharray', `${txPct * ARC_TOTAL_LENGTH}, 200`);

      const rxEl = document.getElementById('netRxSpeed');
      const txEl = document.getElementById('netTxSpeed');
      if (rxEl) rxEl.textContent = rxSec >= 1024 ? `${(rxSec/1024).toFixed(1)} MB/s` : `${rxSec}`;
      if (txEl) txEl.textContent = txSec >= 1024 ? `${(txSec/1024).toFixed(1)} MB/s` : `${txSec}`;

      // Peak tracking
      if (rxSec > netRxPeak) { netRxPeak = rxSec; }
      if (txSec > netTxPeak) { netTxPeak = txSec; }
      const rxPeak = document.getElementById('netRxPeak');
      const txPeak = document.getElementById('netTxPeak');
      if (rxPeak) rxPeak.textContent = netRxPeak >= 1024 ? `${(netRxPeak/1024).toFixed(1)} MB/s` : `${netRxPeak} KB/s`;
      if (txPeak) txPeak.textContent = netTxPeak >= 1024 ? `${(netTxPeak/1024).toFixed(1)} MB/s` : `${netTxPeak} KB/s`;

      // Info fields
      setText('netIface', iface);
      setText('netType', type);
      setText('netIp', ip4 || '--');
      setText('netMac', mac || '--');
    } catch(e) {}
  }, 2000);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// BENCHMARK & STRESS TEST
function initStressAndBenchmark() {
  document.getElementById('btnBenchSingle').addEventListener('click', async () => {
    const btn = document.getElementById('btnBenchSingle');
    const scoreElem = document.getElementById('singleBenchScore');
    btn.disabled = true;
    btn.textContent = 'Đang đo...';
    scoreElem.textContent = 'Measuring...';

    const res = await window.hardwareAPI.runCpuBenchmark({ type: 'single' });
    btn.disabled = false;
    btn.textContent = 'Bench CPU (Single)';
    if (res.success) {
      scoreElem.textContent = `${res.score} pts`;
    }
  });

  document.getElementById('btnBenchMulti').addEventListener('click', async () => {
    const btn = document.getElementById('btnBenchMulti');
    const scoreElem = document.getElementById('multiBenchScore');
    btn.disabled = true;
    btn.textContent = 'Đang đo...';
    scoreElem.textContent = 'Measuring...';

    const res = await window.hardwareAPI.runCpuBenchmark({ type: 'multi' });
    btn.disabled = false;
    btn.textContent = 'Bench CPU (Multi)';
    if (res.success) {
      scoreElem.textContent = `${res.score} pts`;
    }
  });

  const btnStart = document.getElementById('btnStartStress');
  const btnStop = document.getElementById('btnStopStress');
  const statusBadge = document.getElementById('stressStatusBadge');
  const timerElem = document.getElementById('stressTimer');

  btnStart.addEventListener('click', async () => {
    const threads = parseInt(document.getElementById('stressThreadsSelect').value, 10) || 12;
    await window.hardwareAPI.startStressTest({ threads });

    isStressRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    statusBadge.textContent = 'CẢNH BÁO: ĐANG ÉP TẢI 100% CẢ 12 LUỒNG XỬ LÝ (STRESS TESTING)...';
    statusBadge.classList.add('active');

    stressStartTime = Date.now();
    stressInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - stressStartTime) / 1000);
      const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const ss = String(elapsedSec % 60).padStart(2, '0');
      timerElem.textContent = `${mm}:${ss}`;
    }, 1000);
  });

  btnStop.addEventListener('click', async () => {
    await window.hardwareAPI.stopStressTest();
    isStressRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    statusBadge.textContent = 'Trạng thái: Đã dừng ép tải (Hệ thống hoạt động ổn định)';
    statusBadge.classList.remove('active');
    clearInterval(stressInterval);
  });
}

function initFooterControls() {
  document.getElementById('btnCloseApp').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('btnExportTxt').addEventListener('click', () => {
    if (!rawData) return;
    const { cpu, mem, graphics, diskLayout } = rawData;
    const reportText = `========================================================
CPU-Z HARDWARE INSPECTOR PRO - THÔNG SỐ & ĐỘ BỀN
Thời gian: ${new Date().toLocaleString()}
========================================================
CPU: ${cpu.brand} (${cpu.physicalCores} Cores / ${cpu.cores} Threads)
RAM: ${(mem.total / (1024**3)).toFixed(1)} GB
GPU: ${graphics.controllers.map(g => g.model).join(', ')}
Ổ CỨNG: ${diskLayout.map(d => `${d.name} (${(d.size / (1024**3)).toFixed(0)}GB)`).join(', ')}
========================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CPUZ_Hardware_Report_${Date.now()}.txt`;
    a.click();
  });
}
