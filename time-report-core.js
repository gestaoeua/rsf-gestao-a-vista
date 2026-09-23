(function(root){
 'use strict';
 const text=v=>String(v??'').trim();
 function dateKey(value){
  const s=text(value); let y,m,d,match;
  if((match=s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) [,y,m,d]=match;
  else if((match=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [,d,m,y]=match;
  else return null;
  const dt=new Date(Date.UTC(+y,+m-1,+d));
  return dt.getUTCFullYear()===+y&&dt.getUTCMonth()===+m-1&&dt.getUTCDate()===+d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;
 }
 function clock(value){
  const s=text(value);const m=s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if(!m)return null;
  let h=+m[1];const min=+m[2],sec=+(m[3]||0),ap=m[4]?.toUpperCase();
  if(min>59||sec>59||h>(ap?12:23)||(ap&&h<1))return null;
  if(ap)h=h%12+(ap==='PM'?12:0);
  return h*60+min+sec/60;
 }
 function decimal(value){const s=text(value).replace(',','.');return s!==''&&/^\d+(\.\d+)?$/.test(s)?Number(s):null}
 function normalize(records,projects){
  const rows=records.map((x,i)=>{
   const p=projects.find(p=>p.id===x.projectId),date=dateKey(x.date),endDate=x.exitDate?dateKey(x.exitDate):date;
   const a=clock(x.entry),b=clock(x.exit),hasEntry=!!text(x.entry),hasExit=!!text(x.exit);
   const declared=decimal(x.reportHours),issues=[];
   let minutes=null,start=null,end=null,basis='';
   if(!date)issues.push('Data ausente ou inválida');
   if(!text(x.worker))issues.push('Funcionário não informado');
   if(!p)issues.push('Projeto não identificado');
   if(hasEntry&&hasExit){
    if(a===null||b===null||!date||!endDate)issues.push('Horário ou data de saída inválidos');
    else{
     start=Date.parse(date+'T00:00:00Z')/60000+a;end=Date.parse(endDate+'T00:00:00Z')/60000+b;
     if(end<=start)issues.push('Saída deve ser posterior à entrada; informe a data em viradas de dia');
     else{minutes=end-start;basis='Entrada/saída';if(declared!==null&&Math.abs(declared*60-minutes)>1)issues.push('Horas lançadas diferem de entrada/saída');}
    }
   }else if(hasEntry||hasExit){issues.push(hasEntry?'Saída pendente':'Entrada pendente')}
   else if(declared!==null){minutes=declared*60;basis='Horas lançadas; sem entrada/saída'}
   else issues.push('Horas e horários ausentes');
   if(!date||!text(x.worker))minutes=null;
   const correction=text(x.correction),sourceStatus=text(x.reportStatus);
   if(/diverg|pend|error|invál|invalid/i.test(sourceStatus))issues.push('Status da origem: '+sourceStatus);
   return {id:text(x.id)||'linha-'+i,worker:text(x.worker)||'Não informado',workerKey:text(x.workerId)||text(x.worker),date,rawDate:text(x.date),projectId:text(x.projectId)||'__unknown',project:p?.name||text(x.projectId)||'Sem projeto',client:text(x.client)||text(p?.client),entry:text(x.entry),exit:text(x.exit),exitDate:endDate,minutes,start,end,basis,issues,correction,notes:text(x.notes),sourceStatus,rate:decimal(x.rate),status:''};
  });
  // Check the full source BEFORE filtering, so a project filter cannot hide double booking.
  rows.forEach((a,i)=>rows.slice(i+1).forEach(b=>{
   if(a.workerKey&&a.workerKey===b.workerKey&&a.start!==null&&b.start!==null&&a.end>a.start&&b.end>b.start&&Math.max(a.start,b.start)<Math.min(a.end,b.end)){
    for(const row of [a,b]){row.minutes=null;if(!row.issues.includes('Sobreposição de segmentos; excluído dos totais'))row.issues.push('Sobreposição de segmentos; excluído dos totais')}
   }
  }));
  rows.forEach(r=>{r.status=r.issues.length?'Divergência':r.correction?'Corrigido':r.basis.startsWith('Horas lançadas')?'Horas lançadas':'Concluído';if(r.issues.length===1&&r.issues[0]==='Saída pendente')r.status='Em aberto'});
  return rows;
 }
 function summarize(rows,filters={}){
  const invalidPeriod=!!(filters.from&&filters.to&&filters.from>filters.to);
  const selected=invalidPeriod?[]:rows.filter(r=>(!filters.from||r.date&&r.date>=filters.from)&&(!filters.to||r.date&&r.date<=filters.to)&&(!filters.worker||r.workerKey===filters.worker)&&(!filters.project||r.projectId===filters.project)&&(!filters.client||r.client===filters.client)&&(!filters.status||r.status===filters.status));
  const total=selected.reduce((sum,r)=>sum+(r.minutes??0),0),workers=new Map(),projects=new Map(),daily=new Map();
  function add(map,key,label,r){if(!map.has(key))map.set(key,{key,label,minutes:0,segments:[],cost:0,unknownCost:false});const g=map.get(key);g.minutes+=r.minutes??0;g.segments.push(r);if(r.minutes===null||!r.rate)g.unknownCost=true;else g.cost+=r.minutes/60*r.rate;}
  selected.forEach(r=>{add(workers,r.workerKey,r.worker,r);add(projects,r.projectId,r.project,r);add(daily,`${r.date}|${r.workerKey}`,r.worker,r)});
  const direction=filters.sort==='asc'?1:-1,sort=(a,b)=>direction*(a.minutes-b.minutes)||a.label.localeCompare(b.label,'pt-BR');
  return {invalidPeriod,selected,total,count:workers.size,average:workers.size?total/workers.size:0,excluded:selected.filter(r=>r.minutes===null).length,workers:[...workers.values()].sort(sort),daily:[...daily.values()].sort(sort),projects:[...projects.values()].map(g=>({...g,percent:total?g.minutes/total*100:null})).sort(sort)};
 }
 function duration(n){if(n===null)return 'A confirmar';const m=Math.round(n);return `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`}
 const api={dateKey,clock,normalize,summarize,duration};
 if(typeof module!=='undefined')module.exports=api;else root.RSFTime=api;
})(typeof globalThis!=='undefined'?globalThis:this);
