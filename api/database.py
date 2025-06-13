from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime
import os

# Cargar variables del archivo .env
load_dotenv()

MONGO_URI = "mongodb+srv://angelrodrigoar55:kErd8XvJNJsTAzD4@copper.y1bfs2e.mongodb.net/CooperMobile?retryWrites=true&w=majority&appName=Copper"
client = MongoClient(MONGO_URI)
db = client["CooperMobile"]
users_collection = db["users"]
transactions_collection = db["transactions"]
plans_collection = db["plans"]
data_usage_collection = db["data_usage"]
support_tickets_collection = db["support_tickets"]
faq_collection = db["faq"]

''' try:
    print(client.server_info())  # Verifica si la conexión es exitosa
    print("Conexion exitosa!!!")
except Exception as e:
    print("Error de conexión:", str(e)) '''

print(client.list_database_names())
print("Base de datos activa:", db.name)  # Verifica la base de datos en uso

''' # Datos de prueba para insertar
new_user = {
    "phone": "+521234567890",
    "password": "hashed_password",
    "name": "Juan Pérez",
    "balance": 150.00,
    "plan": "P100",
    "transactions": ["transaction_id_1", "transaction_id_2"],
    "createdAt": "2025-06-12T17:55:00Z"
}

try:
    inserted_user = users_collection.insert_one(new_user)
    print("Usuario insertado con éxito. ID:", inserted_user.inserted_id)
except Exception as e:
    print("Error al insertar usuario:", str(e)) '''

''' data_usage = {
    "_id": ObjectId(),
    "userId": ObjectId(),
    "daily_usage": [
        {"date": datetime.utcnow(), "dataUsed": 3.5, "unit": "GB"}
    ]
}

data_usage_collection.insert_one(data_usage)
print("Consumo de datos registrado en CooperMobile.") '''

''' # Datos de la transacción
new_transaction = {
    "_id": ObjectId(),
    "userId": ObjectId(),
    "type": "recarga",
    "amount": 200.00,
    "paymentMethod": "Tarjeta de crédito",
    "date": datetime.utcnow()
}


transactions_collection.insert_one(new_transaction)
print("Transacción insertada en CooperMobile.") '''

''' support_ticket = {
    "_id": ObjectId(),
    "userId": ObjectId(),
    "issue": "No puedo realizar una recarga",
    "status": "pendiente",
    "createdAt": datetime.utcnow()
}

support_tickets_collection.insert_one(support_ticket)
print("Ticket de soporte registrado en CooperMobile.") '''

''' plans = [
    {
        "name": "Plan 50",
        "price": 50,
        "data_limit": "4 GB",
        "validity_days": 7,
        "benefits": ["WhatsApp ilimitado", "Llamadas/SMS incluidas"]
    },
    {
        "name": "Plan 100",
        "price": 100,
        "data_limit": "5 GB",
        "validity_days": 30,
        "benefits": ["Redes sociales + Uber", "Llamadas/SMS incluidas", "Larga distancia ilimitada (USA y Canadá)"]
    },
    {
        "name": "Plan 200",
        "price": 200,
        "data_limit": "15 GB",
        "validity_days": 30,
        "benefits": ["Redes sociales + Uber", "Llamadas/SMS incluidas", "Larga distancia ilimitada (USA y Canadá)"]
    }
]

# Insertar planes en MongoDB
plans_collection.insert_many(plans)
print("Planes actualizados e insertados en CooperMobile.") '''

''' faq = {
    "_id": ObjectId(),
    "question": "¿Cómo hago una recarga?",
    "answer": "Puedes recargar saldo desde la app o en puntos autorizados."
}

faq_collection.insert_one(faq)
print("Pregunta frecuente insertada en CooperMobile.") '''