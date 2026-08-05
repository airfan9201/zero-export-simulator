from dataclasses import replace
from models import SimulationInput,SimulationOutput


class ZeroExportController:

    def apply(self,data: SimulationInput, result: SimulationOutput) -> SimulationOutput:

        target_power = max(
            0,
            result.load - data.deadband
        )

        if result.available_pv_power <= target_power:
            return result

        curtailed_power = (
            result.available_pv_power
            - target_power
        )

        return replace(

            result,
            actual_pv_output=target_power,
            export=0,
            import_power=result.load - target_power,
            curtailed_power=curtailed_power,
            inverter_limit=target_power

        )