/* UI del Centro de Administración ECO — PROTOTIPO SOLO LECTURA */
(function(){
'use strict';
const MOTOR=window.MotorECO;
const $=id=>document.getElementById(id);
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={datos:window.DatosDemoECO,modoDatos:'DATOS_SINTETICOS',diagnostico:null,persona:null,tab:'diagnostico',catalog:'desarrollo',error:null};
const titles={diagnostico:['Motor de diagnóstico','Analiza las evaluaciones, compara criterios de asignación y visualiza las actividades correspondientes.'],catalogos:['Catálogos de actividades','Consulta la publicación de actividades del Editor Modelo Cultural y del programa familiar.'],criterios:['Reglas de asignación','Diferencia los criterios documentados y las nuevas alternativas, sin modificar registros.'],accesos:['Administración de accesos','RH autoriza nóminas, deshabilita accesos y restablece contraseñas de Mi Persona ECO.']};
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
function renderCatalog(){const cfgActual=cfg();const arr=state.datos[state.catalog]||[];
 const enCiclo = state.catalog==='desarrollo'?arr.filter(a=>MOTOR.actividadesParaCiclo(a,cfgActual)):arr;
 const habilitadas=enCiclo.filter(a=>MOTOR.habilitada(a.activo)).length,deshabilitadas=enCiclo.length-habilitadas;
 const adicionales=state.catalog==='desarrollo'?arr.length-enCiclo.length:0;
 const msg={desarrollo:'Catálogo de reforzamiento del ciclo '+cfgActual.ciclo+'. Se incluyen exclusivamente las actividades de ese ciclo; en los registros antiguos sin campo Ciclo, se reconocen inicialmente las 20 actividades MANUAL E1–E20 de 2026. Los registros auxiliares se conservan, pero no se asignan.',especiales:'Actividades especiales: RH elige una persona, un grupo puntual o todos. En los datos actuales esa selección queda registrada por nómina, no mediante un permiso general implícito.',familiares:'Invitaciones familiares abiertas para todos, desde su catálogo independiente, sin asignación personal ni evaluación.'}[state.catalog];
 $('catalogSummary').innerHTML='<strong>'+enCiclo.length+' registradas para esta vista · '+habilitadas+' habilitadas · '+deshabilitadas+' deshabilitadas.'+(adicionales?' · '+adicionales+' fuera de ciclo o catálogo inicial.':'')+'</strong> '+e(msg);
 $('catalogBody').innerHTML=enCiclo.length?enCiclo.map(a=>'<tr><td>'+e(a.id)+'</td><td>'+e(a.titulo)+'</td><td>'+e(a.tipo||'—')+(a.elemento?' · E'+e(a.elemento):'')+(a.ciclo?' · '+e(a.ciclo):'')+'</td><td><span class="state '+(MOTOR.habilitada(a.activo)?'':'off')+'">'+(MOTOR.habilitada(a.activo)?'Habilitada':'Deshabilitada')+'</span></td></tr>').join(''):'<tr><td colspan="4">No hay actividades de este catálogo para el ciclo seleccionado.</td></tr>';
 for(const b of document.querySelectorAll('[data-catalog]'))b.classList.toggle('active',b.getAttribute('data-catalog')===state.catalog);
}
function tab(name){state.tab=name;document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.getAttribute('data-tab')===name;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 for(const id of ['diagnostico','catalogos','criterios','accesos'])$('view-'+id).classList.toggle('hidden',name!==id);
 $('pageTitle').textContent=titles[name][0];$('pageIntro').textContent=titles[name][1];if(name==='catalogos')renderCatalog();if(name==='accesos'&&window.EcoAccesos)window.EcoAccesos.load();}
function renderAll(){updateSource();renderConfig();renderMetricas();renderPersonas();renderDetalle();renderCatalog();tab(state.tab);}
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>tab(b.getAttribute('data-tab')));
for(const b of document.querySelectorAll('[data-catalog]'))b.addEventListener('click',()=>{state.catalog=b.getAttribute('data-catalog');renderCatalog();});
for(const id of ['modo','umbral','cantidadMenores','ciclo'])$(id).addEventListener('input',()=>{renderConfig();renderMetricas();renderDetalle();renderCatalog();});
$('busqueda').addEventListener('input',renderPersonas);
window.addEventListener('eco-confirmacion-guardada',async()=>{try{const r=await window.EcoAdminLive.request('adminConsultarDatosECO',[]);state.datos=r.datos;state.diagnostico=r.diagnostico;renderAll();}catch(err){state.error=err.message;updateSource();}});
async function init(){
 if (window.EcoAdminLive && window.EcoAdminLive.active()) {
   window.EcoAdminLive.start(function(datos,diagnostico){
     if(!datos || !Array.isArray(datos.personas)) throw new Error('Respuesta administrativa incompleta.');
     state.datos=datos;state.diagnostico=diagnostico;state.error=null;state.modoDatos='GOOGLE_SHEETS_LECTURA';
     state.persona=datos.personas[0]?.nomina||null;
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
