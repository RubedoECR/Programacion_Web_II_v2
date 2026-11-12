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
npm run seed              # catálogo de medicamentos, médicos y pacientes de prueba
npm run dev
```

Cuentas de prueba del seed:

| Tipo | Correo | Contraseña |
|---|---|---|
| Médico | diego.leal@medivoz.com · edgar.cepeda@medivoz.com | Medivoz@2026 |
| Paciente | carlos.gomez@correo.com · ana.martinez@correo.com · jorge.ramirez@correo.com | Paciente@2026 |

## Tipos de usuario

El token JWT guarda el **rol** (`medico` o `paciente`). Los middlewares `soloMedico` y `soloPaciente`
(`src/middlewares/auth.js`) deciden quién puede usar cada ruta.

- **Médico:** agenda, consultas, pacientes, recetas, medicamentos, reportes y su perfil.
- **Paciente:** se registra solo, ve los horarios libres, agenda, ve y cancela sus citas.

## Colecciones (6)

| Colección | Modelo | Relaciones |
|---|---|---|
| usuarios | Usuario (médicos) | — |
| pacientes | Paciente (con correo y contraseña para el portal) | — |
| citas | Cita | paciente → pacientes, medico → usuarios |
| consultas | Consulta | paciente → pacientes, medico → usuarios, cita → citas |
| recetas | Receta | consulta → consultas, paciente, medico, medicamentos[].medicamento → medicamentos |
| medicamentos | Medicamento (catálogo) | — |

## Endpoints

Prefijo `/api`. Todas las rutas, **excepto login y registro**, requieren `Authorization: Bearer <token>`.
Responden JSON con la forma `{ success, message?, data? }`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | /auth/medico/login | público | Login de médico → `{ token, rol, usuario }` |
| POST | /auth/medico/registro | público | Registro de médico |
| POST | /auth/paciente/login | público | Login de paciente |
| POST | /auth/paciente/registro | público | El paciente crea su cuenta (genera expediente) |
| GET | /auth/perfil | ambos | Datos del usuario en sesión |
| GET | /doctores | ambos | Lista de médicos |
| GET / PUT / DELETE | /doctores/:id | médico | Ver / editar / eliminar (solo su propia cuenta) |
| GET | /citas/disponibles?medico=&fecha= | ambos | Horarios libres de un médico en un día |
| POST | /citas | ambos | Agendar (el paciente agenda para sí mismo) |
| PATCH | /citas/:id/cancelar | ambos | Cancelar (el paciente solo las suyas) |
| GET | /citas/mias | paciente | Citas del paciente en sesión |
| GET | /citas?fecha=&medico=&paciente=&estado= | médico | Lista de citas |
| GET / PUT / DELETE | /citas/:id | médico | Ver / reprogramar / eliminar |
| GET | /pacientes?buscar=&estado= | médico | Lista y búsqueda |
| GET / PUT / DELETE | /pacientes/:id | médico | Ver (por _id o expediente) / editar / eliminar |
| GET / POST | /consultas | médico | Lista / registrar (crea la receta y marca la cita como Atendida) |
| GET / PUT / DELETE | /consultas/:id | médico | Ver / editar / eliminar |
| GET / POST | /recetas | médico | Lista / crear para una consulta sin receta |
| GET / PUT / DELETE | /recetas/:id | médico | Ver / editar / eliminar |
| GET / POST | /medicamentos | médico | Catálogo |
| GET / PUT / DELETE | /medicamentos/:id | médico | Ver / editar / eliminar |
| GET | /reportes/resumen | médico | Indicadores generales |
| GET | /reportes/consultas-por-medico | médico | consultas + usuarios |
| GET | /reportes/asistencia-citas | médico | citas + usuarios |
| GET | /reportes/diagnosticos-frecuentes | médico | consultas + pacientes |
| GET | /reportes/medicamentos-mas-recetados | médico | recetas + medicamentos |
| GET | /reportes/pacientes-frecuentes | médico | consultas + pacientes |

Los reportes aceptan `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`. Las citas son de 30 minutos, de 08:00 a 14:30
(`src/utils/horarios.js`).

## Validaciones, errores y logs

- Cada tabla tiene su archivo en `src/validators/` con funciones que revisan los datos con `if` y regresan la lista
  de errores. El middleware `validar` responde `400` con el primer error.
- Sin token o token inválido → `401` · Sin permiso → `403` · No existe → `404` · Conflicto → `409`
- `logs/app.log` registra excepciones, inicio (`[INICIO]`) y término (`[FIN]`) de procesos críticos y logins fallidos.
