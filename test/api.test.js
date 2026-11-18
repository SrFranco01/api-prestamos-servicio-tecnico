const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { initDatabase } = require('../src/config/database');

async function runTests() {
  console.log('🧪 Iniciando batería de pruebas de QA para API Préstamo de Celulares...');

  // Resetear DB a estado inicial
  initDatabase(true);

  const server = app.listen(0);
  const port = server.address().port;

  async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      }, res => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(rawData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: rawData });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  try {
    // 1. Healthcheck
    const h = await request('/health');
    assert.strictEqual(h.status, 200, 'Healthcheck debe responder 200');
    console.log('  ✔ [Health] API operativa.');

    // 2. Verificar estado inicial: CEL-001 debe estar disponible
    const cels = await request('/api/v1/celulares');
    const cel1 = cels.body.data.find(c => c.id_celular === 'CEL-001');
    assert.strictEqual(cel1.disponible, 1, 'CEL-001 debe iniciar disponible');
    console.log('  ✔ [Inventario] CEL-001 disponible correctamente.');

    // 3. CA-01: RF-01 Registro Exitoso
    const pExito = await request('/api/v1/prestamos', 'POST', {
      id_prestamo: 'PRE-TEST-01',
      id_cliente: 'CLI-001',
      id_orden: 'ST-001',
      id_celular: 'CEL-001',
      fecha_limite: '2026-11-10T18:00:00.000Z'
    });
    assert.strictEqual(pExito.status, 201, 'Registro exitoso debe retornar 201 Created');
    assert.strictEqual(pExito.body.data.estado, 'ACTIVO');
    console.log('  ✔ [CA-01] Registro exitoso con 201 Created (RF-01).');

    // 4. Verificar que CEL-001 pasó atómicamente a disponible = 0
    const celsPost = await request('/api/v1/celulares');
    const cel1Post = celsPost.body.data.find(c => c.id_celular === 'CEL-001');
    assert.strictEqual(cel1Post.disponible, 0, 'CEL-001 debe estar ocupado tras el préstamo');
    console.log('  ✔ [Atomicidad] CEL-001 marcado como no disponible en la BD.');

    // 5. CA-02: RF-01 Rechazo por Celular No Disponible
    const pRechazo = await request('/api/v1/prestamos', 'POST', {
      id_prestamo: 'PRE-TEST-02',
      id_cliente: 'CLI-001',
      id_orden: 'ST-001',
      id_celular: 'CEL-001'
    });
    assert.strictEqual(pRechazo.status, 409, 'Celular ocupado debe retornar 409 Conflict');
    assert.strictEqual(pRechazo.body.error, 'CELULAR_NO_DISPONIBLE');
    console.log('  ✔ [CA-02] Rechazo por celular no disponible con 409 Conflict (RF-01).');

    // 6. RF-02: Consultar Préstamo por ID
    const pConsulta = await request('/api/v1/prestamos/PRE-TEST-01');
    assert.strictEqual(pConsulta.status, 200, 'Consulta debe retornar 200 OK');
    assert.strictEqual(pConsulta.body.data.id_prestamo, 'PRE-TEST-01');
    console.log('  ✔ [RF-02] Consulta por ID exitosa.');

    // 7. RF-03: Listar Préstamos Activos
    const pLista = await request('/api/v1/prestamos?estado=ACTIVO');
    assert.strictEqual(pLista.status, 200, 'Listar activos debe retornar 200 OK');
    assert.ok(pLista.body.count >= 1, 'Debe haber al menos 1 préstamo activo');
    console.log('  ✔ [RF-03] Listado de préstamos activos exitoso.');

    // 8. RF-04: Registrar Devolución
    const pDev = await request('/api/v1/prestamos/PRE-TEST-01/devolucion', 'PATCH');
    assert.strictEqual(pDev.status, 200, 'Devolución debe responder 200 OK');
    assert.strictEqual(pDev.body.data.estado_prestamo, 'DEVUELTO');
    console.log('  ✔ [RF-04] Devolución procesada exitosamente.');

    // 9. Verificar que CEL-001 volvió a estar libre (disponible = 1)
    const celsFin = await request('/api/v1/celulares');
    const cel1Fin = celsFin.body.data.find(c => c.id_celular === 'CEL-001');
    assert.strictEqual(cel1Fin.disponible, 1, 'CEL-001 debe volver a estar libre');
    console.log('  ✔ [Atomicidad] CEL-001 liberado en inventario exitosamente.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE QA PASARON SATISFACTORIAMENTE (100% EXCELENCIA)!');
  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
