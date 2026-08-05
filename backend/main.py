from fastapi import FastAPI

app = FastAPI(title="Zero Export Simulator")

@app.get("/")
def root():
    return {"message": "Zero Export Simulator API"}