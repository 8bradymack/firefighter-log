/** Turnout Tracker — Internal Fire Station Version **/

const DB_URL = 'https://tpusa-chatgpt-edition-default-rtdb.firebaseio.com/logs.json';

let entries = [];
let currentPage = 'home';
const main = document.getElementById('main-content');
const toastArea = document.getElementById('toast-area');
const modal = document.getElementById('modal');

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentPage = btn.dataset.page;
    renderPage();
  });
});

document.getElementById('btnSync').addEventListener('click', syncData);

// ================================
// Render Pages
// ================================
function renderPage() {
  switch (currentPage) {
    case 'add':
      renderAddPage();
      break;
    case 'logs':
      renderLogsPage();
      break;
    case 'chart':
      renderChartPage();
      break;
    default:
      renderHomePage();
  }
}

// --------------------- Home / Search
function renderHomePage() {
  main.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">Search PPE Records</h2>
    <input id="search" type="text" placeholder="Search by name or serial number" 
      class="border rounded w-full p-2 mb-4" />
    <div id="results" class="space-y-2"></div>
  `;

  const search = document.getElementById('search');
  const results = document.getElementById('results');
  search.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    const filtered = entries.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.serial.toLowerCase().includes(term)
    );
    results.innerHTML = filtered
      .map(e => `
        <div class="bg-white p-3 border rounded shadow-sm">
          <div><strong>${e.name}</strong> — ${e.item}</div>
          <div class="text-xs text-gray-500">Cleaned by ${e.cleanedBy} on ${e.date}</div>
        </div>
      `)
      .join('');
  });
}

// --------------------- Add Entry
function renderAddPage() {
  main.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">Add Cleaning Record</h2>
    <form id="addForm" class="space-y-3 max-w-lg">
      <input name="name" placeholder="Firefighter Name" class="border rounded w-full p-2" required />
      <input name="serial" placeholder="Last 4 digits of Serial #" class="border rounded w-full p-2" required />
      <input name="item" placeholder="PPE Item(s)" class="border rounded w-full p-2" required />
      <input name="cleanedBy" placeholder="Cleaned By" class="border rounded w-full p-2" required />
      <label class="flex items-center space-x-2">
        <input type="checkbox" name="inspection" /> <span>Advanced Inspection Completed</span>
      </label>
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
    </form>
  `;

  document.getElementById('addForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      serial: form.serial.value.trim(),
      item: form.item.value.trim(),
      cleanedBy: form.cleanedBy.value.trim(),
      inspection: form.inspection.checked,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now()
    };
    entries.push(data);
    saveToFirebase();
    form.reset();
    showToast('✅ Record saved.');
  });
}

// --------------------- Logs
function renderLogsPage() {
  main.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">All Logs</h2>
    <div class="overflow-auto bg-white border rounded shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="p-2">Name</th>
            <th class="p-2">Serial</th>
            <th class="p-2">Item</th>
            <th class="p-2">Date</th>
            <th class="p-2">Cleaned By</th>
            <th class="p-2">Inspection</th>
          </tr>
        </thead>
        <tbody id="logBody"></tbody>
      </table>
    </div>
  `;

  const logBody = document.getElementById('logBody');
  logBody.innerHTML = entries.map(e => `
    <tr class="border-t">
      <td class="p-2">${e.name}</td>
      <td class="p-2">${e.serial}</td>
      <td class="p-2">${e.item}</td>
      <td class="p-2">${e.date}</td>
      <td class="p-2">${e.cleanedBy}</td>
      <td class="p-2 text-center">${e.inspection ? '✅' : '❌'}</td>
    </tr>
  `).join('');
}

// --------------------- Chart / Stats
function renderChartPage() {
  main.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">Cleaning Frequency</h2>
    <canvas id="chart" width="400" height="200"></canvas>
  `;
  const ctx = document.getElementById('chart').getContext('2d');
  const counts = {};
  entries.forEach(e => counts[e.name] = (counts[e.name] || 0) + 1);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Cleanings',
        data: Object.values(counts),
        backgroundColor: '#3b82f6'
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// ================================
// Firebase Functions
// ================================
async function saveToFirebase() {
  try {
    await fetch(DB_URL, { method: 'PUT', body: JSON.stringify(entries) });
    showToast('☁️ Synced with Firebase');
  } catch (err) {
    console.error(err);
    showToast('⚠️ Failed to sync');
  }
}

async function syncData() {
  try {
    const res = await fetch(DB_URL);
    entries = (await res.json()) || [];
    renderPage();
    showToast('🔄 Data loaded from cloud');
  } catch (err) {
    showToast('⚠️ Could not load data');
  }
}

// ================================
// Toasts
// ================================
function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast bg-white border shadow px-4 py-2 rounded';
  div.textContent = msg;
  toastArea.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// ================================
syncData();
renderPage();