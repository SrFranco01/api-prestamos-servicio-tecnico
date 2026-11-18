const { Router } = require('express');
const prestamosController = require('../controllers/prestamos.controller');

const router = Router();

// RF-01 / HU-01: Registrar Préstamo
router.post('/', prestamosController.crear);

// RF-03 / HU-03: Listar Préstamos (con filtro opcional ?estado=ACTIVO)
router.get('/', prestamosController.listar);

// RF-02 / HU-02: Consultar Préstamo por ID
router.get('/:id', prestamosController.obtenerPorId);

// RF-04 / HU-04: Registrar Devolución y liberar equipo
router.patch('/:id/devolucion', prestamosController.devolver);

module.exports = router;
