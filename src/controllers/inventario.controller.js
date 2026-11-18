const prestamosService = require('../services/prestamos.service');
const { initDatabase } = require('../config/database');

class InventarioController {
  obtenerCelulares(req, res, next) {
    try {
      const celulares = prestamosService.obtenerCelulares();
      return res.status(200).json({ ok: true, count: celulares.length, data: celulares });
    } catch (error) {
      next(error);
    }
  }

  obtenerClientes(req, res, next) {
    try {
      const clientes = prestamosService.obtenerClientes();
      return res.status(200).json({ ok: true, count: clientes.length, data: clientes });
    } catch (error) {
      next(error);
    }
  }

  obtenerOrdenes(req, res, next) {
    try {
      const ordenes = prestamosService.obtenerOrdenes();
      return res.status(200).json({ ok: true, count: ordenes.length, data: ordenes });
    } catch (error) {
      next(error);
    }
  }

  resetearBaseDatos(req, res, next) {
    try {
      initDatabase(true);
      return res.status(200).json({
        ok: true,
        mensaje: 'Base de datos reiniciada con semillas ficticias originales para la demostración.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventarioController();
