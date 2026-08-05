const API_URL = "http://127.0.0.1:8000/simulate";

async function updateSimulation() {

    try {
		const start = performance.now();
		const dcCapacity =	document.getElementById("dc-capacity").value;
		const irradiance =	document.getElementById("irradiance").value;
		const temperature =	document.getElementById("temperature").value;
		const factoryLoad =	document.getElementById("factory-load-slider").value;
		
		const url =`${API_URL}?dc_capacity=${dcCapacity}&irradiance=${irradiance}&temperature=${temperature}&load=${factoryLoad}`;
		const response = await fetch(url);		

		const result = await response.json();
		const elapsed = performance.now() - start;
		
		document.getElementById("response-time").innerText = elapsed.toFixed(1) + " ms";

		document.getElementById("last-update").innerText =	new Date().toLocaleTimeString();

		document.getElementById("connection-status").innerText = "Connected";

        document.getElementById("available-pv").innerText =
            result.available_pv_power.toFixed(2);

        document.getElementById("actual-pv").innerText =
            result.actual_pv_output.toFixed(2);

        document.getElementById("factory-load").innerText =
            result.load.toFixed(2);

        document.getElementById("export").innerText =
            result.export.toFixed(2);

        document.getElementById("import").innerText =
            result.import_power.toFixed(2);

        document.getElementById("curtailment").innerText =
            result.curtailed_power.toFixed(2);

    }
    catch(error){

        console.error(error);
		const status = document.getElementById("connection-status");
		status.innerText = "Disconnected";
		status.className = "status status-error";

    }

}

function initializeInputPanel() {

    const irradianceSlider = document.getElementById("irradiance");
    const temperatureSlider = document.getElementById("temperature");
    const loadSlider = document.getElementById("factory-load-slider");
	const dcCapacity =  document.getElementById("dc-capacity");	

    irradianceSlider.addEventListener("input", () => {

        document.getElementById("irradiance-value").innerText =
            irradianceSlider.value;
		
		updateSimulation();		

    });

    temperatureSlider.addEventListener("input", () => {

        document.getElementById("temperature-value").innerText =
            temperatureSlider.value;
			
		 updateSimulation();	

    });

    loadSlider.addEventListener("input", () => {

        document.getElementById("factory-load-value").innerText =
            loadSlider.value;
			
		 updateSimulation();	

    });
	
	dcCapacity.addEventListener("input", () => {

		updateSimulation();

	});

}

document.addEventListener("DOMContentLoaded", () => {

    initializeInputPanel();

    updateSimulation();

});