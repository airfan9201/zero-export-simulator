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
// ==========================================
// QUIZ MASTER GAME (2 MODE: BASIC & ADVANCE)
// ==========================================

// 1. BANK SOALAN MODE BIASA (Khas Zero Export & Grid Rules)
// ==========================================
// QUIZ MASTER GAME (2 MODE: BASIC & ADVANCE)
// ==========================================

// 1. BANK SOALAN MODE BIASA (Khas Zero Export & Grid Rules - 25 Soalan)
const basicQuizBank = [
    { q: "Apakah tujuan utama fungsi 'Zero Export' pada sistem Solar PV?", options: ["Memastikan tiada tenaga solar dijual ke grid TNB", "Menutup semua bekalan elektrik kilang", "Menaikkan voltan inverter ke tahap maksimum", "Menukar tenaga AC kepada DC secara automatik"], answer: 0 },
    { q: "Komponen manakah yang mengesan arah aliran arus untuk kawalan Zero Export?", options: ["Solar Panel", "Smart Meter / Power Meter", "DC Isolator", "Battery Inverter"], answer: 1 },
    { q: "Apa yang berlaku jika PV Generation melebihi Load Demand dalam mod Zero Export?", options: ["Sistem akan meletup", "Inverter melakukan Curtailment (potong output)", "Tenaga berlebihan disimpan dalam grid secara percuma", "TNB akan beri denda serta-merta"], answer: 1 },
    { q: "Mengapakah Offset Buffer (Margin) diperlukan dalam Zero Export?", options: ["Untuk menjimatkan bateri", "Sebagai ruang keselamatan mengelak hardware latency", "Untuk menaikkan harga tarif elektrik", "Supaya solar panel sentiasa bersih"], answer: 1 },
    { q: "Apakah maksud istilah 'Curtailment' dalam sistem solar?", options: ["Pembersihan solar panel", "Menghadkan pengeluaran kuasa inverter", "Pemasangan bateri simpanan", "Pemotongan kabel elektrik"], answer: 1 },
    { q: "Apakah risiko utama jika berlaku Reverse Power Flow ke grid tanpa kebenaran?", options: ["Mengenakan penalti/denda daripada TNB/ST", "Solar panel rosak", "Voltase rumah menjadi kosong", "Inverter menjadi lebih sejuk"], answer: 0 },
    { q: "Istilah 'Latency' dalam pengawal Zero Export merujuk kepada?", options: ["Kelajuan angin", "Suhu persekitaran", "Masa tindak balas (delay) sistem mengesan & melaras kuasa", "Kapasiti bateri"], answer: 2 },
    { q: "Apakah peranan utama CT (Current Transformer) dalam Zero Export?", options: ["Mengukur arus elektrik pada kabel utama", "Menjana elektrik solar", "Menyejukkan inverter", "Mengawal kelajuan kipas"], answer: 0 },
    { q: "Jika Load Kilang ialah 50 kW dan Solar menghasilkan 30 kW, berapakah kuasa diambil dari Grid?", options: ["0 kW", "20 kW", "80 kW", "50 kW"], answer: 1 },
    { q: "Jika Load Kilang ialah 20 kW dan Solar berpotensi hasilkan 40 kW, berapa kW perlu di-curtail dalam Zero Export?", options: ["0 kW", "10 kW", "20 kW", "40 kW"], answer: 2 },
    { q: "Jika tetapan Offset Buffer dijatuhkan ke 0 kW, apakah risiko yang paling tinggi boleh berlaku?", options: ["Spillover / Reverse power export semasa kilang mengalami sudden load drop", "Inverter terus terbakar", "Solar panel berhenti beroperasi terus", "Voltan kilang jatuh ke 0V"], answer: 0 },
    { q: "Mengapakah sistem 'Non-Conforming NEM / Zero Export' menjadi pilihan sesetengah kilang?", options: ["Kuota NEM sudah habis atau ingin mengelak syarat jualan semula tenaga", "Untuk membayar bil elektrik yang lebih mahal", "Sebab tidak mahu memasang inverter", "Sebab solar panel tidak perlu dibersihkan"], answer: 0 },
    { q: "Parameter manakah pada Inverter yang perlu diselaraskan semasa melakukan 'Inverter Curtailment'?", options: ["Active Power Limit (%)", "Voltan Input DC", "Sudut Fasa Asas", "Suhu Operasi Maximum"], answer: 0 },
    { q: "Protokol komunikasi manakah yang biasa digunakan antara Power Meter dan Inverter?", options: ["Modbus RTU / TCP", "Bluetooth Low Energy", "FM Radio", "Coaxial Cable"], answer: 0 },
    { q: "Apakah yang dimaksudkan dengan istilah 'Self-Consumption' dalam sistem PV?", options: ["Menggunakan semua tenaga solar yang dijana untuk keperluan sendiri", "Menjual tenaga solar secara pukal", "Menyimpan tenaga solar dalam Grid", "Menggunakan penjana diesel secara berterusan"], answer: 0 },
    
    // 💥 10 SOALAN BAHARU DITAMBAH (MODE BIASA)
    { q: "Lokasi terbaik untuk memasang Current Transformer (CT) Zero Export adalah di...", options: ["Titik kemasukan utama sebelum beban kilang (Main Point of Common Coupling)", "Tepi solar panel di atas bumbung", "Sisi bateri ganti", "Di dalam kotak soket pendingin air"], answer: 0 },
    { q: "Apakah yang berlaku kepada skematik kuasa jika 'Load Drop' berlaku secara mendadak tetapi Response Time Inverter lambat?", options: ["Reverse Power Export sementara berlaku ke grid", "Kilang terputus bekalan terus", "Solar panel menghasilkan voltan negatif", "Bateri meletup secara automatik"], answer: 0 },
    { q: "Apakah fungsi utama 'Zero Export Controller' berasingan jika Inverter tiada kawalan terbina?", options: ["Membaca data Smart Meter dan menghantar arahan kawalan kuasa ke Inverter", "Menukarkan arus AC ke DC secara manual", "Meningkatkan suhu sekeliling", "Membuat pembersihan automatik pada panel"], answer: 0 },
    { q: "Sistem Zero Export mengurangkan kecekapan kewangan solar terutamanya apabila...", options: ["Beban kilang terlalu rendah pada waktu tengah hari berbanding potensi PV", "Suhu udara persekitaran sangat sejuk", "Hujan lebat sepanjang hari", "Voltan TNB berada pada paras tinggi"], answer: 0 },
    { q: "Mengapakah 'Ramp Rate Control' penting dalam pengawal Zero Export?", options: ["Mengelak perubahan kuasa Inverter berlaku terlalu drastik yang menjejaskan kestabilan voltan", "Meningkatkan kelajuan fizikal angin", "Memastikan kabel DC tidak basah", "Menukar frekuensi grid kepada 60Hz"], answer: 0 },
    { q: "Jika bacaan CT pada Smart Meter menunjukkan nilai 'Negative Power (-kW)', ini bermaksud...", options: ["Tenaga sedang mengeksport ke grid awam (Exporting)", "Kilang sedang mengambil kuasa tinggi dari grid", "Solar panel tidak menjana sebarang kuasa", "Bateri sedang kehabisan cas"], answer: 0 },
    { q: "Berapakah kadar peratusan biasa 'Offset Buffer' yang disyorkan pada Inverter untuk langkah keselamatan?", options: ["1% - 5% daripada kapasiti inverter", "50% daripada kapasiti inverter", "100% daripada kapasiti inverter", "0% tanpa sebarang margin"], answer: 0 },
    { q: "Di Malaysia, kelulusan pendaftaran sistem Zero Export biasanya diselia di bawah garis panduan...", options: ["Suruhanjaya Tenaga (ST) & TNB", "Kementerian Pengangkutan", "Jabatan Kerajaan Tempatan", "Jabatan Meteorologi Malaysia"], answer: 0 },
    { q: "Apakah beza utama antara sistem 'NEM (Net Energy Metering)' dan 'Zero Export'?", options: ["NEM membenarkan jualan/kredit lebihan tenaga ke grid, Zero Export melarang sebarang lebihan ke grid", "NEM tidak memerlukan solar panel", "Zero Export menggunakan penjana arang batu", "NEM hanya berfungsi pada waktu malam"], answer: 0 },
    { q: "Jika sambungan RS485 antara Power Meter dan Zero Export Controller terputus, apakah tindakan keselamatan automatik Inverter?", options: ["Mengurangkan output ke paras minimum/selamat (Fail-Safe Mode)", "Meletupkan litar utama", "Menaikkan kuasa ke 200%", "Mematikan bekalan elektrik seluruh daerah"], answer: 0 }
];

// 2. BANK SOALAN MODE ADVANCE (Soalan Lebih Sukar & Power Engineering Umum - 30 Soalan)
const advanceQuizBank = [
    { q: "Apakah piawaian Standard Test Conditions (STC) untuk ujian solar panel?", options: ["1000 W/m², 25°C, AM 1.5", "800 W/m², 35°C, AM 1.0", "1200 W/m², 0°C, AM 2.0", "500 W/m², 20°C, AM 1.5"], answer: 0 },
    { q: "Apakah singkatan bagi BESS dalam sistem tenaga baharu?", options: ["Battery Energy Storage System", "Basic Electrical Solar System", "Backup Energy Surge Safety", "Bi-directional Energy Smart Switch"], answer: 0 },
    { q: "Dalam sistem Hybrid, apakah fungsi BESS jika berlaku PV Generation berlebihan?", options: ["Menyimpan tenaga berlebihan tersebut daripada melakukan Curtailment", "Mematikan kuasa elektrik satu bangunan", "Menaikkan voltan grid TNB", "Membuang tenaga sebagai haba"], answer: 0 },
    { q: "Apakah maksud istilah 'Performance Ratio' (PR) dalam sistem Solar PV?", options: ["Nisbah antara tenaga sebenar yang dihasilkan berbanding potensi teori", "Kelajuan inverter memproses data", "Masa yang diambil untuk membersihkan panel", "Jumlah denda yang dikenakan oleh grid"], answer: 0 },
    { q: "Manakah antara berikut MERUPAKAN punca utama berlakunya 'Voltage Unbalance' dalam sistem 3-fasa?", options: ["Pengagihan beban (load) yang tidak seimbang pada fasa R, Y, B", "Penggunaan solar panel yang terlalu bersih", "Penggunaan kabel elektrik yang terlalu tebal", "Suhu inverter yang sejuk"], answer: 0 },
    { q: "Apakah fungsi utama MPPT (Maximum Power Point Tracking) dalam inverter?", options: ["Mencari titik kuasa maksimum yang boleh dikeluarkan oleh solar panel pada sebarang cuaca", "Mengunci voltan supaya sentiasa 240V", "Mengukur jarak antara solar panel dan matahari", "Mengurangkan saiz fizikal inverter"], answer: 0 },
    { q: "Apakah yang berlaku kepada rintangan (resistance) kabel jika saiz keratan rentas (cross-section area) dinaikkan?", options: ["Rintangan berkurang (kurang voltage drop)", "Rintangan meningkat", "Rintangan menjadi kosong terus", "Tiada sebarang perubahan"], answer: 0 },
    { q: "Apakah istilah bagi faktor kehilangan kuasa akibat haba pada kabel AC/DC?", options: ["I²R Losses (Copper Losses)", "Shadowing Losses", "Soiling Losses", "Clipping Losses"], answer: 0 },
    { q: "Apakah fenomena 'Inverter Clipping'?", options: ["Output DC solar melebihi kapasiti maksimum AC inverter menyebabkan graf puncak rata", "Kabel solar terpotong secara fizikal", "Litar pintas pada papan agihan", "Kipas penyejuk inverter berhenti berfungsi"], answer: 0 },
    { q: "Apakah tujuan 'Earthing / Grounding' pada struktur rak solar dan rangka inverter?", options: ["Keselamatan pengguna daripada kejutan elektrik dan kilat", "Meningkatkan pengeluaran voltan solar", "Mengelakkan solar panel daripada berhabuk", "Menukar warna rangka solar"], answer: 0 },
    { q: "Berapakah frekuensi standard grid elektrik di Malaysia (TNB)?", options: ["50 Hz", "60 Hz", "100 Hz", "120 Hz"], answer: 0 },
    { q: "Apakah nilai Power Factor (PF) ideal yang diharapkan oleh utiliti seperti TNB?", options: ["Menghampiri 1.0 (Unity)", "Kurang daripada 0.55", "Sama dengan 0.00", "Lebih daripada 2.50"], answer: 0 },
    { q: "Apakah itu 'Soiling Loss' dalam penyenggaraan Solar PV?", options: ["Kehilangan tenaga akibat habuk, kotoran, atau tahi burung di atas panel", "Kehilangan tenaga akibat kabel bawah tanah yang lembap", "Kerosakan pada struktur bumbung", "Kehilangan voltan pada bateri"], answer: 0 },
    { q: "Apakah fungsi utama 'Anti-Islanding Protection' pada inverter Grid-Tied?", options: ["Mematikan inverter secara automatik jika grid awam terputus (blackout)", "Memastikan inverter tidak basah apabila hujan", "Mengecas bateri dengan lebih cepat", "Meningkatkan kelajuan kipas penyejuk"], answer: 0 },
    { q: "Apakah maksud istilah 'DOD' dalam spesifikasi bateri simpanan solar?", options: ["Depth of Discharge", "Direct Output Driver", "Daily Operating Duration", "Double Power Distribution"], answer: 0 },
    { q: "Apakah faedah utama menggunakan teknologi N-Type TOPCon atau HJT pada panel solar moden?", options: ["Kecekapan lebih tinggi dan kadar degradasi (degradation rate) lebih rendah", "Harganya Percuma", "Boleh menghasilkan tenaga pada waktu malam tanpa lampu", "Panel tidak memerlukan sebarang kabel"], answer: 0 },
    { q: "Apakah alat yang digunakan untuk menguji ketahanan penebatan (insulation resistance) kabel solar?", options: ["Insulation Tester / Megger Tester", "Thermometer Gun", "Anemometer", "Lux Meter"], answer: 0 },
    { q: "Apakah maksud istilah 'Peak Sun Hours' (PSH)?", options: ["Jumlah jam seolah-olah irradiance berada pada tahap purata 1000 W/m² sehari", "Waktu tepat jam 12:00 tengah hari", "Suhu matahari mencapai tahap paling tinggi", "Waktu matahari terbit hingga terbenam"], answer: 0 },
    { q: "Mengapakah diod pintas (Bypass Diode) dipasang pada kotak simpang (junction box) panel solar?", options: ["Laluan arus alternatif jika sebahagian sel solar dihalang bayang (shading)", "Meningkatkan voltan AC kilang", "Mematikan sistem jika hujan", "Menghalang kilat daripada menyambar panel"], answer: 0 },
    { q: "Apakah peranan Data Logger / Gateway dalam Loji Solar PV?", options: ["Mengumpul data prestasi dan menghantar ke Cloud / SCADA untuk pemantauan", "Menyimpan elektrik dalam bentuk digital", "Menukar kelajuan angin kepada kuasa watt", "Memotong rumput di kawasan tapak solar secara automatik"], answer: 0 },

    // 💥 10 SOALAN BAHARU DITAMBAH (MODE ADVANCE)
    { q: "Apakah kesan 'Temperature Coefficient of Pmax' yang bernilai negatif (contoh: -0.35%/°C) pada panel solar?", options: ["Kuasa maksimum panel berkurang 0.35% bagi setiap kenaikan suhu 1°C melebihi 25°C", "Kuasa panel bertambah 0.35% apabila panas", "Suhu panel tidak memberi sebarang kesan", "Voltan panel menjadi stabil pada waktu malam"], answer: 0 },
    { q: "Apakah beza utama antara Inverter String (String Inverter) dan Microinverter?", options: ["Microinverter dipasang pada setiap panel individu, manakala String Inverter menggabungkan berbilang panel dalam litar bersiri", "Microinverter menggunakan bahan bakar diesel", "String Inverter tidak mengeluarkan arus AC", "Microinverter hanya boleh digunakan pada pencawang tinggi"], answer: 0 },
    { q: "Apakah fungsi 'Harmonic Filter' dalam sistem elektrik industri berkapasiti solar tinggi?", options: ["Mengurangkan gangguan herotan harmonik (THD) bagi mengekalkan kualiti kuasa", "Menolak habuk keluar daripada kawasan kilang", "Mengawal kelajuan kipas siling", "Memilih frekuensi radio untuk komunikasi"], answer: 0 },
    { q: "Apakah maksud istilah 'Bifacial Solar Panel'?", options: ["Panel solar yang boleh menyerap cahaya dari bahagian hadapan dan belakang", "Panel solar yang boleh dilipat dua", "Panel solar yang menggunakan dua jenis bateri", "Panel solar yang bertukar warna mengikut cuaca"], answer: 0 },
    { q: "Istilah 'LCOE' dalam analisis ekonomi tenaga baharu merujuk kepada...", options: ["Levelized Cost of Electricity", "Low Capacity Operating Energy", "Linear Current Output Efficiency", "Long Cycle Optimization Engineering"], answer: 0 },
    { q: "Apakah yang dimaksudkan dengan fenomena 'PID' (Potential Induced Degradation) pada modul PV?", options: ["Kehilangan kuasa modul akibat kebocoran arus disebabkan beza keupayaan voltan tinggi ke ground", "Peningkatan berat fizikal panel akibat hujan", "Kerosakan fizikal rak solar akibat angin", "Panel menjadi terlalu berkilat"], answer: 0 },
    { q: "Alat siapakah yang digunakan untuk mengambil gambar haba bagi mengesan 'Hotspots' pada modul solar?", options: ["Thermal Imaging Camera (Infrared Camera)", "Ultrasound Scanner", "Laser Distance Meter", "Multimeter biasa"], answer: 0 },
    { q: "Apakah yang dimaksudkan dengan 'DC-to-AC Ratio' (atau Oversizing Ratio) dalam reka bentuk sistem PV?", options: ["Nisbah kapasiti puncak panel DC berbanding kapasiti rated AC Inverter", "Jumlah kabel DC bahagi kabel AC", "Saiz fizikal kotak inverter berbanding panel", "Nisbah bilangan fius DC kepada breaker AC"], answer: 0 },
    { q: "Apakah peranan Transformer Pencawang (Step-Up Transformer) dalam loji solar skala besar (Large Scale Solar)?", options: ["Menaikkan voltan pengeluaran Inverter ke tahap voltan tinggi (MV/HV) untuk penghantaran ke grid", "Menurunkan voltan supaya menjadi 12V DC", "Mengecas bateri telefon pekerja", "Mematikan lampu jalan secara automatik"], answer: 0 },
    { q: "Apakah kelebihan utama menggunakan 'Solar Tracker' berbanding struktur condong tetap (Fixed-Tilt)?", options: ["Mengikut pergerakan matahari untuk memaksimumkan tangkapan cahaya sepanjang hari", "Membuatkan panel solar bergerak lebih laju daripada angin", "Menjimatkan ruang kawasan tanah secara separuh", "Tidak memerlukan sebarang kabel elektrik"], answer: 0 }
];

// Variable Permainan
let activeQuizQuestions = [];
let currentQIndex = 0;
let quizScore = 0;
let quizTimer = 15;
let quizInterval = null;
let userAnswersHistory = [];

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
    // 1. Semak Mode Pilihan Pemain (Basic vs Advance)
    const selectedMode = document.querySelector('input[name="quizMode"]:checked').value;
    const targetBank = (selectedMode === 'advance') ? advanceQuizBank : basicQuizBank;

    // 2. Rawak & Pilih 10 Soalan dari Bank yang dipilih
    const shuffled = [...targetBank].sort(() => 0.5 - Math.random());
    activeQuizQuestions = shuffled.slice(0, 10);

    currentQIndex = 0;
    quizScore = 0;
    userAnswersHistory = [];
    
    // Sembunyikan Pilihan Mode bila game sudah bermula
    document.getElementById('quizModeSelect').style.display = 'none';
    document.getElementById('quizScore').textContent = `${quizScore} / 10`;
    document.getElementById('startQuizBtn').style.display = 'none';
    
    showQuestion();
}

function showQuestion() {
    clearInterval(quizInterval);
    quizTimer = 15;
    document.getElementById('quizTimer').textContent = quizTimer + "s";

    if (currentQIndex >= activeQuizQuestions.length) {
        endQuiz();
        return;
    }

    const q = activeQuizQuestions[currentQIndex];
    
    const qElement = document.getElementById('quizQuestion');
    qElement.style.fontSize = "20px";
    qElement.style.lineHeight = "1.4";
    qElement.style.fontWeight = "bold";
    qElement.textContent = `Soalan ${currentQIndex + 1} dari 10: ${q.q}`;
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = "";

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "quiz-opt-btn";
        btn.style.fontSize = "16px";
        btn.style.padding = "14px 18px";
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
            userAnswersHistory.push({ question: q, selected: -1 });
            nextQuestion();
        }
    }, 1000);
}

function checkAnswer(selectedIdx, btnElement) {
    clearInterval(quizInterval);
    const q = activeQuizQuestions[currentQIndex];
    const allBtns = document.querySelectorAll('.quiz-opt-btn');
    
    allBtns.forEach(b => b.onclick = null);

    userAnswersHistory.push({
        question: q,
        selected: selectedIdx
    });

    if (selectedIdx === q.answer) {
        btnElement.classList.add('correct');
        quizScore += 1;
        document.getElementById('quizScore').textContent = `${quizScore} / 10`;
    } else {
        btnElement.classList.add('wrong');
        allBtns[q.answer].classList.add('correct');
    }

    setTimeout(nextQuestion, 1200);
}

function nextQuestion() {
    currentQIndex++;
    showQuestion();
}

function endQuiz() {
    clearInterval(quizInterval);
    
    const qElement = document.getElementById('quizQuestion');
    qElement.style.fontSize = "22px";
    qElement.innerHTML = `🎉 <b>CABARAN KUIZ SELESAI!</b><br>Markah Anda: <span style="color: var(--primary); font-size: 28px;">${quizScore} / 10</span>`;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.style.gridTemplateColumns = "1fr";
    optionsContainer.innerHTML = `<h4 style="margin: 15px 0 5px 0; color: #FFD54F;">📊 Semakan Jawapan:</h4>`;

    userAnswersHistory.forEach((item, index) => {
        const isCorrect = item.selected === item.question.answer;
        const reviewBox = document.createElement('div');
        reviewBox.style.cssText = `
            background: var(--card);
            border-left: 5px solid ${isCorrect ? '#4CAF50' : '#F44336'};
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            text-align: left;
            font-size: 14px;
        `;

        let selectedText = item.selected === -1 ? " Masa Tamat (Tiada Jawapan)" : item.question.options[item.selected];
        let correctText = item.question.options[item.question.answer];

        reviewBox.innerHTML = `
            <div style="font-weight: bold; font-size: 15px; margin-bottom: 5px;">
                ${index + 1}. ${item.question.q}
            </div>
            <div style="color: ${isCorrect ? '#4CAF50' : '#FF5252'}; font-weight: bold;">
                Jawapan Anda: ${selectedText} ${isCorrect ? '✅' : '❌'}
            </div>
            ${!isCorrect ? `<div style="color: #4CAF50; font-size: 13px; margin-top: 3px;"> Jawapan Betul: <b>${correctText}</b></div>` : ''}
        `;
        optionsContainer.appendChild(reviewBox);
    });

    const startBtn = document.getElementById('startQuizBtn');
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "🔄 Main Semula";
}

function resetQuiz() {
    clearInterval(quizInterval);
    
    // Tunjukkan semula radio button pilihan mode
    document.getElementById('quizModeSelect').style.display = 'flex';

    const qElement = document.getElementById('quizQuestion');
    qElement.style.fontSize = "18px";
    qElement.textContent = "Pilih Mode dan tekan butang di bawah untuk memulakan cabaran kuiz!";
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.style.gridTemplateColumns = "1fr 1fr";
    optionsContainer.innerHTML = "";

    document.getElementById('startQuizBtn').style.display = 'inline-block';
    document.getElementById('startQuizBtn').textContent = "▶️ Mula Kuiz";
    document.getElementById('quizScore').textContent = "0 / 10";
    document.getElementById('quizTimer').textContent = "15s";
}