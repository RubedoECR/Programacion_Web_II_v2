# MediVoz — Backend (API REST)

Node.js + Express + **Mongoose** (MongoDB Atlas), con autenticación **JWT**.

## Estructura

```
backend/
├── server.js              Arranca el servidor y conecta a MongoDB
├── scripts/seed.js        Datos iniciales (npm run seed / npm run seed:reset)
└── src/
    ├── app.js             Configuración de Express
    ├── config/db.js       Conexión con Mongoose
    ├── models/            Esquemas (1 por colección)
    ├── routes/            Router del API (index.js) + 1 router por recurso
    ├── controllers/       Lógica de cada recurso
    ├── validators/        Validaciones de backend por tabla (express-validator)
    ├── middlewares/       auth (JWT), validar, logProceso, errorHandler
    └── utils/             logger, ErrorApi, asyncHandler, elegir
```

Flujo de una petición:
`routes/x.routes.js` → `middlewares/auth.js` (token) → `validators/x.validator.js` → `controllers/x.controller.js` → `models/X.js`

## Instalación

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env  → y llena tus datos
npm run seed              # crea catálogo de medicamentos y médicos de prueba
npm run dev
```

Usuarios de prueba del seed: `diego.leal@medivoz.com` / `edgar.cepeda@medivoz.com` — contraseña `Medivoz@2026`.

## Colecciones (6)

| Colección | Modelo | Relaciones |
|---|---|---|
| usuarios | Usuario (médicos) | — |
| pacientes | Paciente | — |
| citas | Cita | paciente → pacientes, medico → usuarios |
| consultas | Consulta | paciente → pacientes, medico → usuarios, cita → citas |
| recetas | Receta | consulta → consultas, paciente, medico, medicamentos[].medicamento → medicamentos |
| medicamentos | Medicamento (catálogo) | — |

## Endpoints

Todas las rutas usan el prefijo `/api`. Todas, **excepto login y registro**, requieren el header
`Authorization: Bearer <token>`. Todas responden JSON con la forma `{ success, message?, data? }`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | /auth/login | Inicia sesión → `{ token, usuario }` (público) |
| POST | /auth/registro | Registra un médico (público) |
| GET | /auth/perfil | Datos del médico en sesión |
| GET | /doctores | Lista de médicos activos |
| GET / PUT / DELETE | /doctores/:id | Ver, actualizar o eliminar (solo la propia cuenta) |
| GET | /pacientes?buscar=&estado= | Lista / búsqueda de pacientes |
| GET | /pacientes/:id | Por `_id` o por expediente (`EXP-000001`) |
| POST | /pacientes | Registra paciente (genera expediente) |
| PUT / DELETE | /pacientes/:id | Actualiza / elimina (no elimina si tiene consultas) |
| GET | /citas?fecha=&medico=&paciente=&estado= | Lista de citas |
| GET | /citas/:id | Detalle de una cita |
| POST | /citas | Agenda cita (valida empalmes de horario → 409) |
| PUT | /citas/:id | Reprograma cita |
| PATCH | /citas/:id/cancelar | Cancela cita |
| DELETE | /citas/:id | Elimina cita (no si ya fue atendida) |
| GET | /consultas?paciente=&medico= | Lista de consultas |
| GET | /consultas/:id | Detalle de una consulta |
| POST | /consultas | Registra consulta + genera receta + marca la cita como Atendida |
| PUT / DELETE | /consultas/:id | Actualiza / elimina (solo el médico autor) |
| GET | /recetas?paciente= | Lista de recetas |
| GET | /recetas/:id | Receta completa (médico, paciente, consulta) |
| POST | /recetas | Crea receta para una consulta sin receta |
| PUT / DELETE | /recetas/:id | Actualiza / elimina (solo el médico autor) |
| GET / POST | /medicamentos | Catálogo de medicamentos |
| GET / PUT / DELETE | /medicamentos/:id | CRUD del catálogo |
| GET | /reportes/resumen | Indicadores generales |
| GET | /reportes/consultas-por-medico | consultas + usuarios |
| GET | /reportes/asistencia-citas | citas + usuarios (% de asistencia) |
| GET | /reportes/diagnosticos-frecuentes | consultas + pacientes |
| GET | /reportes/medicamentos-mas-recetados | recetas + medicamentos |
| GET | /reportes/pacientes-frecuentes | consultas + pacientes |

Los reportes aceptan `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`.

## Errores y logs

- Validaciones fallidas → `400` con `{ message, errores: [{ campo, mensaje }] }`
- Sin token o token inválido → `401` · Sin permiso → `403` · No existe → `404` · Conflicto → `409`
- Todo se registra en `logs/app.log`: excepciones, inicio (`[INICIO]`) y término (`[FIN]`) de procesos críticos
  (crear, actualizar y eliminar), intentos de login fallidos y tokens rechazados.
