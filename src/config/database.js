const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', '..', 'prestamos.db');
const db = new DatabaseSync(DB_PATH);

// Habilitar integridad referencial
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase(forceReset = false) {
  if (forceReset) {
    db.exec(`
      DROP TABLE IF EXISTS prestamos;
      DROP TABLE IF EXISTS celulares;
      DROP TABLE IF EXISTS ordenes;
      DROP TABLE IF EXISTS clientes;
    `);
  }

  // DDL: Creación de tablas
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id_cliente TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      es_elegible INTEGER NOT NULL DEFAULT 1 CHECK(es_elegible IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS ordenes (
      id_orden TEXT PRIMARY KEY,
      id_cliente TEXT NOT NULL,
      estado_equipo TEXT NOT NULL CHECK(estado_equipo IN ('EN_REPARACION', 'LISTO_ENTREGA', 'ENTREGADO')),
      FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
    );

    CREATE TABLE IF NOT EXISTS celulares (
      id_celular TEXT PRIMARY KEY,
      modelo TEXT NOT NULL,
      disponible INTEGER NOT NULL DEFAULT 1 CHECK(disponible IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS prestamos (
      id_prestamo TEXT PRIMARY KEY,
      id_cliente TEXT NOT NULL,
      id_orden TEXT NOT NULL,
      id_celular TEXT NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_limite TEXT NOT NULL,
      estado TEXT NOT NULL CHECK(estado IN ('ACTIVO', 'DEVUELTO')),
      FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
      FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden),
      FOREIGN KEY (id_celular) REFERENCES celulares(id_celular)
    );
  `);

  // Semillas de prueba (Mock Data basado exactamente en Especificacion_Requisitos_Equipo01.docx)
  const countClientes = db.prepare('SELECT COUNT(*) as total FROM clientes').get().total;
  if (countClientes === 0) {
    // Clientes de prueba
    const insertCliente = db.prepare('INSERT INTO clientes (id_cliente, nombre, es_elegible) VALUES (?, ?, ?)');
    insertCliente.run('CLI-001', 'Ana Pérez', 1);       // Elegible (Caso Éxito CA-01)
    insertCliente.run('CLI-002', 'Carlos Gómez', 0);    // No elegible (Para prueba de validación RN-01)
    insertCliente.run('CLI-003', 'María Rodríguez', 1); // Elegible

    // Órdenes de servicio
    const insertOrden = db.prepare('INSERT INTO ordenes (id_orden, id_cliente, estado_equipo) VALUES (?, ?, ?)');
    insertOrden.run('ST-001', 'CLI-001', 'EN_REPARACION');   // Activa
    insertOrden.run('ST-002', 'CLI-002', 'EN_REPARACION');   // Activa
    insertOrden.run('ST-003', 'CLI-003', 'ENTREGADO');       // Inactiva / terminada (Para prueba RN-02)

    // Celulares de soporte técnico
    const insertCelular = db.prepare('INSERT INTO celulares (id_celular, modelo, disponible) VALUES (?, ?, ?)');
    insertCelular.run('CEL-001', 'Galaxy A54', 1);             // DISPONIBLE (Listo para préstamo CA-01)
    insertCelular.run('CEL-002', 'iPhone 13', 0);              // OCUPADO (Previamente prestado, para CA-02)
    insertCelular.run('CEL-003', 'Xiaomi Redmi Note 13', 1);   // DISPONIBLE

    // Préstamo previo para justificar CEL-002 ocupado
    const insertPrestamo = db.prepare(`
      INSERT INTO prestamos (id_prestamo, id_cliente, id_orden, id_celular, fecha_inicio, fecha_limite, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertPrestamo.run(
      'PRE-PREVIO-01',
      'CLI-003',
      'ST-003',
      'CEL-002',
      '2026-11-01T09:00:00.000Z',
      '2026-11-05T18:00:00.000Z',
      'ACTIVO'
    );
  }
}

module.exports = {
  db,
  initDatabase
};
