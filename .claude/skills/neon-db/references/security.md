# Checklist de seguridad — Neon

Repasar antes de dar por terminada la integración.

## Secretos
- [ ] `DATABASE_URL` **solo** en el servidor. Nunca en código de cliente, ni en
      variables `VITE_*`, `NEXT_PUBLIC_*`, `REACT_APP_*` (esas se inyectan al
      bundle del navegador).
- [ ] `.gitignore` contiene `.env`, `.env.*` y `!.env.example`.
- [ ] `git status` no muestra ningún `.env` con valores reales por commitear.
- [ ] Ningún secreto en el historial de git. Si se filtró uno, **rotarlo** en
      Neon (Console → Settings → Reset password / regenerar).
- [ ] La *API key de cuenta* (`napi_...`) no aparece en el repo ni en el código
      de la app. Solo se usa (si acaso) para scripts de gestión locales.

## Conexión
- [ ] Usar la cadena **pooled** (`-pooler` en el host) en entornos serverless.
- [ ] `sslmode=require` presente en la cadena de conexión.
- [ ] Crear el cliente `neon(...)` dentro del handler (o como singleton en un
      servidor de larga vida), no en el scope de un módulo que se importe al
      cliente.

## Consultas
- [ ] Siempre plantillas etiquetadas `sql\`... ${valor} ...\``. El driver
      parametriza; **nunca** concatenar strings con entrada del usuario.
- [ ] Validar y normalizar la entrada (tipos, longitud, formato) antes de tocar
      la base.
- [ ] Restricciones en el esquema (`UNIQUE`, `NOT NULL`, `CHECK`) como segunda
      línea de defensa.

## Exposición de la API
- [ ] Limitar métodos HTTP (p.ej. solo `POST`) y devolver `405` en el resto.
- [ ] Considerar rate limiting / honeypot en formularios públicos para frenar
      bots.
- [ ] Mensajes de error genéricos al cliente; el detalle va a los logs del
      servidor, no en la respuesta.
- [ ] Configurar CORS solo si el endpoint se consume desde otro origen.
