#!/bin/bash

echo "=== Testing Admin Endpoints ==="
echo ""

# Primero hacer login para obtener el token
echo "1. Login as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lab.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: No se pudo obtener el token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token obtenido: ${TOKEN:0:50}..."
echo ""

echo "2. Testing GET /admin/packages"
curl -s -X GET http://localhost:3001/admin/packages \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "Response: $(curl -s -X GET http://localhost:3001/admin/packages -H "Authorization: Bearer $TOKEN")"
echo ""
echo ""

echo "3. Testing GET /admin/suppliers"
curl -s -X GET http://localhost:3001/admin/suppliers \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "Response: $(curl -s -X GET http://localhost:3001/admin/suppliers -H "Authorization: Bearer $TOKEN")"
echo ""
echo ""

echo "4. Testing GET /admin/inventory/items"
curl -s -X GET http://localhost:3001/admin/inventory/items \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "Response: $(curl -s -X GET http://localhost:3001/admin/inventory/items -H "Authorization: Bearer $TOKEN")"
echo ""

