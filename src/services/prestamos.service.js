const { db } = require('../config/database');

class PrestamosService {
  /**
   * RF-01 / HU-01: Registrar Préstamo
   * Validaciones: RN-01 (Elegibilidad), RN-02 (Orden activa), RN-06 (Celular libre)
   * Criterios: CA-01 (Éxito), CA-02 (Rechazo celular ocupado)
   */
  registrarPrestamo({ id_cliente, id_orden, id_celular, fecha_limite, id_prestamo }) {
    if (!id_cliente || !id_orden || !id_celular) {
      const err = new Error('Los campos id_cliente, id_orden e id_celular son obligatorios.');
      err.code = 'CAMPOS_REQUERIDOS';
      err.status = 400;
      throw err;
    }

    // 1. RN-01: Verificar existencia y elegibilidad del cliente
    const cliente = db.prepare('SELECT * FROM clientes WHERE id_cliente = ?').get(id_cliente);
    if (!cliente) {
      const err = new Error(`El cliente ${id_cliente} no existe en el sistema.`);
      err.code = 'CLIENTE_NO_ENCONTRADO';
      err.status = 404;
      throw err;
    }
    if (cliente.es_elegible !== 1) {
      const err = new Error(`El cliente ${cliente.nombre} (${id_cliente}) no es elegible para préstamos.`);
      err.code = 'CLIENTE_NO_ELEGIBLE';
      err.status = 400;
      throw err;
    }

    // 2. RN-02: Verificar orden de servicio activa
    const orden = db.prepare('SELECT * FROM ordenes WHERE id_orden = ?').get(id_orden);
    if (!orden) {
      const err = new Error(`La orden de servicio ${id_orden} no existe.`);
      err.code = 'ORDEN_NO_ENCONTRADA';
      err.status = 404;
      throw err;
    }
    if (orden.id_cliente !== id_cliente) {
      const err = new Error(`La orden ${id_orden} no pertenece al cliente ${id_cliente}.`);
      err.code = 'ORDEN_NO_CORRESPONDE_CLIENTE';
      err.status = 400;
      throw err;
    }
    if (orden.estado_equipo !== 'EN_REPARACION') {
      const err = new Error(`La orden ${id_orden} no está activa en reparación (Estado: ${orden.estado_equipo}).`);
      err.code = 'ORDEN_NO_ACTIVA';
      err.status = 400;
      throw err;
    }

    // 3. RN-06 & CA-02: Verificar existencia y disponibilidad del celular
    const celular = db.prepare('SELECT * FROM celulares WHERE id_celular = ?').get(id_celular);
    if (!celular) {
      const err = new Error(`El celular con ID ${id_celular} no existe en inventario.`);
      err.code = 'CELULAR_NO_ENCONTRADO';
      err.status = 404;
      throw err;
    }
    if (celular.disponible !== 1) {
      // CA-02: Escenario de Rechazo Celular No Disponible
      const err = new Error(`El celular ${celular.modelo} (${id_celular}) ya se encuentra ocupado en otro préstamo.`);
      err.code = 'CELULAR_NO_DISPONIBLE';
      err.status = 409; // Conflict
      throw err;
    }

    // 4. Generación de ID y fechas
    const nuevoId = id_prestamo || `PRE-${Date.now().toString().slice(-4)}`;
    const fechaInicio = new Date().toISOString();
    // Si no envían fecha_limite, por defecto 48 horas hacia adelante
    const fechaFin = fecha_limite || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 5. RN-07: Transacción atómica (Insert préstamo + Update celular)
    try {
      db.exec('BEGIN TRANSACTION;');

      const insertPrestamo = db.prepare(`
        INSERT INTO prestamos (id_prestamo, id_cliente, id_orden, id_celular, fecha_inicio, fecha_limite, estado)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')
      `);
      insertPrestamo.run(nuevoId, id_cliente, id_orden, id_celular, fechaInicio, fechaFin);

      const updateCelular = db.prepare(`
        UPDATE celulares SET disponible = 0 WHERE id_celular = ?
      `);
      updateCelular.run(id_celular);

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      const err = new Error(`Fallo en la persistencia transaccional: ${e.message}`);
      err.code = 'ERROR_PERSISTENCIA';
      err.status = 500;
      throw err;
    }

    // CA-01: Respuesta exitosa
    return {
      id_prestamo: nuevoId,
      id_cliente,
      cliente_nombre: cliente.nombre,
      id_orden,
      id_celular,
      celular_modelo: celular.modelo,
      fecha_inicio: fechaInicio,
      fecha_limite: fechaFin,
      estado: 'ACTIVO',
      mensaje: 'Préstamo registrado exitosamente. Equipo asignado y marcado como no disponible.'
    };
  }

  /**
   * RF-02 / HU-02: Consultar Préstamo por ID
   * Validación: RN-08 (Existencia)
   */
  consultarPorId(id_prestamo) {
    const prestamo = db.prepare(`
      SELECT 
        p.id_prestamo,
        p.fecha_inicio,
        p.fecha_limite,
        p.estado,
        c.id_cliente,
        c.nombre AS cliente_nombre,
        c.es_elegible,
        o.id_orden,
        o.estado_equipo,
        cel.id_celular,
        cel.modelo AS celular_modelo,
        cel.disponible AS celular_disponible
      FROM prestamos p
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      INNER JOIN ordenes o ON p.id_orden = o.id_orden
      INNER JOIN celulares cel ON p.id_celular = cel.id_celular
      WHERE p.id_prestamo = ?
    `).get(id_prestamo);

    if (!prestamo) {
      const err = new Error(`El préstamo ${id_prestamo} no fue encontrado en el sistema.`);
      err.code = 'PRESTAMO_NO_ENCONTRADO';
      err.status = 404;
      throw err;
    }

    return prestamo;
  }

  /**
   * RF-03 / HU-03: Listar Préstamos Activos
   * Validación: RN-09 (Filtro estricto por estado)
   */
  listar({ estado = 'ACTIVO' } = {}) {
    let query = `
      SELECT 
        p.id_prestamo,
        p.fecha_inicio,
        p.fecha_limite,
        p.estado,
        c.id_cliente,
        c.nombre AS cliente_nombre,
        o.id_orden,
        cel.id_celular,
        cel.modelo AS celular_modelo
      FROM prestamos p
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      INNER JOIN ordenes o ON p.id_orden = o.id_orden
      INNER JOIN celulares cel ON p.id_celular = cel.id_celular
    `;

    if (estado) {
      query += ` WHERE p.estado = ? ORDER BY p.fecha_inicio DESC`;
      return db.prepare(query).all(estado);
    } else {
      query += ` ORDER BY p.fecha_inicio DESC`;
      return db.prepare(query).all();
    }
  }

  /**
   * RF-04 / HU-04: Registrar Devolución
   * Validaciones: RN-10 (Préstamo activo), RN-11 (Liberación atómica)
   */
  registrarDevolucion(id_prestamo) {
    const prestamo = db.prepare('SELECT * FROM prestamos WHERE id_prestamo = ?').get(id_prestamo);
    if (!prestamo) {
      const err = new Error(`El préstamo ${id_prestamo} no existe.`);
      err.code = 'PRESTAMO_NO_ENCONTRADO';
      err.status = 404;
      throw err;
    }

    if (prestamo.estado !== 'ACTIVO') {
      const err = new Error(`El préstamo ${id_prestamo} ya se encuentra cerrado (Estado actual: ${prestamo.estado}).`);
      err.code = 'PRESTAMO_YA_DEVUELTO';
      err.status = 400;
      throw err;
    }

    try {
      db.exec('BEGIN TRANSACTION;');

      // Actualizar estado del préstamo
      db.prepare(`
        UPDATE prestamos SET estado = 'DEVUELTO' WHERE id_prestamo = ?
      `).run(id_prestamo);

      // Liberar el celular (disponible = 1)
      db.prepare(`
        UPDATE celulares SET disponible = 1 WHERE id_celular = ?
      `).run(prestamo.id_celular);

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      const err = new Error(`Error al procesar la devolución atómica: ${e.message}`);
      err.code = 'ERROR_PERSISTENCIA';
      err.status = 500;
      throw err;
    }

    return {
      id_prestamo,
      id_celular: prestamo.id_celular,
      estado_prestamo: 'DEVUELTO',
      celular_disponible: true,
      mensaje: `Devolución completada. El celular ${prestamo.id_celular} fue liberado para nuevos préstamos.`
    };
  }

  /**
   * Métodos auxiliares para la demostración y verificación de QA
   */
  obtenerCelulares() {
    return db.prepare('SELECT * FROM celulares').all();
  }

  obtenerClientes() {
    return db.prepare('SELECT * FROM clientes').all();
  }

  obtenerOrdenes() {
    return db.prepare('SELECT * FROM ordenes').all();
  }
}

module.exports = new PrestamosService();
