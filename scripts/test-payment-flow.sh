#!/bin/bash
# scripts/test-payment-flow.sh
#
# Script de testing E2E para el flujo completo de pagos con Stripe
# Requiere:
# - Servidor local corriendo en http://localhost:3000
# - Stripe CLI instalado y autenticado
# - Variables de entorno configuradas en .env

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Test de flujo de pagos con Stripe${NC}"
echo ""

# Variables
API_BASE="http://localhost:3000"
TEST_EMAIL="test-payment-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123"

echo -e "${YELLOW}1. Verificando que el servidor está corriendo...${NC}"
if ! curl -s "${API_BASE}/health" > /dev/null; then
  echo -e "${RED}❌ Servidor no está corriendo en ${API_BASE}${NC}"
  echo "Ejecuta: bun dev"
  exit 1
fi
echo -e "${GREEN}✅ Servidor corriendo${NC}"
echo ""

echo -e "${YELLOW}2. Registrando usuario de prueba...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Usuario registrado: ${TEST_EMAIL}${NC}"
else
  echo -e "${RED}❌ Error registrando usuario${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi
echo ""

echo -e "${YELLOW}3. Iniciando sesión...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error obteniendo token${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Token obtenido${NC}"
echo ""

echo -e "${YELLOW}4. Obteniendo lista de eventos...${NC}"
EVENTS_RESPONSE=$(curl -s -X GET "${API_BASE}/events" \
  -H "Authorization: Bearer ${TOKEN}")

EVENT_ID=$(echo "$EVENTS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$EVENT_ID" ]; then
  echo -e "${RED}❌ No hay eventos disponibles${NC}"
  echo "Crea un evento primero usando POST /events"
  exit 1
fi
echo -e "${GREEN}✅ Evento encontrado: ID ${EVENT_ID}${NC}"
echo ""

echo -e "${YELLOW}5. Creando sesión de Stripe Checkout...${NC}"
CHECKOUT_RESPONSE=$(curl -s -X POST "${API_BASE}/payments/create-checkout-session" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": ${EVENT_ID},
    \"quantity\": 1,
    \"successUrl\": \"http://localhost:3000/success\",
    \"cancelUrl\": \"http://localhost:3000/cancel\"
  }")

SESSION_ID=$(echo "$CHECKOUT_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
CLIENT_SECRET=$(echo "$CHECKOUT_RESPONSE" | grep -o '"clientSecret":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ Error creando sesión de checkout${NC}"
  echo "$CHECKOUT_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Sesión de checkout creada${NC}"
echo "   Session ID: ${SESSION_ID}"
echo "   Client Secret: ${CLIENT_SECRET}"
echo ""

echo -e "${YELLOW}6. Configurando webhook local con Stripe CLI...${NC}"
echo -e "${YELLOW}Para completar el test, ejecuta en otra terminal:${NC}"
echo ""
echo -e "${GREEN}  stripe listen --forward-to localhost:3000/webhooks/stripe${NC}"
echo ""
echo -e "${YELLOW}Luego, simula un pago exitoso con:${NC}"
echo ""
echo -e "${GREEN}  stripe trigger checkout.session.completed --add checkout_session:id=${SESSION_ID}${NC}"
echo ""

echo -e "${YELLOW}7. Esperando webhook... (presiona Ctrl+C para cancelar)${NC}"
echo "Verifica los logs del servidor para confirmar que el webhook fue recibido."
echo ""

# Esperar 30 segundos para dar tiempo a que se complete el webhook
echo "Esperando 30 segundos..."
sleep 30

echo -e "${YELLOW}8. Verificando estado de la sesión...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "${API_BASE}/payments/verify/${SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

echo -e "${YELLOW}9. Verificando tickets del usuario...${NC}"
TICKETS_RESPONSE=$(curl -s -X GET "${API_BASE}/tickets/my-tickets" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$TICKETS_RESPONSE" | jq '.' 2>/dev/null || echo "$TICKETS_RESPONSE"
echo ""

echo -e "${GREEN}✅ Test completado${NC}"
echo ""
echo -e "${YELLOW}Resumen:${NC}"
echo "- Usuario: ${TEST_EMAIL}"
echo "- Token: ${TOKEN}"
echo "- Evento ID: ${EVENT_ID}"
echo "- Session ID: ${SESSION_ID}"
echo ""
echo -e "${YELLOW}Para probar el flujo completo:${NC}"
echo "1. Ejecuta 'stripe listen --forward-to localhost:3000/webhooks/stripe' en otra terminal"
echo "2. Simula un pago con 'stripe trigger checkout.session.completed'"
echo "3. Verifica que se creó el ticket en GET /tickets/my-tickets"
