(function(root){
'use strict';
const model=root.VisionIssueModel;
const h=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function mount(el,initialQuery){
 el.innerHTML='<div class="wrap issue-page"><div class="page-head issue-heading"><div><div class="eyebrow">TROUBLESHOOTING</div><h1>常见问题与排查</h1><p>先选择现场现象，再逐步检查并观察线索。</p></div><div class="issue-path" aria-label="排查过程"><span><b>01</b> 选择现象</span><i aria-hidden="true">→</i><span><b>02</b> 逐步检查</span><i aria-hidden="true">→</i><span><b>03</b> 对照线索</span></div></div>'+
 '<div class="issue-filters"><label class="issue-search"><span>搜索现场现象</span><input type="search" id="issue-search" placeholder="例如：模糊、角度跳变、抓取偏差"></label><div class="issue-categories" role="group" aria-label="按问题类别筛选"></div></div>'+
 '<div class="issue-workspace"><section class="issue-browser" aria-labelledby="issue-browser-title"><div class="issue-section-head"><div><span class="issue-eyebrow">01 / 选择现象</span><h2 id="issue-browser-title">现场遇到了什么？</h2></div><p class="issues-count" role="status" aria-live="polite"></p></div><p class="issue-list-hint">点击一个现象查看检查步骤；手机可左右滑动列表。</p><div id="issue-list" class="issue-list" aria-label="现场问题列表"></div></section>'+
 '<section id="issue-detail" class="issue-detail" tabindex="-1" aria-label="问题排查详情" aria-live="polite"></section></div>'+
 '<p class="notice">观察线索用于缩小排查范围，不代表已确认故障。涉及设备运动和联锁时，请按现场安全流程操作。</p>'+
 '<p class="issue-references">参考资料：<a href="https://docs.cognex.com/isvs_2610/web/EN/InSight_Sheet/Content/Topics/HowTo/VGR/VGR-acq-and-placement.htm">Cognex 图像采集</a> · <a href="https://docs.baslerweb.com/triggered-image-acquisition">Basler 触发采集</a> · <a href="https://www.universal-robots.com/manuals/EN/HTML/SW5_19/Content/prod-usr-man/software/PolyScope/content/installation_g5/installation_TCP_configuration_en.htm">Universal Robots TCP</a></p></div>';
 const search=el.querySelector('#issue-search'),categoryBox=el.querySelector('.issue-categories'),list=el.querySelector('#issue-list'),detail=el.querySelector('#issue-detail'),count=el.querySelector('.issues-count');
 const contentIndex=root.VisionSiteSearch.build(root.VISION_KNOWLEDGE,root.VISION_PROJECTS.projects,root.VISION_EXPERIENCES.catalogue,root.VisionIssues.catalogue,root.VisionPracticalCases.cases);
 const state={category:'all',id:null,step:0,visible:[]};
 search.value=typeof initialQuery==='string'?initialQuery:'';
 function syncQuery(){const q=search.value.trim();try{root.history.replaceState(null,'',q?'#issues?q='+encodeURIComponent(q):'#issues')}catch(e){}}
 function renderCategories(){
  const all=[['all','全部'],...model.categories.map(x=>[x,x])];
  categoryBox.innerHTML=all.map(([id,label])=>{const total=id==='all'?model.cases.length:model.cases.filter(c=>c.category===id).length;return '<button type="button" data-category="'+h(id)+'" aria-pressed="'+String(state.category===id)+'">'+h(label)+' <span>'+total+'</span></button>'}).join('');
 }
 function renderList(){
  list.innerHTML=state.visible.map(c=>'<button type="button" class="issue-option" data-issue="'+h(c.id)+'" aria-pressed="'+String(c.id===state.id)+'"><span class="issue-option-category">'+h(c.category)+'</span><strong>'+h(c.title)+'</strong><span class="issue-option-desc">可能相关：'+h(c.desc)+'</span><span class="issue-option-action">'+(c.id===state.id?'正在查看':'查看排查')+' <b aria-hidden="true">→</b></span></button>').join('');
  root.requestAnimationFrame(revealSelected);
 }
 function revealSelected(){if(!list.isConnected||!root.matchMedia('(max-width: 900px)').matches||!state.id)return;const selected=list.querySelector('[data-issue="'+state.id+'"]');if(!selected)return;const box=list.getBoundingClientRect(),item=selected.getBoundingClientRect();if(item.left<box.left)list.scrollLeft-=box.left-item.left;else if(item.right>box.right)list.scrollLeft+=item.right-box.right}
 function current(){return state.visible.find(c=>c.id===state.id)||null}
 function renderDetail(){
  const c=current();
  if(!c){detail.innerHTML='<div class="issue-empty"><span class="issue-eyebrow">没有匹配的现象</span><h2>换个说法试试</h2><p>可以搜索“模糊”“角度”或“丢帧”，也可以清除筛选查看全部问题。</p><button type="button" data-clear>清除筛选</button></div>';return}
  const step=c.steps[state.step];
  const suggestions=root.VisionSiteSearch.related(contentIndex,'issue:'+c.id,8).filter(x=>x.entry.href!==c.href).slice(0,2);
  const extraLinks=suggestions.map(x=>'<a href="'+h(x.entry.href)+'">'+h(x.entry.title)+' →</a>').join('');
  detail.innerHTML='<div class="issue-detail-head"><div><span class="issue-eyebrow">02 / 当前选择 · '+h(c.category)+'</span><h2>'+h(c.title)+'</h2><p>先从第 1 步开始，也可以直接切换到想看的检查。</p></div><span class="issue-detail-count">'+c.steps.length+' 步</span></div>'+
   '<div class="issue-overview"><div class="issue-cause"><span>可能相关的原因</span><p>'+h(c.desc)+'</p></div><div class="issue-visual">'+root.VisionIssueVisuals.render(c.id)+'</div></div>'+
   '<div class="issue-steps-heading"><div><span class="issue-eyebrow">03 / 排查步骤</span><h3>按顺序缩小范围</h3></div><span>第 '+(state.step+1)+' / '+c.steps.length+' 步</span></div>'+
   '<div class="issue-stepper" role="group" aria-label="选择检查步骤">'+c.steps.map((s,i)=>'<button type="button" data-step="'+i+'" aria-pressed="'+String(i===state.step)+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+h(s.title)+'</strong></button>').join('')+'</div>'+
   '<div class="issue-active-step"><div class="issue-action"><span>这一步怎么做</span><h3>'+h(step.action)+'</h3></div><div class="issue-observation"><span>可以观察什么</span><p>'+h(step.clue)+'</p></div></div>'+
   '<div class="issue-step-actions"><button type="button" data-shift="-1" '+(state.step===0?'disabled':'')+'>← 上一步</button><span>检查 '+(state.step+1)+' / '+c.steps.length+'</span><button type="button" data-shift="1" '+(state.step===c.steps.length-1?'disabled':'')+'>下一步 →</button></div>'+
   '<div class="issue-related"><div><span>继续了解</span><strong>需要结合实际图像和现场记录判断</strong></div><div class="issue-related-links"><a href="'+h(c.href)+'">'+h(c.linkText)+' →</a>'+extraLinks+'</div></div>';
 }
 function refresh(){
  state.visible=model.filter(search.value,state.category);
  if(!state.visible.some(c=>c.id===state.id)){state.id=state.visible.length?state.visible[0].id:null;state.step=0}
  count.textContent=state.visible.length?'找到 '+state.visible.length+' 个现象':'没有匹配的现象';
  renderCategories();renderList();renderDetail();
 }
 search.addEventListener('input',()=>{syncQuery();list.scrollLeft=0;refresh()});
 categoryBox.addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category;list.scrollLeft=0;refresh();const selected=categoryBox.querySelector('[data-category="'+state.category+'"]');if(selected)selected.focus({preventScroll:true})});
 list.addEventListener('click',event=>{const button=event.target.closest('[data-issue]');if(!button)return;state.id=button.dataset.issue;state.step=0;renderList();renderDetail();if(root.matchMedia('(max-width: 900px)').matches){detail.focus({preventScroll:true});detail.scrollIntoView({behavior:root.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}else{const selected=list.querySelector('[data-issue="'+state.id+'"]');if(selected)selected.focus({preventScroll:true})}});
 detail.addEventListener('click',event=>{
  const clear=event.target.closest('[data-clear]');if(clear){search.value='';state.category='all';state.id=null;state.step=0;syncQuery();refresh();search.focus();return}
  const direct=event.target.closest('[data-step]'),shift=event.target.closest('[data-shift]'),c=current();if(!c||(!direct&&!shift))return;
  const next=direct?Number(direct.dataset.step):state.step+Number(shift.dataset.shift);if(!Number.isInteger(next)||next<0||next>=c.steps.length)return;
  state.step=next;renderDetail();const active=detail.querySelector('[data-step="'+state.step+'"]');if(active)active.focus({preventScroll:true});
 });
 const onResize=()=>root.requestAnimationFrame(revealSelected);root.addEventListener('resize',onResize);root.addEventListener('hashchange',()=>root.removeEventListener('resize',onResize),{once:true});
 renderCategories();refresh();
}
root.VisionIssues={mount,catalogue:model.cases.map(c=>({id:c.id,title:c.title,category:c.category,desc:c.desc,aliases:c.aliases,steps:c.steps.map(s=>s.action)}))};
})(window);
