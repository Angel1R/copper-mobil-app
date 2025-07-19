from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Cargar variables del entorno
load_dotenv()

# Usar la URI de la variable de entorno
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

# Base de datos
db = client["CooperMobile"]
users_collection = db["users"]
transactions_collection = db["transactions"]
plans_collection = db["plans"]
data_usage_collection = db["data_usage"]
support_tickets_collection = db["support_tickets"]
faq_collection = db["faq"]
chip_requests_collection = db["chip_requests"]
otp_collection = db ["otp"]