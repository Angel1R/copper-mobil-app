from fastapi import FastAPI, HTTPException, Body, Request, Path
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from typing import List
from datetime import datetime
import os
from dotenv import load_dotenv
import pusher

from models import UserModel, PlanModel
from database import (
    users_collection,
    plans_collection,
    data_usage_collection
)


# 🚦 Inicializar FastAPI
app = FastAPI()

# 🌐 CORS
origins = [
    "capacitor://localhost",
    "http://localhost",
    "http://localhost:8100",
    "https://copper-mobil-app.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 🔐 Cargar variables de entorno desde /api/.env
load_dotenv(dotenv_path="./api/.env")

# 🚀 Inicializar Pusher
pusher_client = pusher.Pusher(
    app_id=os.getenv("PUSHER_APP_ID"),
    key=os.getenv("PUSHER_KEY"),
    secret=os.getenv("PUSHER_SECRET"),
    cluster=os.getenv("PUSHER_CLUSTER"),
    ssl=True
)

# 🔁 Función para emitir evento de actualización de planes
def notificar_planes_actualizados():
    try:
        pusher_client.trigger("planes-channel", "planes_actualizados", {"mensaje": "Planes actualizados"})
    except Exception as e:
        print("❌ Error al notificar con Pusher:", e)

# 🔎 Endpoint de salud
@app.get("/")
def health_check():
    return {"status": "online"}

@app.put("/api/planes/{plan_id}")
def actualizar_plan(plan_id: str, cambios: dict = Body(...)):
    try:
        resultado = plans_collection.update_one(
            {"_id": ObjectId(plan_id)},
            {"$set": cambios}
        )

        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Plan no encontrado")

        notificar_planes_actualizados()

        plan_actualizado = plans_collection.find_one({"_id": ObjectId(plan_id)}, {"_id": 0})
        return {
            "message": "Plan actualizado correctamente",
            "plan": plan_actualizado
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el plan: {e}")


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

# 🆕 Crear nuevo plan y notificar con Pusher
@app.post("/api/planes")
def crear_plan(plan: PlanModel):
    try:
        plan_data = plan.dict()
        plans_collection.insert_one(plan_data)
        notificar_planes_actualizados()
        return {
            "message": "Plan creado exitosamente",
            "plan": plan_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar el plan: {e}")

# 🟢 Obtener todos los planes
@app.get("/api/planes", response_model=List[PlanModel])
def obtener_planes():
    planes = list(plans_collection.find({}, {"_id": 0}))
    return planes

# 🟢 Obtener plan de un usuario
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

# 🟢 Obtener consumo de datos
@app.get("/api/consumo/{user_id}")
def get_data_usage(user_id: str):
    try:
        usage = data_usage_collection.find_one({"userId": ObjectId(user_id)}, {"_id": 0})
        if not usage:
            raise HTTPException(status_code=404, detail="Sin historial de consumo")
        return usage
    except:
        raise HTTPException(status_code=400, detail="ID inválido o error de formato")

# 📋 Middleware para encabezados de depuración
@app.middleware("http")
async def log_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Debug-Origin"] = request.headers.get("origin", "no-origin")
    return response
