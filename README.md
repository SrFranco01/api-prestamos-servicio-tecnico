# 📱 API REST de Gestión de Préstamos de Celulares en Servicio Técnico

> **Asignatura:** Programación Avanzada con enfoque en QA  
> **Entrega:** Diseño Técnico y Primer Avance de la API  
> **Equipo:** 01  
> **Documento Base de Requisitos:** `Especificacion_Requisitos_Equipo01.docx` (Versión 0.1)

---

## 🎯 1. Propósito y Alcance del Proyecto

La API resuelve la problemática de los clientes de servicio técnico que quedan incomunicados temporalmente al dejar su smartphone personal en reparación. Para mitigar esto, el taller provee celulares de soporte ("loaner phones").

El sistema automatiza el control de inventario, garantiza que **no existan préstamos duplicados** de un mismo dispositivo, valida la elegibilidad de los clientes y gestiona el ciclo de vida completo de cada préstamo (registro, consulta, monitoreo activo y devolución con liberación atómica).

### Operaciones del Alcance (Fase 1)
- **RF-01 / HU-01:** Registrar Préstamo de Celular (con validación de disponibilidad y elegibilidad).
- **RF-02 / HU-02:** Consultar Préstamo por ID.
- **RF-03 / HU-03:** Listar Préstamos Activos (con filtro por estado `ACTIVO`).
- **RF-04 / HU-04:** Registrar Devolución de Dispositivo (con liberación atómica en inventario).

---

## 🧱 2. Arquitectura de Software

La API está construida bajo una **arquitectura por capas limpia** (Separation of Concerns), garantizando alta cohesión, bajo acoplamiento y facilidad para pruebas de QA:

```
API/
├── src/
│   ├── config/
│   │   └── database.js              # Inicialización de SQLite, DDL, constraints y semillas de prueba
│   ├── controllers/
│   │   ├── prestamos.controller.js  # Mapeo HTTP, códigos de respuesta y extracción de parámetros
│   │   └── inventario.controller.js # Endpoints auxiliares para la verificación en vivo
│   ├── services/
│   │   └── prestamos.service.js     # Reglas de negocio (RN-01 a RN-14) y transacciones ACID
│   ├── routes/
│   │   ├── prestamos.routes.js      # Definición de rutas REST versionadas (/api/v1/prestamos)
│   │   └── inventario.routes.js     # Rutas de inventario y utilidad para demos
│   ├── app.js                       # Configuración de Express, middlewares globales y errores
│   └── server.js                    # Punto de entrada y levantamiento del puerto HTTP
├── postman/
│   └── prestamos_servicio_tecnico.postman_collection.json  # Colección exportada para demo
├── presentacion.html                # Presentación interactiva HTML con diseño temático de soporte
├── GUION_EXPOSICION.md              # Guion completo para 3 oradores (10 min con demo)
├── prestamos.db                     # Base de datos SQLite local (creada automáticamente)
└── package.json
```

---

## 🗄️ 3. Modelo de Datos y Motor Elegido

### Motor de Persistencia
Se seleccionó **SQLite 3 nativo** (mediante `node:sqlite`), proporcionando:
1. **Transacciones ACID:** `BEGIN TRANSACTION ... COMMIT` para asegurar que el registro del préstamo y el bloqueo del celular ocurran atómicamente.
2. **Integridad Referencial Estricta:** `PRAGMA foreign_keys = ON` para evitar registros huérfanos.
3. **Cero Secretos Expuestos:** No requiere credenciales remotas ni archivos `.env` con contraseñas en el repositorio.
4. **Portabilidad Inmediata:** 100% compatible para migrar a PostgreSQL en entornos productivos.

### Esquema Relacional (DDL)
```sql
CREATE TABLE clientes (
  id_cliente TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  es_elegible INTEGER NOT NULL CHECK(es_elegible IN (0, 1))
);

CREATE TABLE ordenes (
  id_orden TEXT PRIMARY KEY,
  id_cliente TEXT NOT NULL,
  estado_equipo TEXT NOT NULL CHECK(estado_equipo IN ('EN_REPARACION', 'LISTO_ENTREGA', 'ENTREGADO')),
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE celulares (
  id_celular TEXT PRIMARY KEY,
  modelo TEXT NOT NULL,
  disponible INTEGER NOT NULL CHECK(disponible IN (0, 1))
);

CREATE TABLE prestamos (
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
```

---

## 📋 4. Contrato de la API (Endpoints)

| Operación | Método | Ruta | Entrada | Respuesta Exitosa | Códigos de Error |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-01: Registrar Préstamo** | `POST` | `/api/v1/prestamos` | JSON Body: `{ id_cliente, id_orden, id_celular, fecha_limite }` | **201 Created**<br>Objeto Préstamo `ACTIVO` | **409 Conflict** (`CELULAR_NO_DISPONIBLE`)<br>**400 Bad Request** (`CLIENTE_NO_ELEGIBLE`, `ORDEN_NO_ACTIVA`) |
| **RF-02: Consultar Préstamo** | `GET` | `/api/v1/prestamos/:id` | Path Param: `:id` (ej. `PRE-001`) | **200 OK**<br>Detalle con cliente y celular | **404 Not Found** (`PRESTAMO_NO_ENCONTRADO`) |
| **RF-03: Listar Préstamos Activos** | `GET` | `/api/v1/prestamos?estado=ACTIVO` | Query Param: `?estado=ACTIVO` | **200 OK**<br>Array de préstamos en curso | `[]` vacío si no hay activos |
| **RF-04: Registrar Devolución** | `PATCH` | `/api/v1/prestamos/:id/devolucion` | Path Param: `:id` (ej. `PRE-001`) | **200 OK**<br>Celular liberado | **400 Bad Request** (`PRESTAMO_YA_DEVUELTO`)<br>**404 Not Found** (`PRESTAMO_NO_ENCONTRADO`) |

---

## 🚀 5. Instalación y Ejecución

### Prerrequisitos
- Node.js (v18+ recomendado, compatible con Node v20, v22 y v24).

### Pasos
1. Clonar el repositorio o posicionarse en la carpeta raíz del proyecto:
   ```bash
   cd API
   ```
2. Instalar dependencias (Express):
   ```bash
   npm install
   ```
3. Iniciar el servidor:
   ```bash
   npm start
   ```
   *El servidor quedará escuchando en `http://localhost:3000` con la base de datos inicializada automáticamente.*

4. Ejecutar pruebas automatizadas:
   ```bash
   npm test
   ```

---

## 🧪 6. Guía de Demostración en Postman (5 Minutos)

Para ejecutar la demostración exigida en la guía:
1. Abrir **Postman** e importar el archivo ubicado en:  
   `postman/prestamos_servicio_tecnico.postman_collection.json`
2. Seguir el orden de las peticiones enumeradas:
   - **01. Estado Inicial:** Muestra que `CEL-001` tiene `disponible = 1`.
   - **02. [DEMO ÉXITO CA-01]:** Envía `POST /api/v1/prestamos` -> Devuelve **201 Created** y genera `PRE-001`.
   - **03. [COMPROBACIÓN BD]:** Vuelve a consultar `CEL-001` -> Comprueba que ahora tiene `disponible = 0`.
   - **04. [DEMO RECHAZO CA-02]:** Envía un segundo `POST` intentando pedir el mismo `CEL-001` -> La API responde con **409 Conflict** y error `CELULAR_NO_DISPONIBLE`.
   - **05. RF-02 Consulta:** Muestra la consulta por ID del préstamo generado.
   - **06. RF-03 Listar:** Muestra el listado de préstamos activos en curso.
   - **07. RF-04 Devolución:** Envía `PATCH /api/v1/prestamos/PRE-001/devolucion` -> Devuelve **200 OK**.
   - **08. Verificación Final:** Muestra que `CEL-001` volvió a estar liberado (`disponible = 1`).

---

## 👥 7. Distribución de Tareas del Equipo

- **Integrante 1:** Análisis de requerimientos según `Especificacion_Requisitos_Equipo01.docx`, modelado entidad-relación, restricciones de integridad referencial y generación de datos semilla (seeds).
- **Integrante 2:** Arquitectura de la API en capas, configuración del servidor Express, definición de rutas RESTful, controladores y capa de acceso a datos transaccional con SQLite.
- **Integrante 3:** Implementación del servicio de negocio, validación de las 14 reglas (RN-01 a RN-14), manejo centralizado de errores, suite de pruebas automatizadas y colección de Postman.

---

## 🔮 8. Estado del Avance y Trabajo Pendiente

- ✅ **Completado (100% de la entrega actual):**
  - Contrato de las 4 operaciones definido y documentado.
  - Base de datos relacional transaccional configurada con datos ficticios.
  - Operación principal completa (RF-01) con validación estricta y prueba de rechazo (CA-01 y CA-02).
  - Operaciones auxiliares (RF-02, RF-03, RF-04) totalmente implementadas y funcionales.
  - Colección de Postman exportada y lista para la defensa.
  - Presentación interactiva en `presentacion.html` y guion para 3 oradores en `GUION_EXPOSICION.md`.
- ⏳ **Pendiente para Fases Posteriores (Fase 2):**
  - Autenticación y autorización basada en roles (JWT).
  - Módulo de prórrogas automáticas basadas en tiempos de taller.
