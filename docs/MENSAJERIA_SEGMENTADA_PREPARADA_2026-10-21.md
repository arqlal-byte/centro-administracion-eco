# Centro de Administración ECO — mensajería por área y actividad especial

**Fecha de preparación:** 2026-10-21. **Estado:** solo rama, no desplegada ni validada operativamente.

## Alcance
- Mantiene los envíos por nómina y para todos.
- Añade envío por área y por actividad especial.
- Selección desde catálogos oficiales ya consultados por el Centro.
- Vista previa de cantidad y descripción de los destinatarios; el servidor devuelve una huella del grupo, sin exponer una lista de nóminas.
- Al publicar, Apps Script recalcula la audiencia y bloquea el envío si cambió; exige vista previa para área o actividad especial.
- Conserva la operación idempotente, historial, retiro/restauración y bloqueo por sesión RH.
- Almacenamiento en la hoja oficial existente `Mensajes_Persona_ECO` sin agregar columnas.
- No cambia asignaciones, permisos, contraseñas, evidencias, resultados ni las aplicaciones operativas.

## Archivos GitHub de la rama
- `index.html` — cuatro destinatarios, selectores, estado de vista previa y caché.
- `eco-mensajes.js` — selección, consulta, confirmación y presentación del historial.
- `app-eco.js` — facilita datos de personas y actividades especiales al módulo.
- `eco-admin-live.js` y `eco-bridge-client.js` — lista explícita de consultas RH autorizadas.

## Archivos privados indispensables fuera de GitHub
- `Servicio_Datos_ECO_Code_MENSAJERIA_AREAS_ACTIVIDADES_PREPARADO_2026-10-21.txt` — Code.gs completo preparado a partir de la copia documental `Servicio_Datos_ECO_Code_OPTIMIZADO_PREPARADO_2026-10-21.txt`.
- `Servicio_Datos_ECO_Bridge_MENSAJERIA_PREPARADO_2026-10-21.txt` — Bridge.html completo preparado tomando como base la copia del 20 de octubre.

**Nunca subir Code.gs ni Bridge.html a GitHub público.** Ambos archivos deben cotejarse con el código realmente vigente del servicio Apps Script, que no puede verificarse a partir de las copias documentales.

## Verificación de estructuras (solo lectura)
- La hoja `Mensajes_Persona_ECO` dispone de columnas `Tipo destinatario`, `ID actividad`, `Actividad especial`, `Total destinatarios`, `Área destinataria`, `Nómina destinataria` y `Nombre destinatario`.
- Catálogo de líderes dispone de `Nomina`, `Nombre`, `Area`.
- Hojas de actividades especiales y asignación contienen `Activo` y `Asignada`.

## Pruebas
- Validación sintáctica del Code.gs completo y los JavaScript modificados.
- 16 pruebas simuladas del backend, incluidos los cuatro públicos, conteos, integridad de columnas, asignaciones duplicadas, cambio de audiencia, ausencia de destinatarios e inactividad.
- Falta prueba de integración en navegador y prueba real contra Google Apps Script, Google Sheets y el puente desplegado.

## Despliegue y reversión
No avanzar `main` mientras el backend y Bridge desplegados no estén preparados y comparados. No publicar ni reemplazar los Apps Script existentes sin autorización y respaldo previo. La rama `respaldo-centro-previo-mensajeria-20261021` conserva el estado anterior del Centro.
