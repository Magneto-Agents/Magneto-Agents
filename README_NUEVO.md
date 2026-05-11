# Magneto Agents - Sistema de Reclutamiento con IA

Este proyecto ha evolucionado de una aplicación monolítica en Next.js a una arquitectura de **microservicios** que utiliza **IA y una Base de Datos Vectorial** para mejorar el proceso de reclutamiento.

---

## 🚀 Cambios Realizados (Resumen de la Migración)

1.  **Nuevo Backend en Python (`python_services/`):** Se migró toda la lógica de procesamiento pesado (Scraping, Análisis de PDF y Gestión de Estados) a **FastAPI**. Python permite un manejo mucho más robusto de datos e inteligencia artificial.
2.  **Base de Datos Vectorial (pgvector):** Se sustituyeron los archivos JSON por **PostgreSQL + pgvector** corriendo en Docker. Esto permite realizar **búsquedas semánticas** (recomendar vacantes por "significado" y no solo por palabras clave).
3.  **Embeddings de IA:** Cada vacante y cada CV analizado se convierte automáticamente en un vector numérico (embedding) usando el modelo `all-MiniLM-L6-v2`.
4.  **Arquitectura de Proxy:** Las rutas de Next.js (`app/api/...`) ahora actúan como un puente, delegando las tareas complejas al servicio de Python.

---

## 🛠️ Cómo ponerlo en marcha (Paso a Paso)

Para que el sistema funcione al 100%, necesitas tener **3 componentes** activos simultáneamente:

### 1. Base de Datos (Docker)
Levanta el contenedor de PostgreSQL con soporte vectorial:
```bash
docker-compose up -d
```

### 2. Microservicio de IA (Python)
Abre una terminal nueva y prepara el entorno:
```bash
cd python_services
python -m venv venv
# Activar entorno (Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
playwright install chromium
# Ejecutar el servidor
python main.py
```
*El backend estará listo en `http://localhost:8000`.*

### 3. Frontend (Next.js)
Abre una tercera terminal:
```bash
npm run dev
```

---

## 🔄 ¿Cómo usar la "Forma Antigua"?

He mantenido la compatibilidad para que no pierdas lo que ya tenías:

*   **Si NO enciendes Python:** El sistema entrará en modo **"Fallback"**. Podrás seguir viendo las vacantes que ya existan en los archivos `data/vacantes.json`, pero no podrás ejecutar el scraper ni analizar nuevos CVs (estos darán error de conexión).
*   **Archivos Originales:** No he borrado nada. Tu lógica original en TypeScript sigue intacta en la carpeta `src/agents/`.
*   **Revertir totalmente:** Si deseas volver al 100% a TypeScript, solo debes cambiar las llamadas `fetch('http://localhost:8000/...')` en los archivos de `app/api/...` por las funciones originales que están comentadas o referenciadas en esos mismos archivos.

---

## 💡 Notas Importantes

*   **Migración de Datos:** Si tienes datos viejos en archivos JSON y quieres verlos en la nueva Base de Datos Vectorial, ejecuta el script de migración:
    ```bash
    cd python_services
    python migrate_json_to_db.py
    ```
*   **Búsqueda Semántica:** La nueva base de datos permite comparar un CV contra las vacantes. He creado un endpoint en Python `GET /api/recomendar/{perfil_id}` que puedes usar para mostrar "Vacantes Sugeridas" en el Dashboard.
*   **CORS:** El backend de Python está configurado para permitir peticiones desde cualquier origen, pero en producción deberías restringirlo a la URL de tu frontend.

---
© 2026 Magneto Agents - Transformación Digital de Reclutamiento.
