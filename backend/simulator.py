from models import SimulationInput, SimulationOutput


class Simulator:

    def run(self, data: SimulationInput) -> SimulationOutput:

        TEMP_COEFFICIENT = 0.004
        REFERENCE_TEMPERATURE = 25
        temperature_factor = 1 - (TEMP_COEFFICIENT * (data.temperature - REFERENCE_TEMPERATURE))

        available_pv_power = (
            data.dc_capacity
            * (data.irradiance / 1000)
            * temperature_factor
            * (data.inverter_efficiency / 100)
        )
        
        export_power = max(0, available_pv_power - data.load)

        import_power = max(0, data.load - available_pv_power)
        
        return SimulationOutput(
            available_pv_power=available_pv_power,
            actual_pv_output=available_pv_power,
            load=data.load,
            export=export_power,
            import_power=import_power,
            curtailed_power=0,
            inverter_limit=available_pv_power
        )