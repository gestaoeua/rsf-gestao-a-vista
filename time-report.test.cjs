// Synthetic test records only. Not imported by the application or live data source.
const test=require('node:test'),assert=require('node:assert/strict');
const {normalize,summarize,duration,dateKey}=require('./time-report-core.js');
const projects=[{id:'a',name:'Projeto A'},{id:'b',name:'Projeto B'}];
const segment=(changes={})=>({id:'1',worker:'Funcionário teste',projectId:'a',date:'21/09/2026',entry:'08:00',exit:'12:00',rate:25,...changes});
test('multiple projects retain hours/costs and consolidate one worker',()=>{
 const rows=normalize([segment({exit:'15:00'}),segment({id:'2',projectId:'b',entry:'15:00',exit:'23:00'})],projects),r=summarize(rows);
 assert.equal(r.count,1);assert.equal(r.total,900);assert.equal(r.daily.length,1);assert.equal(r.projects.find(p=>p.key==='a').minutes,420);assert.equal(r.projects.find(p=>p.key==='b').cost,200);assert.equal(r.projects.reduce((s,p)=>s+p.percent,0),100);
});
test('breaks are not counted',()=>{assert.equal(summarize(normalize([segment({entry:'07:37',exit:'14:21'}),segment({entry:'15:36',exit:'23:00'})],projects)).total,848)});
test('filters compose and percentage denominator follows filtered total',()=>{
 const rows=normalize([segment(),segment({worker:'Outro',id:'2',projectId:'b',date:'22/09/2026',client:'Cliente B'})],projects);
 const r=summarize(rows,{from:'2026-09-22',to:'2026-09-22',worker:'Outro',project:'b',client:'Cliente B',status:'Concluído'});assert.equal(r.total,240);assert.equal(r.count,1);assert.equal(r.projects[0].percent,100);
 assert.equal(summarize(rows,{from:'2026-09-23',to:'2026-09-21'}).invalidPeriod,true);
 assert.equal(summarize(rows,{worker:'Inexistente'}).total,0);
});
test('source hours discrepancies and corrections are visible',()=>{const [r]=normalize([segment({reportHours:8,correction:'Projeto corrigido'})],projects);assert.equal(r.minutes,240);assert.equal(r.status,'Divergência');assert.equal(r.correction,'Projeto corrigido')});
test('open, invalid and overlapping entries never inflate totals',()=>{
 const rows=normalize([segment({exit:''}),segment({worker:'Inválido',exit:'07:00'}),segment({worker:'Sobreposto'}),segment({worker:'Sobreposto',projectId:'b',entry:'11:00',exit:'16:00'})],projects);
 assert.equal(summarize(rows).total,0);assert.equal(summarize(rows).excluded,4);assert.equal(summarize(rows,{project:'b'}).total,0);assert.equal(rows[0].status,'Em aberto');
});
test('explicit overnight date accepted; missing overnight date rejected',()=>{assert.equal(normalize([segment({entry:'22:00',exit:'02:00',exitDate:'22/09/2026'})],projects)[0].minutes,240)});
test('decimal hours without timestamps are labeled; absent values stay unknown',()=>{
 const rs=normalize([segment({entry:'',exit:'',reportHours:'7,5',rate:0}),segment({entry:'',exit:'',worker:'Sem horas'})],projects);assert.equal(rs[0].minutes,450);assert.equal(rs[0].status,'Horas lançadas');assert.equal(rs[1].minutes,null);assert.equal(summarize(rs).projects[0].unknownCost,true);
});
test('invalid dates are flagged; sorting and rounding are consistent',()=>{
 assert.equal(dateKey('31/02/2026'),null);assert.equal(dateKey('09/10/2026'),'2026-10-09');assert.equal(duration(143*60+37),'143h37');assert.equal(duration(8617/12),'11h58');
 const rs=normalize([segment(),segment({worker:'Longo',exit:'18:00'})],projects);assert.equal(summarize(rs,{sort:'asc'}).workers[0].label,'Funcionário teste');assert.equal(summarize(rs).workers[0].label,'Longo');
});
