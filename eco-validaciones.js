/* Centro de Administración ECO — enlaces y QR de validación, preparados en rama.
 * Sólo lee token existente mediante la sesión autenticada de RH.
 * QR generado localmente: no transmite el token a terceros.
 * Se limita al requisito oficial "QR + nómina" (sin escrituras).
 */
(function(){
'use strict';
const PERSONA_URL='https://arqlal-byte.github.io/mi-persona-eco/';
const css=document.createElement('style');
css.textContent=`
.ecoQrDialog{box-sizing:border-box;width:min(560px,94vw);max-height:92dvh;overflow:auto;border:1px solid #d7e0e5;border-radius:16px;padding:23px;background:#fff;color:#192b37;font:15px/1.5 system-ui,-apple-system,sans-serif}
.ecoQrDialog::backdrop{background:rgba(15,31,42,.68)}
.ecoQrDialog h2{font-size:21px;margin:0 0 8px}
.ecoQrDialog .ecoQrMeta{font-size:13px;color:#546a75;overflow-wrap:anywhere}
.ecoQrDialog .ecoQrImage{display:flex;justify-content:center;margin:20px auto 12px}
.ecoQrDialog canvas{display:block;max-width:100%;height:auto;border:1px solid #dce6e9;border-radius:10px}
.ecoQrDialog label{display:block;font-weight:650;font-size:13px;margin-top:15px}
.ecoQrDialog input{box-sizing:border-box;width:100%;padding:10px;margin-top:6px;border-radius:8px;border:1px solid #c7d1d7;font:13px system-ui}
.ecoQrDialog .ecoQrActions{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.ecoQrDialog .ecoQrActions button,.ecoQrDialog .ecoQrActions a{padding:10px 12px;border:1px solid #bfccd3;border-radius:8px;background:white;color:#263e4d;text-decoration:none;font:650 13px system-ui;cursor:pointer}
.ecoQrDialog .ecoQrActions a{background:#c32638;border-color:#c32638;color:#fff}
.ecoQrDialog .ecoQrStatus{font-size:13px;min-height:20px;color:#465d69;overflow-wrap:anywhere}
.ecoQrDialog .ecoQrWarning{font-size:12px;color:#734b23;background:#fff7e8;padding:10px;border-radius:8px}
.ecoQrDialog [hidden]{display:none!important}
`;
document.head.appendChild(css);
let dialog=null;
function limpiar(){
 const d=dialog;dialog=null;
 if(d){if(d.open)d.close();d.remove();}
}
function dibujarQR(canvas,url){
 if(typeof window.qrcode!=='function')throw new Error('No se cargó el generador QR local.');
 const qr=window.qrcode(0,'M');qr.addData(url);qr.make();
 const total=qr.getModuleCount(),paso=7,borde=4;
 canvas.width=(total+borde*2)*paso;canvas.height=canvas.width;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('El navegador no permite generar el QR.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#000';
 for(let y=0;y<total;y++)for(let x=0;x<total;x++)
  if(qr.isDark(y,x))ctx.fillRect((x+borde)*paso,(y+borde)*paso,paso,paso);
 return total;
}
function prepararURL(token){
 if(!/^[A-Za-z0-9_-]{16,256}$/.test(token))throw new Error('El token de esta actividad no tiene el formato oficial.');
 const url=new URL(PERSONA_URL);url.searchParams.set('validar',token);return url.href;
}
function habilitada(v){return v===true||['si','sí','true','1'].includes(String(v??'').trim().toLocaleLowerCase('es-MX'));}
function metodoQR(v){return ['qrnomina','qrenlace'].includes(String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''));}
async function abrir(boton){
 if(dialog||document.body.classList.contains('eco-live-locked'))return;
 const catalogo=boton.dataset.catalogo,id=boton.dataset.id;
 if(!['desarrollo','especiales'].includes(catalogo)||!id)return;
 const d=document.createElement('dialog');d.className='ecoQrDialog';dialog=d;
 d.innerHTML='<h2>QR y enlace de validación</h2><p class="ecoQrMeta" data-eco-qr-titulo></p><p class="ecoQrStatus" role="status" aria-live="polite" data-eco-qr-estado>Consultando el requisito oficial…</p><div class="ecoQrImage" data-eco-qr-imagen></div><div data-eco-qr-detalles hidden><label>Enlace de validación<input type="text" readonly data-eco-qr-url aria-label="Enlace de validación"></label><p class="ecoQrWarning">Comparte este código únicamente con los responsables de la actividad. Con QR y nómina se puede registrar un cumplimiento sin iniciar sesión.</p></div><div class="ecoQrActions"><button type="button" data-eco-qr-cerrar>Cerrar</button><button type="button" data-eco-qr-copiar hidden>Copiar enlace</button><button type="button" data-eco-qr-descargar hidden>Guardar QR PNG</button><a data-eco-qr-abrir hidden target="_blank" rel="noopener noreferrer">Abrir enlace</a></div>';
 document.body.appendChild(d);d.showModal();
 d.addEventListener('close',()=>{if(dialog===d)dialog=null;d.remove();});
 const $=q=>d.querySelector(q),setStatus=s=>{$('[data-eco-qr-estado]').textContent=s;};
 $('[data-eco-qr-cerrar]').addEventListener('click',()=>{if(dialog===d)limpiar();});
 try{
  const r=await window.EcoAdminLive.request('adminLeerActividadECO',[{catalogo,id}]);
  if(dialog!==d||!d.open)return;
  if(!r||!r.ok||!r.datos)throw new Error('El Servicio de Datos no devolvió información verificable.');
  const data=r.datos;
  if(String(data.idactividad||'').trim()!==id)throw new Error('El Servicio de Datos devolvió otra actividad.');
  if(!habilitada(data.activo))throw new Error('La actividad está deshabilitada. No se puede compartir su QR.');
  if(!metodoQR(data.tipodevalidacion))throw new Error('Esta actividad no utiliza el requisito QR + nómina.');
  const token=String(data.tokendevalidacion||'').trim();
  if(!token)throw new Error('Esta actividad aún no tiene token. Abre Editar actividad y guarda la configuración QR + nómina para generarlo desde el servicio.');
  const url=prepararURL(token);
  const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Código QR para validar la actividad');
  dibujarQR(canvas,url);
  $('[data-eco-qr-titulo]').textContent=String(data.actividad||id)+' · '+id;
  $('[data-eco-qr-imagen]').replaceChildren(canvas);
  const campo=$('[data-eco-qr-url]');campo.value=url;
  const abrir=$('[data-eco-qr-abrir]');abrir.href=url;
  $('[data-eco-qr-detalles]').hidden=false;
  $('[data-eco-qr-copiar]').hidden=false;
  $('[data-eco-qr-descargar]').hidden=false;
  abrir.hidden=false;
  $('[data-eco-qr-copiar]').addEventListener('click',async()=>{
   try{if(!navigator.clipboard?.writeText)throw new Error('Sin acceso al portapapeles');
    await navigator.clipboard.writeText(campo.value);if(dialog===d)setStatus('Enlace copiado.');}
   catch(_){if(dialog===d){campo.focus();campo.select();setStatus('Selecciona el enlace y cópialo manualmente.');}}
  });
  $('[data-eco-qr-descargar]').addEventListener('click',()=>{
   if(dialog!==d)return;
   try{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='ECO_QR_'+id.replace(/[^A-Za-z0-9_-]/g,'_')+'.png';d.appendChild(a);a.click();a.remove();setStatus('QR preparado para guardar como imagen PNG.');}
   catch(_){setStatus('No se pudo guardar la imagen. Puedes copiar el enlace.');}
  });
  setStatus('Código generado localmente a partir del token existente en el catálogo oficial.');
 }catch(err){if(dialog===d&&d.open)setStatus(err&&err.message?err.message:'No fue posible preparar el QR.');}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-eco-validacion-qr]');if(b)abrir(b);
});
window.addEventListener('eco-admin-logout',limpiar);
})();
