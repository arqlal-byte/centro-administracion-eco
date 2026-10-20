# Centro de Administración ECO · GitHub Pages · v0.4

**Estado:** prototipo funcional en validación operativa. Este repositorio es la interfaz y el motor de consulta del Centro de Administración ECO. **Google Sheets y Drive continúan como fuentes oficiales.** La aplicación original de Google y sus bases no fueron alteradas.

## Fase 1: consulta segura a fuentes oficiales

La interfaz consulta, por medio de una conexión protegida, el Catálogo de Líderes, resultados publicados de Evaluación 2026, actividades de desarrollo, especiales, asignaciones, cumplimientos y actividades familiares. La respuesta del servicio está restringida a RH mediante usuario y contraseña. No expone credenciales ni identificadores de bases privadas en este repositorio.

El código de conexión privada (`Code.gs.txt` y `Bridge.html.txt`) **no se publica aquí**; se conserva en el paquete de implementación y se despliega con una identidad autorizada sobre Google Sheets. Su publicación requiere autorización y configuración manual en Google. Este backend no constituye otra aplicación dirigida a usuarios.

**No se habilitan escrituras** a Sheets, asignación de actividades ni validación de evidencias en esta primera fase.

## Archivos publicados

- `index.html`: interfaz administrativa, login y botón para cerrar sesión.
- `app-eco.js`: consultas, diagnóstico, vistas y aviso de estado de fuentes.
- `motor-eco.js`: reglas y simulaciones E1–E20.
- `eco-admin-live.js`: acceso RH y eliminación del contenido privado al cerrar sesión.
- `eco-bridge-client.js`: cliente de transporte con Apps Script; sin contraseñas.
- `eco-config.js`: la configuración pública mantiene `mode: 'demo'` y `bridgeUrl: ''` hasta verificar la conexión real.
- `datos-demo.js`: registros sintéticos empleados únicamente en demostración.

## Activación pendiente

Requiere desplegar el servicio protegido, comprobar la autorización de RH y facilitar su URL `/exec`. **Nunca** publicar contraseñas ni hojas confidenciales. Una vez probada la conexión, se podrá activar `mode:'live'` en `eco-config.js` y configurar la URL pública del servicio. **Los datos oficiales nunca se copian a GitHub.**

## Observaciones

En la copia consultada del Plan de Desarrollo ECO, las actividades de reforzamiento están inactivas. El sistema presentará el estado real y advertirá cuando no haya actividades habilitadas para el ciclo. Nunca cambia por sí solo el campo «Activo».

Pruebas locales: 26 comprobaciones del backend con datos sintéticos y pruebas de interfaz responsiva en tres tamaños. **No equivale a validación con Sheets reales ni del despliegue público.**