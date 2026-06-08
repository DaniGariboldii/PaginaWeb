# Activar Mercado Pago (pagos reales)

La integración con Mercado Pago (Checkout Pro) ya está **implementada y lista**. Mientras no haya credenciales configuradas, el checkout usa un **modo de simulación** para poder probar el flujo completo. Para procesar pagos reales (de prueba o productivos) seguí estos pasos.

> Implementación: `backend/src/modules/payments/` + `backend/src/config/mercadopago.js`. SDK: `mercadopago` (oficial).

---

## 1. Obtener las credenciales

1. Entrá a **https://www.mercadopago.com.ar/developers** e iniciá sesión.
2. Creá una aplicación (Panel → Tus integraciones → Crear aplicación).
3. En la app vas a tener dos juegos de credenciales:
   - **Credenciales de prueba** (sandbox) — para testear sin dinero real.
   - **Credenciales de producción** — para cobrar de verdad.
4. Copiá el **Access Token** (empieza con `TEST-...` en prueba o `APP_USR-...` en producción).
5. (Opcional pero recomendado) Generá el **Secret de webhook** en la sección de Webhooks/Notificaciones.

---

## 2. Configurar el backend (`backend/.env`)

```env
MP_ACCESS_TOKEN=TEST-1234567890-...     # tu access token real
MP_WEBHOOK_SECRET=tu_secret_de_webhook  # opcional: valida la firma del webhook
MP_SUCCESS_URL=http://localhost:5173/pago/exitoso
MP_FAILURE_URL=http://localhost:5173/pago/rechazado
MP_PENDING_URL=http://localhost:5173/pago/pendiente

# IMPORTANTE: la URL pública del backend para que MP pueda llamar al webhook
BACKEND_URL=https://tu-backend-publico   # ver paso 4
```

> En cuanto `MP_ACCESS_TOKEN` deja de ser el placeholder, el sistema cambia solo del modo simulado al **Checkout Pro real**.

---

## 3. Cómo funciona el flujo

1. El cliente hace clic en **"Confirmar y pagar"** en el checkout.
2. El backend crea el pedido (reservando stock) y una **preferencia de pago** en MP.
3. El frontend redirige al cliente a la pantalla de pago de Mercado Pago (`init_point`).
4. El cliente paga. MP lo redirige de vuelta a `/pago/exitoso` (o `/pendiente` / `/rechazado`).
5. **En paralelo, MP llama al webhook** `POST /api/payments/webhook`. El backend:
   - valida la firma (`x-signature`) si hay secret,
   - consulta el pago real en MP,
   - si está **aprobado** → marca el pedido `PAID` (idempotente, no duplica),
   - si está **rechazado/cancelado** → libera el stock reservado.

> La fuente de verdad es **el webhook**, no la redirección. Por eso el webhook necesita una URL pública.

---

## 4. Webhook en desarrollo local (ngrok)

Mercado Pago necesita llegar a tu backend desde internet. En local, exponelo con **ngrok**:

```bash
# instalar ngrok (https://ngrok.com) y luego:
ngrok http 4000
```

ngrok te da una URL pública (ej. `https://abc123.ngrok-free.app`). Poné esa URL en el `.env`:

```env
BACKEND_URL=https://abc123.ngrok-free.app
```

Reiniciá el backend. Ahora la `notification_url` que se envía a MP apunta a tu ngrok y los webhooks llegan.

---

## 5. Tarjetas de prueba (sandbox)

Con credenciales de **prueba**, usá estas tarjetas (no cobran dinero real):

| Tarjeta | Número | CVV | Vencimiento |
|---|---|---|---|
| Visa (aprobada) | 4509 9535 6623 3704 | 123 | 11/30 |
| Mastercard (aprobada) | 5031 7557 3453 0604 | 123 | 11/30 |

- **Nombre del titular** para forzar el resultado: `APRO` (aprobado), `OTHE` (rechazado), `CONT` (pendiente).
- DNI: `12345678`.

Más info: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 6. Producción

- Cambiá `MP_ACCESS_TOKEN` por el de **producción** (`APP_USR-...`).
- `BACKEND_URL`, `FRONTEND_URL` y las `MP_*_URL` deben apuntar a tus dominios reales con **HTTPS**.
- Configurá la URL del webhook en el panel de MP: `https://tu-backend.com/api/payments/webhook`.
- Definí `MP_WEBHOOK_SECRET` para validar la firma de cada notificación.

---

## Checklist rápido

- [ ] `MP_ACCESS_TOKEN` configurado (prueba o producción)
- [ ] `BACKEND_URL` apunta a una URL pública (ngrok en local)
- [ ] `MP_*_URL` apuntan al frontend
- [ ] (Prod) `MP_WEBHOOK_SECRET` configurado y webhook registrado en el panel de MP
- [ ] Probado con tarjeta de prueba → pedido pasa a `PAID` automáticamente
