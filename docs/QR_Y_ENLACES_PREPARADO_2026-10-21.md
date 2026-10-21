# Centro de Administración ECO — QR y enlaces de validación
Preparación: 21 de octubre de 2026. Estado: rama de preparación; no publicada ni validada operativamente.

## Alcance
- Botón **QR y enlace** en actividades de desarrollo y especiales que estén habilitadas y tengan como requisito `QR + nómina`.
- RH autenticado consulta los datos vigentes de la actividad con `adminLeerActividadECO`, método que ya existe en el Servicio de Datos ECO. Se reutilizan los filtros de acceso y sesión actuales.
- El token existente de la columna oficial `Token de validación` se transforma en el enlace `https://arqlal-byte.github.io/mi-persona-eco/?validar=<TOKEN>`.
- El QR se dibuja **sin llamadas a terceros**, con la biblioteca local `vendor/qrcode.js` (MIT, licencia incluida).
- El administrador puede ver, copiar el enlace, abrir el formulario y guardar el QR en PNG.
- El token no se publica en archivos GitHub, no se solicita hasta que RH inicia sesión y no se guarda en almacenamiento local. Se elimina de la vista al cerrar sesión.
- No se modifican Apps Script, Sheets, columnas, Drive, permisos, otras aplicaciones ni funciones de validación existentes.

## Límites funcionales y de seguridad
- No se generan tokens nuevos con solo abrir la vista. Una actividad QR + nómina sin token requiere abrir y guardar su configuración en la sección **Editar actividad**; esta acción sí escribe en el catálogo, de manera explícita y con controles del servicio.
- Por seguridad, no se presenta enlace para actividades deshabilitadas ni para tipos de validación distintos de QR + nómina.
- QR + nómina es un flujo público intencional: quien posea el enlace y conozca una nómina elegible puede intentar registrar un cumplimiento sin iniciar sesión. Resguardar los QR y valorar controles adicionales antes de una etapa institucional.
- Los enlaces usan el formulario de Mi Persona ECO en GitHub, no una URL antigua del Editor, y su funcionalidad real requiere el Servicio de Datos actualizado y autorizado.
- No se implementa aquí **validación por enlace delegado**; es una fase posterior con autorización, uso único y reglas propias.
- Cambios de caché en index.html y versión nueva de app-eco.js sólo en rama de preparación.

## Validaciones efectuadas
- Sintaxis de archivos JavaScript y scripts inline sin errores en análisis.
- Generación local de matriz QR con enlace de ejemplo sintético: correcto a nivel de formato; no se ha confirmado mediante escáner de cámara real.
- Casos aislados: método QR reconocido, token válido/inválido, generación de URL oficial, permiso de sesión, botón sólo en actividades QR activas, limpieza por cierre de sesión.
- No se comprobó contra registros reales, navegador móvil ni Google Apps Script desplegado.

## Archivos
- `eco-validaciones.js` nuevo: interfaz, lectura RH, QR, copia, imagen.
- `vendor/qrcode.js` nuevo y `vendor/LICENSE.qrcode.txt`: biblioteca offline y licencia.
- `app-eco.js`: botón condicional en catálogos; preserva los indicadores previos.
- `index.html`: carga de scripts y actualización de referencia de caché.

## Recuperación
Rama de respaldo `respaldo-centro-previo-qr-20261021`, creada desde el commit `04bfd47ec47f9b7ef37f2c619b4722d0beca445d`. 
No publicar sin autorización del responsable; al publicarse quedará **pendiente de validación operativa**.
