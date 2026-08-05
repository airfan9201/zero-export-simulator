from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from simulator import Simulator
from controller import ZeroExportController
from models import SimulationInput

app = FastAPI(title="Zero Export Simulator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = Simulator()
controller = ZeroExportController()

@app.get("/")
def root():
    return {"message": "Zero Export Simulator API"}
    
@app.get("/simulate")
def simulate(dc_capacity: float = 1000,irradiance: float = 900,temperature: float = 30,load: float = 500,inverter_efficiency: float = 98, deadband: float = 0):    
    data = SimulationInput(
        dc_capacity=dc_capacity,
        irradiance=irradiance,
        temperature=temperature,
        load=load,
        inverter_efficiency=inverter_efficiency,
        deadband=deadband
    )
    
    raw_result = simulator.run(data)    
    final_result = controller.apply(data,raw_result)
    return final_result