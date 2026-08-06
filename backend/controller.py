from dataclasses import replace
from models import SimulationInput,SimulationOutput


class ZeroExportController:

    def apply(self,data: SimulationInput, result: SimulationOutput) -> SimulationOutput:

        target_power = max(
            0,
            result.incoming_meter - data.offset
        )

        if result.available_pv_power <= target_power:
            return result

        curtailed_power = (
            result.available_pv_power
            - target_power
        )

        factory_load = target_power + result.incoming_meter

        return replace(

            result,
            actual_pv_output=target_power,
            factory_load=factory_load,
            export=0,
            curtailed_power=curtailed_power,
            inverter_limit=target_power

        )