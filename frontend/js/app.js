const API_URL = "http://127.0.0.1:8000/simulate";

async function updateSimulation() {

    try {
		const start = performance.now();
		const dcCapacity =	document.getElementById("dc-capacity").value;
		const irradiance =	document.getElementById("irradiance").value;
		const temperature =	document.getElementById("temperature").value;
		const incomingMeter =	document.getElementById("incoming-meter-slider").value;
		const offset =  document.getElementById("offset").value;
		
		const url =`${API_URL}?dc_capacity=${dcCapacity}&irradiance=${irradiance}&temperature=${temperature}&incoming_meter=${incomingMeter}&offset=${offset}`;

		const response = await fetch(url);		

		if (!response.ok) {
			throw new Error("Backend request failed.");
		}

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
            result.factory_load.toFixed(2);


		document.getElementById("incoming-meter").innerText =
		result.incoming_meter.toFixed(2);
	
        document.getElementById("export").innerText =
            result.export.toFixed(2);

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

function initializeInputPanel() {

    const irradianceSlider = document.getElementById("irradiance");
    const temperatureSlider = document.getElementById("temperature");
    const incomingMeterSlider = document.getElementById("incoming-meter-slider");
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

    incomingMeterSlider.addEventListener("input", () => {

        document.getElementById("incoming-meter-value").innerText =
            incomingMeterSlider.value;
			
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
		<li>Available PV exceeds the factory demand.</li>
		<li>Controller limits inverter output.</li>
		<li>No power is exported to the utility grid.</li>
		<li>System operating as expected.</li>
	`;
    }

    else{

        title.innerText =
            "🟢 PV Limited By Availability";

		description.innerHTML = `
			<li>Available PV is lower than the factory demand.</li>
			<li>The inverter is operating at maximum available output.</li>
			<li>Additional power is supplied by the utility grid.</li>
			<li>No curtailment is required.</li>
		`;

    }

}

document.addEventListener("DOMContentLoaded", () => {

    initializeInputPanel();
    updateSimulation();

});