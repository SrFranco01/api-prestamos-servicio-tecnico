const prestamosService = require('../services/prestamos.service');

class PrestamosController {
  // POST /api/v1/prestamos (RF-01)
  crear(req, res, next) {
    try {
      const { id_cliente, id_orden, id_celular, fecha_limite, id_prestamo } = req.body;
      const resultado = prestamosService.registrarPrestamo({
        id_cliente,
        id_orden,
        id_celular,
        fecha_limite,
        id_prestamo
      });
      return res.status(201).json({
        ok: true,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/prestamos/:id (RF-02)
  obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = prestamosService.consultarPorId(id);
      return res.status(200).json({
        ok: true,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/prestamos?estado=ACTIVO (RF-03)
  listar(req, res, next) {
    try {
      const { estado } = req.query;
      const resultado = prestamosService.listar({ estado });
      return res.status(200).json({
        ok: true,
        count: resultado.length,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/prestamos/:id/devolucion (RF-04)
  devolver(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = prestamosService.registrarDevolucion(id);
      return res.status(200).json({
        ok: true,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PrestamosController();
