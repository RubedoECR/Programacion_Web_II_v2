const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    console.log('Conectado a la base de datos:', db.databaseName);

    // Listar colecciones existentes
    const existingColls = (await db.listCollections().toArray()).map(c => c.name);
    console.log('Colecciones existentes antes de inicializar:', existingColls);

    // Definición de las colecciones que debe tener MediVoz
    const requiredCollections = [
      {
        name: 'usuarios',
        indexes: [
          { key: { usuario: 1 }, unique: true, sparse: true },
          { key: { email: 1 }, unique: true, sparse: true }
        ]
      },
      {
        name: 'pacientes',
        indexes: [
          { key: { expediente: 1 }, unique: true },
          { key: { nombreCompleto: 'text', nombre: 'text', apellidoP: 'text' } }
        ]
      },
      {
        name: 'consultas',
        indexes: [
          { key: { pacienteExpediente: 1 } },
          { key: { fecha: -1 } },
          { key: { medicoId: 1 } }
        ]
      },
      {
        name: 'citas',
        indexes: [
          { key: { fecha: 1, hora: 1 } },
          { key: { pacienteExpediente: 1 } },
          { key: { doctor: 1 } }
        ]
      },
      {
        name: 'recetas',
        indexes: [
          { key: { consultaId: 1 } },
          { key: { pacienteExpediente: 1 } },
          { key: { fecha: -1 } }
        ]
      }
    ];

    for (const collInfo of requiredCollections) {
      if (!existingColls.includes(collInfo.name)) {
        await db.createCollection(collInfo.name);
        console.log(`[+] Colección creada con éxito: "${collInfo.name}"`);
      } else {
        console.log(`[=] La colección "${collInfo.name}" ya existía.`);
      }

      // Crear índices para optimizar búsquedas y garantizar unicidad
      const coll = db.collection(collInfo.name);
      for (const idx of collInfo.indexes) {
        try {
          const { key, ...options } = idx;
          await coll.createIndex(key, options);
          console.log(`  -> Índice creado en "${collInfo.name}":`, JSON.stringify(key));
        } catch (idxErr) {
          console.warn(`  -> Nota en índice para "${collInfo.name}":`, idxErr.message);
        }
      }
    }

    // Colecciones finales
    const finalColls = (await db.listCollections().toArray()).map(c => c.name);
    console.log('\n--- Colecciones activas en MongoDB Atlas ---');
    console.log(finalColls);

  } catch (err) {
    console.error('Error inicializando colecciones:', err);
  } finally {
    await client.close();
  }
}

main();
