/* Centro de Administración ECO — enlace delegado de uso único.
 * Interfaz preparada para el contrato adminGenerarEnlaceDelegadoECO.
 * No genera tokens ni almacena enlaces en el navegador: el servidor debe hacerlo.
 * Pendiente: implementar/verificar el contrato en el Servicio de Datos ECO.
 */
(function(){
 'use strict';
 const css=document.createElement('style');
 css.textContent=`
 .ecoDelegadoDialog{box-sizing:border-box;width:min(580px,94vw);max-height:90dvh;overflow:auto;border:1px solid #d2dde1;border-radius:16px;padding:22px;background:white;color:#20313b;font:15px/1.5 system-ui,-apple-system,sans-serif}
 .ecoDelegadoDialog::backdrop{background:rgba(13,26,36,.7)}
 .ecoDelegadoDialog h2{font-size:21px;margin:0 0 12px}
 .ecoDelegadoDialog .ecoDelegadoEstado{color:#385466;min-height:24px;overflow-wrap:anywhere}
 .ecoDelegadoDialog .ecoDelegadoError{color:#a52335;min-height:1em;overflow-wrap:anywhere}
 .ecoDelegadoDialog input{display:block;width:100%;box-sizing:border-box;border:1px solid #b7c8ce;border-radius:8px;padding:10px;margin:7px 0 12px;font:13px system-ui}
 .ecoDelegadoDialog .ecoDelegadoAcciones{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
 .ecoDelegadoDialog button,.ecoDelegadoDialog a{border:1px solid #acb9c1;border-radius:8px;padding:10px 13px;background:#fff;color:#233943;font-weight:700;cursor:pointer;text-decoration:none}
 .ecoDelegadoDialog button[data-crear]{background:#c42638;color:white;border-color:#c42638}
 .ecoDelegadoDialog button:disabled{opacity:.55;cursor:default}
 .ecoDelegadoDialog [hidden]{display:none!important}
 `;
 document.head.appendChild(css);
 let dialog=null,creating=false;
 const normalizar=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const activo=v=>v===true||['si','sí','true','1'].includes(String(v??'').trim().toLowerCase());
 function cerrar(){const d=dialog;dialog=null;creating=false;if(d){if(d.open)d.close();d.remove();}}
 function verificarUrl(cadena){
  const url=new URL(cadena);
  if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)||
     !/^[A-Za-z0-9_-]{16,256}$/.test(url.searchParams.get('delegado')||'')||url.searchParams.size!==1||url.hash)
   throw new Error('El servicio devolvió un enlace que no corresponde al formato oficial de validación delegada.');
  return url.href;
 }
 async function abrir(btn){
  if(dialog||document.body.classList.contains('eco-live-locked'))return;
  const catalogo=btn.dataset.catalogo,id=String(btn.dataset.id||'').trim();
  if(catalogo!=='especiales'||!id)return;
  const d=document.createElement('dialog');d.className='ecoDelegadoDialog';dialog=d;
  d.innerHTML='<h2>Validación por enlace delegado</h2><p data-actividad></p><p class="ecoDelegadoEstado" role="status" aria-live="polite">Comprobando actividad y permisos…</p><p class="ecoDelegadoError" role="alert"></p><div data-resultado hidden><label>Enlace de uso único<input type="text" readonly data-url aria-label="Enlace delegado"></label><p>Compártelo solo con la persona responsable. Una vez usado, no debe permitir otra validación.</p></div><div class="ecoDelegadoAcciones"><button type="button" data-cerrar>Cerrar</button><button type="button" data-crear hidden>Generar enlace delegado</button><button type="button" data-copiar hidden>Copiar enlace</button><a data-abrir hidden target="_blank" rel="noopener noreferrer">Abrir enlace</a></div>';
  const $=q=>d.querySelector(q),estado=s=>$('[role=status]').textContent=s,error=s=>{$('[role=alert]').textContent=s;};
  document.body.appendChild(d);d.showModal();
  d.addEventListener('close',()=>{if(dialog===d)dialog=null;d.remove();});
  $('[data-cerrar]').onclick=()=>{if(!creating)cerrar();};
  try{
   const r=await window.EcoAdminLive.request('adminLeerActividadECO',[{catalogo,id}]);
   if(dialog!==d||!d.open)return;
   const a=r?.datos||{};
   if(!r?.ok||String(a.idactividad||'').trim()!==id)throw new Error('La actividad no pudo verificarse en el catálogo oficial.');
   if(!activo(a.activo))throw new Error('Esta actividad está deshabilitada.');
   if(normalizar(a.tipodevalidacion)!=='validacionporenlacedelegado')throw new Error('La actividad ya no usa validación por enlace delegado.');
   $('[data-actividad]').textContent=String(a.actividad||id)+' · '+id;
   estado('Este enlace se genera para las nóminas asignadas y solo debe utilizarse una vez.');
   $('[data-crear]').hidden=false;
   const operacion=crypto.randomUUID();
   $('[data-crear]').onclick=async()=>{
    if(creating)return;creating=true;error('');estado('Solicitando enlace al servicio…');
    $('[data-crear]').disabled=true;$('[data-cerrar]').disabled=true;
    try{
     const respuesta=await window.EcoAdminLive.request('adminGenerarEnlaceDelegadoECO',[{catalogo,id,operacion}]);
     if(dialog!==d||!d.open)return;
     if(!respuesta?.ok||typeof respuesta.url!=='string')throw new Error('El servicio no confirmó la generación del enlace.');
     const url=verificarUrl(respuesta.url);
     $('[data-url]').value=url;$('[data-abrir]').href=url;
     $('[data-resultado]').hidden=false;$('[data-copiar]').hidden=false;$('[data-abrir]').hidden=false;
     $('[data-crear]').hidden=true;
     estado('Enlace generado para '+Number(respuesta.total||0)+' personas asignadas. Cópialo antes de cerrar.');
    }catch(ex){
     if(dialog===d){error(ex?.message||'No fue posible generar el enlace.');estado('No se confirmó la generación. No compartas enlaces anteriores sin verificar su estado.');}
    }finally{creating=false;if(dialog===d){$('[data-cerrar]').disabled=false;$('[data-crear]').disabled=false;}}
   };
   $('[data-copiar]').onclick=async()=>{
    const input=$('[data-url]');
    try{await navigator.clipboard.writeText(input.value);estado('Enlace copiado.');}
    catch(_){input.focus();input.select();estado('Selecciona y copia el enlace manualmente.');}
   };
  }catch(ex){if(dialog===d){error(ex?.message||'No se pudo consultar la actividad.');estado('No se generó ningún enlace.');}}
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-eco-enlace-delegado]');if(b)void abrir(b);});
 window.addEventListener('eco-admin-logout',cerrar);
})();
