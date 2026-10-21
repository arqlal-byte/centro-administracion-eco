/* Centro de Administración ECO — controles de actividades especiales según Editor Cultural ECO.
   Prototipo para pruebas, no requiere editar el proyecto Apps Script del Editor. */
(function(){
'use strict';
const css=document.createElement('style');
css.textContent=[
'.eco-especial-btn{border:1px solid #b72c3e;border-radius:8px;padding:10px 13px;background:#fff;color:#99283a;font-weight:800;cursor:pointer}',
'.eco-especial-btn:disabled{opacity:.5}',
'.eco-especial-dialog{box-sizing:border-box;width:min(930px,96vw);max-width:96vw;max-height:92dvh;border:1px solid #d1d9dd;border-radius:18px;padding:22px;color:#21313b;background:#fff;font:16px system-ui}',
'.eco-especial-dialog::backdrop{background:rgba(14,27,36,.68)}',
'.eco-especial-dialog h2{margin:0 0 10px;font-size:22px}',
'.eco-especial-dialog .eco-especial-intro{color:#485f6a;line-height:1.45}',
'.eco-especial-dialog .eco-especial-tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:16px 0}',
'.eco-especial-dialog .eco-especial-tools label{display:flex;gap:8px;align-items:center}',
'.eco-especial-dialog .eco-especial-tools select,.eco-especial-dialog .eco-especial-tools input[type=search]{padding:9px;border:1px solid #b8c4ca;border-radius:8px;font:inherit;max-width:100%;min-height:43px}',
'.eco-especial-dialog .eco-especial-rows{overflow:auto;max-height:53dvh;border:1px solid #e0e5e9;border-radius:10px}',
'.eco-especial-dialog table{border-collapse:collapse;width:100%;font-size:14px;white-space:nowrap}',
'.eco-especial-dialog th,.eco-especial-dialog td{padding:10px;text-align:left;border-bottom:1px solid #e6ebee}',
'.eco-especial-dialog th{position:sticky;top:0;background:#ecf0f2;z-index:1}',
'.eco-especial-dialog .eco-persona-nombre{font-weight:800;white-space:normal;min-width:170px}',
'.eco-especial-dialog .eco-persona-datos{display:block;color:#667783;font-size:12px;font-weight:500}',
'.eco-especial-dialog .eco-especial-rows input[type=checkbox]{width:21px;height:21px;accent-color:#ab2435}',
'.eco-especial-dialog .eco-especial-actions{display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end;margin:18px 0 0}',
'.eco-especial-dialog .eco-especial-actions button{padding:12px 16px;border-radius:9px;border:1px solid #aab6be;background:white;cursor:pointer;font-weight:800}',
'.eco-especial-dialog .eco-especial-actions button[data-guardar]{background:#b62135;color:#fff;border-color:#b62135}',
'.eco-especial-dialog .eco-especial-actions button:disabled{opacity:.6}',
'.eco-especial-dialog .eco-especial-status{min-height:1.3em;margin:12px 0;color:#485f6a;overflow-wrap:anywhere}',
'.eco-especial-dialog .eco-especial-status.error{color:#a72c3b}',
'@media(max-width:650px){.eco-especial-dialog{padding:15px}.eco-especial-dialog .eco-especial-tools{display:block}.eco-especial-dialog .eco-especial-tools label{margin:8px 0}.eco-especial-dialog .eco-especial-actions button{flex:1}}'
].join('\n');
document.head.appendChild(css);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let modal=null,active=null,busy=false;
function status(s,error){const el=modal?.querySelector('.eco-especial-status');if(el){el.textContent=String(s||'');el.classList.toggle('error',!!error);}}
function cerrar(){if(busy)return;if(modal){modal.close();modal.remove();}modal=null;active=null;}
function tipoVisible(x){
 if(active.tipo!=='asignacion')return true;
 const mode=modal.querySelector('[name="modo"]').value;
 if(mode!=='gap')return true;
 return !!(x.elegible||x.originalAsignado);
}
function visibles(){
 const q=modal.querySelector('[name="filtro"]').value.trim().toLocaleLowerCase('es-MX');
 return (active.personas||[]).filter(x=>tipoVisible(x)&&(!q||[x.nombre,x.nomina,x.puesto,x.area].some(y=>String(y||'').toLocaleLowerCase('es-MX').includes(q))));
}
function resumen(){
 const todos=active.personas||[],seleccionados=todos.filter(x=>x.seleccionado).length;
 return active.tipo==='asignacion'?seleccionados+' líderes seleccionados · '+visibles().length+' mostrados':
  seleccionados+' de '+todos.length+' personas registradas como asistentes';
}
function pintar(){
 if(!modal||!active)return;
 const rows=visibles(),area=modal.querySelector('.eco-especial-rows');
 const asignar=active.tipo==='asignacion';
 const names=['Generador de Impacto','Mejora Continua','Desarrollador de Talento','Líder de Negocio','Aliado Estratégico'];
 area.innerHTML='<table><thead><tr><th>'+(asignar?'Asignar':'Asistió')+'</th><th>Persona</th>'+
 (asignar?names.map(n=>'<th>'+esc(n)+'</th>').join('')+'<th>Mínima</th>':'<th>Estado</th>')+
 '</tr></thead><tbody>'+rows.map(p=>{
  const marks=asignar?(p.competencias||[]).map(v=>'<td>'+(v==null?'—':Number(v).toFixed(2))+'</td>').join('')+
   '<td>'+(p.minima==null?'—':Number(p.minima).toFixed(2))+'</td>':
   '<td>'+(p.seleccionado?'Asistió ✓':'Pendiente')+'</td>';
  return '<tr><td><input data-nomina="'+esc(p.nomina)+'" type="checkbox" '+(p.seleccionado?'checked':'')+' aria-label="'+(asignar?'Asignar':'Registrar asistencia')+' a '+esc(p.nombre)+'"></td>'+
  '<td class="eco-persona-nombre">'+esc(p.nombre||'Sin nombre')+'<span class="eco-persona-datos">'+esc(p.puesto||'')+' · '+esc(p.area||'')+' · '+esc(p.nomina)+'</span></td>'+marks+'</tr>';
 }).join('')+'</tbody></table>';
 if(!rows.length)area.innerHTML='<p style="padding:20px">No hay personas que coincidan con este criterio.</p>';
 const summary=modal.querySelector('.eco-especial-resumen');if(summary)summary.textContent=resumen();
 const all=modal.querySelector('[name="todos"]');
 if(all){all.checked=!!rows.length&&rows.every(x=>x.seleccionado);all.indeterminate=rows.some(x=>x.seleccionado)&&!all.checked;}
}
async function guardar(){
 if(!active||busy)return;
 const s=active,version=s.version,nominas=s.personas.filter(x=>x.seleccionado).map(x=>x.nomina);
 const metodo=s.tipo==='asignacion'?'adminGuardarAsignacionEspecialECO':'adminGuardarAsistenciaEspecialECO';
 busy=true;const buttons=modal.querySelectorAll('button');buttons.forEach(x=>x.disabled=true);status('Guardando cambios en la fuente oficial…',false);
 try{
  const r=await window.EcoAdminLive.request(metodo,[{idActividad:s.id,version,nominas}]);
  if(!r||!r.ok)throw new Error(r?.mensaje||'No fue posible confirmar el guardado.');
  status(r.mensaje||(s.tipo==='asignacion'?'Asignaciones guardadas.':'Asistencia guardada.'),false);
  modal.querySelector('[data-guardar]').hidden=true;
  modal.querySelector('.eco-especial-tools').hidden=true;
  modal.querySelector('.eco-especial-rows').hidden=true;
  active=null;
  window.dispatchEvent(new Event('eco-confirmacion-guardada'));
 }catch(e){status((e?.message||String(e))+' No se alteró la selección mostrada. Si hubo un error de red, consulta de nuevo antes de repetir.',true);}
 finally{busy=false;buttons.forEach(x=>x.disabled=false);}
}
async function abrir(tipo,id){
 if(modal)return;
 modal=document.createElement('dialog');modal.className='eco-especial-dialog';
 const asignar=tipo==='asignacion';
 modal.innerHTML='<h2>'+(asignar?'Asignar líderes':'Registrar asistencia')+'</h2>'+
 '<p class="eco-especial-intro">'+(asignar?'Selecciona a quién corresponde esta actividad especial. Puedes retirar una asignación desmarcando su casilla.':'Marca a quienes asistieron y desmarca a quienes no participaron. Solo se muestran personas con esta actividad asignada.')+'</p>'+
 '<div class="eco-especial-tools">'+(asignar?'<label>Criterio <select name="modo"><option value="gap">Alguna competencia menor a 4.00</option><option value="all">Todos los líderes</option><option value="manual">Selección manual</option></select></label>':'')+
 '<label>Buscar <input type="search" name="filtro" placeholder="Nómina o nombre" autocomplete="off"></label>'+
 (asignar?'<label><input type="checkbox" name="todos"> Seleccionar todos los mostrados</label>':'')+'</div>'+
 '<p class="eco-especial-resumen"></p><div class="eco-especial-rows"></div>'+
 '<p class="eco-especial-status" role="status" aria-live="polite">Consultando información oficial…</p>'+
 '<div class="eco-especial-actions"><button type="button" data-cerrar>Cerrar</button><button type="button" data-guardar hidden>Guardar '+(asignar?'asignaciones':'asistencia')+'</button></div>';
 document.body.appendChild(modal);modal.showModal();
 modal.querySelector('[data-cerrar]').onclick=cerrar;
 modal.addEventListener('cancel',e=>{if(busy)e.preventDefault();else {modal.remove();modal=null;active=null;}});
 modal.querySelector('[name="filtro"]').addEventListener('input',pintar);
 if(asignar){
  modal.querySelector('[name="modo"]').addEventListener('change',pintar);
  modal.querySelector('[name="todos"]').addEventListener('change',e=>{visibles().forEach(x=>x.seleccionado=e.target.checked);pintar();});
 }
 modal.querySelector('.eco-especial-rows').addEventListener('change',e=>{
  if(!e.target.matches('input[data-nomina]')||!active)return;
  const x=active.personas.find(x=>String(x.nomina)===e.target.dataset.nomina);
  if(x){x.seleccionado=e.target.checked;pintar();}
 });
 modal.querySelector('[data-guardar]').onclick=guardar;
 try{
  const method=asignar?'adminCandidatosActividadEspecialECO':'adminObtenerAsistenciaEspecialECO';
  const r=await window.EcoAdminLive.request(method,[id]);
  if(!modal||!modal.open)return;
  if(!r||!r.ok||!Array.isArray(asignar?r.lideres:r.personas)||!r.version)throw new Error('El servicio no devolvió una lista verificable.');
  const personas=(asignar?r.lideres:r.personas).map(p=>({...p,seleccionado:asignar?!!p.asignado:!!p.asistio,originalAsignado:!!p.asignado}));
  active={tipo,id,version:r.version,personas};
  modal.querySelector('.eco-especial-intro').textContent=r.titulo+' · '+modal.querySelector('.eco-especial-intro').textContent;
  modal.querySelector('[data-guardar]').hidden=false;status('',false);pintar();
 }catch(e){status(e?.message||String(e),true);}
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-eco-asignar-especial],[data-eco-asistencia-especial]');
 if(!btn||btn.disabled||modal)return;
 const id=btn.dataset.ecoAsignarEspecial||btn.dataset.ecoAsistenciaEspecial||'';
 if(!id)return;
 abrir(btn.hasAttribute('data-eco-asignar-especial')?'asignacion':'asistencia',id);
});
})();