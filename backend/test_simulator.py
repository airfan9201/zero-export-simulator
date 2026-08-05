from simulator import Simulator
from models import SimulationInput


simulator = Simulator()

data = SimulationInput(
    dc_capacity=1000,
    irradiance=900,
    temperature=30,
    load=500,
    inverter_efficiency=98
)

result = simulator.run(data)

print(result)