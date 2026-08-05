const API_URL = "http://127.0.0.1:8000/simulate";

async function updateSimulation() {

    try {
		const start = performance.now();
		const dcCapacity =	document.getElementById("dc-capacity").value;
		const irradiance =	document.getElementById("irradiance").value;
		const temperature =	document.getElementById("temperature").value;
		const factoryLoad =	document.getElementById("factory-load-slider").value;
		const offset =  document.getElementById("offset").value;
		
		const url =`${API_URL}?dc_capacity=${dcCapacity}&irradiance=${irradiance}&temperature=${temperature}&load=${factoryLoad}&offset=${offset}`;

		const response = await fetch(url);		

		const result = await response.json();
		const elapsed = performance.now() - start;
		
		const status = document.getElementById("connection-status");

		document.getElementById("response-time").innerText = elapsed.toFixed(1) + " ms";

		document.getElementById("last-update").innerText =	new Date().toLocaleTimeString();

		status.innerText = "Connected";
		status.className = "status status-ok";
		

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
			
		// Tambah ini
		updateAssessment(result);			
			
		//sprint 3.1
		/*document.getElementById("flow-pv").innerText =
			result.available_pv_power.toFixed(2);

		document.getElementById("flow-inverter").innerText =
			result.actual_pv_output.toFixed(2);

		document.getElementById("flow-load").innerText =
			result.load.toFixed(2);

		document.getElementById("flow-grid").innerText =
			result.export.toFixed(2);
		*/

    }
    catch(error){

        console.log(error);
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
	const offset =    document.getElementById("offset");
	
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
	
	offset.addEventListener("input", () => {

		updateSimulation();

	});

}

function updateAssessment(result){

    const title =
        document.getElementById("assessment-title");

    const description =
        document.getElementById("assessment-description");

    if(result.curtailed_power > 0){

        title.innerText =
            "🟢 Zero Export Active";

     description.innerHTML = `
		<li>Available PV exceeds factory load.</li>
		<li>Controller limits inverter output.</li>
		<li>No power is exported to the utility grid.</li>
		<li>System operating as expected.</li>
	`;
    }

    else{

        title.innerText =
            "🟢 PV Limited By Availability";

        description.innerText =
            "The PV system is operating at its maximum available output. Additional factory demand is supplied by the utility grid.";

    }

}

document.addEventListener("DOMContentLoaded", () => {

    initializeInputPanel();
    updateSimulation();

});