/* MOTOR ECO v0.2 — prototipo, solo simulación, sin escrituras.
 * Reglas confirmadas: por elemento E1-E20 (< umbral), todas las actividades activas
 * y aplicables a su ciclo, varias actividades por elemento, sin tope.
 * La lógica LEGADO se conserva solo para comparación documental, NO es la predeterminada.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MotorECO = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const COMPETENCIAS = [
    { key: 'C1_GeneradorImpacto', nombre: 'Generador de Impacto', indice: 1 },
    { key: 'C2_AgenteMejora', nombre: 'Agente de Mejora Continua', indice: 2 },
    { key: 'C3_DesarrolladorTalento', nombre: 'Desarrollador de Talento', indice: 3 },
    { key: 'C4_LiderNegocio', nombre: 'Líder de Negocio', indice: 4 },
    { key: 'C5_AliadoEstrategico', nombre: 'Aliado Estratégico', indice: 5 }
  ];
  const ORDEN_PERSONA_DOCUMENTAL = [4,3,1,2,8,7,6,5,10,12,9,11,15,13,16,14,18,20,19,17];
  const TIPOS = Object.freeze({ ELEMENTOS: 'elementos', MENORES: 'menores', LEGADO: 'legado' });
  const texto = v => String(v ?? '').trim();
  function numero(v) {
    if (v === null || v === undefined || texto(v) === '') return null;
    const n = Number(texto(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  function esSi(v) { return ['sí','si','true','1'].includes(texto(v).toLowerCase()); }
  function habilitada(v) { return esSi(v); }
  function elementoValido(v) { return /^(?:[1-9]|1\d|20)$/.test(texto(v)); }
  function cicloValido(v) {
    const n = numero(v);
    return n !== null && Number.isInteger(n) && n >= 2020 && n <= 2100 ? n : null;
  }
  function configurar(config) {
    const c = config || {};
    return {
      modo: Object.values(TIPOS).includes(c.modo) ? c.modo : TIPOS.ELEMENTOS,
      umbral: Math.max(0, Math.min(5, numero(c.umbral) ?? 4)),
      cantidadMenores: Math.max(1, Math.min(20, Math.trunc(numero(c.cantidadMenores) ?? 3))),
      ciclo: cicloValido(c.ciclo) ?? 2026,
      // Regla de compatibilidad explícita para datos de Sheets aún sin columna Ciclo.
      // Solo actividades MANUAL E1-E20 y resultados del ciclo 2026; no inventa metadatos.
      cicloBaseSinEtiqueta: 2026
    };
  }
  function actividadesParaCiclo(actividad, config) {
    const c = configurar(config);
    if (!elementoValido(actividad.elemento)) return false;
    const declarado = cicloValido(actividad.ciclo);
    if (declarado !== null) return declarado === c.ciclo;
    return c.ciclo === c.cicloBaseSinEtiqueta && texto(actividad.origen).toUpperCase() === 'MANUAL';
  }
  function diagnosticar(resultado, config) {
    const cfg = configurar(config);
    const vacio = { configuracion: cfg, competencias: [], elementos: [], tieneResultados: false, observaciones: [] };
    if (!resultado || !texto(resultado.nomina)) return { ...vacio, observaciones: ['No hay evaluación publicada para este colaborador.'] };
    const cicloResultado = cicloValido(resultado.ciclo) ?? 2026; // Fuente vigente: Evaluación 2026
    if (cicloResultado !== cfg.ciclo) return { ...vacio, observaciones: ['No hay resultados disponibles para el ciclo seleccionado.'] };
    const competencias = COMPETENCIAS.map(c => ({ ...c, calificacion: numero(resultado[c.key]) }));
    const orden = cfg.modo === TIPOS.LEGADO ? ORDEN_PERSONA_DOCUMENTAL : Array.from({length:20}, (_,i)=>i+1);
    let candidatos = orden.map((n, i) => ({
      elemento: String(n), competenciaIndice: Math.ceil(n/4),
      calificacion: numero(resultado['E'+n]), ordenOriginal: i
    })).filter(x => x.calificacion !== null);
    const observaciones=[];
    if (cfg.modo === TIPOS.ELEMENTOS) {
      candidatos = candidatos.filter(x => x.calificacion < cfg.umbral);
      observaciones.push('Regla confirmada: todos los elementos con calificación inferior al umbral; sin límite de cantidad.');
    } else if (cfg.modo === TIPOS.LEGADO) {
      const bajoComp = new Set(competencias.filter(c => c.calificacion !== null && c.calificacion < cfg.umbral).map(c => c.indice));
      if (bajoComp.size) candidatos = candidatos.filter(x => bajoComp.has(x.competenciaIndice));
      observaciones.push('Comparación histórica documental; no se utilizará para asignaciones nuevas.');
      candidatos.sort((a,b)=>a.calificacion-b.calificacion||a.ordenOriginal-b.ordenOriginal);
      candidatos = candidatos.slice(0,bajoComp.size?5:3);
    } else if (cfg.modo === TIPOS.MENORES) {
      observaciones.push('Escenario alternativo para una decisión posterior, sin aplicar cambios.');
      candidatos.sort((a,b)=>a.calificacion-b.calificacion||Number(a.elemento)-Number(b.elemento));
      candidatos = candidatos.slice(0,cfg.cantidadMenores);
    }
    if (cfg.modo === TIPOS.ELEMENTOS) candidatos.sort((a,b)=>Number(a.elemento)-Number(b.elemento));
    return {
      configuracion: cfg, competencias: competencias.map(c=>({...c,bajoUmbral:c.calificacion!==null&&c.calificacion<cfg.umbral})),
      elementos: candidatos, tieneResultados: true, observaciones
    };
  }
  /** Simula la selección que realiza RH. No modifica los Sheets ni publica asignaciones.
   * En la hoja vigente, cualquier alcance se materializa como registros
   * (Nómina, ID actividad, Asignada), uno por persona. El grupo no se infiere
   * automáticamente del título de la actividad.
   */
  function simularAsignacionEspecialRH(personas, idActividad, seleccion) {
    const id = texto(idActividad), s = seleccion || {};
    if (!id) throw new Error('Se requiere el ID de la actividad especial.');
    const alcance = texto(s.alcance).toLowerCase();
    if (!['individual','grupo','todos'].includes(alcance)) throw new Error('Alcance manual no reconocido.');
    const elegibles = new Map((personas||[]).filter(p=>texto(p.nomina)).map(p=>[texto(p.nomina),p]));
    const solicitadas = alcance === 'todos' ? [...elegibles.keys()]
      : [...new Set((s.nominas||[]).map(texto).filter(Boolean))];
    if (alcance === 'individual' && solicitadas.length!==1) throw new Error('La selección individual requiere una nómina.');
    if (alcance === 'grupo' && solicitadas.length===0) throw new Error('La selección de grupo requiere nóminas explícitas.');
    if (solicitadas.some(n=>!elegibles.has(n))) throw new Error('La selección incluye una nómina que no está en el catálogo consultado.');
    return solicitadas.map(nomina=>({nomina,id,asignada:'Sí'}));
  }
  function vistaPersona(data, nomina, config) {
    const cfg = configurar(config), key = texto(nomina);
    const persona = (data.personas||[]).find(p=>texto(p.nomina)===key);
    if (!persona) return null;
    const resultado = (data.resultados||[]).find(r=>texto(r.nomina)===key && (cicloValido(r.ciclo)??2026)===cfg.ciclo);
    const d = diagnosticar(resultado, cfg);
    const seleccion = new Set(d.elementos.map(x=>x.elemento));
    const cumplimiento = new Map((data.cumplimientos||[]).filter(x=>texto(x.nomina)===key)
      .map(x=>[texto(x.id),{completada:esSi(x.completada),fecha:x.fecha||''}]));
    const aVista=(x,categoria)=>({
      id:texto(x.id),titulo:String(x.titulo||''),categoria,tipo:String(x.tipo||''),tipoValidacion:String(x.tipoValidacion||''),
      elemento:texto(x.elemento),ciclo:cicloValido(x.ciclo)??(categoria==='Reforzamiento'?cfg.ciclo:null),
      completada:cumplimiento.get(texto(x.id))?.completada||false,
      fecha:cumplimiento.get(texto(x.id))?.fecha||''
    });
    const refuerzo = (data.desarrollo||[])
      .filter(a=>habilitada(a.activo)&&actividadesParaCiclo(a,cfg)&&seleccion.has(texto(a.elemento)))
      .map(a=>aVista(a,'Reforzamiento'));
    const idsEspeciales = new Set((data.asignaciones||[]).filter(a=>texto(a.nomina)===key&&esSi(a.asignada))
      .map(a=>texto(a.id)));
    const especiales = (data.especiales||[]).filter(a=>habilitada(a.activo)&&idsEspeciales.has(texto(a.id)))
      .map(a=>aVista(a,'Especial'));
    // Invitaciones familiares: catálogo abierto para todos, sin cálculo
    // E1–E20, sin asignación manual y sin marcar 'pendiente de cumplir'.
    const familiares = (data.familiares||[]).filter(a=>habilitada(a.activo))
      .map(a=>({id:texto(a.id),titulo:String(a.titulo||''),categoria:'Invitación familiar',
        tipo:'Invitación abierta',url:String(a.url||''),abierta:true}));
    const unica=arr=>[...new Map(arr.filter(a=>a.id).map(a=>[a.id,a])).values()];
    const disponibles=unica(refuerzo), todosCatalogo=(data.desarrollo||[]).filter(a=>actividadesParaCiclo(a,cfg)&&seleccion.has(texto(a.elemento)));
    return { persona,diagnostico:d,refuerzo:disponibles,especiales:unica(especiales),familiares:unica(familiares),
      posiblesRefuerzo:todosCatalogo.length,refuerzoNoVisible:todosCatalogo.filter(a=>!habilitada(a.activo)).length };
  }
  function resumen(data, config) {
    const cfg=configurar(config), personas=data.personas||[];
    const resultados=(data.resultados||[]).filter(r=>(cicloValido(r.ciclo)??2026)===cfg.ciclo);
    const evaluadas=personas.filter(p=>resultados.some(r=>texto(r.nomina)===texto(p.nomina)));
    const catalogoCiclo=(data.desarrollo||[]).filter(a=>actividadesParaCiclo(a,cfg));
    return {
      personas: personas.length,conResultados:evaluadas.length,
      conElementosBajos:evaluadas.filter(p=>diagnosticar(resultados.find(r=>texto(r.nomina)===texto(p.nomina)),{...cfg,modo:TIPOS.ELEMENTOS}).elementos.length>0).length,
      desarrolloActivas:catalogoCiclo.filter(a=>habilitada(a.activo)).length,
      desarrolloInactivas:catalogoCiclo.filter(a=>!habilitada(a.activo)).length,
      desarrolloFueraDeCiclo:(data.desarrollo||[]).length-catalogoCiclo.length,
      especialesActivas:(data.especiales||[]).filter(a=>habilitada(a.activo)).length,
      familiaresActivas:(data.familiares||[]).filter(a=>habilitada(a.activo)).length
    };
  }
  return {COMPETENCIAS,TIPOS,configurar,diagnosticar,vistaPersona,resumen,habilitada,esSi,actividadesParaCiclo,elementoValido,simularAsignacionEspecialRH};
});
