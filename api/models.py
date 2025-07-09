from pydantic import BaseModel, EmailStr, Field
from typing import Literal, List, Optional
from datetime import datetime

# Modelo para Usuarios
class UserModel(BaseModel):
    phone: str = Field(..., min_length=10)
    password: str = Field(..., min_length=6)
    name: str
    email: EmailStr
    balance: float = 0.0
    plan: str
    transactions: List[str] = []
    createdAt: Optional[datetime]

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
    type: Literal["recarga", "pago", "ajuste"]  # Puedes agregar más tipos si expandes funciones
    amount: float
    paymentMethod: Literal["mercadopago", "paypal", "oxxo", "efectivo"]
    status: Literal["approved", "pending", "rejected", "error"]
    paymentId: Optional[str] = None  # ID que devuelve Mercado Pago
    reference: Optional[str] = None  # Para OXXO u otras referencias si aplica
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
