# MediVoz — Frontend (React + Vite)

## Estructura

```
src/
├── main.jsx / App.jsx
├── router/AppRouter.jsx      Router del navegador (públicas, solo médico, solo paciente)
├── context/                  Sesión: token JWT, rol y datos del usuario
├── api/                      1 archivo por recurso; cliente.js agrega el token a cada petición
├── componentes/              Navbar, HeaderClinico, RutaProtegida, FormularioPaciente
├── paginas/
│   ├── auth/                 Login (médico / paciente), Registro de médico, Registro de paciente, Mi perfil
│   ├── citas/                Agenda del médico (atender, reprogramar, cancelar, eliminar)
│   ├── consultas/            Nueva consulta (dictado por voz), Editar consulta
│   ├── pacientes/            Lista, Editar, Historial
│   ├── recetas/              Receta (editar medicamentos, imprimir, eliminar)
│   ├── medicamentos/         Catálogo
│   ├── reportes/             Reportes
│   └── portal/               Paciente: Agendar cita, Mis citas
├── utils/                    Formato de fechas/nombres y rutas de inicio
└── estilos/                  CSS
```

## Instalación

```bash
cd frontend-react
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev
```

`VITE_API_URL` apunta al backend (por defecto `http://localhost:3000/api`).

Sin sesión solo se puede entrar a `/login`, `/registro` y `/registro-paciente`. Un paciente que intenta abrir una página de médico (o al revés) es enviado a su propia página de inicio.
