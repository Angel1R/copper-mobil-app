from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Modelo para Usuarios
class UserModel(BaseModel):
    phone: str
    password: str
    name: str
    balance: float
    plan: str
    transactions: List[str]
    createdAt: datetime

# Modelo para Planes
class PlanModel(BaseModel):
    name: str
    price: float
    data_limit: str
    validity_days: int
    benefits: List[str]

# Modelo para Transacciones
class TransactionModel(BaseModel):
    userId: str
    type: str
    amount: float
    paymentMethod: str
    date: datetime

# Modelo para Consumo de Datos
class DataUsageModel(BaseModel):
    userId: str
    daily_usage: List[dict]  # Lista de consumo diario, estructura: {"date": datetime, "dataUsed": float, "unit": "GB"}

# Modelo para Tickets de Soporte
class SupportTicketModel(BaseModel):
    userId: str
    issue: str
    status: str
    createdAt: datetime

# Modelo para Preguntas Frecuentes (FAQ)
class FAQModel(BaseModel):
    question: str
    answer: str
