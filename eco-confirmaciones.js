/* Centro ECO v0.5: confirmación explícita de RH. */
(function(){
'use strict';
const style=document.createElement('style');style.textContent=`
.eco-confirmar-btn{margin-top:9px;border:1px solid #b52a3c;background:#fff;color:#a51f30;border-radius:8px;padding:8px 12px;font-weight:650}
#ecoConfirmDialog{border:1px solid #d6dfe4;border-radius:16px;max-width:640px;width:calc(100% - 24px);max-height:92dvh;padding:24px;color:#192b37;box-sizing:border-box}
#ecoConfirmDialog::backdrop{background:#15212dbb}#ecoConfirmDialog h2{margin-top:0;font-size:23px}#ecoConfirmDialog p{line-height:1.5}
#ecoConfirmDialog label{display:block;margin-top:16px;font-weight:650}#ecoConfirmDialog input:not([type=checkbox]),#ecoConfirmDialog textarea{box-sizing:border-box;width:100%;font:inherit;padding:11px;border:1px solid #c5d0d8;border-radius:8px;margin-top:6px}#ecoConfirmDialog textarea{min-height:100px}
#ecoConfirmDialog .eco-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;flex-wrap:wrap}#ecoConfirmDialog button{font:inherit;padding:11px 15px;border-radius:8px;border:1px solid #aebbc4;background:white;cursor:pointer}#ecoConfirmDialog button[type=submit]{background:#b62135;color:white;border:0}
#ecoConfirmDialog .eco-error{color:#a22228;white-space:pre-wrap}#ecoConfirmDialog .eco-meta{color:#637582;font-size:14px}#ecoConfirmDialog video{max-width:100%;border-radius:10px}#ecoConfirmDialog input[type=checkbox]{width:19px;height:19px;vertical-align:middle}#ecoConfirmDialog [hidden]{display:none!important}
`;document.head.appendChild(style);
const dialog=document.createElement('dialog');dialog.id='ecoConfirmDialog';
dialog.innerHTML=`<form id="ecoConfirmForm"><h2>Confirmar actividad</h2><p id="ecoConfirmIdentity" class="eco-meta"></p><p id="ecoConfirmTitle"></p><p id="ecoConfirmMethod"></p><div id="ecoConfirmFields"></div><p id="ecoConfirmStatus" role="status" aria-live="polite"></p><p id="ecoConfirmError" class="eco-error" role="alert"></p><div class="eco-actions"><button type="button" id="ecoConfirmCancel">Cerrar</button><button type="submit" id="ecoConfirmSave" hidden>Guardar y confirmar actividad</button></div></form>`;
document.body.appendChild(dialog);
const $=id=>document.getElementById(id);let activity=null,operation=null,busy=false,stream=null,scanTimer=null;
const labels={simple:'Confirmación de realización',pregunta:'Pregunta / reflexión',foto:'Evidencia fotográfica',documento:'Evidencia documental',qr:'QR o enlace de validación',clave:'Clave de validación',rh:'Acreditación administrativa de RH',jefe:'Confirmación del jefe directo',automatica:'Validación automática desde otra aplicación',desconocida:'Método no reconocido'};
function text(id,value){$(id).textContent=String(value||'');}
function field(label,id,type,required,max){const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement(type==='textarea'?'textarea':'input');input.id=id;if(type!=='textarea')input.type=type;input.required=!!required;if(max)input.maxLength=max;wrap.appendChild(input);$('ecoConfirmFields').appendChild(wrap);return input;}
function stopCamera(){if(scanTimer)clearInterval(scanTimer);scanTimer=null;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;const v=$('ecoQrVideo');if(v){v.srcObject=null;v.hidden=true;}}
function close(){if(busy)return;stopCamera();activity=null;operation=null;$('ecoConfirmFields').replaceChildren();dialog.close();}
$('ecoConfirmCancel').addEventListener('click',close);
dialog.addEventListener('cancel',ev=>{if(busy)ev.preventDefault();else close();});
new MutationObserver(()=>{if(document.body.classList.contains('eco-live-locked')){stopCamera();activity=null;$('ecoConfirmFields').replaceChildren();dialog.close();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
async function open(n,id){
 if(busy)return;activity=null;operation=crypto.randomUUID();$('ecoConfirmFields').replaceChildren();text('ecoConfirmError','');text('ecoConfirmStatus','Consultando el requisito oficial…');text('ecoConfirmIdentity','');text('ecoConfirmTitle','');text('ecoConfirmMethod','');$('ecoConfirmSave').hidden=true;dialog.showModal();
 try{
  const a=await window.EcoAdminLive.request('adminObtenerRequisitoECO',[n,id]);if(!dialog.open)return;activity=a;
  text('ecoConfirmIdentity',a.nombre+' · Nómina '+a.nomina+' · Ciclo '+a.ciclo);text('ecoConfirmTitle',a.titulo);text('ecoConfirmMethod','Requisito: '+(labels[a.metodo]||a.tipoValidacion));text('ecoConfirmStatus','');
  if(a.completada){text('ecoConfirmStatus','Esta actividad ya está completada. No se duplicará el cumplimiento.');return;}
  if(!a.habilitada){text('ecoConfirmError',a.metodo==='automatica'?'El cumplimiento se recibe de la aplicación correspondiente. No se acredita manualmente aquí.':'Debe corregirse el método en el catálogo antes de confirmar.');return;}
  if(a.metodo==='pregunta'){const p=document.createElement('p');p.textContent=a.pregunta;$('ecoConfirmFields').appendChild(p);field('Respuesta recibida de la persona','ecoAnswer','textarea',true,10000);}
  if(a.metodo==='foto'||a.metodo==='documento'){
   const photo=a.metodo==='foto';const f=field(photo?'Adjuntar de 1 a 3 fotografías (JPG, PNG o WebP; 3 MB por imagen)':'Adjuntar un documento (PDF, Word o imagen; máximo 5 MB)','ecoFiles','file',true);
   f.accept=photo?'image/jpeg,image/png,image/webp':'.pdf,.doc,.docx,image/jpeg,image/png,image/webp';f.multiple=photo;
   if(photo){const capture=field('Tomar una fotografía con el celular (opcional)','ecoCapture','file',false);capture.accept='image/*';capture.setAttribute('capture','environment');capture.addEventListener('change',()=>{if(capture.files.length)f.required=false;});f.addEventListener('change',()=>{f.required=!f.files.length&&!$('ecoCapture').files.length;});}
  }
  if(a.metodo==='qr'){
   field('Escanea o pega el token o enlace del QR de esta actividad','ecoQr','text',true,2500);
   const b=document.createElement('button');b.type='button';b.textContent='Leer QR con la cámara';b.addEventListener('click',scan);$('ecoConfirmFields').appendChild(b);
   const video=document.createElement('video');video.id='ecoQrVideo';video.autoplay=true;video.playsInline=true;video.muted=true;video.hidden=true;$('ecoConfirmFields').appendChild(video);
   const note=document.createElement('p');note.className='eco-meta';note.textContent='Si tu navegador no permite leer QR aquí, escanéalo con la cámara del teléfono y pega su enlace. No necesitas abrir enlaces desconocidos.';$('ecoConfirmFields').appendChild(note);
  }
  if(a.requiereClave||a.metodo==='clave'){const f=field('Clave de validación de la actividad','ecoKey','password',true,500);f.autocomplete='off';}
  if(a.metodo==='jefe')field('Nombre del jefe que confirmó a RH','ecoBoss','text',true,150);
  if(a.metodo==='rh'||a.metodo==='jefe')field('Referencia o constancia que respalda la confirmación','ecoReference','textarea',true,300);
  field('Comentario de RH (opcional)','ecoComment','textarea',false,2000);
  const c=field('Confirmo que revisé y recibí el requisito indicado para esta persona','ecoChecked','checkbox',true);c.style.marginLeft='10px';
  $('ecoConfirmSave').hidden=false;
 }catch(err){text('ecoConfirmStatus','');text('ecoConfirmError',err.message||err);}
}
async function scan(){
 stopCamera();text('ecoConfirmError','');
 if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){text('ecoConfirmError','Este navegador no ofrece lector de QR integrado. Usa la cámara del teléfono y pega el enlace o token.');return;}
 try{
  const supported=await BarcodeDetector.getSupportedFormats();if(!supported.includes('qr_code'))throw new Error('El navegador no admite QR. Pega el enlace o token.');
  const detector=new BarcodeDetector({formats:['qr_code']});stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
  const video=$('ecoQrVideo');video.srcObject=stream;video.hidden=false;await video.play();let scanning=false;
  scanTimer=setInterval(async()=>{if(scanning||!stream)return;scanning=true;try{const codes=await detector.detect(video);if(codes.length){$('ecoQr').value=codes[0].rawValue;stopCamera();text('ecoConfirmStatus','Código leído. Se comprobará al guardar.');}}catch(_){}finally{scanning=false;}},350);
 }catch(err){stopCamera();text('ecoConfirmError','No se pudo utilizar la cámara. Puedes pegar el código o enlace.');}
}
function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('No fue posible leer el archivo.'));r.readAsDataURL(file);});}
async function photoData(file){
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Convierte la fotografía a JPG, PNG o WebP antes de adjuntarla.');
 if(file.size>25*1024*1024)throw new Error('La fotografía supera 25 MB. Usa una versión más pequeña.');
 const url=await readFile(file);if(file.size<=3*1024*1024)return url;
 const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('No se pudo procesar la fotografía.'));i.src=url;});
 const scale=Math.min(1,2000/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
 const result=canvas.toDataURL('image/jpeg',.82);if(result.length>4*1024*1024)throw new Error('La fotografía sigue superando 3 MB. Usa una versión más pequeña.');return result;
}
$('ecoConfirmForm').addEventListener('submit',async ev=>{
 ev.preventDefault();if(busy||!activity||!activity.habilitada)return;
 busy=true;stopCamera();$('ecoConfirmSave').disabled=true;$('ecoConfirmCancel').disabled=true;text('ecoConfirmError','');text('ecoConfirmStatus','Guardando requisito y confirmación…');
 try{
  const a=activity,val=id=>$(id)?.value||'';const payload={nomina:a.nomina,id:a.id,ciclo:a.ciclo,operacion:operation,confirmo:!!$('ecoChecked')?.checked,respuesta:val('ecoAnswer'),comentario:val('ecoComment'),referencia:val('ecoReference'),jefe:val('ecoBoss'),clave:val('ecoKey'),codigo:val('ecoQr'),archivos:[]};
  const f=$('ecoFiles');if(f){const files=Array.from(f.files).concat(Array.from($('ecoCapture')?.files||[]));if(files.length<1||files.length>(a.metodo==='foto'?3:1))throw new Error(a.metodo==='foto'?'Selecciona de 1 a 3 fotografías en total.':'Selecciona un documento.');for(const file of files){if(a.metodo!=='foto'&&file.size>5*1024*1024)throw new Error('El documento supera 5 MB.');payload.archivos.push({nombre:file.name,dataUrl:a.metodo==='foto'?await photoData(file):await readFile(file)});}}
  const response=await window.EcoAdminLive.request('adminConfirmarActividadECO',[payload]);if(!response?.ok)throw new Error(response?.mensaje||'No se confirmó el guardado.');
  text('ecoConfirmStatus',response.mensaje);$('ecoConfirmFields').replaceChildren();$('ecoConfirmSave').hidden=true;activity=null;window.dispatchEvent(new Event('eco-confirmacion-guardada'));
 }catch(err){text('ecoConfirmStatus','');text('ecoConfirmError',(err.message||String(err))+' Si se interrumpió la red, puedes reintentar sin cerrar este formulario.');}
 finally{busy=false;$('ecoConfirmSave').disabled=false;$('ecoConfirmCancel').disabled=false;}
});
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-eco-confirmar]');if(b)open(b.getAttribute('data-eco-nomina'),b.getAttribute('data-eco-confirmar'));});
})();
