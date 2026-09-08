let data={
 projects:[{id:'P001',name:'Kentfield Ct',city:'Laconia',start:'05/09/2026',stage:'Insulation',status:'In Progress'},{id:'P002',name:'Jewett St',city:'Manchester',start:'05/09/2026',stage:'Insulation',status:'In Progress'}],
 stages:[{projectId:'P001',name:'Demolition',sequence:2,status:'Complete',notes:''},{projectId:'P001',name:'Insulation',sequence:8,status:'In Progress',notes:''},{projectId:'P002',name:'Demolition',sequence:2,status:'Complete',notes:''},{projectId:'P002',name:'Insulation',sequence:8,status:'In Progress',notes:''}],
 labor:[{id:'L001',projectId:'P001',stage:'Demolition',worker:'Carlos',date:'05/09/2026',hours:8,rate:25,total:200},{id:'L002',projectId:'P001',stage:'Demolition',worker:'Dênis',date:'05/09/2026',hours:8,rate:25,total:200},{id:'L003',projectId:'P001',stage:'Demolition',worker:'Welber',date:'05/09/2026',hours:8,rate:25,total:200},{id:'L004',projectId:'P001',stage:'Insulation',worker:'Marcio Monteagudo',date:'07/09/2026',hours:4,rate:0,total:0,entry:'15:00',exit:'19:00'},{id:'L005',projectId:'P001',stage:'Insulation',worker:'Rafael Silva',date:'07/09/2026',hours:12.08,rate:0,total:0,entry:'07:10',exit:'19:15'},{id:'L006',projectId:'P002',stage:'Insulation',worker:'Heber André',date:'07/09/2026',hours:12.72,rate:0,total:0,entry:'07:00',exit:'19:43'}],
 purchases:[{id:'PU001',projectId:'P001',vendor:'Home Depot',date:'05/09/2026',amount:292.28,category:'Unclassified',stage:'Demolition',status:'Pending classification',receipt:''}],
 items:[{id:'PI001',purchaseId:'PU001',description:'Receipt total pending itemization',quantity:1,unitCost:292.28,total:292.28,category:'Unclassified',stage:'Demolition'}],
 commitments:[]
};

const sheetId='1ie-edjTy56CM8190ksLVNeuaHt6jXJkZiMHJH2a82Dw';
const num=v=>Number(String(v??0).replace(/[^0-9.-]/g,''))||0;
const usd=n=>num(n).toLocaleString('en-US',{style:'currency',currency:'USD'});
const hoursLabel=n=>`${num(n).toLocaleString('pt-BR',{maximumFractionDigits:2})}h`;
const clean=v=>String(v??'').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isClosed=p=>/closed|complete|completed|conclu[ií]d|fechad|finalizad/i.test(clean(p.status));
const projectStatus=p=>isClosed(p)?'Fechado':'Em andamento';
const statusPt=s=>({'Not Started':'Não iniciada','In Progress':'Em andamento','Waiting':'A confirmar','Complete':'Concluída','Not Applicable':'Não se aplica'}[s]||s||'A confirmar');
const statusClass=s=>({'Not Started':'not-started','In Progress':'in-progress','Waiting':'waiting','Complete':'complete','Not Applicable':'not-applicable'}[s]||'waiting');
const paymentStatus=s=>/cancel/i.test(clean(s))?'Cancelled':/paid|pago/i.test(clean(s))?'Paid':'To Pay';
const paymentPt=s=>({Paid:'Pago','To Pay':'A pagar',Cancelled:'Cancelado'}[paymentStatus(s)]);
const categoryInfo={
 labor:{label:'Mão de obra'},
 materials:{label:'Materiais e consumíveis'},
 equipment:{label:'Ferramentas e equipamentos'},
 subcontractors:{label:'Subcontratados'},
 other:{label:'Outros'}
};
let lastSync=new Date();

function loadSheet(name,query=''){return new Promise((resolve,reject)=>{const cb='rsf_'+name+'_'+Date.now()+Math.floor(Math.random()*1000);const script=document.createElement('script');window[cb]=r=>{delete window[cb];script.remove();if(r.status==='error')reject(new Error(name));else resolve(r.table)};script.onerror=()=>reject(new Error(name));script.src=`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(name)}&tqx=responseHandler:${cb}${query?'&tq='+encodeURIComponent(query):''}`;document.head.appendChild(script)})}
function rows(table){const headers=table.cols.map(c=>c.label);return table.rows.map(r=>Object.fromEntries(headers.map((h,i)=>{const cell=r.c[i];return[h,typeof cell?.v==='number'||typeof cell?.v==='boolean'?cell.v:(cell?.f??cell?.v??'')]}))).filter(x=>Object.values(x).some(v=>v!==''&&v!==null))}
async function refreshData(){try{const [projectRows,stageRows,laborRows,purchaseRows,itemRows,budgetRows]=await Promise.all([loadSheet('Projects'),loadSheet('Stages'),loadSheet('Labor'),loadSheet('Purchases'),loadSheet('Purchase_Items'),loadSheet('Budget_Sales',"select * where D = 'Committed Cost'")]);data.projects=rows(projectRows).map(x=>({id:clean(x.project_id),name:clean(x.project_name),city:clean(x.city),start:clean(x.start_date),stage:clean(x.current_stage),status:clean(x.status)})).filter(x=>x.id&&x.name);data.stages=rows(stageRows).map(x=>({projectId:clean(x.project_id),name:clean(x.stage),sequence:num(x.sequence),status:clean(x.status),notes:clean(x.notes)}));data.labor=rows(laborRows).map(x=>({id:clean(x.labor_id),projectId:clean(x.project_id),stage:clean(x.stage),worker:clean(x.worker),date:clean(x.date),hours:num(x.hours),rate:num(x.rate),total:num(x.total),entry:clean(x.entry_time),exit:clean(x.exit_time)}));data.purchases=rows(purchaseRows).map(x=>({id:clean(x.purchase_id),projectId:clean(x.project_id),vendor:clean(x.vendor),date:clean(x.date),amount:num(x.amount),category:clean(x.category),stage:clean(x.stage),status:clean(x.status),receipt:clean(x.receipt_url)}));data.items=rows(itemRows).map(x=>({id:clean(x.item_id),purchaseId:clean(x.purchase_id),description:clean(x.description),quantity:num(x.quantity),unitCost:num(x.unit_cost),total:num(x.total),category:clean(x.category),stage:clean(x.stage)}));data.commitments=rows(budgetRows).map(x=>({id:clean(x.record_id),projectId:clean(x.project_id),stage:clean(x.stage),type:clean(x.record_type),amount:num(x.amount),date:clean(x.date),notes:clean(x.notes),paymentStatus:paymentStatus(x.payment_status)}));lastSync=new Date();selectedProjectId=null;path=[];render();document.body.dataset.synced='true'}catch(e){document.body.dataset.synced='fallback';console.error('Falha ao atualizar dados',e)}updateSyncTime()}

const view=document.querySelector('#view'),crumbs=document.querySelector('#crumbs');
let selectedProjectId=null,path=[],projectFilter='open',stageFilter='active';
function project(){return data.projects.find(x=>x.id===selectedProjectId)}
function purchase(id){return data.purchases.find(x=>x.id===id)}
function projectLabor(id=selectedProjectId){return data.labor.filter(x=>x.projectId===id)}
function projectPurchases(id=selectedProjectId){return data.purchases.filter(x=>x.projectId===id)}
function projectItems(id=selectedProjectId){const ids=new Set(projectPurchases(id).map(x=>x.id));return data.items.filter(x=>ids.has(x.purchaseId))}
function projectCommitments(id=selectedProjectId){return data.commitments.filter(x=>x.projectId===id)}
function categoryKey(category){if(/equipment|tool/i.test(category))return'equipment';if(/material|consumable/i.test(category))return'materials';return'other'}
function providerName(x){if(/electrical/i.test(x.stage))return'Eletricista';if(/plumb|heating|hvac/i.test(x.stage))return'Henry Plumber Services';return'Subcontratado'}
function activeCommitments(id=selectedProjectId){return projectCommitments(id).filter(x=>paymentStatus(x.paymentStatus)!=='Cancelled')}

function stageCosts(stage,id=selectedProjectId){
 const laborEntries=projectLabor(id).filter(x=>x.stage===stage);
 const labor=laborEntries.reduce((a,x)=>a+x.total,0);
 const hours=laborEntries.reduce((a,x)=>a+x.hours,0);
 const pendingLabor=laborEntries.filter(x=>!x.rate).length;
 const items=projectItems(id).filter(x=>x.stage===stage);
 const materials=items.filter(x=>categoryKey(x.category)==='materials').reduce((a,x)=>a+x.total,0);
 const equipment=items.filter(x=>categoryKey(x.category)==='equipment').reduce((a,x)=>a+x.total,0);
 const other=items.filter(x=>categoryKey(x.category)==='other').reduce((a,x)=>a+x.total,0);
 const subcontractors=activeCommitments(id).filter(x=>x.stage===stage);
 const subcontractPaid=subcontractors.filter(x=>paymentStatus(x.paymentStatus)==='Paid').reduce((a,x)=>a+x.amount,0);
 const toPay=subcontractors.filter(x=>paymentStatus(x.paymentStatus)==='To Pay').reduce((a,x)=>a+x.amount,0);
 const paid=labor+materials+equipment+other+subcontractPaid;
 return{labor,laborEntries,hours,pendingLabor,materials,equipment,other,subcontractPaid,toPay,paid,committed:paid+toPay};
}
function projectTotals(id){const laborEntries=projectLabor(id),labor=laborEntries.reduce((a,x)=>a+x.total,0),items=projectItems(id).reduce((a,x)=>a+x.total,0),subcontracts=activeCommitments(id),subcontractPaid=subcontracts.filter(x=>paymentStatus(x.paymentStatus)==='Paid').reduce((a,x)=>a+x.amount,0),toPay=subcontracts.filter(x=>paymentStatus(x.paymentStatus)==='To Pay').reduce((a,x)=>a+x.amount,0),paid=labor+items+subcontractPaid,hours=laborEntries.reduce((a,x)=>a+x.hours,0),pendingLabor=laborEntries.filter(x=>!x.rate).length;return{paid,toPay,committed:paid+toPay,hours,pendingLabor}}
function projectAlerts(id){
 const buys=projectPurchases(id),items=projectItems(id),stages=data.stages.filter(x=>x.projectId===id);
 const unclassified=buys.filter(x=>/unclassified/i.test(x.category)).length;
 const noReceipt=buys.filter(x=>!x.receipt).length;
 const mismatch=buys.filter(p=>Math.abs(items.filter(x=>x.purchaseId===p.id).reduce((a,x)=>a+x.total,0)-p.amount)>.01).length;
 const stagesWaiting=stages.filter(x=>x.status==='Waiting').length;
 const payments=activeCommitments(id).filter(x=>paymentStatus(x.paymentStatus)==='To Pay').length;
 const pendingLabor=projectLabor(id).filter(x=>!x.rate).length;
 const groups=[['Taxas de mão de obra a confirmar',pendingLabor],['Compras sem classificação',unclassified],['Comprovantes sem link',noReceipt],['Totais de compra a conferir',mismatch],['Etapas a confirmar',stagesWaiting],['Pagamentos pendentes',payments]].filter(x=>x[1]>0);
 return{groups,total:groups.length};
}

function go(...parts){path=parts;render()}
function crumb(label,...parts){return `<button class="crumb" onclick='go(${parts.map(x=>JSON.stringify(x)).join(',')})'>${esc(label)}</button>`}
function openProject(id){selectedProjectId=id;path=[];stageFilter='active';render()}
function showProjects(){selectedProjectId=null;path=[];render()}
function setProjectFilter(filter){projectFilter=filter;render()}
function setStageFilter(filter){stageFilter=filter;render()}
function updateSyncTime(){const el=document.querySelector('#syncTime');if(el)el.textContent=`Atualizado em ${lastSync.toLocaleDateString('pt-BR')} às ${lastSync.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`}

function moneyLine(t){return `<div class="project-money"><span><small>Pago</small><b>${usd(t.paid)}</b></span><span><small>A pagar</small><b>${usd(t.toPay)}</b></span><span class="committed"><small>Custo comprometido</small><b>${usd(t.committed)}</b></span><span><small>Horas registradas</small><b>${hoursLabel(t.hours)}</b>${t.pendingLabor?`<small>${t.pendingLabor} taxa${t.pendingLabor===1?'':'s'} a confirmar</small>`:''}</span></div>`}
function renderProjects(){const title=document.querySelector('#pageTitle'),subtitle=document.querySelector('#pageSubtitle'),status=document.querySelector('#pageStatus');title.textContent='Gestão à Vista';subtitle.textContent='Custo simples por projeto';status.style.display='none';crumbs.innerHTML='';const open=data.projects.filter(p=>!isClosed(p)).length,closed=data.projects.length-open;const visible=data.projects.filter(p=>projectFilter==='all'||(projectFilter==='closed'?isClosed(p):!isClosed(p)));view.innerHTML=`<div class="projects-head"><h2 class="section-title">Projetos</h2><div class="filters"><button class="filter ${projectFilter==='all'?'active':''}" onclick="setProjectFilter('all')">Todos (${data.projects.length})</button><button class="filter ${projectFilter==='open'?'active':''}" onclick="setProjectFilter('open')">Abertos (${open})</button><button class="filter ${projectFilter==='closed'?'active':''}" onclick="setProjectFilter('closed')">Fechados (${closed})</button></div></div><div class="project-list">${visible.map(p=>{const t=projectTotals(p.id),a=projectAlerts(p.id);return `<article class="card click project-card" onclick="openProject('${esc(p.id)}')"><div class="project-content"><div class="project-top"><div class="project-name">${esc(p.name)}</div><span class="project-status ${isClosed(p)?'closed':''}">${projectStatus(p)}</span>${a.total?`<span class="alert-badge">${a.total} alerta${a.total===1?'':'s'}</span>`:''}</div><div class="note">${esc(p.city)} · Etapa atual: ${esc(p.stage||'Não informada')}</div>${moneyLine(t)}</div><span class="project-arrow">›</span></article>`}).join('')||'<div class="empty-state">Nenhum projeto nesta categoria.</div>'}</div>`;updateSyncTime()}

function alertsPanel(id){const a=projectAlerts(id);if(!a.total)return`<section class="alerts clear"><strong>✓ Tudo conferido</strong><span>Nenhuma pendência encontrada.</span></section>`;return`<section class="alerts"><div><strong>${a.total} alerta${a.total===1?'':'s'} para conferir</strong><span>Esses avisos não impedem o cálculo do custo.</span></div><div class="alert-chips">${a.groups.map(([label,count])=>`<span>${count} · ${esc(label)}</span>`).join('')}</div></section>`}
function renderStageOverview(){const p=project(),all=data.stages.filter(x=>x.projectId===p.id).sort((a,b)=>a.sequence-b.sequence),visible=all.filter(s=>stageFilter==='all'||s.status!=='Not Applicable'),totals=projectTotals(p.id),complete=all.filter(s=>s.status==='Complete').length;view.innerHTML=`<div class="project-summary"><div><span>Pago</span><strong>${usd(totals.paid)}</strong></div><div><span>A pagar</span><strong>${usd(totals.toPay)}</strong></div><div class="featured"><span>Custo comprometido</span><strong>${usd(totals.committed)}</strong></div><div><span>Andamento</span><strong>${complete}/${all.length} etapas</strong><small>${hoursLabel(totals.hours)} registradas${totals.pendingLabor?` · ${totals.pendingLabor} taxa${totals.pendingLabor===1?'':'s'} pendente${totals.pendingLabor===1?'':'s'}`:''}</small></div></div>${alertsPanel(p.id)}<div class="stage-toolbar"><h2 class="section-title">Custos por etapa</h2><div class="filters"><button class="filter ${stageFilter==='active'?'active':''}" onclick="setStageFilter('active')">Aplicáveis</button><button class="filter ${stageFilter==='all'?'active':''}" onclick="setStageFilter('all')">Todas</button></div></div><div class="stage-list">${visible.map(s=>{const c=stageCosts(s.name);return `<article class="stage-card click" onclick="go('Etapa','${esc(s.name)}')"><div class="stage-order">${s.sequence}</div><div class="stage-main"><div class="stage-title"><strong>${esc(s.name)}</strong><span class="stage-status ${statusClass(s.status)}">${statusPt(s.status)}</span></div>${s.notes?`<div class="note">${esc(s.notes)}</div>`:''}<div class="stage-money"><span>Pago <b>${usd(c.paid)}</b></span><span>A pagar <b>${usd(c.toPay)}</b></span><span>Total <b>${usd(c.committed)}</b></span>${c.hours?`<span>Horas <b>${hoursLabel(c.hours)}</b>${c.pendingLabor?' · taxa a confirmar':''}</span>`:''}</div></div><span class="project-arrow">›</span></article>`}).join('')}</div>`}

function categoryRows(stage){const c=stageCosts(stage);return[
 {key:'labor',label:categoryInfo.labor.label,paid:c.labor,toPay:0,count:c.laborEntries.length,pending:c.pendingLabor},
 {key:'materials',label:categoryInfo.materials.label,paid:c.materials,toPay:0},
 {key:'equipment',label:categoryInfo.equipment.label,paid:c.equipment,toPay:0},
 {key:'subcontractors',label:categoryInfo.subcontractors.label,paid:c.subcontractPaid,toPay:c.toPay},
 {key:'other',label:categoryInfo.other.label,paid:c.other,toPay:0}
].filter(x=>x.paid+x.toPay>0||x.count>0)}
function renderStage(stage){const s=data.stages.find(x=>x.projectId===selectedProjectId&&x.name===stage),c=stageCosts(stage),categories=categoryRows(stage);view.innerHTML=`<div class="stage-heading"><div><h2 class="section-title">${esc(stage)}</h2><span class="stage-status ${statusClass(s?.status)}">${statusPt(s?.status)}</span></div><div class="stage-total"><span>Pago <b>${usd(c.paid)}</b></span><span>A pagar <b>${usd(c.toPay)}</b></span><span>Total <b>${usd(c.committed)}</b></span></div></div>${s?.notes?`<div class="stage-note">${esc(s.notes)}</div>`:''}<div class="list">${categories.map(x=>`<div class="row click" onclick="go('Etapa','${esc(stage)}','${x.key}')"><span><strong>${esc(x.label)}</strong><div class="note">${x.pending?`${x.pending} taxa${x.pending===1?'':'s'} a confirmar`:x.toPay?`Pago ${usd(x.paid)} · A pagar ${usd(x.toPay)}`:'Clique para ver os detalhes'}</div></span><span class="money">${x.pending&&!x.paid?'A confirmar':usd(x.paid+x.toPay)}</span></div>`).join('')||'<div class="empty-state">Ainda não existem custos registrados nesta etapa.</div>'}</div>`}
function renderCategory(stage,key){let entries=[];if(key==='labor')entries=projectLabor().filter(x=>x.stage===stage).map(x=>({id:x.id,title:x.worker,note:`${hoursLabel(x.hours)}${x.entry&&x.exit?` · ${x.entry}–${x.exit}`:''} · ${x.rate?`${usd(x.rate)}/h`:'taxa a confirmar'}`,amount:x.total,pending:!x.rate,type:'labor'}));else if(key==='subcontractors')entries=activeCommitments().filter(x=>x.stage===stage).map(x=>({id:x.id,title:providerName(x),note:paymentPt(x.paymentStatus),amount:x.amount,type:'commitment'}));else entries=projectItems().filter(x=>x.stage===stage&&categoryKey(x.category)===key).map(x=>({id:x.id,title:x.description,note:`${x.quantity} × ${usd(x.unitCost)}`,amount:x.total,type:'item'}));const label=categoryInfo[key]?.label||key;view.innerHTML=`<h2 class="section-title">${esc(label)} · ${esc(stage)}</h2><div class="list">${entries.map(x=>`<div class="row click" onclick="go('Etapa','${esc(stage)}','${esc(key)}','${esc(x.type)}','${esc(x.id)}')"><span><strong>${esc(x.title)}</strong><div class="note">${esc(x.note)}</div></span><span class="money">${x.pending?'A confirmar':usd(x.amount)}</span></div>`).join('')||'<div class="empty-state">Nenhum lançamento nesta categoria.</div>'}</div>`}
function renderDetail(stage,key,type,id){if(type==='labor'){const x=data.labor.find(y=>y.id===id),pending=!x.rate;view.innerHTML=`<h2 class="section-title">Lançamento de mão de obra</h2><article class="card detail"><strong>${esc(x.worker)}</strong><br>Etapa: ${esc(x.stage)}<br>Data: ${esc(x.date)}${x.entry?`<br>Entrada: ${esc(x.entry)}`:''}${x.exit?`<br>Saída: ${esc(x.exit)}`:''}<br>Horas: ${hoursLabel(x.hours)}<br>Taxa: ${pending?'a confirmar':`${usd(x.rate)}/h`}<br><strong>Total: ${pending?'a calcular':usd(x.total)}</strong></article>`;return}if(type==='commitment'){const x=data.commitments.find(y=>y.id===id);view.innerHTML=`<h2 class="section-title">Subcontratado</h2><article class="card detail"><strong>${providerName(x)}</strong><br>Etapa: ${esc(x.stage)}<br>Valor: <strong>${usd(x.amount)}</strong><br>Status do pagamento: <strong>${paymentPt(x.paymentStatus)}</strong>${x.date?`<br>Data do orçamento: ${esc(x.date)}`:''}<br><span class="note">${esc(x.notes)}</span></article>`;return}const x=data.items.find(y=>y.id===id),p=purchase(x.purchaseId);view.innerHTML=`<h2 class="section-title">Detalhe da compra</h2><article class="card detail"><strong>${esc(x.description)}</strong><br>Loja: ${esc(p?.vendor)}<br>Data: ${esc(p?.date)}<br>Quantidade: ${x.quantity}<br>Preço unitário: ${usd(x.unitCost)}<br>Categoria: ${esc(categoryInfo[categoryKey(x.category)].label)}<br><strong>Total: ${usd(x.total)}</strong><br>Comprovante: ${p?.receipt?`<a href="${esc(p.receipt)}" target="_blank" rel="noopener">abrir comprovante</a>`:'<span class="empty">link ainda não informado</span>'}</article>`}
function render(){if(!selectedProjectId){renderProjects();return}const p=project();if(!p){showProjects();return}const title=document.querySelector('#pageTitle'),subtitle=document.querySelector('#pageSubtitle'),status=document.querySelector('#pageStatus');title.textContent=p.name;subtitle.textContent=`${p.city} · Início ${p.start}`;status.style.display='inline-block';status.textContent=projectStatus(p);const labels=path.slice(1).map((x,i)=>crumb(i===1?(categoryInfo[x]?.label||x):x,...path.slice(0,i+2)));crumbs.innerHTML=`<button class="back-home" onclick="showProjects()">← Voltar para todos os projetos</button><div class="trail">${crumb('Custos por etapa')}${labels.length?' › '+labels.join(' › '):''}</div>`;if(!path.length){renderStageOverview();updateSyncTime();return}const [,stage,key,type,id]=path;if(!key){renderStage(stage);return}if(!type){renderCategory(stage,key);return}renderDetail(stage,key,type,id)}

render();refreshData();

