/** Acceso administrativo a través del mismo conector protegido. Sin contraseñas en el repositorio. */
(function(root){
'use strict';
var token = null;
function active(){return root.EcoBridgeClient && root.EcoBridgeClient.active();}
function $ (id){return document.getElementById(id);}
function error(msg){$('eco-admin-error').textContent=String(msg||'');}
function start(onData){
  if(!active())return false;
  document.body.classList.add('eco-live-locked');
  const form=$('eco-admin-form');
  form.addEventListener('submit',async function(ev){
    ev.preventDefault();error('');
    var btn=$('eco-admin-submit');btn.disabled=true;btn.textContent='Verificando acceso…';
    try{
      var u=$('eco-admin-user').value.trim();var pw=$('eco-admin-pw').value;
      if(!u||!pw)throw new Error('Ingresa usuario y contraseña.');
      var auth=await root.EcoBridgeClient.invoke('adminIniciarSesionECO',[u,pw]);
      if(!auth||!auth.ok||!auth.token)throw new Error('No se pudo iniciar sesión.');
      token=auth.token;
      // Borrar inmediatamente credenciales del formulario y no conservar el token en storage.
      $('eco-admin-pw').value='';
      btn.textContent='Consultando hojas oficiales…';
      var response=await root.EcoBridgeClient.invoke('adminConsultarDatosECO',[token]);
      if(!response||!response.ok||!response.datos)throw new Error('El servidor no devolvió datos autorizados.');
      onData(response.datos);
      document.body.classList.remove('eco-live-locked');
      error('');
    }catch(e){error(e&&e.message||String(e));}
    finally{btn.disabled=false;btn.textContent='Ingresar al centro';}
  });
  return true;
}
root.EcoAdminLive={active:active,start:start};
})(window);