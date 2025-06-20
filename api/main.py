from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from typing import List
from datetime import datetime

from models import UserModel, PlanModel
from database import (
    users_collection,
    plans_collection,
    data_usage_collection
)

app = FastAPI()

@app.get("/")
def health_check():
    return {"status": "online"}


# Habilitar CORS para acceso desde la app móvil
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8100"],  # O usa ["*"] solo mientras desarrollas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🟢 Crear usuario
@app.post("/users/")
def create_user(user: UserModel):
    user_data = user.dict()
    user_data["createdAt"] = datetime.utcnow()
    inserted_user = users_collection.insert_one(user_data)
    return {
        "message": "Usuario creado con éxito",
        "user_id": str(inserted_user.inserted_id),
        "data": user_data
    }

# 🟢 Login de usuario
@app.post("/auth/login")
def login_user(data: dict = Body(...)):
    phone = data.get("phone")
    password = data.get("password")

    user = users_collection.find_one({"phone": phone})
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {
        "message": "Inicio de sesión exitoso",
        "user_id": str(user["_id"]),
        "name": user["name"],
        "plan": user["plan"],
        "balance": user["balance"]
    }

# 🟢 Obtener todos los planes
@app.get("/api/planes", response_model=List[PlanModel])
def obtener_planes():
    planes = list(plans_collection.find({}, {"_id": 0}))
    return planes

# 🟢 Obtener plan de un usuario por su ID
@app.get("/api/planes/{user_id}")
def get_user_plan(user_id: str):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        plan_id = user.get("plan")
        plan = plans_collection.find_one({"_id": ObjectId(plan_id)}, {"_id": 0})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan no encontrado")
        return plan
    except:
        raise HTTPException(status_code=400, detail="ID inválido o error de formato")

# 🟢 Obtener consumo de datos del usuario
@app.get("/api/consumo/{user_id}")
def get_data_usage(user_id: str):
    try:
        usage = data_usage_collection.find_one({"userId": ObjectId(user_id)}, {"_id": 0})
        if not usage:
            raise HTTPException(status_code=404, detail="Sin historial de consumo")
        return usage
    except:
        raise HTTPException(status_code=400, detail="ID inválido o error de formato")
