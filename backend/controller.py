from dataclasses import replace
from models import SimulationOutput


class ZeroExportController:

    def apply(self, result: SimulationOutput) -> SimulationOutput:

        if result.available_pv_power <= result.load:
            return result

        curtailed_power = (
            result.available_pv_power
            - result.load
        )

        return replace(

            result,
            actual_pv_output=result.load,
            export=0,
            import_power=0,
            curtailed_power=curtailed_power,
            inverter_limit=result.load

        )