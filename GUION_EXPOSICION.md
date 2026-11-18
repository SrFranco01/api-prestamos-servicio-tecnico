# 🎙️ GUION DE EXPOSICIÓN — DISEÑO TÉCNICO Y PRIMER AVANCE DE API
**Materia:** Programación Avanzada con enfoque en QA  
**Proyecto:** API REST de Gestión de Préstamos de Celulares en Servicio Técnico (Equipo 01)  
**Modalidad:** Exposición para 3 Personas  
**Tiempo Total:** 10 Minutos (5 Minutos Diapositivas + 5 Minutos Demostración en Postman y Preguntas)  
**Tono:** Claro, seguro, pedagógico, conversacional y no sobrecargado de tecnicismos innecesarios.

---

## 👥 DISTRIBUCIÓN DE ROLES

| Integrante | Rol Temático | Bloque asignado | Tiempo estimado |
| :--- | :--- | :--- | :--- |
| **Persona 1** | *Contexto, Negocio y Modelado* | Diapositiva 1 y Diapositiva 2 | ~1:45 min |
| **Persona 2** | *Arquitectura, Base de Datos y Rutas* | Diapositiva 3 y Diapositiva 4 | ~1:45 min |
| **Persona 3** | *Respuestas, QA y Demo en Postman* | Diapositiva 5, Diapositiva 6 y Demostración en vivo | ~6:30 min |

---

## ⏱️ PARTE 1: PRESENTACIÓN TEÓRICA (5 MINUTOS)

### 📍 DIAPOSITIVA 1: Proyecto Recibido y Alcance del Backend
**🗣️ Orador:** Persona 1  
**Tiempo sugerido:** ~50 segundos  
**Acción visual:** Mostrar Diapositiva 1 en el navegador.

> **Persona 1:**  
> "Buenas tardes profesor y compañeros. Hoy les vamos a presentar el diseño técnico y el primer avance del backend para la gestión de préstamos de celulares en un centro de servicio técnico.
> 
> Para entender la necesidad real del proyecto: cuando un cliente deja su teléfono personal en el taller para cambiarle la pantalla o la batería, queda incomunicado por horas o días. Pierde contacto con su trabajo, su familia y sus emergencias. 
> Para solucionar esto, el taller les ofrece celulares de préstamo temporal o teléfonos de respaldo. Sin embargo, al gestionarse de forma informal o en cuadernos, se generaba un caos: celulares perdidos, equipos prometidos a dos personas al mismo tiempo, o entregas a clientes con deudas pendientes.
> 
> Nuestra API resuelve esto centralizando y automatizando 4 operaciones clave: registrar un préstamo, consultar sus datos, ver cuáles están activos y procesar la devolución. 
> Además, aclaramos una decisión técnica muy importante: la duración del préstamo no es un horario universal fijo, sino que depende de cuánto tiempo tome la reparación según la Orden de Servicio del cliente.
> 
> Ahora pasemos a ver cómo estructuramos los datos para soportar esto."

---

### 📍 DIAPOSITIVA 2: Modelos, Entidades y Reglas de Negocio
**🗣️ Orador:** Persona 1  
**Tiempo sugerido:** ~55 segundos  
**Acción visual:** Cambiar a Diapositiva 2 (Flecha derecha o click en botón 2). Señalar las 4 tarjetas de entidades.

> **Persona 1:**  
> "Para que el sistema sea confiable, definimos cuatro entidades principales:
> 
> 1. **Cliente:** con su identificador, nombre y una propiedad clave llamada `es_elegible`. Si el cliente no cumple los criterios (por ejemplo, tiene un equipo anterior no devuelto), el sistema frena la entrega inmediatamente (Regla de Negocio 01).
> 2. **Orden de Servicio:** que vincula el teléfono que el cliente dejó a reparar. Para entregar un equipo de respaldo, la orden debe estar en estado activo `EN_REPARACION` (Regla 02).
> 3. **Celular de Soporte:** que representa el teléfono del taller, con su modelo y la bandera `disponible`.
> 4. Y en el centro, el **Préstamo:** que asocia al cliente, a su orden y al celular asignado, con fechas claras de inicio y devolución.
> 
> Lo más importante acá a nivel de QA son las Reglas de Negocio 07 y 12: en el momento en que se presta un celular, este pasa automáticamente a no disponible. Si alguien más intenta prestar ese mismo celular, la API lo rechaza y la base de datos queda intacta.
> 
> Ahora mi compañero les va a explicar cómo garantizamos esto a nivel de base de datos y arquitectura."

*(Transición fluida: Persona 1 le cede la palabra a Persona 2)*

---

### 📍 DIAPOSITIVA 3: Persistencia, Motor Elegido y Esquema Relacional
**🗣️ Orador:** Persona 2  
**Tiempo sugerido:** ~50 segundos  
**Acción visual:** Cambiar a Diapositiva 3.

> **Persona 2:**  
> "Gracias. Al momento de elegir la base de datos, evaluamos qué necesitaba el negocio. No se trataba solo de guardar registros, sino de garantizar que jamás ocurran asignaciones dobles, incluso si dos coordinadores intentan registrar un préstamo en el mismo segundo.
> 
> Por eso elegimos una base de datos relacional con **SQLite 3 nativo**, que tiene una compatibilidad directa con PostgreSQL para producción. 
> Las razones técnicas clave son:
> - Primero, **Transacciones ACID:** Cuando registramos un préstamo, hacemos dos cosas a la vez: creamos el préstamo y cambiamos la disponibilidad del celular a falso. Si usamos transacciones, esto ocurre como un bloque atómico: o se hace todo completo, o si algo falla, se hace rollback y no queda nada a medias.
> - Segundo, **Integridad referencial activa:** Con las foreign keys obligatorias, es imposible registrar un préstamo para un cliente o un celular que no existan.
> - Y tercero, **Seguridad y portabilidad:** No requerimos servicios externos con contraseñas expuestas en el repositorio, cumpliendo con la directiva de seguridad del docente.
> 
> Ahora veamos cómo exponemos estas operaciones hacia el exterior."

---

### 📍 DIAPOSITIVA 4: Rutas, Métodos HTTP y Contrato de Operaciones
**🗣️ Orador:** Persona 2  
**Tiempo sugerido:** ~55 segundos  
**Acción visual:** Cambiar a Diapositiva 4. Señalar la tabla de endpoints.

> **Persona 2:**  
> "Para interactuar con la API, diseñamos las 4 rutas siguiendo estrictamente las buenas prácticas de REST:
> 
> 1. Para **RF-01 (Registrar Préstamo):** usamos `POST /api/v1/prestamos`. Recibe un JSON con los IDs del cliente, la orden y el celular. Si todo es válido, responde con código **201 Created**. Si el celular ya está ocupado, responde con **409 Conflict**.
> 2. Para **RF-02 (Consultar Préstamo):** usamos `GET /api/v1/prestamos/:id`. Le pasamos el ID por la URL y nos devuelve el detalle completo con código **200 OK**.
> 3. Para **RF-03 (Listar Préstamos Activos):** usamos `GET /api/v1/prestamos?estado=ACTIVO`. Este endpoint le permite al taller ver en tiempo real qué celulares están afuera y quién los tiene.
> 4. Y para **RF-04 (Registrar Devolución):** usamos `PATCH /api/v1/prestamos/:id/devolucion`. Usamos PATCH porque no destruimos el préstamo; actualizamos su estado a 'DEVUELTO' y automáticamente liberamos el celular para que otro cliente pueda usarlo.
> 
> Ahora mi compañero les va a mostrar cómo responde la API ante casos de éxito y de error, y cómo organizamos el código."

*(Transición fluida: Persona 2 le cede la palabra a Persona 3)*

---

### 📍 DIAPOSITIVA 5: Respuestas de Ejemplo y Casos de Demostración
**🗣️ Orador:** Persona 3  
**Tiempo sugerido:** ~50 segundos  
**Acción visual:** Cambiar a Diapositiva 5. Usar los botones interactivos para alternar entre CA-01 (verde) y CA-02 (rojo).

> **Persona 3:**  
> "Muchas gracias. Desde la perspectiva de Aseguramiento de la Calidad (QA), no solo nos interesa que el sistema funcione cuando todo está bien, sino que sea robusto y predecible ante los errores.
> 
> En pantalla pueden ver los dos escenarios solicitados en la especificación:
> - **Criterio de Aceptación 01 (Éxito):** Cuando el cliente es elegible y el celular está libre, la API genera el préstamo y devuelve un código **201 Created** con el objeto completo.
> - **Criterio de Aceptación 02 (Rechazo Celular No Disponible):** Si un coordinador intenta registrar un préstamo con un celular que ya está ocupado, la API no se cae ni crea datos corruptos. Frena la operación, devuelve un **409 Conflict** con el código de error `CELULAR_NO_DISPONIBLE`, y garantiza que la base de datos no sufra ninguna alteración.
> 
> Esta es exactamente la secuencia que vamos a probar en Postman."

---

### 📍 DIAPOSITIVA 6: Organización del Código, Avance Real y Aportes
**🗣️ Orador:** Persona 3  
**Tiempo sugerido:** ~50 segundos  
**Acción visual:** Cambiar a Diapositiva 6.

> **Persona 3:**  
> "Para que el proyecto sea mantenible y testeable, organizamos el código en una arquitectura por capas limpia:
> - En la carpeta `routes` definimos los endpoints y contratos HTTP.
> - En `controllers` recibimos las peticiones y preparamos las respuestas.
> - En `services` está el verdadero corazón del sistema: ahí se validan las 14 reglas de negocio y se ejecutan las transacciones.
> - Y en `config/database.js` centralizamos la conexión y las semillas de prueba de SQLite.
> 
> Respecto a nuestro avance: cumplimos con el requerimiento de tener la operación principal 100% terminada, pero además ya dejamos operativas las 4 operaciones del contrato (registro, consulta, listado y devolución).
> 
> Y en cuanto al trabajo del equipo: el Integrante 1 lideró el análisis de requerimientos y el diseño del modelo relacional; el Integrante 2 construyó la arquitectura del servidor, los controladores y la configuración de persistencia; y yo me enfoqué en la capa de servicios con las reglas de negocio, las transacciones y la colección de pruebas en Postman.
> 
> Pasemos ahora a la demostración práctica en vivo."

---

## 🚀 PARTE 2: DEMOSTRACIÓN EN POSTMAN (5 MINUTOS)

**🗣️ Conductor principal:** Persona 3 *(con apoyo puntual de Persona 1 y 2 según las preguntas del docente)*.  
**Herramienta abierta:** Postman con la colección `API Gestión Préstamos Celulares - Servicio Técnico (Equipo 01)`.  
**Servidor:** Ejecutándose en terminal (`npm start`).

---

### PASO 1: Comprobar el Estado Inicial del Celular
* **Petición en Postman:** `01. Estado Inicial - Consultar Celulares Disponibles` (`GET /api/v1/celulares`)
* **Qué decir:**
  > "Primero vamos a consultar el inventario de celulares. Como pueden ver en la respuesta JSON, el dispositivo `CEL-001` (Samsung Galaxy A54) tiene el campo `disponible: 1`, es decir, está completamente libre para ser prestado."

---

### PASO 2: Ejecutar el Registro Exitoso (CA-01)
* **Petición en Postman:** `02. [DEMO ÉXITO CA-01] RF-01 Registrar Préstamo Válido` (`POST /api/v1/prestamos`)
* **Body:**
  ```json
  {
    "id_prestamo": "PRE-001",
    "id_cliente": "CLI-001",
    "id_orden": "ST-001",
    "id_celular": "CEL-001",
    "fecha_limite": "2026-11-10T18:00:00.000Z"
  }
  ```
* **Qué decir:**
  > "Ahora enviamos la solicitud de préstamo para la cliente Ana Pérez (`CLI-001`), con su orden activa `ST-001` y el celular `CEL-001`. 
  > Observen el resultado: la API nos responde con código HTTP **201 Created**, nos devuelve el préstamo `PRE-001` en estado `ACTIVO` y nos confirma la asignación exitosa."

---

### PASO 3: Comprobar el Cambio en la Base de Datos
* **Petición en Postman:** `03. [COMPROBACIÓN BD] Verificar Celular CEL-001 Ocupado` (`GET /api/v1/celulares`)
* **Qué decir:**
  > "Tal como exige la guía de evaluación, comprobamos el efecto en los datos: si consultamos nuevamente el inventario, el celular `CEL-001` ahora tiene `disponible: 0`. El sistema ya sabe que está físicamente entregado."

---

### PASO 4: Demostrar el Rechazo por Celular No Disponible (CA-02)
* **Petición en Postman:** `04. [DEMO RECHAZO CA-02] RF-01 Intento Préstamo con Celular Ocupado` (`POST /api/v1/prestamos`)
* **Body:** Mismo `CEL-001`.
* **Qué decir:**
  > "Ahora viene la prueba de fuego de QA: supongamos que otro coordinador intenta registrar un segundo préstamo usando ese mismo celular `CEL-001`.
  > Al enviar la petición, la API bloquea la operación de inmediato, nos responde con código **409 Conflict** y nos indica el código de error `CELULAR_NO_DISPONIBLE`. 
  > Y si revisamos los préstamos, no se creó ningún registro basura; la base de datos se conservó exactamente igual."

---

### PASO 5: Consultar, Listar y Devolver (Cierre Completo)
* **Peticiones en Postman:**
  - `05. RF-02 Consultar Préstamo por ID (PRE-001)` -> Devuelve 200 OK con datos completos.
  - `06. RF-03 Listar Préstamos Activos` -> Muestra el listado filtrado de equipos en calle.
  - `07. RF-04 Registrar Devolución (PRE-001)` -> `PATCH /api/v1/prestamos/PRE-001/devolucion` -> 200 OK.
  - `08. Verificar Celular Liberado` -> Muestra que `CEL-001` volvió a `disponible: 1`.
* **Qué decir:**
  > "Para finalizar el ciclo de vida, ejecutamos la devolución con PATCH. El préstamo pasa a `DEVUELTO` y el celular vuelve a liberarse atómicamente en el inventario. 
  > Con esto demostramos que las 4 operaciones no solo están diseñadas, sino completamente implementadas y validadas. Quedamos a disposición para sus preguntas."

---

## 🛡️ BANCO DE RESPUESTAS A PREGUNTAS DEL DOCENTE (QA & ARQUITECTURA)

### Pregunta 1: "¿Por qué usaron código HTTP 409 Conflict en vez de 400 Bad Request cuando el celular está ocupado?"
> **Respuesta recomendada (Persona 2 o 3):**  
> "Excelente pregunta, profesor. La sintaxis del JSON es totalmente válida, por lo que no es un error de formato de entrada (que sería un 400). El error ocurre porque el estado actual del recurso en el servidor entra en colisión directa con la solicitud: el celular ya está reservado. Según la especificación oficial de HTTP (RFC 9110), el código semánticamente exacto para un conflicto de estado de negocio es el **409 Conflict**."

### Pregunta 2: "¿Cómo garantizan que la asignación del préstamo y la actualización del celular no queden desincronizadas?"
> **Respuesta recomendada (Persona 2):**  
> "Lo garantizamos mediante una **transacción atómica** en SQLite con `BEGIN TRANSACTION` y `COMMIT`. Si la base de datos llegara a fallar justo después de insertar el préstamo, el bloque entero hace `ROLLBACK`. Así garantizamos la propiedad de Atomicidad de ACID: o se aplican ambas escrituras, o no se aplica ninguna."

### Pregunta 3: "¿Dónde está la validación de que el cliente sea elegible?"
> **Respuesta recomendada (Persona 3):**  
> "En la capa de servicio (`src/services/prestamos.service.js`). Antes de intentar cualquier escritura, el servicio consulta la tabla de clientes y evalúa la regla de negocio `RN-01`. Si `es_elegible` es falso, lanzamos una excepción tipada `CLIENTE_NO_ELEGIBLE` con código 400 que interrumpe el flujo de inmediato."
