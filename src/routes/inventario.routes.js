const { Router } = require('express');
const inventarioController = require('../controllers/inventario.controller');

const router = Router();

// Endpoints auxiliares para la verificación y demo en Postman
router.get('/celulares', inventarioController.obtenerCelulares);
router.get('/clientes', inventarioController.obtenerClientes);
router.get('/ordenes', inventarioController.obtenerOrdenes);
router.post('/reset', inventarioController.resetearBaseDatos);

module.exports = router;
