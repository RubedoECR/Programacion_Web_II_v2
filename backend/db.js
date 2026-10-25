require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const CACHE_FILE = path.join(__dirname, '.db_cache.json');

let db = null;
let client = null;
let isConnected = false;
let isReconnecting = false;
let rawCollections = {};

// Cache inicial segura para arranque inmediato o modo offline
const DEFAULT_CACHE = {
  usuarios: [
    {
      _id: "6ad9a7813c0a64aa6bcea950",
      usuario: "diego.leal@medivoz.com",
      email: "diego.leal@medivoz.com",
      password: "password123",
      nombre: "Dr. Diego Leal",
      especialidad: "Medicina General",
      cedula: "CED-8492018",
      rol: "medico"
    },
    {
      _id: "6ad9a7813c0a64aa6bcea951",
      usuario: "test123",
      email: "test@ejemplo.com",
      password: "Test@12345",
      nombre: "Dr. Test",
      especialidad: "Médico General",
      rol: "medico"
    }
  ],
  pacientes: [
    {
      _id: "6ad9a7813c0a64aa6bcea958",
      expediente: "EXP-000001",
      nombre: "Carlos",
      apellidoP: "Gómez",
      apellidoM: "Ruiz",
      nombreCompleto: "Carlos Gómez Ruiz",
      fechaNacimiento: "1985-04-12",
      sexo: "Masculino",
      telefono: "8119876543",
      correo: "carlos.gomez@test.com",
      tipoSangre: "O+",
      direccion: "Av. Constitución 1234, Monterrey, NL",
      alergias: ["Penicilina", "Sulfas"],
      contactoEmergencia: { nombre: "María Ruiz", parentesco: "Madre", telefono: "8111223344" },
      estado: "Activo"
    },
    {
      _id: "6ad9aaa24d82e50284bd24ed",
      expediente: "EXP-000002",
      nombre: "aaaaa",
      apellidoP: "aaaaa",
      apellidoM: "aaaaa",
      nombreCompleto: "aaaaa aaaaa aaaaa",
      fechaNacimiento: "2026-10-01",
      sexo: "Femenino",
      telefono: "8198765432",
      correo: "aaa@aaa.com",
      tipoSangre: "A+",
      direccion: "aaaaa",
      alergias: ["a"],
      contactoEmergencia: { nombre: "mamá", parentesco: "madre", telefono: "8109876543" },
      estado: "Activo"
    },
    {
      _id: "6ada5a144d82e50284bd24ef",
      expediente: "EXP-000003",
      nombre: "Enfermito",
      apellidoP: ":(",
      apellidoM: "pippipipi",
      nombreCompleto: "Enfermito :( pippipipi",
      fechaNacimiento: "2026-10-21",
      sexo: "Otro",
      telefono: "8133445566",
      correo: "enfermo@hotmail.com",
      tipoSangre: "",
      direccion: "su casita",
      alergias: ["Ninguna"],
      contactoEmergencia: { nombre: "Mamá", parentesco: "Madre", telefono: "8198765432" },
      estado: "Activo"
    }
  ],
  consultas: [],
  citas: []
};

// Cargar o inicializar caché en disco
function cargarCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('⚠️ No se pudo leer .db_cache.json, usando caché por defecto:', err.message);
  }
  guardarCache(DEFAULT_CACHE);
  return { ...DEFAULT_CACHE };
}

let memoriaCache = cargarCache();

function guardarCache(datos) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(datos, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ Error guardando caché en disco:', err.message);
  }
}

// Opciones de conexión optimizadas para evitar desconexiones y latencia excesiva
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000, // Falla a los 5s en lugar de congelarse 30s
  connectTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true
};

// Sincronizar datos de Atlas hacia la caché local
async function sincronizarDesdeAtlas() {
  if (!isConnected || !db) return;
  try {
    const users = await rawCollections.users.find({}).toArray();
    const patients = await rawCollections.patients.find({}).toArray();
    const consultas = await rawCollections.consultas.find({}).toArray();
    const citas = await rawCollections.citas.find({}).toArray();

    if (users.length > 0) memoriaCache.usuarios = users;
    if (patients.length > 0) memoriaCache.pacientes = patients;
    if (consultas.length > 0) memoriaCache.consultas = consultas;
    if (citas.length > 0) memoriaCache.citas = citas;

    guardarCache(memoriaCache);
    console.log('🔄 Caché local sincronizada con MongoDB Atlas con éxito');
  } catch (err) {
    console.warn('Advertencia al sincronizar caché desde Atlas:', err.message);
  }
}

// Reintento en segundo plano sin tumbar el servidor
function programarReintento() {
  if (isReconnecting || isConnected) return;
  isReconnecting = true;

  console.log('🔄 Programando reconexión automática en segundo plano (cada 8 segundos)...');
  const timer = setInterval(async () => {
    if (isConnected) {
      clearInterval(timer);
      isReconnecting = false;
      return;
    }

    try {
      if (client) {
        try { await client.close(); } catch (e) { /* ignore */ }
      }

      client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);
      await client.connect();
      db = client.db('medivoz');

      rawCollections.users = db.collection('usuarios');
      rawCollections.patients = db.collection('pacientes');
      rawCollections.consultas = db.collection('consultas');
      rawCollections.citas = db.collection('citas');

      isConnected = true;
      isReconnecting = false;
      clearInterval(timer);

      console.log('✅ ¡Reconexión exitosa con MongoDB Atlas! Servidor operando en modo en línea.');
      await sincronizarDesdeAtlas();
    } catch (err) {
      console.log('⏳ Reintentando conexión con Atlas... (servidor sigue respondiendo con respaldo local)');
    }
  }, 8000);
}

// Conexión principal resiliente
const connectToMongo = async () => {
  try {
    client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);
    await client.connect();
    console.log('✅ Conectado exitosamente a MongoDB Atlas (Modo en línea)');
    db = client.db('medivoz');

    rawCollections.users = db.collection('usuarios');
    rawCollections.patients = db.collection('pacientes');
    rawCollections.consultas = db.collection('consultas');
    rawCollections.citas = db.collection('citas');

    isConnected = true;
    sincronizarDesdeAtlas();
    return client;
  } catch (error) {
    console.warn('\n⚠️ AVISO DE CONEXIÓN A MONGODB ATLAS:');
    console.warn('  No se pudo conectar inmediatamente a Atlas (' + error.message + ').');
    console.warn('  Posibles causas: IP no autorizada en Atlas (Network Access) o latencia de red.');
    console.warn('  🛡️ ACTIVANDO MODO RESILIENTE: El servidor responderá usando el respaldo local sin caerse.');
    console.warn('  🔄 Se reintentará la conexión con Atlas en segundo plano.\n');

    isConnected = false;
    programarReintento();
    return null;
  }
};

// Evaluador de filtros compatible con MongoDB en memoria
function matchFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (filter.$or && Array.isArray(filter.$or)) {
    return filter.$or.some(subFilter => matchFilter(doc, subFilter));
  }

  for (const key of Object.keys(filter)) {
    if (key === '$or') continue;
    const cond = filter[key];

    if (cond && typeof cond === 'object' && cond.$ne !== undefined) {
      if (doc[key] === cond.$ne) return false;
      continue;
    }

    if (key === '_id' && cond instanceof ObjectId) {
      if (String(doc._id) !== String(cond)) return false;
      continue;
    }

    if (doc[key] !== cond && String(doc[key]) !== String(cond)) {
      return false;
    }
  }

  return true;
}

// Wrapper inteligente de colección (MongoDB en vivo + Respaldo en Caché Local)
function crearColeccionResiliente(nombreColeccion) {
  return {
    async findOne(filtro = {}) {
      if (isConnected && rawCollections[nombreColeccion]) {
        try {
          return await rawCollections[nombreColeccion].findOne(filtro);
        } catch (err) {
          console.warn(`Error en findOne Atlas (${nombreColeccion}), usando caché:`, err.message);
          isConnected = false;
          programarReintento();
        }
      }
      const lista = memoriaCache[nombreColeccion] || [];
      return lista.find(doc => matchFilter(doc, filtro)) || null;
    },

    find(filtro = {}) {
      const self = this;
      let sortConfig = null;
      let limitConfig = null;

      const cursorObj = {
        sort(sortObj) {
          sortConfig = sortObj;
          return cursorObj;
        },
        limit(num) {
          limitConfig = num;
          return cursorObj;
        },
        async toArray() {
          if (isConnected && rawCollections[nombreColeccion]) {
            try {
              let query = rawCollections[nombreColeccion].find(filtro);
              if (sortConfig) query = query.sort(sortConfig);
              if (limitConfig) query = query.limit(limitConfig);
              return await query.toArray();
            } catch (err) {
              console.warn(`Error en find Atlas (${nombreColeccion}), usando caché:`, err.message);
              isConnected = false;
              programarReintento();
            }
          }

          let lista = (memoriaCache[nombreColeccion] || []).filter(doc => matchFilter(doc, filtro));

          if (sortConfig) {
            const keys = Object.keys(sortConfig);
            if (keys.length > 0) {
              const sortKey = keys[0];
              const sortDir = sortConfig[sortKey];
              lista.sort((a, b) => {
                const valA = a[sortKey] || '';
                const valB = b[sortKey] || '';
                return sortDir >= 0 ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
              });
            }
          }

          if (limitConfig && limitConfig > 0) {
            lista = lista.slice(0, limitConfig);
          }

          return lista;
        }
      };

      return cursorObj;
    },

    async insertOne(doc) {
      const nuevoDoc = { ...doc };
      if (!nuevoDoc._id) {
        nuevoDoc._id = new ObjectId().toString();
      }

      // Guardar de inmediato en caché local para respuesta instantánea
      if (!memoriaCache[nombreColeccion]) memoriaCache[nombreColeccion] = [];
      memoriaCache[nombreColeccion].push(nuevoDoc);
      guardarCache(memoriaCache);

      // Si Atlas está conectado, guardar en la nube
      if (isConnected && rawCollections[nombreColeccion]) {
        try {
          const res = await rawCollections[nombreColeccion].insertOne(doc);
          return res;
        } catch (err) {
          console.warn(`Error en insertOne Atlas (${nombreColeccion}), guardado en respaldo local:`, err.message);
          isConnected = false;
          programarReintento();
        }
      }

      return {
        acknowledged: true,
        insertedId: nuevoDoc._id
      };
    },

    async updateOne(filtro, update) {
      if (isConnected && rawCollections[nombreColeccion]) {
        try {
          return await rawCollections[nombreColeccion].updateOne(filtro, update);
        } catch (err) {
          console.warn(`Error en updateOne Atlas (${nombreColeccion}), actualizando localmente:`, err.message);
          isConnected = false;
          programarReintento();
        }
      }

      const lista = memoriaCache[nombreColeccion] || [];
      const item = lista.find(doc => matchFilter(doc, filtro));
      if (item && update.$set) {
        Object.assign(item, update.$set);
        guardarCache(memoriaCache);
        return { matchedCount: 1, modifiedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }
  };
}

const resilientCollections = {
  users: crearColeccionResiliente('usuarios'),
  patients: crearColeccionResiliente('pacientes'),
  consultas: crearColeccionResiliente('consultas'),
  citas: crearColeccionResiliente('citas')
};

const getCollections = () => resilientCollections;

const getStatus = () => ({
  connected: isConnected,
  mode: isConnected ? 'atlas_online' : 'resilient_local_cache'
});

module.exports = {
  connectToMongo,
  getCollections,
  getStatus
};
