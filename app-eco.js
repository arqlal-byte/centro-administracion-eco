/* UI del Centro de Administración ECO — PROTOTIPO SOLO LECTURA */
(function(){
'use strict';
const MOTOR=window.MotorECO;
const $=id=>document.getElementById(id);
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={datos:window.DatosDemoECO,modoDatos:'DATOS_SINTETICOS',diagnostico:null,persona:null,tab:'diagnostico',catalog:'desarrollo',error:null};
const titles={mensajes:['Mensajes','Publica mensajes por nómina o para todos y consulta su historial.'],diagnostico:['Motor de diagnóstico','Analiza las evaluaciones, compara criterios de asignación y visualiza las actividades correspondientes.'],catalogos:['Catálogos de actividades','Consulta la publicación de actividades del Editor Modelo Cultural y del programa familiar.'],criterios:['Reglas de asignación','Diferencia los criterios documentados y las nuevas alternativas, sin modificar registros.'],accesos:['Administración de accesos','RH autoriza nóminas, deshabilita accesos y restablece contraseñas de Mi Persona ECO.']};
function cfg(){return MOTOR.configurar({modo:$('modo').value,umbral:$('umbral').value,cantidadMenores:$('cantidadMenores').value,ciclo:$('ciclo').value});}
function isReal(){return state.modoDatos==='GOOGLE_SHEETS_LECTURA';}
function updateSource(){const tag=$('sourceTag');tag.className='viewtag'+(isReal()?'':' demo');tag.textContent=isReal()?'Google Sheets · gestión RH': 'Demostración · datos ficticios';
 const aviso=$('notice');aviso.innerHTML=isReal()
 ? '<strong>Consulta autenticada activa.</strong> Información oficial de Google Sheets. Confirmación de actividades por RH según su requisito. Catálogos y asignaciones se conservan.'
 : '<strong>Datos ficticios.</strong> Esta demostración utiliza registros sintéticos: no muestra resultados reales de colaboradores ni modifica Google Sheets. Las cifras difieren de las bases operativas.';
 if(isReal()) {
   const d=state.diagnostico||{};
   const fecha=d.consultadoEn?new Date(d.consultadoEn).toLocaleString('es-MX'):'';
   if(fecha) aviso.innerHTML+='<div style="margin-top:7px">Consulta realizada: <strong>'+e(fecha)+'</strong> · Ciclo publicado: '+e(d.ciclo||2026)+'</div>';
   const warnings=Array.isArray(d.advertencias)?d.advertencias:[];
   warnings.forEach(w=>{aviso.innerHTML+='<div style="margin-top:8px;color:#8b451c">'+e(w)+'</div>';});
 }
 if(state.error){aviso.innerHTML+='<div style="margin-top:7px;color:#a43d36">La conexión no pudo establecerse: '+e(state.error)+'. No se muestran datos reales.</div>';}}
function renderMetricas(){let s=MOTOR.resumen(state.datos,cfg());let values=[
 [s.personas,'Personas del catálogo','Catálogo de identidad'],
 [s.conResultados,'Con evaluación publicada','Ciclo '+cfg().ciclo],
 [s.conElementosBajos,'Con elementos inferiores a '+cfg().umbral,'Evaluación por elemento'],
 [s.desarrolloActivas,'Reforzamientos habilitados · '+cfg().ciclo,s.desarrolloInactivas+' deshabilitados; '+s.desarrolloFueraDeCiclo+' fuera del ciclo']];
 $('metrics').innerHTML=values.map(([n,label,hint])=>'<div class="metric"><div class="num">'+e(n)+'</div><div class="label">'+e(label)+'</div><div class="hint">'+e(hint)+'</div></div>').join('');}
function renderConfig(){const c=cfg();$('cantidadField').classList.toggle('hidden',c.modo!=='menores');$('umbralField').classList.toggle('hidden',c.modo==='menores');const text={
 elementos:['Por elemento · regla confirmada','Cada E1–E20 inferior a '+c.umbral+' genera asignación de todas sus actividades habilitadas para el ciclo '+c.ciclo+'. Sin límite de elementos ni de actividades por elemento.'],
 legado:['Código documental · comparación','Lógica anterior basada en competencias y hasta 5 prioridades (o 3 cuando no hay competencias bajas). Solo comparación; no es la regla aprobada.'],
 menores:['N elementos menores · simulación','Escenario futuro: '+c.cantidadMenores+' elementos de menor calificación. No está autorizado para asignaciones reales.']
 }[c.modo];$('modoInfo').innerHTML='<strong>'+e(text[0])+'</strong>'+e(text[1]);}
function personasVisibles(){const q=$('busqueda').value.toLocaleLowerCase('es-MX').trim();return (state.datos.personas||[]).filter(p=>!q||[p.nombre,p.nomina,p.area,p.puesto].some(v=>String(v||'').toLocaleLowerCase('es-MX').includes(q))).sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),'es'));}
function renderPersonas(){const a=personasVisibles();$('conteoPersonas').textContent=a.length+' personas';$('listHint').textContent='Seleccionar';const existing=new Set((state.datos.resultados||[]).filter(r=>Number(r.ciclo||2026)===cfg().ciclo).map(x=>String(x.nomina)));
 $('personasLista').innerHTML=a.length?a.map(p=>'<button class="person'+(state.persona===String(p.nomina)?' selected':'')+'" type="button" data-persona="'+e(p.nomina)+'" aria-pressed="'+(state.persona===String(p.nomina))+'"><span><span class="personName">'+e(p.nombre||'Sin nombre')+'</span><span class="personMeta">'+e(p.nomina)+' · '+e(p.area||'Sin área')+'</span></span><span aria-label="'+(existing.has(String(p.nomina))?'Con resultados':'Sin evaluación')+'" title="'+(existing.has(String(p.nomina))?'Con resultados':'Sin evaluación')+'" class="statusDot '+(existing.has(String(p.nomina))?'ok':'')+'"></span></button>').join(''):'<div class="empty">No se encontraron registros con ese filtro.</div>';
 for(const btn of $('personasLista').querySelectorAll('[data-persona]'))btn.addEventListener('click',()=>{state.persona=btn.getAttribute('data-persona');renderPersonas();renderDetalle();});}
function actividadHTML(arr, type){if(!arr.length)return '<div class="empty">'+(
 type==='familiares'?'No hay invitaciones familiares abiertas.':
 type==='especiales'?'No hay actividades especiales asignadas por RH y habilitadas.':
 'No hay actividades de reforzamiento habilitadas para estos elementos y ciclo.')+'</div>';
 return arr.map(a=>'<div class="actrow"><div><b>'+e(a.titulo)+'</b><small>'+e(a.id)+' · '+e(a.tipo||a.categoria)+(a.elemento?' · Elemento '+e(a.elemento):'')+(a.ciclo?' · '+e(a.ciclo):'')+(a.tipoValidacion?' · '+e(a.tipoValidacion):'')+'</small>'+((isReal()&&cfg().modo==='elementos'&&cfg().umbral===4&&cfg().ciclo===2026&&type!=='familiares'&&!a.completada)?'<button class="eco-confirmar-btn" type="button" data-eco-confirmar="'+e(a.id)+'" data-eco-nomina="'+e(state.persona)+'">Revisar y confirmar</button>':'')+'</div><span class="state '+(a.completada?'done':'')+'">'+(type==='familiares'?'Invitación abierta':a.completada?'Completada':'Pendiente')+'</span></div>').join('');}
function resumenComparativo(resultado){const modos=[['elementos','Por cada elemento bajo el umbral'],['legado','Código documental anterior'],['menores','N elementos menores']];const config=cfg();
 return '<div class="compare"><h4>Comparación de criterios · Solo simulación</h4><div class="tableWrap"><table><thead><tr><th>Escenario</th><th>Elementos elegidos</th></tr></thead><tbody>'+modos.map(([modo,label])=>{const d=MOTOR.diagnosticar(resultado,{...config,modo});return '<tr><td>'+e(label)+'</td><td>'+e(d.elementos.map(x=>'E'+x.elemento).join(', ')||'Ninguno')+'</td></tr>';}).join('')+'</tbody></table></div></div>';}
function renderDetalle(){const nomina=state.persona;const vista=MOTOR.vistaPersona(state.datos,nomina,cfg());if(!vista){$('detalleNombre').textContent='Selecciona un colaborador';$('detalleMeta').textContent='La información de diagnóstico aparecerá aquí.';$('detalle').innerHTML='<div class="empty">Selecciona un registro para consultar sus resultados.</div>';return;}
 const {persona,diagnostico:d,refuerzo,especiales,familiares}=vista;
 $('detalleNombre').textContent=persona.nombre||'Colaborador';$('detalleMeta').textContent=[persona.nomina,persona.puesto,persona.area].filter(Boolean).join(' · ');
 let barra='';for(const comp of d.competencias){const x=comp.calificacion,low=comp.bajoUmbral;const pct=x===null?0:Math.max(0,Math.min(100,(x/5)*100));barra+='<div class="baritem"><div><div class="rowbar"><span>'+e('C'+comp.indice+' · '+comp.nombre)+'</span></div><div class="track"><div class="fill '+(low?'low':'')+'" style="width:'+pct+'%"></div></div></div><span class="score '+(low?'low':'')+'">'+(x===null?'—':e(x.toFixed(2)))+'</span></div>';}
 const badges=d.elementos.map(x=>'<span class="tag red">E'+e(x.elemento)+' · '+e(x.calificacion.toFixed(2))+'</span>').join('');
 let body='';if(!d.tieneResultados){body='<div class="modepill warning"><strong>Sin evaluación publicada</strong>Esta persona no tiene resultados en la fuente del ciclo '+e(cfg().ciclo)+'. No se calculan reforzamientos; las actividades especiales manualmente asignadas siguen siendo independientes.</div>';}
 else{body='<div class="splitCards"><div class="smCard"><h4>Competencias evaluadas</h4><div class="bars">'+barra+'</div></div><div class="smCard"><h4>Elementos priorizados · '+e(d.elementos.length)+'</h4><div class="tags">'+(badges||'<span class="tiny">Sin elementos prioritarios</span>')+'</div><p class="note">'+e(d.observaciones.join(' '))+'</p></div></div>';}
 body+='<div class="splitCards"><div class="smCard"><h4>Actividades de reforzamiento · '+refuerzo.length+'</h4>'+actividadHTML(refuerzo,'refuerzo')+'</div><div class="smCard"><h4>Actividades especiales RH · '+especiales.length+'</h4>'+actividadHTML(especiales,'especiales')+'</div></div>';
 body+='<div class="smCard" style="margin-top:15px"><h4>Invitaciones abiertas para la familia · '+familiares.length+'</h4><p class="note">Son para todos los colaboradores y sus familias; no dependen de evaluación ni de una asignación por RH.</p>'+actividadHTML(familiares,'familiares')+'</div>';
 if(d.tieneResultados)body+=resumenComparativo((state.datos.resultados||[]).find(r=>String(r.nomina)===String(nomina)&&Number(r.ciclo||2026)===cfg().ciclo));
 body+='<p class="note">De '+e(vista.posiblesRefuerzo)+' actividades de reforzamiento identificadas para los elementos evaluados y el ciclo seleccionado, '+e(vista.refuerzoNoVisible)+' están deshabilitadas. No se sustituyen por otras.</p>';
 body+='<p class="note">Las especiales las asigna RH de manera individual, a grupos seleccionados o a todos, mediante registros por nómina. Las familiares son invitaciones abiertas para todos. Las actividades deshabilitadas no aparecen. Cambiar una simulación no guarda registros; una confirmación requiere revisar su requisito y guardarla expresamente.</p>';
 $('detalle').innerHTML=body;
}
// Conteos informativos: regla confirmada del ciclo 2026, nunca filtros de simulación.
function indicadoresActividadECO_(datos){
 const criterio={modo:'elementos',umbral:4,ciclo:2026};
 const personas=new Set((datos.personas||[]).map(p=>String(p.nomina??'').trim()).filter(Boolean));
 const vistos=new Set(),porElemento=new Map(),porEspecial=new Map(),porCumplimiento=new Map();
 for(const r of (datos.resultados||[])){
  const n=String(r.nomina??'').trim();
  if(!n||!personas.has(n)||vistos.has(n)||Number(r.ciclo||2026)!==2026)continue;
  vistos.add(n);
  for(const el of MOTOR.diagnosticar(r,criterio).elementos){
   if(!porElemento.has(el.elemento))porElemento.set(el.elemento,new Set());
   porElemento.get(el.elemento).add(n);
  }
 }
 for(const a of (datos.asignaciones||[])){
  if(!MOTOR.esSi(a.asignada))continue;
  const id=String(a.id??'').trim(),n=String(a.nomina??'').trim();
  if(!id||!n)continue;
  if(!porEspecial.has(id))porEspecial.set(id,new Set());
  porEspecial.get(id).add(n);
 }
 // En registros repetidos prevalece la última fila, como en Mi Persona ECO.
 for(const x of (datos.cumplimientos||[])){
  const id=String(x.id??'').trim(),n=String(x.nomina??'').trim();
  if(!id||!n)continue;
  if(!porCumplimiento.has(id))porCumplimiento.set(id,new Map());
  porCumplimiento.get(id).set(n,MOTOR.esSi(x.completada));
 }
 return {porElemento,porEspecial,porCumplimiento};
}
function resumenCumplimientoActividadECO_(a,categoria,habilitada,indice,registros){
 const id=String(a.id??'').trim(),operativa=categoria==='especiales'||MOTOR.actividadesParaCiclo(a,{ciclo:2026});
 if(categoria==='familiares')return '<p class="note">Invitación abierta a las familias · sin asignación ni porcentaje de cumplimiento individual.</p>';
 if(!habilitada||!operativa)return '<p class="note">'+registros+' registros de cumplimiento en la hoja · '+(!habilitada?'Actividad deshabilitada: indicadores de asignación no aplicables.':'Recurso o ciclo fuera de la asignación automática de 2026.')+'</p>';
 const asignados=categoria==='desarrollo'?indice.porElemento.get(String(a.elemento??'').trim()):indice.porEspecial.get(id);
 const total=asignados?.size||0,completadas=indice.porCumplimiento.get(id);
 let cumplidos=0;
 if(asignados)for(const nomina of asignados)if(completadas?.get(nomina)===true)cumplidos++;
 const porcentaje=total?Math.round(cumplidos*100/total):null;
 const etiqueta=categoria==='desarrollo'?'Personas aplicables (E&lt;4)':'Personas asignadas por RH';
 return '<div class="ecoActivityStats" aria-label="Indicadores de cumplimiento del ciclo 2026">'+
  '<span><strong>'+total+'</strong> '+etiqueta+'</span>'+
  '<span><strong>'+cumplidos+'</strong> cumplidos</span>'+
  '<span><strong>'+(porcentaje===null?'—':porcentaje+'%')+'</strong> de avance</span>'+
  '</div>'+(porcentaje===null?'<p class="ecoActivityStatsHint">Sin personas aplicables: porcentaje no calculable.</p>':
  '<div class="ecoActivityProgress" role="progressbar" aria-label="Avance de cumplimiento" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+porcentaje+'"><span style="width:'+porcentaje+'%"></span></div>')+
  '<p class="ecoActivityStatsHint">Ciclo operativo 2026 · solo cumplimientos de personas aplicables'+(categoria==='desarrollo'?' conforme a la regla confirmada.':'.')+'</p>';
}
function metodoQrCatalogoECO_(v){
 const n=String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 return n==='qrnomina'||n==='qrenlace';
}
function renderCatalog(){
 const c=cfg(),all=state.datos[state.catalog]||[],development=state.catalog==='desarrollo';
 const elements=(state.datos.elementosCatalogo||[]).length?state.datos.elementosCatalogo:Array.from(new Map((state.datos.desarrollo||[]).map(a=>[String(a.elemento),{numero:String(a.elemento),competencia:a.competencia,objetivo:a.comportamiento||'Comportamiento '+a.elemento}])).values());
 const comps=Array.from(new Set(elements.map(x=>x.competencia).filter(Boolean)));
 if(!comps.includes(state.catalogCompetencia))state.catalogCompetencia=comps[0]||'';
 const group=elements.filter(x=>x.competencia===state.catalogCompetencia).sort((a,b)=>Number(a.numero)-Number(b.numero));
 if(!group.some(x=>x.numero===state.catalogElemento))state.catalogElemento=group[0]?.numero||'';
 const current=group.find(x=>x.numero===state.catalogElemento);
 $('catalogSelectors').hidden=!development;
 $('catalogCompetencia').innerHTML=comps.map(x=>'<option '+(x===state.catalogCompetencia?'selected':'')+'>'+e(x)+'</option>').join('');
 $('catalogComportamiento').innerHTML=group.map(x=>'<option value="'+e(x.numero)+'" '+(x.numero===state.catalogElemento?'selected':'')+'>E'+e(x.numero)+' · '+e(x.objetivo)+'</option>').join('');
 $('catalogComportamientoTitulo').textContent=development?(current?.objetivo||'Selecciona un comportamiento'):state.catalog==='especiales'?'Actividades especiales RH':'Actividades familiares';
 const arr=development?all.filter(a=>String(a.elemento)===state.catalogElemento&&(a.ciclo===null||a.ciclo===undefined||Number(a.ciclo)===c.ciclo)):all;
 const active=arr.filter(a=>MOTOR.habilitada(a.activo)).length;
 const indices=indicadoresActividadECO_(state.datos);
 // Evita revisar todos los cumplimientos por cada actividad del catálogo.
 const cumplimientoPorId=new Map();
 for(const x of (state.datos.cumplimientos||[])){
  if(!MOTOR.habilitada(x.completada))continue;
  const id=String(x.id);
  cumplimientoPorId.set(id,(cumplimientoPorId.get(id)||0)+1);
 }
 $('catalogSummary').innerHTML=(isReal()?'<button class="ecoCatalogPrimary" type="button" data-eco-nueva data-catalogo="'+e(state.catalog)+'" '+(development?'data-elemento="'+e(state.catalogElemento)+'"':'')+'>Nueva actividad</button>':'')+'<p>'+arr.length+' actividades · '+active+' habilitadas · '+(arr.length-active)+' deshabilitadas'+(development?' · Ciclo '+c.ciclo:'')+'</p>';
 $('catalogCards').innerHTML=arr.length?arr.map(a=>{
 const enabled=MOTOR.habilitada(a.activo),attrs=' data-catalogo="'+e(state.catalog)+'" data-id="'+e(a.id)+'"';
 const done=cumplimientoPorId.get(String(a.id))||0;
 const status=enabled?'Habilitada':'Deshabilitada';
 return '<article class="ecoActivityCard '+(enabled?'':'ecoActivityOff')+'"><div class="ecoActivityHead"><div><div class="eyebrow">'+e(a.tipo|| (state.catalog==='familiares'?'Invitación familiar':'Actividad'))+'</div><h4>'+e(a.titulo)+'</h4><small>'+e(a.id)+(development?' · '+e(a.origen||'MANUAL'):'')+'</small></div><span class="state '+(enabled?'':'off')+'">'+status+'</span></div>'+(a.imagenPortada?'<img class="ecoActivityCover" src="'+e(a.imagenPortada)+'" alt="Portada de la actividad" loading="lazy">':'')+resumenCumplimientoActividadECO_(a,state.catalog,enabled,indices,done)+'<details><summary>Ver detalles</summary><p style="white-space:pre-wrap">'+e(a.descripcion||'Sin descripción registrada.')+'</p><p>Validación: '+e(a.tipoValidacion||'Sin validación configurada')+'</p>'+(a.fecha?'<p>Fecha límite: '+e(a.fecha)+'</p>':'')+(/^https:\/\//i.test(a.url||'')?'<a href="'+e(a.url)+'" target="_blank" rel="noopener noreferrer">Abrir recurso</a>':'')+'</details>'+(isReal()?'<div class="ecoActivityActions">'+(state.catalog==='especiales'?'<button type="button" class="eco-especial-btn" data-eco-asignar-especial="'+e(a.id)+'">Asignar líderes</button><button type="button" class="eco-especial-btn" data-eco-asistencia-especial="'+e(a.id)+'">Registrar asistencia</button>':'')+(enabled&&metodoQrCatalogoECO_(a.tipoValidacion)?'<button type="button" data-eco-validacion-qr'+attrs+'>QR y enlace</button>':'')+'<button type="button" data-eco-editar'+attrs+'>Editar actividad</button><button type="button" data-eco-disponibilidad'+attrs+' data-titulo="'+e(a.titulo)+'" data-activo="'+enabled+'">'+(enabled?'Deshabilitar':'Habilitar')+'</button><button type="button" class="ecoActivityDelete" data-eco-eliminar'+attrs+'>Eliminar actividad</button></div>':'')+'</article>';
 }).join(''):'<div class="empty">No hay actividades para este comportamiento y ciclo. Puedes crear una con Nueva actividad.</div>';
 for(const b of document.querySelectorAll('[data-catalog]'))b.classList.toggle('active',b.getAttribute('data-catalog')===state.catalog);
}
function tab(name){
 if(name!=='diagnostico'&&busquedaTimer!==null){clearTimeout(busquedaTimer);busquedaTimer=null;}
 state.tab=name;document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.getAttribute('data-tab')===name;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 for(const id of ['diagnostico','catalogos','criterios','accesos','mensajes'])$('view-'+id).classList.toggle('hidden',name!==id);
 $('pageTitle').textContent=titles[name][0];$('pageIntro').textContent=titles[name][1];
 if(name==='diagnostico'){renderMetricas();renderPersonas();renderDetalle();}
 if(name==='mensajes'&&window.EcoMensajes)window.EcoMensajes.load();
 if(name==='catalogos')renderCatalog();
 if(name==='accesos'&&window.EcoAccesos)window.EcoAccesos.load();
}
let busquedaTimer=null;
function renderAll(){
 if(busquedaTimer!==null){clearTimeout(busquedaTimer);busquedaTimer=null;}
 updateSource();renderConfig();
 // Al cambiar de pestaña se renderiza únicamente la vista que se abre.
 tab(state.tab);
}
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>tab(b.getAttribute('data-tab')));
for(const b of document.querySelectorAll('[data-catalog]'))b.addEventListener('click',()=>{state.catalog=b.getAttribute('data-catalog');renderCatalog();});
for(const id of ['modo','umbral','cantidadMenores','ciclo'])$(id).addEventListener('input',()=>{
 renderConfig();
 if(state.tab==='diagnostico'){renderMetricas();renderPersonas();renderDetalle();}
 else if(state.tab==='catalogos')renderCatalog();
});
$('busqueda').addEventListener('input',()=>{
 if(busquedaTimer!==null)clearTimeout(busquedaTimer);
 busquedaTimer=setTimeout(()=>{
  busquedaTimer=null;
  if(state.tab==='diagnostico')renderPersonas();
 },160);
});
$('catalogCompetencia').addEventListener('change',()=>{state.catalogCompetencia=$('catalogCompetencia').value;state.catalogElemento='';renderCatalog();});
$('catalogComportamiento').addEventListener('change',()=>{state.catalogElemento=$('catalogComportamiento').value;renderCatalog();});
window.addEventListener('eco-confirmacion-guardada',async()=>{try{const r=await window.EcoAdminLive.request('adminConsultarDatosECO',[]);state.datos=r.datos;state.diagnostico=r.diagnostico;if(window.EcoMensajes)window.EcoMensajes.setCatalogos(state.datos);renderAll();}catch(err){state.error=err.message;updateSource();}});
async function init(){
 if (window.EcoAdminLive && window.EcoAdminLive.active()) {
   window.EcoAdminLive.start(function(datos,diagnostico){
     if(!datos || !Array.isArray(datos.personas)) throw new Error('Respuesta administrativa incompleta.');
     state.datos=datos;state.diagnostico=diagnostico;state.error=null;state.modoDatos='GOOGLE_SHEETS_LECTURA';
     state.persona=datos.personas[0]?.nomina||null;if(window.EcoMensajes)window.EcoMensajes.setCatalogos(datos);
     renderAll();
   },function(){
     state.datos={personas:[],resultados:[],desarrollo:[],especiales:[],asignaciones:[],cumplimientos:[],familiares:[]};
     state.persona=null;state.diagnostico=null;state.modoDatos='GOOGLE_SHEETS_LECTURA';
     renderAll();
   });
   return;
 }
 state.persona=state.datos.personas[0]?.nomina||null;
 renderAll();
}

init();
})();

