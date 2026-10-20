/** Centro de Administración ECO: acceso autenticado de RH, solo lectura.
 * Los datos privados permanecen en memoria y se eliminan al cerrar sesión.
 */
(function (root) {
  'use strict';
  let token = null;
  let timer = null;
  let inflight = false;
  let onLogout = null;
  let lastActivity = 0;
  const MAX_IDLE_MS = 15 * 60 * 1000;
  const $ = id => document.getElementById(id);
  const active = () => !!(root.EcoBridgeClient && root.EcoBridgeClient.active());
  function status(text) { const x=$('eco-admin-status'); if(x) x.textContent=String(text||''); }
  function error(text) { const x=$('eco-admin-error'); if(x) x.textContent=String(text||''); }
  function lock(clear) {
    document.body.classList.add('eco-live-locked');
    const exit=$('eco-admin-logout'); if(exit) exit.hidden=true;
    if(clear && typeof onLogout==='function') onLogout();
  }
  async function logout() {
    const previous=token; token=null;
    if(timer) { clearInterval(timer); timer=null; }
    lock(true); status(''); error('');
    const pass=$('eco-admin-pw'); if(pass) pass.value='';
    // Se revoca también del servidor; si no hay red, desaparece de memoria local.
    if(previous) {
      try { await root.EcoBridgeClient.invoke('adminCerrarSesionECO',[previous]); }
      catch(e) { console.warn('No se pudo confirmar la revocación remota de sesión.'); }
    }
  }
  function interaction() { if(token) lastActivity=Date.now(); }
  function start(showData, clearData) {
    if(!active()) return false;
    if(typeof showData!=='function' || typeof clearData!=='function')
      throw new Error('No está inicializada la vista administrativa de acceso seguro.');
    onLogout=clearData;
    lock(false);
    // Los controles solo se muestran después de autenticar al administrador.
    const exit=$('eco-admin-logout');
    if(exit) exit.addEventListener('click',logout);
    ['click','keydown','touchstart'].forEach(name=>
      document.addEventListener(name,interaction,{passive:true}));
    timer=setInterval(()=>{
      if(token && Date.now()-lastActivity>MAX_IDLE_MS) {
        logout().then(()=>error('Sesión cerrada por inactividad. Ingresa nuevamente.'));
      }
    },30000);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden && token && Date.now()-lastActivity>MAX_IDLE_MS) {
        logout().then(()=>error('Sesión cerrada por inactividad. Ingresa nuevamente.'));
      }
    });
    const form=$('eco-admin-form');
    if(!form) throw new Error('No se encontró el formulario de RH.');
    form.addEventListener('submit',async ev=>{
      ev.preventDefault();
      if(inflight) return;
      inflight=true;
      error(''); status('Conectando con el servicio privado…');
      const btn=$('eco-admin-submit'); btn.disabled=true;
      const old=btn.textContent; btn.textContent='Consultando…';
      let nuevoToken=null;
      try {
        const u=$('eco-admin-user').value.trim();
        const pw=$('eco-admin-pw').value;
        if(!u||!pw) throw new Error('Ingresa usuario y contraseña.');
        const auth=await root.EcoBridgeClient.invoke('adminIniciarSesionECO',[u,pw]);
        if(!auth || !auth.ok || typeof auth.token!=='string')
          throw new Error('No se pudo iniciar sesión.');
        nuevoToken=auth.token;
        $('eco-admin-pw').value='';
        status('Leyendo catálogos, resultados y asignaciones de Sheets…');
        const response=await root.EcoBridgeClient.invoke('adminConsultarDatosECO',[nuevoToken]);
        if(!response || !response.ok || !response.datos || !Array.isArray(response.datos.personas))
          throw new Error('La consulta oficial devolvió un formato inesperado.');
        showData(response.datos,response.diagnostico||null);
        token=nuevoToken;
        lastActivity=Date.now();
        document.body.classList.remove('eco-live-locked');
        if(exit) exit.hidden=false;
        status('');error('');
      } catch (e) {
        lock(true);
        status('');
        error(e && e.message ? e.message : String(e));
        if(nuevoToken) root.EcoBridgeClient.invoke('adminCerrarSesionECO',[nuevoToken]).catch(()=>{});
      } finally {
        inflight=false; btn.disabled=false;btn.textContent=old;
        $('eco-admin-pw').value='';
      }
    });
    return true;
  }
  async function request(method,args){if(!token)throw new Error('Inicia sesión como RH.');if(!['adminObtenerRequisitoECO','adminConfirmarActividadECO','adminConsultarDatosECO'].includes(method))throw new Error('Operación no permitida.');lastActivity=Date.now();return root.EcoBridgeClient.invoke(method,[token].concat(args||[]));}
  root.EcoAdminLive={active,start,logout,request};
})(window);
