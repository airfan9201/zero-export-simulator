from dataclasses import dataclass


@dataclass
class SimulationInput:
    dc_capacity: float
    irradiance: float
    temperature: float
    incoming_meter: float
    inverter_efficiency: float
    offset: float = 0
    
@dataclass
class SimulationOutput:

    available_pv_power: float
    actual_pv_output: float
    factory_load: float
    incoming_meter: float
    export: float
    curtailed_power: float
    inverter_limit: float