# Centro de Administración ECO · v0.5

Prototipo funcional en validación operativa. Google Sheets y Drive permanecen como fuentes oficiales; no sustituye las aplicaciones de Google existentes.

## Funciones

Consulta RH autenticada de catálogo, resultados 2026, actividades, asignaciones y cumplimientos. Confirmación individual de actividades según su requisito oficial: realización sin validación adicional, respuesta/reflexión, clave, QR/enlace, evidencia fotográfica, documento, acreditación RH y constancia del jefe directo.

El servidor comprueba nuevamente identidad, asignación, publicación activa y elegibilidad 2026. Los escenarios de comparación, otros ciclos y cambios del umbral son simulaciones y no permiten confirmar. Las invitaciones familiares y la validación automática entre aplicaciones no se acreditan manualmente.

## Datos y seguridad

Las respuestas se registran en la hoja oficial de respuestas; las evidencias en una carpeta privada de Drive creada al primer envío y referenciada desde la hoja oficial de evidencias. El cumplimiento se registra después de guardar el requisito. Se conserva origen, responsable y bitácora administrativa. Las operaciones repetidas usan un identificador para recuperar interrupciones sin duplicar el cumplimiento. Las operaciones terminadas se retienen siete días en propiedades privadas; las incompletas quedan para recuperación.

No hay contraseñas, claves de actividades, tokens de sesión ni copias de información de colaboradores en GitHub. El código privado se mantiene fuera de este repositorio. La autorización de RH es independiente de las aplicaciones operativas.

## Archivos

- `index.html`: interfaz, identidad corporativa y acceso RH.
- `app-eco.js` y `motor-eco.js`: consulta, diagnóstico, reglas y acciones elegibles.
- `eco-admin-live.js`: sesión RH, consulta y operaciones autorizadas.
- `eco-bridge-client.js`: transporte con canal aleatorio y validación de origen.
- `eco-confirmaciones.js`: formularios de requisitos, adjuntos y lector QR cuando el navegador lo permite.
- `eco-config.js`: modo real y URL pública del conector; sin secretos.
- `datos-demo.js`: datos sintéticos de demostración, ajenos a las bases oficiales.

## Límites de la validación

Fotografías: de 1 a 3 JPG, PNG o WebP, 3 MB cada una. Documento: un PDF, Word o imagen de hasta 5 MB. Se valida formato y firma básica del archivo; no constituye análisis antivirus ni evaluación del contenido. La confirmación del jefe registra la constancia recibida por RH; no suplanta la identidad del jefe ni envía solicitudes automáticas.

El escaneo QR depende de BarcodeDetector y permiso de cámara. Cuando no está disponible, puede pegarse el token o enlace leído con la cámara del teléfono. Las claves se verifican en el servidor.

## Pruebas y recuperación

26 pruebas aisladas del backend de gestión aprobadas con datos sintéticos: autorización, asignación, actividad activa, elegibilidad, requisitos, archivos inválidos, duplicados, fórmulas y recuperación de bitácora. Revisión de sintaxis ejecutada. No se registraron cumplimientos reales como prueba. Las pruebas visuales locales no pudieron ejecutarse por falta del navegador de pruebas. La validación operativa completa sigue pendiente.

El historial de commits conserva la interfaz anterior. Apps Script conserva las versiones anteriores del conector. Revertir el código no revierte cumplimientos ya guardados: deben revisarse con su bitácora. Los bloqueos del conector no coordinan operaciones simultáneas iniciadas por otros proyectos Apps Script; se conserva esa limitación de integración.
