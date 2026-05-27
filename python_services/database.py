import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pgvector.sqlalchemy import Vector
from datetime import datetime
from sentence_transformers import SentenceTransformer

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "magneto_pass")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "magneto_db")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelo de Embeddings (AI)
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str):
    if not text:
        return [0] * 384
    return model.encode(text).tolist()

class Vacante(Base):
    __tablename__ = "vacantes"
    id = Column(String, primary_key=True)
    url = Column(String)
    title = Column(String)
    company = Column(String)
    experiencia = Column(String)
    salario = Column(String)
    ubicacion = Column(String)
    descripcion = Column(Text)
    embedding = Column(Vector(384))
    creado_en = Column(DateTime, default=datetime.utcnow)

class Perfil(Base):
    __tablename__ = "perfiles"
    id = Column(String, primary_key=True)
    nombre = Column(String)
    correo = Column(String)
    telefono = Column(String)
    ubicacion = Column(String)
    resumen = Column(Text)
    datos_completos = Column(JSON)
    embedding = Column(Vector(384))
    creado_en = Column(DateTime, default=datetime.utcnow)

class Postulacion(Base):
    __tablename__ = "postulaciones"
    id = Column(String, primary_key=True)
    candidato_id = Column(String)
    vacante_id = Column(String)
    estado_actual = Column(String)
    fecha_postulacion = Column(DateTime, default=datetime.utcnow)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Historial(Base):
    __tablename__ = "historial"
    id = Column(String, primary_key=True)
    postulacion_id = Column(String, ForeignKey("postulaciones.id"))
    accion = Column(String)
    estado_anterior = Column(String, nullable=True)
    estado_nuevo = Column(String)
    metadata_json = Column(JSON)
    fecha_hora = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
