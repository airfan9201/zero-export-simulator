from dataclasses import dataclass


@dataclass
class SimulationInput:
    dc_capacity: float
    irradiance: float
    temperature: float
    load: float
    inverter_efficiency: float
    
@dataclass
class SimulationOutput:

    available_pv_power: float
    actual_pv_output: float
    load: float
    export: float
    import_power: float
    curtailed_power: float
    inverter_limit: float