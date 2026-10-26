/** ECO · Solicitudes RH / gestión excepcional de cuentas.
 * La autorización y la validación de identidad se ejecutan en Apps Script.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
let busy=false,view='pendientes';
const escapeNotNeeded=true; // La interfaz solo escribe datos dinámicos con textContent.
function status(msg,error){
 const el=$('ecoAccEstado');if(!el)return;
 el.textContent=String(msg||'');el.style.color=error?'#a52d24':'#345567';
}
function busyState(on){busy=on;document.querySelectorAll('#view-accesos button').forEach(b=>b.disabled=on);}
function cell(tr,value){const td=document.createElement('td');td.textContent=String(value==null?'':value);tr.appendChild(td);return td;}
function action(label,type,handler){
 const b=document.createElement('button');b.type='button';b.className='ecoAccBtn ecoAcc-'+type;
 b.textContent=label;b.addEventListener('click',handler);return b;
}
function mark(value,type){
 const s=document.createElement('span');s.className='ecoAccStatus ecoAcc-'+type;s.textContent=value;return s;
}
function reset(){
 const rows=$('ecoAccFilas');if(rows)rows.replaceChildren();
 const history=$('ecoAccBitacora');if(history)history.replaceChildren();
 status('Inicia sesión como RH para revisar solicitudes.');
}
async function load(){
 if(busy)return;
 busyState(true);status('Consultando solicitudes y accesos…');
 try{
  const r=await root.EcoAdminLive.request('adminListarAccesosECO',[]);
  if(!r||!r.ok||!Array.isArray(r.usuarios))throw Error('Respuesta de accesos incompleta.');
  const pending=r.usuarios.filter(u=>u.pendiente);
  const other=r.usuarios.filter(u=>!u.pendiente);
  const list=view==='pendientes'?pending:other;
  const rows=$('ecoAccFilas');rows.replaceChildren();
  const badge=$('ecoAccPendientes');
  if(badge){badge.textContent=String(pending.length);badge.classList.toggle('ecoAccWarn',pending.length>0);}
  $('ecoAccTabPendientes').setAttribute('aria-pressed',String(view==='pendientes'));
  $('ecoAccTabCuentas').setAttribute('aria-pressed',String(view==='cuentas'));
  const caption=$('ecoAccVistaAyuda');
  if(caption)caption.textContent=view==='pendientes'
   ?'Autoriza únicamente cuando Recursos Humanos haya verificado la identidad.'
   :'Administración excepcional: cuentas activas, bloqueadas o sin contraseña.';
  if(!list.length){
   const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;
   td.textContent=view==='pendientes'?'No hay solicitudes pendientes.':'No hay cuentas registradas en esta categoría.';
   tr.appendChild(td);rows.appendChild(tr);
  }
  list.sort((a,b)=>String(a.nomina).localeCompare(String(b.nomina),'es',{numeric:true}));
  for(const u of list){
   const tr=document.createElement('tr');
   cell(tr,u.nomina);cell(tr,u.nombre||'—');
   const td=document.createElement('td');
   td.appendChild(u.pendiente?mark('Pendiente de RH','warning'):u.bloqueado?mark('Bloqueada','danger'):u.habilitado?mark('Activa','success'):mark(u.conContrasena?'Inactiva':'Sin registro','neutral'));
   tr.appendChild(td);
   const actions=document.createElement('td');
   if(u.pendiente){
    actions.appendChild(action('✓ Autorizar','success',()=>operate('habilitar',u.nomina,true)));
    actions.appendChild(action('✕ Rechazar','danger',()=>operate('rechazar',u.nomina,true)));
   }else{
    const details=document.createElement('details');details.className='ecoAccManage';
    const summary=document.createElement('summary');summary.textContent='Administrar cuenta';details.appendChild(summary);
    const panel=document.createElement('div');panel.className='ecoAccManageActions';
    if(u.habilitado)panel.appendChild(action('Deshabilitar acceso','danger',()=>operate('deshabilitar',u.nomina)));
    else if(u.conContrasena)panel.appendChild(action('Habilitar acceso','success',()=>operate('habilitar',u.nomina)));
    if(u.bloqueado)panel.appendChild(action('Desbloquear','warning',()=>operate('desbloquear',u.nomina)));
    if(u.conContrasena)panel.appendChild(action('Restablecer contraseña','neutral',()=>operate('restablecer',u.nomina)));
    if(!panel.children.length){const p=document.createElement('span');p.textContent='Aún no crea contraseña.';panel.appendChild(p);}
    details.appendChild(panel);actions.appendChild(details);
   }
   tr.appendChild(actions);rows.appendChild(tr);
  }
  const history=$('ecoAccBitacora');history.replaceChildren();
  for(const e of (Array.isArray(r.bitacora)?r.bitacora:[])){
   const li=document.createElement('li');li.textContent=[e.fecha,e.accion,'Nómina '+e.nomina,'RH '+e.rh].filter(Boolean).join(' · ');history.appendChild(li);
  }
  status('Solicitudes por revisar: '+pending.length+'.');
 }catch(e){status((e&&e.message)||'No fue posible consultar solicitudes.',true);}
 finally{busyState(false);}
}
async function operate(kind,n,pending){
 if(busy)return;
 const commands={habilitar:['adminHabilitarNominaECO','habilitar'],rechazar:['adminRechazarSolicitudAccesoECO','rechazar'],
 deshabilitar:['adminDeshabilitarNominaECO','deshabilitar'],desbloquear:['adminDesbloquearAccesoECO','desbloquear'],
 restablecer:['adminRestablecerAccesoECO','restablecer la contraseña de']};
 const choice=commands[kind];if(!choice)return;
 const message=pending&&kind==='habilitar'
 ?'¿RH verificó la identidad de la nómina '+n+'? Autorizar permitirá consultar su información.'
 :'¿Confirmas '+choice[1]+' la nómina '+n+'?';
 if(!root.confirm(message))return;
 busyState(true);status('Procesando la solicitud…');
 try{
  const r=await root.EcoAdminLive.request(choice[0],[n]);
  if(!r||!r.ok)throw Error((r&&r.mensaje)||'No fue posible realizar la operación.');
  busyState(false);await load();
  status((r.mensaje||'Operación guardada.')+' · Nómina '+n);
 }catch(e){status((e&&e.message)||'No se pudo guardar el cambio.',true);}
 finally{busyState(false);}
}
function start(){
 const t=$('ecoAccTabPendientes'),c=$('ecoAccTabCuentas'),update=$('ecoAccActualizar');
 if(!t||!c||!update)return;
 t.addEventListener('click',()=>{view='pendientes';load();});
 c.addEventListener('click',()=>{view='cuentas';load();});
 update.addEventListener('click',load);
 root.addEventListener('eco-admin-logout',reset);
 root.addEventListener('eco-admin-login',()=>{view='pendientes';if(!$('view-accesos').classList.contains('hidden'))load();});
}
root.EcoAccesos={load,reset};start();
})(window);
