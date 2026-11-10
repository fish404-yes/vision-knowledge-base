/* 应用案例按任务归档；每个原有案例继续使用自己的深链。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionCaseIndex=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const definitions=[
  {id:'position',name:'定位抓取',desc:'识别位置、方向和抓取或贴合目标。',topics:[
   {title:'双 Mark 定位',keys:['project:single','project:dual','case:two-mark']},
   {title:'对位贴合',keys:['project:placement']},
   {title:'模板匹配定位',keys:['project:template-localize']}
  ]},
  {id:'measure',name:'测量与检测',desc:'从孔距、轮廓到表面缺陷与端子检测。',topics:[
   {title:'尺寸与孔距测量',keys:['project:measure','project:circle-calipers','case:hole-pitch']},
   {title:'灰度与表面检测',keys:['project:defect-threshold','project:blob-regions','case:scratch']},
   {title:'端子检测',keys:['project:terminal-missing']}
  ]},
  {id:'code',name:'读码与标定',desc:'读取和核对结果，建立图像与物理平面的关系。',topics:[
   {title:'读码结果校验',keys:['project:code-verify']},
   {title:'平面标定与验证',keys:['project:calibration-nine']}
  ]},
  {id:'selection',name:'方案选型',desc:'从工艺需求出发，比较 2D、3D 和采集方式。',topics:[
   {title:'从需求到方案',keys:['case:selection-planar-pick','case:selection-step-height','case:selection-bin-pick']}
  ]}
 ];
 function arrange(projects=[],cases=[]){
  const entries=new Map();
  for(const p of projects){if(p&&p.id)entries.set('project:'+p.id,{key:'project:'+p.id,title:p.title,desc:p.desc,label:'分步互动 · '+p.label,steps:(p.steps||[]).length,href:'#project/'+encodeURIComponent(p.id)})}
  for(const c of cases){if(c&&c.id)entries.set('case:'+c.id,{key:'case:'+c.id,title:c.title,desc:c.desc,label:'应用示例 · '+c.label,steps:(c.stages||[]).length,href:'#case/'+encodeURIComponent(c.id)})}
  const used=new Set();
  const groups=definitions.map(group=>({...group,topics:group.topics.map(topic=>({title:topic.title,items:topic.keys.map(key=>{const entry=entries.get(key);if(!entry||used.has(key))return null;used.add(key);return entry}).filter(Boolean)})).filter(topic=>topic.items.length)}));
  const other=[...entries.values()].filter(entry=>!used.has(entry.key));
  if(other.length)groups.push({id:'other',name:'其他案例',desc:'尚未归入上方分类的案例。',topics:[{title:'其他应用',items:other}]});
  return groups.map(group=>({...group,count:group.topics.reduce((n,topic)=>n+topic.items.length,0)}));
 }
 function mount(target,projects,cases,section,esc){
  const groups=arrange(projects,cases),selected=groups.find(group=>group.id===section),total=groups.reduce((n,group)=>n+group.count,0);
  const cards=items=>'<div class="case-topic-cards">'+items.map(item=>`<a class="case-topic-card" href="${esc(item.href)}"><span>${esc(item.label)} · ${item.steps} 步</span><strong>${esc(item.title)}</strong><p>${esc(item.desc)}</p><b>查看案例 →</b></a>`).join('')+'</div>';
  const topicList=group=>group.topics.map(topic=>`<section class="case-topic"><h2>${esc(topic.title)}</h2>${cards(topic.items)}</section>`).join('');
  const navigation=`<nav class="case-nav" aria-label="案例分类"><a href="#cases" ${!section?'aria-current="page"':''}>分类总览</a>${groups.map(group=>`<a href="#cases/${esc(group.id)}" ${section===group.id?'aria-current="page"':''}>${esc(group.name)} <span>${group.count}</span></a>`).join('')}<a href="#cases/all" ${section==='all'?'aria-current="page"':''}>全部 ${total}</a></nav>`;
  let content;
  if(!section)content=`<div class="case-overview-heading"><h2>选择想解决的问题</h2><p>按应用任务查找；同一主题中的分步互动和应用示例放在一起。</p></div><div class="case-category-grid">${groups.map((group,index)=>`<a class="case-category" href="#cases/${esc(group.id)}"><span>0${index+1} / ${group.count} 个案例</span><strong>${esc(group.name)}</strong><p>${esc(group.desc)}</p><b>查看案例 →</b></a>`).join('')}</div>`;
  else if(section==='all')content=groups.map(group=>`<div class="case-group"><div class="case-group-heading"><h2>${esc(group.name)}</h2><a href="#cases/${esc(group.id)}">单独查看 →</a></div>${topicList(group)}</div>`).join('');
  else if(selected)content=`<div class="case-overview-heading"><h2>${esc(selected.name)}</h2><p>${esc(selected.desc)} 共 ${selected.count} 个案例。</p></div>${topicList(selected)}`;
  else content='<p>没有找到这个分类。<a href="#cases">返回案例总览 →</a></p>';
  target.innerHTML=`<div class="wrap case-index-page"><div class="page-head"><div class="eyebrow">APPLICATION CASES</div><h1>应用案例</h1><p>从实际任务出发，选择分步互动或方案示例。</p></div><p class="case-index-note">图像、数值和流程均为模拟示例；具体方案需要结合设备资料和实际样件验证。</p>${navigation}${content}</div>`;
 }
 return {definitions,arrange,mount};
});
