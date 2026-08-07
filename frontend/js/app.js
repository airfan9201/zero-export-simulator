const API_URL = "https://zero-export-simulator.onrender.com/simulate";

// Variable global untuk simpan instance chart
let powerChart = null;

// ================= GAME MODE VARIABLES =================


// ==========================================
// 1. INSIALISASI & KEMASKINI CHART.JS
// ==========================================
function initChart() {
    const ctx = document.getElementById('powerChart');
    if (!ctx) return;

    powerChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Available PV', 'Actual PV Output', 'Factory Load', 'Incoming Meter (Grid)', 'Curtailment'],
            datasets: [{
                label: 'Power (kW)',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#FFC107', // Available PV (Kuning)
                    '#00E676', // Actual PV (Hijau)
                    '#29B6F6', // Factory Load (Biru)
                    '#FF7043', // Incoming Meter (Oren)
                    '#E91E63'  // Curtailment (Pink)
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#4A4A4A' },
                    ticks: { color: '#DDDDDD' }
                },
                x: {
                    ticks: { color: '#DDDDDD' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateChart(result) {
    if (!powerChart) return;

    powerChart.data.datasets[0].data = [
        result.available_pv_power,
        result.actual_pv_output,
        result.factory_load,
        result.incoming_meter,
        result.curtailed_power
    ];
    
    powerChart.update();
}

// ==========================================
// 2. SIMULASI & PEMANGGILAN API
// ==========================================
async function updateSimulation() {
    try {
        const start = performance.now();
        const dcCapacity = document.getElementById("dc-capacity").value;
        const irradiance = document.getElementById("irradiance").value;
        const temperature = document.getElementById("temperature").value;
        const incomingMeter = document.getElementById("incoming-meter-slider").value;
        //const offset = document.getElementById("offset").value;
        const offset = document.getElementById("offset").value || 0; // Pastikan ada nilai laluan jika kosong
		
        //const url = `${API_URL}?dc_capacity=${dcCapacity}&irradiance=${irradiance}&temperature=${temperature}&incoming_meter=${incomingMeter}&offset=${offset}`;
		// Pembinaan URL yang betul tanpa titik bertindih (:) tersalah letak
        const url = `${API_URL}?dc_capacity=${parseFloat(dcCapacity)}&irradiance=${parseFloat(irradiance)}&temperature=${parseFloat(temperature)}&incoming_meter=${parseFloat(incomingMeter)}&offset=${parseFloat(offset)}`;
		
        const response = await fetch(url);		

        if (!response.ok) {
           throw new Error(`Backend request failed with status ${response.status}`);
        }

        const result = await response.json();
        const elapsed = performance.now() - start;
        
        const status = document.getElementById("connection-status");

        document.getElementById("response-time").innerText = elapsed.toFixed(1) + " ms";
        document.getElementById("last-update").innerText = new Date().toLocaleTimeString();

        status.innerText = "Connected";
        status.className = "status status-ok";

        // Kemaskini kad jawapan
        document.getElementById("available-pv").innerText = result.available_pv_power.toFixed(2);
        document.getElementById("actual-pv").innerText = result.actual_pv_output.toFixed(2);
        document.getElementById("factory-load").innerText = result.factory_load.toFixed(2);
        document.getElementById("incoming-meter").innerText = result.incoming_meter.toFixed(2);
        document.getElementById("export").innerText = result.export.toFixed(2);
        document.getElementById("curtailment").innerText = result.curtailed_power.toFixed(2);
            
        // Kemaskini Penilaian
        updateAssessment(result);			
        
        // Kemaskini Graf
        updateChart(result);

		//update flow
		updatePowerFlow(result)
		
    }
    catch(error){
        console.error(error);
        const status = document.getElementById("connection-status");
        status.innerText = "Disconnected";
        status.className = "status status-error";

        document.getElementById("available-pv").innerText = "--";
        document.getElementById("actual-pv").innerText = "--";
        document.getElementById("factory-load").innerText = "--";
        document.getElementById("incoming-meter").innerText = "--";
        document.getElementById("export").innerText = "--";
        document.getElementById("curtailment").innerText = "--";
        document.getElementById("response-time").innerText = "--";
        document.getElementById("last-update").innerText = "--";
    }
}

// ==========================================
// 3. LISTENERS & SCENARIO
// ==========================================
function initializeInputPanel() {
    const irradianceSlider = document.getElementById("irradiance");
    const temperatureSlider = document.getElementById("temperature");
    const incomingMeterSlider = document.getElementById("incoming-meter-slider");
    const dcCapacity = document.getElementById("dc-capacity");	
    const offset = document.getElementById("offset");
    
    irradianceSlider.addEventListener("input", () => {
        document.getElementById("irradiance-value").innerText = irradianceSlider.value;
        updateSimulation();		
    });

    temperatureSlider.addEventListener("input", () => {
        document.getElementById("temperature-value").innerText = temperatureSlider.value;
        updateSimulation();	
    });

    incomingMeterSlider.addEventListener("input", () => {
        document.getElementById("incoming-meter-value").innerText = incomingMeterSlider.value;
        updateSimulation();	
    });
    
    dcCapacity.addEventListener("input", () => {
        updateSimulation();
    });
    
    offset.addEventListener("input", () => {
        updateSimulation();
    });
}

let simulationTimer = null;

// ==========================================
// 1. SIMULASI LATENCY / CONTROLLER DELAY
// ==========================================
function simulateControllerDelay() {
    const title = document.getElementById("assessment-title");
    const description = document.getElementById("assessment-description");

    // Fasa 1: Tunjukkan Amaran Overshoot / Power Spillover
    if (title && description) {
        title.innerText = "🚨 CRITICAL: Temporary Reverse Power Export!";
        description.innerHTML = `
            <li style="color:#FF5252; font-weight:bold;">Factory load dropped rapidly from 25,000 kW to 1,000 kW!</li>
            <li style="color:#FF5252;">Controller detecting reverse power flow (Latency Delay ~2.5s)...</li>
            <li style="color:#FF5252;">Excess solar energy is spilling over to the Utility Grid!</li>
        `;
    }

    // Kemaskini Status Node ke Warna MERAH (Export)
    const arrowGrid = document.getElementById("arrow-grid");
    const nodeGrid = document.getElementById("node-grid");
    
    if (arrowGrid && nodeGrid) {
        arrowGrid.innerText = "►";
        arrowGrid.style.color = "#F44336";
        nodeGrid.className = "node-card status-export";
        const flowGridVal = document.getElementById("flow-grid-val");
        if (flowGridVal) flowGridVal.innerText = "21296.02 kW (EXPORT!)";
    }

    // Fasa 2: Selepas 2.5 saat, panggil backend untuk pengiraan Curtailment sebenar
    simulationTimer = setTimeout(() => {
        updateSimulation();
    }, 2500);
}

// ==========================================
// 2. LOGIK PENUKARAN SENARIO
// ==========================================
function applyScenario(type, btnElement) {
    // 1. Kemaskini rupa butang (Active State)
    const allButtons = document.querySelectorAll('.scenario-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));

    if (btnElement) {
        btnElement.classList.add('active');
    } else {
        // Fallback jika dipanggil tanpa parameter btnElement
        const currentBtn = document.getElementById(`btn-${type}`);
        if (currentBtn) currentBtn.classList.add('active');
    }

    // 2. Akses Input Sliders
    const irradiance = document.getElementById("irradiance");
    const temperature = document.getElementById("temperature");
    const incomingMeter = document.getElementById("incoming-meter-slider");
    const offset = document.getElementById("offset");

    if (simulationTimer) clearInterval(simulationTimer);

    if (type === 'load_drop') {
        irradiance.value = 1100;
        temperature.value = 30;
        incomingMeter.value = 1000; 
        offset.value = 0;

        document.getElementById("irradiance-value").innerText = irradiance.value;
        document.getElementById("temperature-value").innerText = temperature.value;
        document.getElementById("incoming-meter-value").innerText = incomingMeter.value;

        simulateControllerDelay();
    } 
    else {
        if (type === 'normal') {
            irradiance.value = 1000;
            temperature.value = 35;
            incomingMeter.value = 25000;
            offset.value = 0;
        } 
        else if (type === 'cloud') {
            irradiance.value = 250;
            temperature.value = 28;
            incomingMeter.value = 12000;
            offset.value = 0;
        } 
        else if (type === 'offset_test') {
            irradiance.value = 950;
            temperature.value = 32;
            incomingMeter.value = 5000;
            offset.value = 500;
        }

        document.getElementById("irradiance-value").innerText = irradiance.value;
        document.getElementById("temperature-value").innerText = temperature.value;
        document.getElementById("incoming-meter-value").innerText = incomingMeter.value;

        updateSimulation();
    }
}

function updateAssessment(result){
    const title = document.getElementById("assessment-title");
    const description = document.getElementById("assessment-description");

    if(result.curtailed_power > 0){
        title.innerText = "🟢 Zero Export Active";
        description.innerHTML = `
            <li>Available PV exceeds the factory demand.</li>
            <li>Controller limits inverter output.</li>
            <li>No power is exported to the utility grid.</li>
            <li>System operating as expected.</li>
        `;
    }
    else{
        title.innerText = "🟢 PV Limited By Availability";
        description.innerHTML = `
            <li>Available PV is lower than the factory demand.</li>
            <li>The inverter is operating at maximum available output.</li>
            <li>Additional power is supplied by the utility grid.</li>
            <li>No curtailment is required.</li>
        `;
    }
}


function updatePowerFlow(result) {
    // Kemaskini nilai Teks pada Node
    document.getElementById("flow-pv-val").innerText = result.available_pv_power.toFixed(2) + " kW";
    document.getElementById("flow-inv-val").innerText = result.actual_pv_output.toFixed(2) + " kW";
    document.getElementById("flow-load-val").innerText = result.factory_load.toFixed(2) + " kW";
    document.getElementById("flow-grid-val").innerText = result.incoming_meter.toFixed(2) + " kW";

    const arrowGrid = document.getElementById("arrow-grid");
    const nodeGrid = document.getElementById("node-grid");

    // Jika berlaku Export (Tenaga keluar ke grid)
    if (result.export > 0) {
        arrowGrid.innerText = "►"; // Anak panah menunjuk ke Grid
        arrowGrid.style.color = "#F44336";
        nodeGrid.className = "node-card status-export";
        document.getElementById("flow-grid-val").innerText = result.export.toFixed(2) + " kW (Export)";
    } 
    // Jika Import dari Grid (Kuasa masuk dari Grid ke Kilang)
    else if (result.incoming_meter > 0) {
        arrowGrid.innerText = "◄"; // Anak panah menunjuk ke Load
        arrowGrid.style.color = "#FF7043";
        nodeGrid.className = "node-card status-active";
    } 
    // Zero Export Sempurna (Grid = 0 kW)
    else {
        arrowGrid.innerText = "━";
        arrowGrid.style.color = "#888888";
        nodeGrid.className = "node-card";
    }
}

// ==========================================
// LOGIK TEMA (LIGHT / DARK THEME TOGGLE)
// ==========================================
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme); // Simpan pilihan pengguna
    
    updateThemeUI(newTheme);
    updateChartTheme(newTheme);
}

function updateThemeUI(theme) {
    const icon = document.getElementById("theme-icon");
    const text = document.getElementById("theme-text");
    
    if (theme === "light") {
        if (icon) icon.innerText = "🌙";
        if (text) text.innerText = "Dark Mode";
    } else {
        if (icon) icon.innerText = "☀️";
        if (text) text.innerText = "Light Mode";
    }
}

function updateChartTheme(theme) {
    if (!powerChart) return;
    
    const textColor = theme === "light" ? "#212121" : "#DDDDDD";
    const gridColor = theme === "light" ? "#E0E0E0" : "#4A4A4A";
    
    powerChart.options.scales.y.ticks.color = textColor;
    powerChart.options.scales.y.grid.color = gridColor;
    powerChart.options.scales.x.ticks.color = textColor;
    powerChart.update();
	powerChart.resize();
}

function initTheme() {
    // Semak tema yang disimpan dalam LocalStorage atau guna Dark sebagai laluan
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeUI(savedTheme);
}

// ==========================================
// 4. PELAKSANAAN BILA DOM SIAP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
	initTheme(); // Set tema awal
    initChart();
    initializeInputPanel();
    //updateSimulation();
	// Panggil senario normal secara automatik pada waktu reload
    applyScenario('normal');
});

// ==========================================
// QUIZ MASTER GAME
// ==========================================
const quizData = [
    {
        q: "Apakah tujuan utama fungsi 'Zero Export' pada sistem Solar PV?",
        options: [
            "Memastikan tiada tenaga solar dijual ke grid TNB",
            "Menutup semua bekalan elektrik kilang",
            "Menaikkan voltan inverter ke tahap maksimum",
            "Menukar tenaga AC kepada DC secara automatik"
        ],
        answer: 0
    },
    {
        q: "Komponen manakah yang mengesan arah aliran arus untuk kawalan Zero Export?",
        options: [
            "Solar Panel",
            "Smart Meter / Power Meter",
            "DC Isolator",
            "Battery Inverter"
        ],
        answer: 1
    },
    {
        q: "Apa yang berlaku jika PV Generation melebihi Load Demand dalam mod Zero Export?",
        options: [
            "Sistem akan meletup",
            "Inverter melakukan Curtailment (potong output)",
            "Tenaga berlebihan disimpan dalam grid secara percuma",
            "TNB akan beri denda serta-merta"
        ],
        answer: 1
    },
    {
        q: "Mengapakah Offset Buffer (Margin) diperlukan dalam Zero Export?",
        options: [
            "Untuk menjimatkan bateri",
            "Sebagai ruang keselamatan mengelak hardware latency",
            "Untuk menaikkan harga tarif elektrik",
            "Supaya solar panel sentiasa bersih"
        ],
        answer: 1
    }
];

let currentQIndex = 0;
let quizScore = 0;
let quizTimer = 15;
let quizInterval = null;

// Toggle Game Dashboard
document.getElementById('gameModeToggle').addEventListener('change', function(e) {
    const gameDash = document.getElementById('gameDashboard');
    if (e.target.checked) {
        gameDash.classList.remove('hideDisplay');
    } else {
        gameDash.classList.add('hideDisplay');
        resetQuiz();
    }
});

// Listener untuk butang Start Quiz
document.getElementById('startQuizBtn').addEventListener('click', function() {
    startQuiz();
});

function startQuiz() {
    currentQIndex = 0;
    quizScore = 0;
    document.getElementById('quizScore').textContent = quizScore;
    document.getElementById('startQuizBtn').style.display = 'none';
    showQuestion();
}

function showQuestion() {
    clearInterval(quizInterval);
    quizTimer = 15;
    document.getElementById('quizTimer').textContent = quizTimer + "s";

    if (currentQIndex >= quizData.length) {
        endQuiz();
        return;
    }

    const q = quizData[currentQIndex];
    document.getElementById('quizQuestion').textContent = `${currentQIndex + 1}. ${q.q}`;
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = "";

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "quiz-opt-btn";
        btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
        btn.onclick = () => checkAnswer(idx, btn);
        optionsContainer.appendChild(btn);
    });

    // Timer Countdown 15s
    quizInterval = setInterval(() => {
        quizTimer--;
        document.getElementById('quizTimer').textContent = quizTimer + "s";
        if (quizTimer <= 0) {
            clearInterval(quizInterval);
            nextQuestion();
        }
    }, 1000);
}

function checkAnswer(selectedIdx, btnElement) {
    clearInterval(quizInterval);
    const q = quizData[currentQIndex];
    const allBtns = document.querySelectorAll('.quiz-opt-btn');
    
    allBtns.forEach(b => b.onclick = null); // Nyahaktifkan butang selepas ditekan

    if (selectedIdx === q.answer) {
        btnElement.classList.add('correct');
        let gained = 100 + (quizTimer * 10); // Bonus masa
        quizScore += gained;
        document.getElementById('quizScore').textContent = quizScore;
    } else {
        btnElement.classList.add('wrong');
        allBtns[q.answer].classList.add('correct'); // Tunjuk jawapan betul
    }

    setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
    currentQIndex++;
    showQuestion();
}

function endQuiz() {
    clearInterval(quizInterval);
    document.getElementById('quizQuestion').innerHTML = `🎉 <b>TAHNIAH! QUIZ SELESAI!</b><br><br>Markah Akhir Anda: <span style="color: var(--primary); font-size: 24px;">${quizScore}</span>`;
    document.getElementById('quizOptions').innerHTML = "";
    
    const startBtn = document.getElementById('startQuizBtn');
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "🔄 Main Semula";
}

function resetQuiz() {
    clearInterval(quizInterval);
    document.getElementById('quizQuestion').textContent = "Tekan butang di bawah untuk memulakan cabaran kuiz!";
    document.getElementById('quizOptions').innerHTML = "";
    document.getElementById('startQuizBtn').style.display = 'inline-block';
    document.getElementById('startQuizBtn').textContent = "▶️ Mula Kuiz";
    document.getElementById('quizScore').textContent = "0";
    document.getElementById('quizTimer').textContent = "15s";
}