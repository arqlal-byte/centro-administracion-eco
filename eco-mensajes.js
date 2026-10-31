/* ECO — Mensajería RH por nómina, toda la organización, área y actividad especial.
 * Los destinatarios siempre se verifican en Apps Script antes de publicar.
 * Sólo lectura de metadatos en el navegador; nunca se envían nóminas de grupos.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const enabled=v=>v===true||['si','sí','true','1','x'].includes(String(v??'').trim().toLowerCase());
let people=[],specials=[],items=[],busy=false,sequence=0,previewSeq=0,previewInfo=null,op=crypto.randomUUID();
let v2Listo=false;
const status=s=>{$('ecoMsgEstado').textContent=String(s||'');};
function v2Campos(){
 const p=$('ecoMsgPrioridad'),c=$('ecoMsgConfirmacion'),info=$('ecoMsgV2Estado');
 if(p){p.disabled=!v2Listo;if(!v2Listo)p.checked=false;}
 if(c){c.disabled=!v2Listo;if(!v2Listo)c.checked=false;}
 if(info)info.textContent=v2Listo?'Funciones especiales disponibles. Las confirmaciones se registran por nómina.':
 'Para habilitar prioridades y confirmaciones falta actualizar Servicio de Datos ECO y sus hojas.';
}
async function detectarV2(){
 v2Listo=false;v2Campos();
 if(!window.EcoAdminLive?.active?.())return;
 try{
  const r=await window.EcoAdminLive.request('eco2CapacidadesMensajeriaRH',[]);
  v2Listo=!!(r?.ok&&r.listo===true&&Number(r.version)>=2);
 }catch(_){v2Listo=false;}
 v2Campos();
 if(v2Listo)history();
}
const previewStatus=s=>{$('ecoMsgPrevia').textContent=String(s||'');};
const selectOptions=(id,rows,placeholder,make)=>{const el=$(id),keep=el.value;el.innerHTML='<option value="">'+esc(placeholder)+'</option>'+rows.map(make).join('');if(rows.some(x=>String(x.value)===keep))el.value=keep;};
function options(){
 const unique=new Map();
 for(const p of people){const n=String(p.nomina||'').trim();if(n&&!unique.has(n))unique.set(n,p);}
 const all=[...unique.values()].sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),'es'));
 selectOptions('ecoMsgNomina',all.map(x=>({value:String(x.nomina),nombre:String(x.nombre||'Sin nombre')})),'Seleccionar colaborador',x=>'<option value="'+esc(x.value)+'">'+esc(x.value)+' · '+esc(x.nombre)+'</option>');
 const f=$('ecoMsgFiltro'),save=f.value;
 f.innerHTML='<option value="">Todos los mensajes</option>'+all.map(p=>'<option value="'+esc(p.nomina)+'">'+esc(p.nomina)+' · '+esc(p.nombre)+'</option>').join('');
 f.value=all.some(p=>String(p.nomina)===save)?save:'';
 const areas=new Map();
 for(const p of all){const v=String(p.area||'').trim(),k=norm(v);if(!k)continue;
  if(!areas.has(k))areas.set(k,{value:v,count:0});areas.get(k).count++;
 }
 selectOptions('ecoMsgArea',[...areas.values()].sort((a,b)=>a.value.localeCompare(b.value,'es')),'Seleccionar área',x=>'<option value="'+esc(x.value)+'">'+esc(x.value)+' ('+x.count+')</option>');
 const uniqueActivities=new Map();
 for(const a of specials){
  const id=String(a.id||'').trim();if(!id||!enabled(a.activo)||uniqueActivities.has(id))continue;
  uniqueActivities.set(id,{value:id,titulo:String(a.titulo||id)});
 }
 selectOptions('ecoMsgActividad',[...uniqueActivities.values()].sort((a,b)=>a.titulo.localeCompare(b.titulo,'es')),'Seleccionar actividad especial',x=>'<option value="'+esc(x.value)+'">'+esc(x.titulo)+'</option>');
}
function selection(){
 const tipo=$('ecoMsgTipo').value;
 return {tipo,nomina:tipo==='nomina'?$('ecoMsgNomina').value:'',area:tipo==='area'?$('ecoMsgArea').value:'',idActividad:tipo==='actividad'?$('ecoMsgActividad').value:''};
}
function validSelection(p){return p.tipo==='todos'||p.tipo==='nomina'&&!!p.nomina||p.tipo==='area'&&!!p.area||p.tipo==='actividad'&&!!p.idActividad;}
function updateFields(){
 const tipo=$('ecoMsgTipo').value;
 for(const [k,v] of [['ecoMsgNominaCampo','nomina'],['ecoMsgAreaCampo','area'],['ecoMsgActividadCampo','actividad']]){
  const shown=tipo===v;
  $(k).hidden=!shown;
 }
 for(const [k,v] of [['ecoMsgNomina','nomina'],['ecoMsgArea','area'],['ecoMsgActividad','actividad']])$(k).required=tipo===v;
}
function clearPreview(){
 previewSeq++;previewInfo=null;$('ecoMsgEnviar').disabled=true;
 previewStatus('Selecciona destinatarios para consultar la cantidad oficial antes de publicar.');
}
async function preview(){
 const seq=++previewSeq,p=selection(),key=JSON.stringify(p);
 previewInfo=null;$('ecoMsgEnviar').disabled=true;
 if(!validSelection(p)){previewStatus('Selecciona un destinatario.');return;}
 if(!window.EcoAdminLive?.active?.()){previewStatus('Inicia sesión como RH para consultar destinatarios.');return;}
 previewStatus('Verificando destinatarios en las fuentes oficiales…');
 try{
  const r=await window.EcoAdminLive.request('adminResumenDestinatariosMensajeECO',[p]);
  if(seq!==previewSeq||key!==JSON.stringify(selection()))return;
  if(!r?.ok||!Number.isInteger(r.total)||typeof r.version!=='string'||r.version.length<32)throw new Error('Respuesta de audiencia incompleta.');
  if(r.total<1){previewStatus('No hay colaboradores destinatarios para esta selección.');return;}
  previewInfo={key,total:r.total,version:r.version,descripcion:String(r.descripcion||'Destinatarios seleccionados')};
  previewStatus(previewInfo.descripcion+' · '+r.total+' '+(r.total===1?'destinatario':'destinatarios')+' (verificado en Google Sheets).');
  $('ecoMsgEnviar').disabled=false;
 }catch(e){if(seq===previewSeq)previewStatus((e?.message||String(e))+' No se publicará ningún mensaje.');}
}
async function history(){
 const seq=++sequence;status('Consultando mensajes…');
 try{const endpoint=v2Listo?'eco2HistorialMensajesRH':'adminHistorialMensajesECO';
  const r=await window.EcoAdminLive.request(endpoint,[{nomina:$('ecoMsgFiltro').value}]);
  if(seq!==sequence)return;if(!r?.ok)throw new Error('Respuesta incompleta.');
  items=r.mensajes||[];render();status(items.length+' mensajes encontrados.');
 }catch(e){if(seq===sequence)status(e.message);}
}
function audienceLabel(m){
 const tipo=norm(m.tipo);
 if(tipo==='todos')return 'Para todos';
 if(tipo==='nomina')return 'Nómina '+m.nomina+' · '+m.nombre;
 if(tipo==='area')return 'Área: '+(m.area||'sin referencia');
 if(tipo==='actividad'||tipo==='actividadespecial')return 'Actividad especial: '+(m.actividad||m.idActividad||'sin referencia');
 return m.tipo;
}
function render(){
 const show=$('ecoMsgVerRetirados').checked;
 const arr=items.filter(x=>show||norm(x.estado)==='publicado');
 $('ecoMsgLista').innerHTML=arr.length?arr.map(m=>'<article class="ruleCard"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><strong>'+esc(audienceLabel(m))+'</strong><span>'+esc(m.estado)+'</span></div><p style="margin-top:8px">'+esc(m.fecha)+(Number.isFinite(Number(m.total))&&Number(m.total)>0?' · '+esc(m.total)+' destinatarios':'')+'</p><p style="white-space:pre-wrap;margin:12px 0;color:#192b37">'+esc(m.mensaje)+'</p>'+(v2Listo&&m.prioridad?'<strong style="display:inline-block;margin-right:10px">Prioritario</strong>':'')+(v2Listo&&m.requiereConfirmacion?'<strong>Requiere «Entendido»</strong> <button type="button" data-confirm-id="'+esc(m.id)+'">Consultar confirmaciones</button>':'')+(['publicado','retirado'].includes(norm(m.estado))?'<button type="button" data-msg-id="'+esc(m.id)+'">'+(norm(m.estado)==='publicado'?'Eliminar mensaje':'Restaurar mensaje')+'</button>':'')+'</article>').join(''):'<p>No hay mensajes para este filtro.</p>';
}
$('ecoMsgTipo').onchange=()=>{updateFields();clearPreview();preview();};
for(const id of ['ecoMsgNomina','ecoMsgArea','ecoMsgActividad'])$(id).onchange=()=>{clearPreview();preview();};
$('ecoMsgFormulario').onsubmit=async e=>{
 e.preventDefault();if(busy)return;
 const p=selection(),key=JSON.stringify(p),m=$('ecoMsgTexto').value.trim(),pre=previewInfo;
 const prioridad=v2Listo&&!!$('ecoMsgPrioridad')?.checked;
 const requiereConfirmacion=v2Listo&&!!$('ecoMsgConfirmacion')?.checked;
 if(!m||!pre||key!==pre.key){previewStatus('Actualiza la vista previa antes de publicar.');return;}
 if(!confirm('¿Publicar este mensaje para '+pre.total+' '+(pre.total===1?'destinatario':'destinatarios')+'?\n'+pre.descripcion))return;
 busy=true;$('ecoMsgEnviar').disabled=true;status('Publicando mensaje…');
 try{
  const endpoint=v2Listo?'eco2PublicarMensajeECO':'adminPublicarMensajeECO';
  const r=await window.EcoAdminLive.request(endpoint,[{...p,mensaje:m,operacion:op,audienciaVersion:pre.version,prioridad,requiereConfirmacion}]);
  if(!r?.ok)throw new Error('El servicio no confirmó el envío.');
  op=crypto.randomUUID();$('ecoMsgTexto').value='';
  if($('ecoMsgPrioridad'))$('ecoMsgPrioridad').checked=false;
  if($('ecoMsgConfirmacion'))$('ecoMsgConfirmacion').checked=false;
  clearPreview();await history();
  status('Mensaje publicado para '+(r.total??pre.total)+' destinatarios.');await preview();
 }catch(e){
  status(e?.message||String(e));
  // El mismo ID de operación se mantiene para reintentos idempotentes.
  if(previewInfo===pre)$('ecoMsgEnviar').disabled=false;
 }finally{busy=false;}
};
$('ecoMsgLista').onclick=async e=>{
 const consultar=e.target.closest('[data-confirm-id]');
 if(consultar){
  if(busy||!v2Listo)return;
  busy=true;consultar.disabled=true;
  try{
   const r=await window.EcoAdminLive.request('eco2ConfirmacionesMensajeRH',[consultar.dataset.confirmId]);
   if(!r?.ok)throw Error('No se pudo consultar las confirmaciones.');
   const filas=(r.confirmados||[]).map(x=>x.nomina+' · '+(x.nombre||'Sin nombre')+' · '+x.fecha);
   window.alert('Confirmaciones registradas: '+filas.length+
    '\\nDestinatarios originales: '+(r.totalDestinatariosOriginal??'—')+
    '\\n\\n'+(filas.join('\\n')||'Aún no hay confirmaciones.')+
    '\\n\\nEl total original puede diferir de la audiencia actual.');
  }catch(err){status(err.message||String(err));}
  finally{busy=false;consultar.disabled=false;}
  return;
 }
 const b=e.target.closest('[data-msg-id]');if(!b||busy)return;
 const m=items.find(x=>x.id===b.dataset.msgId);if(!m)return;
 const restore=norm(m.estado)==='retirado';
 if(!confirm((restore?'Restaurar':'Retirar')+' este mensaje'+(norm(m.tipo)==='todos'?' para TODOS los colaboradores':' de sus destinatarios')+'? '+(restore?'Volverá a estar visible.':'Se conservará en el historial y podrás restaurarlo.')))return;
 busy=true;b.disabled=true;
 try{const r=await window.EcoAdminLive.request('adminEstadoMensajeECO',[{id:m.id,version:m.version,estado:restore?'Publicado':'Retirado'}]);
  if(!r?.ok)throw new Error('No se confirmó el cambio.');await history();
 }catch(err){status(err.message);}finally{busy=false;b.disabled=false;}
};
$('ecoMsgFiltro').onchange=history;$('ecoMsgActualizar').onclick=history;$('ecoMsgVerRetirados').onchange=render;
window.addEventListener('eco-admin-login',()=>{options();updateFields();clearPreview();preview();detectarV2();});
window.addEventListener('eco-admin-logout',()=>{v2Listo=false;v2Campos();++sequence;++previewSeq;people=[];specials=[];items=[];options();$('ecoMsgTexto').value='';$('ecoMsgLista').textContent='';status('Inicia sesión para consultar mensajes.');op=crypto.randomUUID();clearPreview();});
window.EcoMensajes={
 setPeople:p=>{people=p||[];options();},
 setCatalogos:d=>{people=d?.personas||[];specials=d?.especiales||[];options();updateFields();clearPreview();preview();},
 load:history
};
updateFields();clearPreview();v2Campos();
})();
