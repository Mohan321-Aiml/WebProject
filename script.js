// script.js

// Theme preference is shared by every dashboard page.
function applyTheme(theme) {
    const lightMode = theme === 'light';
    document.body.classList.toggle('light-theme', lightMode);
    localStorage.setItem('dashboardTheme', lightMode ? 'light' : 'dark');

    const toggle = document.getElementById('themeToggle');
    const status = document.getElementById('themeStatus');
    const icon = document.getElementById('themeIcon');
    if (toggle) {
        toggle.classList.toggle('is-light', lightMode);
        toggle.setAttribute('aria-checked', String(lightMode));
        toggle.setAttribute('aria-label', lightMode ? 'Toggle dark mode' : 'Toggle light mode');
    }
    if (status) status.textContent = lightMode ? 'Light mode active' : 'Dark mode active';
    if (icon) icon.className = `fas ${lightMode ? 'fa-sun' : 'fa-moon'}`;
}

applyTheme(localStorage.getItem('dashboardTheme') || 'dark');

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.addEventListener('click', () => {
        applyTheme(document.body.classList.contains('light-theme') ? 'dark' : 'light');
    });

    const applyAlertPreference = (name, enabled) => {
        localStorage.setItem(`dashboard${name}Alerts`, String(enabled));
        const button = document.getElementById(`${name.toLowerCase()}AlertsToggle`);
        const status = document.getElementById(`${name.toLowerCase()}AlertsStatus`);
        if (button) {
            button.classList.toggle('is-enabled', enabled);
            button.setAttribute('aria-checked', String(enabled));
        }
        if (status) status.textContent = enabled ? 'Enabled' : 'Disabled';
    };

    ['Email', 'Sms'].forEach((name) => {
        const key = `dashboard${name}Alerts`;
        const enabled = localStorage.getItem(key) !== 'false';
        applyAlertPreference(name, enabled);
        const button = document.getElementById(`${name.toLowerCase()}AlertsToggle`);
        if (button) button.addEventListener('click', () => applyAlertPreference(name, !button.classList.contains('is-enabled')));
    });

    const sensitivity = document.getElementById('aiSensitivity');
    if (sensitivity) {
        sensitivity.value = localStorage.getItem('dashboardAiSensitivity') || 'high';
        sensitivity.addEventListener('change', () => localStorage.setItem('dashboardAiSensitivity', sensitivity.value));
    }
});

// Update current date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const dateEl = document.getElementById('currentDateTime');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}
setInterval(updateDateTime, 1000);
updateDateTime();

// Sensor data simulation
const sensors = [
    { name: 'Temperature', icon: 'fas fa-thermometer-half', unit: '°C', value: 82, status: 'warning', color: 'yellow' },
    { name: 'Humidity', icon: 'fas fa-tint', unit: '%', value: 65, status: 'normal', color: 'green' },
    { name: 'Gas Leakage', icon: 'fas fa-gas-pump', unit: 'ppm', value: 0, status: 'normal', color: 'green' },
    { name: 'Pressure', icon: 'fas fa-gauge', unit: 'PSI', value: 145, status: 'normal', color: 'green' },
    { name: 'Motor Vibration', icon: 'fas fa-wave-square', unit: 'mm/s', value: 12.5, status: 'warning', color: 'yellow' },
    { name: 'Energy Usage', icon: 'fas fa-bolt', unit: 'kW', value: 8.7, status: 'normal', color: 'green' }
];

// Generate sensor cards
function generateSensorCards() {
    const container = document.getElementById('sensorCards');
    if (!container) return;

    const colorMap = {
        green: {
            icon: 'text-emerald-400',
            dot: 'bg-emerald-500',
            bar: 'bg-emerald-400',
            text: 'text-emerald-400',
            border: 'border-emerald-500'
        },
        yellow: {
            icon: 'text-yellow-400',
            dot: 'bg-yellow-500',
            bar: 'bg-yellow-400',
            text: 'text-yellow-400',
            border: 'border-yellow-500'
        },
        red: {
            icon: 'text-red-400',
            dot: 'bg-red-500',
            bar: 'bg-red-400',
            text: 'text-red-400',
            border: 'border-red-500'
        },
        purple: {
            icon: 'text-purple-400',
            dot: 'bg-purple-500',
            bar: 'bg-purple-400',
            text: 'text-purple-400',
            border: 'border-purple-500'
        }
    };

    sensors.forEach(sensor => {
        const styles = colorMap[sensor.color] || colorMap.green;
        const progressWidth = Math.min(sensor.value / 100 * 100, 100);
        const card = document.createElement('div');
        card.className = 'glass-card p-6 rounded-3xl hover:scale-105 transition-transform duration-300';
        card.innerHTML = `
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 bg-opacity-50 border ${styles.border}">
                        <i class="${sensor.icon} text-2xl ${styles.icon}"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold">${sensor.name}</h3>
                        <p class="text-sm text-slate-400">Live sensor reading</p>
                    </div>
                </div>
                <div class="w-3 h-3 rounded-full ${styles.dot} mt-2"></div>
            </div>
            <div class="text-4xl font-bold mb-2">${sensor.value}${sensor.unit}</div>
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm ${styles.text} capitalize">${sensor.status}</span>
                <span class="text-xs text-slate-400">AI Status: Active</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2.5">
                <div class="${styles.bar} h-2.5 rounded-full progress-bar" style="width: ${progressWidth}%;"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Alerts data
const alerts = [
    { type: 'critical', message: 'High motor temperature detected', color: 'red', icon: 'fas fa-exclamation-triangle' },
    { type: 'warning', message: 'Gas leakage warning', color: 'yellow', icon: 'fas fa-exclamation-circle' },
    { type: 'normal', message: 'Pressure overload risk', color: 'green', icon: 'fas fa-info-circle' }
];

// Generate alerts
function generateAlerts() {
    const container = document.getElementById('alertsPanel');
    if (!container) return;
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `p-4 rounded-lg border-l-4 border-${alert.color}-500 bg-${alert.color}-900 bg-opacity-20 flex items-center space-x-3 alert-${alert.type}`;
        alertDiv.innerHTML = `
            <i class="${alert.icon} text-${alert.color}-400 text-xl"></i>
            <div class="flex-1">
                <p class="font-semibold capitalize">${alert.type} Alert</p>
                <p class="text-sm text-gray-300">${alert.message}</p>
                <p class="text-xs text-gray-400 mt-1">2 minutes ago</p>
            </div>
            <button class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(alertDiv);
    });
}

// Machine table data
const machines = [
    { id: 'M001', health: 85, temp: 78, risk: 'Low', status: 'Online', lastMaint: '2023-05-10' },
    { id: 'M002', health: 92, temp: 82, risk: 'Medium', status: 'Online', lastMaint: '2023-05-08' },
    { id: 'M003', health: 67, temp: 95, risk: 'High', status: 'Warning', lastMaint: '2023-04-28' },
    { id: 'M004', health: 88, temp: 75, risk: 'Low', status: 'Online', lastMaint: '2023-05-12' }
];

// Generate machine table
function generateMachineTable() {
    const tbody = document.getElementById('machineTable');
    if (!tbody) return;
    machines.forEach(machine => {
        const row = document.createElement('tr');
        row.className = 'border-t border-gray-700 hover:bg-gray-700 transition-colors';
        row.innerHTML = `
            <td class="p-3">${machine.id}</td>
            <td class="p-3">${machine.health}%</td>
            <td class="p-3">${machine.temp}°C</td>
            <td class="p-3"><span class="px-2 py-1 rounded text-xs ${machine.risk === 'High' ? 'bg-red-900 text-red-300' : machine.risk === 'Medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}">${machine.risk}</span></td>
            <td class="p-3"><span class="px-2 py-1 rounded text-xs ${machine.status === 'Online' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">${machine.status}</span></td>
            <td class="p-3">${machine.lastMaint}</td>
        `;
        tbody.appendChild(row);
    });
}

// Charts
let tempChart, vibChart, powerChart, perfChart;

function initCharts() {
    const tempCanvas = document.getElementById('tempChart');
    if (tempCanvas) {
        const tempCtx = tempCanvas.getContext('2d');
        tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [75, 78, 82, 85, 80, 77],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false, grid: { color: '#374151' } },
                    x: { grid: { color: '#374151' } }
                },
                plugins: { legend: { labels: { color: '#FFFFFF' } } }
            }
        });
    }

    const vibCanvas = document.getElementById('vibChart');
    if (vibCanvas) {
        const vibCtx = vibCanvas.getContext('2d');
        vibChart = new Chart(vibCtx, {
            type: 'bar',
            data: {
                labels: ['Motor 1', 'Motor 2', 'Motor 3', 'Motor 4'],
                datasets: [{
                    label: 'Vibration (mm/s)',
                    data: [8, 12, 15, 9],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#10B981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#374151' } },
                    x: { grid: { color: '#374151' } }
                },
                plugins: { legend: { labels: { color: '#FFFFFF' } } }
            }
        });
    }

    const powerCanvas = document.getElementById('powerChart');
    if (powerCanvas) {
        const powerCtx = powerCanvas.getContext('2d');
        powerChart = new Chart(powerCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Power Usage (kW)',
                    data: [6, 8, 9, 10, 7, 6],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#374151' } },
                    x: { grid: { color: '#374151' } }
                },
                plugins: { legend: { labels: { color: '#FFFFFF' } } }
            }
        });
    }

    const perfCanvas = document.getElementById('perfChart');
    if (perfCanvas) {
        const perfCtx = perfCanvas.getContext('2d');
        perfChart = new Chart(perfCtx, {
            type: 'doughnut',
            data: {
                labels: ['Optimal', 'Good', 'Warning', 'Critical'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#FFFFFF' } } }
            }
        });
    }
}

// Simulate real-time updates
function updateSensorData() {
    sensors.forEach((sensor, index) => {
        sensor.value += (Math.random() - 0.5) * 2; // Small random change
        sensor.value = Math.max(0, Math.min(sensor.value, 100)); // Keep within bounds
        if (sensor.value > 90) sensor.status = 'critical';
        else if (sensor.value > 80) sensor.status = 'warning';
        else sensor.status = 'normal';
    });
    // Update cards (simplified, in real app would re-render)
}

// Chatbot functionality
const sendChatButton = document.getElementById('sendChat');
if (sendChatButton) {
    sendChatButton.addEventListener('click', function() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (message) {
            addChatMessage('You', message);
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "Motor Unit 3 is at the highest risk with 78% failure probability.",
                    "I recommend scheduling maintenance for all motors within the next 24 hours.",
                    "There are 2 critical alerts: high temperature and vibration anomaly.",
                    "Machine M001 is operating normally with 85% health score.",
                    "AI predicts potential bearing failure in Motor 2 within 48 hours."
                ];
                addChatMessage('AI Assistant', responses[Math.floor(Math.random() * responses.length)]);
            }, 1000);
            input.value = '';
        }
    });
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-2 fade-in';
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Emergency buttons
const emergencyShutdown = document.getElementById('emergencyShutdown');
if (emergencyShutdown) emergencyShutdown.addEventListener('click', () => alert('Emergency shutdown initiated!'));

const resetAlarm = document.getElementById('resetAlarm');
if (resetAlarm) resetAlarm.addEventListener('click', () => alert('Alarms reset!'));

const callMaintenance = document.getElementById('callMaintenance');
if (callMaintenance) callMaintenance.addEventListener('click', () => alert('Maintenance team notified!'));

const activateCooling = document.getElementById('activateCooling');
if (activateCooling) activateCooling.addEventListener('click', () => alert('Cooling system activated!'));

// Notification bell
const notificationBell = document.getElementById('notificationBell');
if (notificationBell) {
    notificationBell.addEventListener('click', () => {
        alert('You have 3 active notifications: 1 critical, 2 warnings');
    });
}

// Machine monitoring data
const machinesData = [
    { 
        name: 'Assembly Line A', 
        id: 'MC-191', 
        status: 'ONLINE', 
        statusColor: 'green',
        internalTemp: '42.4°C',
        linePressure: '53 PSI'
    },
    { 
        name: 'Cooling Unit 04', 
        id: 'MC-192', 
        status: 'ONLINE', 
        statusColor: 'green',
        internalTemp: '16.4°C',
        linePressure: '29 PSI'
    },
    { 
        name: 'Hydraulic Press', 
        id: 'MC-193', 
        status: 'WARNING', 
        statusColor: 'warning',
        internalTemp: '68.4°C',
        linePressure: '450 PSI'
    },
    { 
        name: 'Compressor B', 
        id: 'MC-194', 
        status: 'ONLINE', 
        statusColor: 'green',
        internalTemp: '34.3°C',
        linePressure: '237 PSI',
        highlight: true
    },
    { 
        name: 'Laser Cutter', 
        id: 'MC-195', 
        status: 'OFFLINE', 
        statusColor: 'red',
        internalTemp: '44.9°C',
        linePressure: '10 PSI'
    },
    { 
        name: 'Conveyor Rail 2', 
        id: 'MC-196', 
        status: 'ONLINE', 
        statusColor: 'green',
        internalTemp: '32.1°C',
        linePressure: '-19 PSI'
    }
];

// Generate machine cards
function generateMachineCards() {
    const container = document.getElementById('machineCards');
    if (!container) return;

    machinesData.forEach(machine => {
        const statusClass = machine.statusColor === 'green' ? 'text-green-400' 
                          : machine.statusColor === 'warning' ? 'text-yellow-400'
                          : 'text-red-400';
        const statusBgClass = machine.statusColor === 'green' ? 'bg-green-900' 
                            : machine.statusColor === 'warning' ? 'bg-yellow-900'
                            : 'bg-red-900';
        const borderClass = machine.highlight ? 'border-blue-500 border-2' : 'border-slate-700';
        
        const card = document.createElement('div');
        card.className = `glass-card p-6 rounded-3xl border ${borderClass} transition-all duration-300 hover:shadow-lg`;
        if (machine.highlight) {
            card.classList.add('shadow-lg', 'shadow-blue-500/30');
        }
        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h3 class="text-xl font-semibold text-white">${machine.name}</h3>
                    <p class="text-sm text-slate-400 mt-1">${machine.id}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusClass} ${statusBgClass}">
                    ${machine.status}
                </span>
            </div>
            
            <div class="space-y-4 mb-6">
                <div class="flex justify-between">
                    <div>
                        <p class="text-slate-500 text-xs uppercase tracking-wider mb-1">Internal Temp</p>
                        <p class="text-2xl font-bold text-white">${machine.internalTemp}</p>
                    </div>
                    <div>
                        <p class="text-slate-500 text-xs uppercase tracking-wider mb-1">Line Pressure</p>
                        <p class="text-2xl font-bold text-white">${machine.linePressure}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Alert filtering functionality
function initAlertFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const alertRows = document.querySelectorAll('.alert-row');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button style
            filterBtns.forEach(b => {
                b.classList.remove('bg-blue-600', 'bg-blue-500');
                b.classList.add('bg-slate-700', 'hover:bg-slate-600');
            });
            this.classList.remove('bg-slate-700', 'hover:bg-slate-600');
            this.classList.add('bg-blue-600', 'hover:bg-blue-500');

            // Filter table rows
            alertRows.forEach(row => {
                const severity = row.getAttribute('data-severity');
                if (filter === 'all') {
                    row.style.display = '';
                } else if (severity === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    generateSensorCards();
    generateAlerts();
    generateMachineTable();
    generateMachineCards();
    initCharts();
    initAlertFilters();
    setInterval(updateSensorData, 5000); // Update every 5 seconds
});
