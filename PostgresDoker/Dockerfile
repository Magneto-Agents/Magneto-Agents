# 1. Usamos la imagen oficial de Postgres como base
FROM postgres:16

# 2. Instalamos las dependencias necesarias para compilar pgvector
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-16 \
    && rm -rf /var/lib/apt/lists/*

# 3. Clonamos el repositorio de pgvector y lo instalamos
RUN git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

# 4. (Opcional) Podemos añadir scripts que se ejecuten al iniciar
# Por ejemplo, para que la extensión se active automáticamente
RUN echo "CREATE EXTENSION IF NOT EXISTS vector;" > /docker-entrypoint-initdb.d/init-vector.sql
