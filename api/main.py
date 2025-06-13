from fastapi import FastAPI, HTTPException
from models import UserModel
from database import users_collection

app = FastAPI()

@app.post("/users/")
def create_user(user: UserModel):
    # Convertir a formato JSON compatible con MongoDB
    user_data = user.dict()
    
    # Insertar en la base de datos
    inserted_user = users_collection.insert_one(user_data)
    
    return {
        "message": "Usuario creado con éxito",
        "user_id": str(inserted_user.inserted_id),
        "data": user_data
    }

@app.get("/users/{phone}")
def get_user(phone: str):
    user = users_collection.find_one({"phone": phone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
