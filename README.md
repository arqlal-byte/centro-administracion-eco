# Centro de Administración ECO · aplicación web en GitHub Pages

**Estado:** prototipo funcional en validación. Google Sheets seguirá como base oficial; GitHub Pages publica la aplicación y conserva su historial de código.

**Web:** https://arqlal-byte.github.io/centro-administracion-eco/

## Estructura

- `index.html`, `app-eco.js`, `motor-eco.js`: interfaz y motor de diagnóstico E1–E20, ciclo y reglas confirmadas.
- `datos-demo.js`: únicamente datos sintéticos para validación visual.
- `eco-config.js`, `eco-bridge-client.js` y `eco-admin-live.js`: conexión protegida y acceso de RH. Cuando se activa `mode:'live'` con `bridgeUrl`, ninguna nómina se consulta antes de autenticar al administrador.

**La consulta administrativa real está protegida por un usuario y una contraseña establecidos en el backend privado.** La contraseña nunca se envía a GitHub ni se guarda en el navegador de manera persistente. Al cerrar sesión se limpian los datos mostrados.

## Pendientes funcionales

Asignaciones por RH, activación/desactivación de actividades, envío de mensajes, seguimiento histórico por ciclo y validaciones con escritura requieren desarrollo y pruebas específicas, preservando la propiedad de cada hoja. No afirmar que esas operaciones funcionan en la versión actual.

La configuración pública se mantiene en modo demostración hasta habilitar el conector privado. No copiar el backend ni claves al repositorio público.