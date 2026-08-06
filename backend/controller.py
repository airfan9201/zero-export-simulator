from dataclasses import replace
from models import SimulationInput, SimulationOutput

class ZeroExportController:

    def apply(self, data: SimulationInput, result: SimulationOutput) -> SimulationOutput:
        # data.incoming_meter dalam input kini merujuk kepada 'Simulated Factory Load'
        factory_load = data.incoming_meter

        # Controller menetapkan sasaran maksimum PV supaya tak melebihi Beban Kilang (tolak safety offset)
        target_pv = max(0.0, factory_load - data.offset)

        # Output PV sebenar mengikut mana yang lebih rendah (Available PV atau Target PV)
        actual_pv = min(result.available_pv_power, target_pv)

        # Solar yang terpaksa dipotong / dibuang
        curtailed_power = max(0.0, result.available_pv_power - actual_pv)

        # Baki beban yang tidak cukup diserap daripada Grid (Incoming Meter)
        new_incoming_meter = max(0.0, factory_load - actual_pv)

        # Kuasa ter-eksport jika PV melebihi Beban Kilang (Patut 0 jika controller berfungsi)
        export_power = max(0.0, actual_pv - factory_load)

        return replace(
            result,
            actual_pv_output=actual_pv,
            factory_load=factory_load,
            incoming_meter=new_incoming_meter,  # Menjadi output kiraan
            export=export_power,
            curtailed_power=curtailed_power,
            inverter_limit=actual_pv
        )