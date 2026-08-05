from simulator import Simulator
from controller import ZeroExportController
from models import SimulationInput

simulator = Simulator()
controller = ZeroExportController()

data = SimulationInput(
    dc_capacity=1000,
    irradiance=900,
    temperature=30,
    load=500,
    inverter_efficiency=98
)

raw_result = simulator.run(data)

final_result = controller.apply(raw_result)

print("Raw Result")
print(raw_result)

print()

print("Controlled Result")
print(final_result)