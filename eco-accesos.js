/** Administración de accesos individuales a Mi Persona ECO · exclusivo RH.
 * Sin credenciales ni permisos en el navegador: las decisiones se ejecutan en Apps Script.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
let busy=false,loaded=false;
function status(msg,error){
  const el=$('ecoAccEstado');if(!el)return;
  el.textContent=String(msg||'');
  el.style.color=error?'#a52d24':'#345567';
}
function setBusy(on){
  busy=on;
  for(const b of document.querySelectorAll('#view-accesos button')) b.disabled=on;
}
function textCell(tr,value){
  const td=document.createElement('td');
  td.textContent=String(value==null?'':value);tr.appendChild(td);return td;
}
function btn(label,action){
  const b=document.createElement('button');b.type='button';b.textContent=label;
  b.className='ecoAccBtn';b.addEventListener('click',action);return b;
}
function reset(){
  loaded=false;const t=$('ecoAccFilas');if(t)t.replaceChildren();
  const h=$('ecoAccBitacora');if(h)h.replaceChildren();
  const n=$('ecoAccNomina');if(n)n.value='';
  status('Inicia sesión como RH para administrar accesos.');
}
async function load(){
  if(busy)return;
  setBusy(true);status('Consultando accesos autorizados…');
  try{
    const r=await root.EcoAdminLive.request('adminListarAccesosECO',[]);
    if(!r||!r.ok||!Array.isArray(r.usuarios))throw new Error('Respuesta de accesos incompleta.');
    loaded=true;
    const rows=$('ecoAccFilas');rows.replaceChildren();
    if(!r.usuarios.length){
      const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;
      td.textContent='Todavía no hay nóminas habilitadas o registradas.';tr.appendChild(td);rows.appendChild(tr);
    }
    for(const u of r.usuarios){
      const tr=document.createElement('tr');
      textCell(tr,u.nomina);textCell(tr,u.nombre||'—');
      textCell(tr,u.bloqueado?'Bloqueada · 3 errores':u.habilitado?'Habilitada':'Deshabilitada');
      textCell(tr,u.conContrasena?'Contraseña creada':'Pendiente de primer acceso');
      const actions=document.createElement('td');
      actions.appendChild(btn(u.habilitado?'Deshabilitar':'Habilitar',()=>operate(u.habilitado?'deshabilitar':'habilitar',u.nomina)));
      if(u.bloqueado)actions.appendChild(btn('Desbloquear',()=>operate('desbloquear',u.nomina)));
      actions.appendChild(btn('Restablecer contraseña',()=>operate('restablecer',u.nomina)));
      tr.appendChild(actions);rows.appendChild(tr);
    }
    const history=$('ecoAccBitacora');history.replaceChildren();
    for(const e of (Array.isArray(r.bitacora)?r.bitacora:[])){
      const li=document.createElement('li');li.textContent=[e.fecha,e.accion,'Nómina '+e.nomina,'RH '+e.rh].filter(Boolean).join(' · ');
      history.appendChild(li);
    }
    status('Accesos consultados: '+r.usuarios.length+'. Los cambios se aplican al guardar.');
  }catch(e){
    status((e&&e.message)||'No se pudieron consultar los accesos. Verifica que el Servicio de Datos tenga habilitado este módulo.',true);
  }finally{setBusy(false);}
}
async function operate(action,provided){
  if(busy)return;
  const n=String(provided||$('ecoAccNomina').value||'').trim();
  if(!/^\d{1,12}$/.test(n)){status('Introduce una nómina válida.',true);return;}
  const options={
    habilitar:['adminHabilitarNominaECO','habilitar'],
    deshabilitar:['adminDeshabilitarNominaECO','deshabilitar'],
    desbloquear:['adminDesbloquearAccesoECO','desbloquear'],
    restablecer:['adminRestablecerAccesoECO','restablecer la contraseña de']
  };
  const choice=options[action];if(!choice)return;
  if(action!=='habilitar'&&!root.confirm('¿Confirmas '+choice[1]+' la nómina '+n+'?'))return;
  setBusy(true);status('Procesando nómina '+n+'…');
  try{
    const result=await root.EcoAdminLive.request(choice[0],[n]);
    if(!result||!result.ok)throw new Error((result&&result.mensaje)||'La operación no fue confirmada.');
    // Liberar el bloqueo antes de actualizar el listado.
    setBusy(false);
    await load();
    status((result.mensaje||'Operación guardada.')+' Nómina: '+n+'.');
  }catch(e){
    status((e&&e.message)||'No se pudo guardar el cambio.',true);
  }finally{setBusy(false);}
}
function start(){
  const f=$('ecoAccFormulario');
  if(!f)return;
  f.addEventListener('submit',e=>{e.preventDefault();operate('habilitar');});
  $('ecoAccActualizar').addEventListener('click',load);
  root.addEventListener('eco-admin-logout',reset);
  root.addEventListener('eco-admin-login',()=>{loaded=false;if(!$('view-accesos').classList.contains('hidden'))load();});
}
root.EcoAccesos={load,reset};
start();
})(window);
