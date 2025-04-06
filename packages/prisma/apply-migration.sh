#!/bin/bash

# Lee todas las migraciones del directorio excepto la última
migrations=$(ls ./migrations | grep -v "20250121224408_chv_composio" | sort)

# Marca cada migración como aplicada
for migration in $migrations; do
    echo "Marking migration $migration as applied..."
    DATABASE_URL="postgresql://develop:Chatsappai.2323@chatsappaidb-develop.postgres.database.azure.com:5432/databerry" npx prisma migrate resolve --applied "${migration%/}" --schema ./schema.prisma
donepostgresql://USER:PASSWORD@chatsappaidb-develop.postgres.database.azure.com:5432/databerry?schema=public