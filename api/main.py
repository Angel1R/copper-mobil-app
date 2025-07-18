from fastapi import FastAPI, HTTPException, Body, Request, Path
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from typing import List, Optional
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import pusher
import mercadopago
from passlib.context import CryptContext
from random import randint

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from models import (
    UserModel, PlanModel, UserInput, UserResponse,
    TransactionModel, DataUsageModel, SupportTicketModel,
    TicketDB, TicketInput, FAQModel, ChipRequest
)
from database import (
    users_collection, plans_collection, support_tickets_collection,
    data_usage_collection, transactions_collection, faq_collection,
    chip_requests_collection, otp_collection
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

load_dotenv(dotenv_path="./api/.env")

# 📡 Inicializar Pusher
pusher_client = pusher.Pusher(
    app_id=os.getenv("PUSHER_APP_ID"),
    key=os.getenv("PUSHER_KEY"),
    secret=os.getenv("PUSHER_SECRET"),
    cluster=os.getenv("PUSHER_CLUSTER"),
    ssl=True
)

def notificar_api_offline(error_msg=""):
    try:
        pusher_client.trigger("estado-api", "offline", {
            "status": "fail",
            "timestamp": str(datetime.utcnow()),
            "error": error_msg
        })
    except Exception as e:
        print("Error al emitir evento OFFLINE:", e)

def notificar_planes_actualizados():
    try:
        pusher_client.trigger("planes-channel", "planes_actualizados", {"mensaje": "Planes actualizados"})
    except Exception as e:
        print("❌ Error al notificar con Pusher:", e)

@app.on_event("startup")
async def notificar_api_encendida():
    try:
        pusher_client.trigger("estado-api", "online", {
            "status": "ok",
            "timestamp": str(datetime.utcnow())
        })
    except Exception as e:
        print("❌ Error al notificar estado ONLINE:", e)

# 🩺 Salud
@app.get("/")
def health_check():
    return {"status": "online"}

@app.get("/api/ping")
def ping():
    return {"status": "ok", "timestamp": datetime.utcnow()}

# 🧱 Hashing
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain, hashed) -> bool:
    return pwd_context.verify(plain, hashed)

@app.post("/api/users/", response_model=UserResponse)
def create_user(user: UserInput):
    if users_collection.find_one({"phone": user.phone}):
        return JSONResponse(status_code=400, content={"detail": "Teléfono ya registrado"})
    if user.email and users_collection.find_one({"email": user.email}):
        return JSONResponse(status_code=400, content={"detail": "Correo ya registrado"})

    user_data = user.dict()
    user_data["password"] = hash_password(user.password)
    print("🔐 Password hasheada:", user_data["password"])  # 👈 Aquí se muestra el hash generado
    user_data["createdAt"] = datetime.utcnow()

    inserted_user = users_collection.insert_one(user_data)

    return UserResponse(
        user_id=str(inserted_user.inserted_id),
        name=user.name,
        phone=user.phone,
        email=user.email,
        balance=user.balance,
        plan=user.plan
    )


# 🔐 Login con verificación de hash
@app.post("/api/auth/login")
def login_user(data: dict = Body(...)):
    login_id = data.get("login")
    password = data.get("password")

    if not login_id or not password:
        raise HTTPException(status_code=400, detail="Faltan datos")

    user = users_collection.find_one({
        "$or": [{"phone": login_id}, {"email": login_id}]
    })

    if not user or not verify_password(password, user.get("password")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    for campo in ["name", "plan", "balance"]:
        if campo not in user:
            raise HTTPException(status_code=500, detail=f"Campo faltante: {campo}")

    return {
        "message": "Login exitoso",
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user.get("email", ""),
        "plan": user["plan"],
        "balance": user["balance"]
    }

# Enviar código OTP
@app.post("/api/auth/send-otp")
def enviar_otp(data: dict = Body(...)):
    phone = data.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Falta el número")

    code = str(randint(100000, 999999))
    otp_collection.delete_many({"phone": phone})  # limpiar previos
    otp_collection.insert_one({
        "phone": phone,
        "code": code,
        "expiresAt": datetime.utcnow() + timedelta(minutes=2)
    })

    # Aquí iría la integración real con API SMS externa
    print(f"🧪 Código generado para {phone}: {code}")

    return {"message": "Código enviado"}

# Validar código OTP
@app.post("/api/auth/validate-otp")
def validar_otp(data: dict = Body(...)):
    phone = data.get("phone")
    code = data.get("code")

    if not phone or not code:
        raise HTTPException(status_code=400, detail="Faltan datos")

    registro = otp_collection.find_one({"phone": phone})
    if not registro or registro["code"] != code or registro["expiresAt"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Código inválido o expirado")

    return {"message": "Código válido"}

    
# Crear nuevo plan y notificar con Pusher
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

# Obtener todos los planes
@app.get("/api/planes", response_model=List[PlanModel])
def obtener_planes():
    try:
        planes = list(plans_collection.find({}, {"_id": 0}))
        return planes
    except Exception as e:
        notificar_api_offline(f"Error al obtener planes: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener los planes")


# Obtener plan de un usuario
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

# Obtener consumo de datos
@app.get("/api/consumo/{user_id}")
def get_data_usage(user_id: str):
    try:
        usage = data_usage_collection.find_one({"userId": ObjectId(user_id)}, {"_id": 0})
        if not usage:
            raise HTTPException(status_code=404, detail="Sin historial de consumo")
        return usage
    except:
        raise HTTPException(status_code=400, detail="ID inválido o error de formato")

#  Middleware para encabezados de depuración
@app.middleware("http")
async def log_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Debug-Origin"] = request.headers.get("origin", "no-origin")
    return response

@app.post("/api/recargas")
def registrar_recarga(datos: dict = Body(...)):
    try:
        # Aquí se podrían guardar en MongoDB si lo deseas
        print(" Recarga simulada:", datos)
        return {"message": "Recarga simulada con éxito", "datos": datos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar recarga: {e}")



# MERCADOPAGO
@app.post("/api/pago/mercadopago")
def crear_preferencia_pago(plan: dict = Body(...)):
    try:
        # 1. Obtener entorno y token
        env = os.getenv("MP_ENV", "sandbox")
        token = os.getenv("MP_ACCESS_TOKEN_PROD") if env == "production" else os.getenv("MP_ACCESS_TOKEN_SANDBOX")

        print("🔑 TOKEN EN USO:", repr(token))
        print("🌎 Entorno:", env)

        # 2. Validar token
        if not isinstance(token, str) or not token.strip():
            raise ValueError("Access token no definido o no válido")

        # 3. Obtener email dinámico
        if env == "sandbox":
            payer_email = "test_user_123456@testuser.com"
        else:
            user_id = plan.get("user_id")
            if not user_id:
                raise HTTPException(status_code=400, detail="Falta user_id")
            
            usuario = users_collection.find_one({"_id": ObjectId(user_id)})
            if not usuario or "email" not in usuario:
                raise HTTPException(status_code=404, detail="Usuario no encontrado o sin email")

            payer_email = usuario["email"]

        print("📧 Email asignado:", payer_email)

        # 4. Inicializar SDK y armar preferencia
        sdk = mercadopago.SDK(token)

        preference_data = {
            "items": [{
                "title": plan.get("title", "Plan personalizado"),
                "quantity": 1,
                "unit_price": float(plan.get("price", 100.0))
            }],
            "payer": {
                "email": payer_email
            },
            "back_urls": {
                "success": "coppermobil://pago-exitoso",
                "failure": "coppermobil://pago-fallido",
                "pending": "coppermobil://pago-pendiente"
            },
            "auto_return": "approved"
        }

        preference_response = sdk.preference().create(preference_data)
        preference = preference_response.get("response", {})

        return {
            "init_point": preference.get("init_point"),
            "status": "ok"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear preferencia de pago: {e}")

@app.get("/api/pago/validar")
def validar_pago(request: Request):
    try:
        env = os.getenv("MP_ENV", "sandbox")
        token = os.getenv("MP_ACCESS_TOKEN_PROD") if env == "production" else os.getenv("MP_ACCESS_TOKEN_SANDBOX")
        sdk = mercadopago.SDK(token)

        params = dict(request.query_params)
        payment_id = params.get("payment_id")

        if not payment_id:
            return {"message": "Falta payment_id", "approved": False}

        pago = sdk.payment().get(payment_id)["response"]

        return {
            "payment_id": pago.get("id"),
            "status": pago.get("status"),
            "status_detail": pago.get("status_detail"),
            "amount": pago.get("transaction_amount"),
            "approved": pago.get("status") == "approved"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al validar el pago: {e}")
    
# Preguntas frecuentas (FAQ)
@app.get("/api/faq", response_model=List[FAQModel])
def obtener_faq():
    try:
        faq = list(faq_collection.find({}, {"_id": 0}))
        return faq
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener FAQs: {e}")
    
@app.post("/api/faq")
def crear_faq(pregunta: FAQModel):
    try:
        faq_collection.insert_one(pregunta.dict())
        return {
            "message": "Pregunta agregada con éxito",
            "faq": pregunta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar la FAQ: {e}")
    
# Soporte
@app.post("/api/soporte")
async def crear_ticket(ticket: dict = Body(...)):
    try:
        user_id = ticket.get("userId")
        issue = ticket.get("issue")

        if not user_id or not issue:
            raise HTTPException(status_code=400, detail="Datos incompletos para el ticket")

        # Asegurarse que createdAt es una cadena
        creado = datetime.utcnow().isoformat()
        ticket_data = {
            "userId": user_id,
            "issue": issue,
            "status": "pendiente",
            "createdAt": creado
        }

        support_tickets_collection.insert_one(ticket_data)

        # Envolver respuesta en dict plano para evitar errores de serialización
        return {
            "message": "Ticket creado exitosamente",
            "ticket": {
                "userId": user_id,
                "issue": issue,
                "status": "pendiente",
                "createdAt": creado
            }
        }

    except Exception as e:
        print("❌ Error interno:", e)
        return {
            "message": "No se pudo crear el ticket",
            "error": str(e)
        }
    
@app.get("/api/soporte/{user_id}")
def obtener_historial_tickets(user_id: str):
    try:
        tickets = list(support_tickets_collection.find({"userId": user_id}, {"_id": 0}))
        return {"tickets": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener tickets: {e}")
    
@app.put("/api/soporte/{ticket_id}")
def actualizar_estado_ticket(ticket_id: str, cambios: dict = Body(...)):
    try:
        resultado = support_tickets_collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": cambios}
        )
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        return {"message": "Ticket actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el ticket: {e}")
    
# Portabilidad
@app.post("/api/chip/solicitud")
def crear_solicitud_chip(data: dict = Body(...)):
    try:
        required = ["userId", "nombre", "direccion", "tipo"]
        if not all(k in data for k in required):
            raise HTTPException(status_code=400, detail="Faltan datos obligatorios")

        if data["tipo"] == "portabilidad" and not data.get("telefono"):
            raise HTTPException(status_code=400, detail="El número de portabilidad es obligatorio")

        solicitud = {
            "userId": data["userId"],
            "nombre": data["nombre"],
            "direccion": data["direccion"],
            "tipo": data["tipo"],
            "telefono": data.get("telefono"),  # opcional si no aplica
            "status": "pendiente",
            "createdAt": datetime.utcnow()
        }

        resultado = chip_requests_collection.insert_one(solicitud)

        return {
            "message": "Solicitud recibida",
            "solicitud_id": str(resultado.inserted_id)
        }

    except Exception as e:
        print("❌ Error interno:", e)
        raise HTTPException(status_code=500, detail="No se pudo registrar la solicitud")
    
@app.get("/api/chips/{user_id}")
def obtener_chips_usuario(user_id: str):
    try:
        chips = list(chip_requests_collection.find({"userId": user_id}, {"_id": 0}))
        return {"chips": chips}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener historial de chips: {e}")


@app.put("/api/chips/{chip_id}")
def actualizar_chip(chip_id: str, cambios: dict = Body(...)):
    try:
        resultado = chip_requests_collection.update_one(
            {"_id": ObjectId(chip_id)},
            {"$set": cambios}
        )
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Solicitud de chip no encontrada")
        return {"message": "Solicitud de chip actualizada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar solicitud: {e}")


    
# Endpoint para depurar CORS
@app.get("/api/debug")
def debug_cors(request: Request):
    return {
        "method": request.method,
        "url": str(request.url),
        "headers": dict(request.headers),
        "origin": request.headers.get("origin"),
        "host": request.headers.get("host")
    }
