# MediVoz — Frontend (React + Vite)

## Estructura

```
src/
├── main.jsx / App.jsx
├── router/AppRouter.jsx      Router del navegador (rutas públicas y protegidas)
├── context/                  Sesión del médico (token JWT + datos del usuario)
├── api/                      1 archivo por recurso; cliente.js agrega el token a cada petición
├── componentes/              Navbar, HeaderClinico, RutaProtegida
├── paginas/
│   ├── auth/                 Login, Registro
│   ├── citas/                Agenda, AgendarCita
│   ├── pacientes/            Pacientes, PacienteNuevo, Historial
│   ├── consultas/            Consulta (dictado por voz)
│   └── recetas/              Receta
├── utils/formato.js          Fechas, nombres y adaptadores de datos
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

Sin sesión solo se puede entrar a `/login` y `/registro`; cualquier otra ruta redirige al login.
