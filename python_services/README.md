# Python Magneto Agents Service

Este microservicio en Python centraliza toda la lógica de negocio y el procesamiento de datos del proyecto Magneto Agents, utilizando FastAPI, Playwright y PyPDF.

## Funcionalidades

1.  **Scraper de Vacantes:** Extrae ofertas de empleo de Magneto365 utilizando Playwright.
2.  **Analizador de Perfiles (CV):** Procesa archivos PDF y TXT para extraer información profesional detallada.
3.  **Gestión de Postulaciones:** Controla el ciclo de vida de las aplicaciones, validando transiciones de estado y manteniendo un historial detallado.

## Requisitos

- Python 3.10+
- Navegador Chromium (vía Playwright)

## Instalación

1.  **Crear un entorno virtual:**
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Linux/Mac:
    source venv/bin/activate
    ```

2.  **Instalar dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Instalar Playwright:**
    ```bash
    playwright install chromium
    ```

## Ejecución

Inicia el servidor de FastAPI:

```bash
python main.py
```

El servidor estará disponible en `http://localhost:8000`.

## API Endpoints

### Vacantes
- `POST /api/vacantes/scraper`: Ejecuta el scraper.
- `GET /api/vacantes`: Obtiene las vacantes indexadas.

### Perfil
- `POST /api/perfil/analizar`: Analiza un CV (PDF/TXT). Requiere un campo `cv` en el form-data.

### Postulaciones
- `POST /api/postulacion`: Crea una nueva postulación.
- `GET /api/postulacion?candidatoId=ID`: Lista postulaciones de un candidato.
- `GET /api/postulacion/{id}`: Detalle de una postulación con historial.
- `PATCH /api/postulacion/{id}/estado`: Actualiza el estado de una postulación.
