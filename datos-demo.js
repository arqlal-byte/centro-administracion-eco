/* Datos SINTÉTICOS. Nunca reproducen información personal real de ECO. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.DatosDemoECO = data;
})(typeof window !== 'undefined' ? window : null, function () {
  const base = (nomina, values, competencias) => {
    const o = { nomina };
    competencias.forEach((v,i) => o[['C1_GeneradorImpacto','C2_AgenteMejora','C3_DesarrolladorTalento','C4_LiderNegocio','C5_AliadoEstrategico'][i]] = v);
    values.forEach((v,i) => o['E'+(i+1)] = v);
    return o;
  };
  return {
    personas: [
      {nomina:'DEMO-001',nombre:'Colaborador de ejemplo A',puesto:'Liderazgo',area:'Operaciones'},
      {nomina:'DEMO-002',nombre:'Colaborador de ejemplo B',puesto:'Supervisión',area:'Administración'},
      {nomina:'DEMO-003',nombre:'Colaborador de ejemplo C',puesto:'Coordinación',area:'Comercial'},
      {nomina:'DEMO-004',nombre:'Colaborador de ejemplo D',puesto:'Colaborador',area:'Operaciones'}
    ],
    resultados: [
      {...base('DEMO-001',[3.2,3.8,4.1,3.0,4.4,4.2,3.8,4.0,3.1,4.0,4.2,4.1,4.5,4.5,4.1,4.1,3.2,4.1,4.4,3.9],[3.6,4.1,3.9,4.3,3.9]),ciclo:2026},
      {...base('DEMO-002',[4.2,4.5,4.1,4.0,4.3,4.4,4.5,4.1,4.0,4.3,4.4,4.5,4.0,4.2,4.4,4.1,4.2,4.1,4.5,4.0],[4.2,4.3,4.2,4.2,4.2]),ciclo:2026},
      {...base('DEMO-003',[3.9,3.7,3.8,3.4,3.5,3.9,4.0,3.8,3.8,3.5,3.4,3.7,4.1,3.8,3.6,4.1,4.0,3.9,4.3,3.8],[3.7,3.8,3.6,3.9,4.0]),ciclo:2026}
    ],
    // 20 actividades principales del ciclo 2026: 1 por elemento.
    // Dos están deshabilitadas para demostrar que no aparecen en Mi Persona ECO.
    // El elemento 5 de 2027 tiene otro ID y NO está habilitado todavía.
    desarrollo: Array.from({length:20}, (_,i)=>({
      id:'ACT-DEMO-2026-'+String(i+1).padStart(2,'0'),
      elemento:String(i+1),ciclo:2026,origen:'MANUAL',
      competencia:['Generador de Impacto','Agente de Mejora Continua','Desarrollador de Talento','Líder de Negocio','Aliado Estratégico'][Math.floor(i/4)],
      tipo:'Reforzamiento',titulo:'Actividad de reforzamiento E'+(i+1)+' · 2026',
      activo:[5,17].includes(i+1)?'No':'Sí'
    })).concat([
      {id:'ACT-DEMO-2027-05',elemento:'5',ciclo:2027,origen:'MANUAL',tipo:'Reforzamiento',titulo:'Nueva actividad E5 · 2027 (pendiente de publicar)',activo:'No'},
      {id:'ACT-DEMO-BASE-05',elemento:'5',origen:'BASE',tipo:'Recurso',titulo:'Recurso auxiliar fuera del catálogo inicial',activo:'Sí'}
    ]),
    // Tres formas de RH: individual, grupo seleccionado y todas las personas.
    // La estructura real guarda una fila Nómina + ID por destinatario.
    especiales: [
      {id:'ESP-DEMO-01',titulo:'Sesión individual designada por RH',tipo:'Sesión',activo:'Sí'},
      {id:'ESP-DEMO-02',titulo:'Taller para un grupo específico',tipo:'Taller',activo:'Sí'},
      {id:'ESP-DEMO-03',titulo:'Invitación especial para todos los colaboradores',tipo:'Actividad especial',activo:'Sí'},
      {id:'ESP-DEMO-04',titulo:'Actividad especial deshabilitada',tipo:'Taller',activo:'No'}
    ],
    asignaciones: [
      {nomina:'DEMO-001',id:'ESP-DEMO-01',asignada:'Sí'}, // individual
      {nomina:'DEMO-001',id:'ESP-DEMO-02',asignada:'Sí'}, // grupo
      {nomina:'DEMO-003',id:'ESP-DEMO-02',asignada:'Sí'}, // grupo
      ...['DEMO-001','DEMO-002','DEMO-003','DEMO-004'].map(nomina=>({nomina,id:'ESP-DEMO-03',asignada:'Sí'})), // todos
      {nomina:'DEMO-003',id:'ESP-DEMO-04',asignada:'Sí'} // deshabilitada: no visible
    ],
    cumplimientos: [
      {nomina:'DEMO-001',id:'ESP-DEMO-01',completada:'Sí',fecha:'2026-09-15'},
      {nomina:'DEMO-001',id:'ACT-DEMO-2026-04',completada:'Sí',fecha:'2026-09-20'}
    ],
    familiares: [
      {id:'FAM-DEMO-01',titulo:'Invitación abierta a una convivencia familiar',activo:'Sí',url:''},
      {id:'FAM-DEMO-02',titulo:'Invitación abierta a una actividad de reflexión familiar',activo:'Sí',url:''},
      {id:'FAM-DEMO-03',titulo:'Invitación familiar aún no publicada',activo:'No',url:''}
    ]
  };
});