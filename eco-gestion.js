/* Gestión RH: el servidor valida sesión, fuente y cambios concurrentes. */
(function(){
'use strict';
let busy=false;
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function modal(title,body){
 const d=document.createElement('dialog');d.style.cssText='width:min(520px,90vw);border:1px solid #ccd1d5;border-radius:14px;padding:24px;font:16px system-ui';
 d.innerHTML='<form><h2>'+escapeHTML(title)+'</h2>'+body+'<p role="status" class="gestion-status"></p><button type="button" class="cancel">Cancelar</button> <button type="submit">Confirmar</button></form>';
 d.querySelector('.cancel').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());document.body.appendChild(d);d.showModal();return d;
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-eco-mensaje],[data-eco-disponibilidad]');if(!b||busy)return;
 const message=b.hasAttribute('data-eco-mensaje'),nomina=b.dataset.nomina;
 const d=modal(message?'Enviar mensaje':'Cambiar disponibilidad',message?'<p>Para '+escapeHTML(b.dataset.nombre)+' · Nómina '+escapeHTML(nomina)+'</p><label>Mensaje<textarea required maxlength="5000" rows="7" style="display:block;width:100%;box-sizing:border-box;font:inherit" name="mensaje"></textarea></label>':'<p>'+escapeHTML(b.dataset.titulo)+'</p><p>Se '+(b.dataset.activo==='true'?'deshabilitará':'habilitará')+' para todos los colaboradores. Su historial se conserva.</p>');
 const op=crypto.randomUUID();
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const buttons=d.querySelectorAll('button');buttons.forEach(x=>x.disabled=true);d.querySelector('.gestion-status').textContent='Guardando…';
 try{
 const payload=message?{nomina,mensaje:d.querySelector('textarea').value.trim(),operacion:op}:{catalogo:b.dataset.catalogo,id:b.dataset.id,anterior:b.dataset.activo==='true',activo:b.dataset.activo!=='true'};
 const r=await window.EcoAdminLive.request(message?'adminEnviarMensajeECO':'adminCambiarDisponibilidadECO',[payload]);if(!r||!r.ok)throw new Error('El servicio no confirmó la operación.');
 d.querySelector('.gestion-status').textContent=message?'Mensaje publicado.':'Disponibilidad guardada.';
 d.querySelector('button[type="submit"]').hidden=true;d.querySelector('.cancel').textContent='Cerrar';
 if(message)d.querySelector('textarea').readOnly=true;else window.dispatchEvent(new Event('eco-confirmacion-guardada'));
 }catch(err){d.querySelector('.gestion-status').textContent=err.message;}finally{busy=false;buttons.forEach(x=>x.disabled=false);}
 };
});
})();
