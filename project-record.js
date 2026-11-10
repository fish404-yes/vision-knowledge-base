(function(root){
 'use strict';
 const M=root.VisionProjectRecordModel,key='vision-project-record-v1';
 let memory=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const option=(values,value)=>values.map(v=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(v)}</option>`).join('');
 const field=(id,label,value,placeholder='',wide=false,type='text')=>`<label class="record-field${wide?' is-wide':''}"><span>${esc(label)}</span><input type="${type}" data-field="${id}" value="${esc(value)}" ${type==='date'?'':`placeholder="${esc(placeholder)}"`} maxlength="500"></label>`;
 const area=(id,label,value,placeholder='',wide=true)=>`<label class="record-field${wide?' is-wide':''}"><span>${esc(label)}</span><textarea data-field="${id}" rows="3" maxlength="5000" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
 function sample(row,i){return `<article class="record-sample"><div class="record-sample-head"><strong>样件 ${i+1}</strong><button type="button" data-remove="${i}">删除此条</button></div><div class="record-grid">
  <label class="record-field"><span>样件编号</span><input data-row="${i}" data-key="id" value="${esc(row.id)}" maxlength="500" placeholder="例如：良品 01"></label>
  <label class="record-field"><span>样件类别</span><select data-row="${i}" data-key="type">${option(M.sampleTypes,row.type)}</select></label>
  <label class="record-field"><span>拍样条件</span><input data-row="${i}" data-key="condition" value="${esc(row.condition)}" maxlength="500" placeholder="位置、方向、曝光等"></label>
  <label class="record-field"><span>观察或测得值</span><input data-row="${i}" data-key="observation" value="${esc(row.observation)}" maxlength="500" placeholder="写明数据、单位或现象"></label>
  <label class="record-field"><span>填写人判定</span><select data-row="${i}" data-key="result">${option(M.sampleResults,row.result)}</select></label>
  <label class="record-field"><span>备注</span><input data-row="${i}" data-key="note" value="${esc(row.note)}" maxlength="500" placeholder="异常、图片编号或原因"></label>
 </div></article>`}
 function mount(target){
  if(!target||!M)return;
  target.innerHTML='<div class="wrap record-page"></div>';const page=target.querySelector('.record-page');
  let state=memory?M.clean(memory):M.blank(),undo=null,message='',importMessage='',revision=0;
  function remember(){memory=M.clean(state);revision++}
  function setMessage(s){message=s;const node=page.querySelector('[data-message]');if(node)node.textContent=s}
  function updateDerived(){
   const f=state.fields,req=['project','goal','part','area','accuracy','cycle'].filter(k=>f[k].trim()).length;
   const filled=state.samples.filter(s=>s.id.trim()||s.condition.trim()||s.observation.trim()||s.note.trim()||s.type!=='待确认'||s.result!=='未判断').length;
   const nodes=page.querySelectorAll('[data-progress]');if(nodes.length){nodes[0].textContent=req+' / 6 项已填写';nodes[1].textContent=f.selectionSummary.trim()?'已有摘要':'待填写';nodes[2].textContent=filled+' 条有内容';nodes[3].textContent=f.status}
   const preview=page.querySelector('[data-preview-text]');if(preview)preview.textContent=M.toText(state)||'暂时无法生成预览。';
   page.querySelectorAll('[data-undo]').forEach(button=>button.hidden=!undo);
  }
  function render(){const f=state.fields;page.innerHTML=`<div class="page-head"><div class="eyebrow">PROJECT NOTES / 项目记录</div><h1>项目需求与样件验证记录</h1><p>把现场条件、选型思路和拍样结果放在一起，便于自己复盘与团队沟通。</p></div>
   <div class="record-intro"><div><strong>从需求到验证，留下一份清楚的记录</strong><p>内容由填写人确认；可加载演示，也可从空白开始。保存只保留在当前浏览器，文本和 JSON 备份可自行分享。</p>${state.demo?'<span class="record-demo">当前为演示数据 · 并非实际拍样</span>':''}</div><div class="record-intro-actions"><button type="button" data-example>载入演示记录</button><button type="button" data-undo ${undo?'':'hidden'}>撤销上一步</button></div></div>
   <div class="record-flow" aria-label="记录内容"><button type="button" data-jump="record-needs"><b>01</b><span>项目需求<small data-progress></small></span></button><button type="button" data-jump="record-selection"><b>02</b><span>选型条件<small data-progress></small></span></button><button type="button" data-jump="record-samples"><b>03</b><span>样件验证<small data-progress></small></span></button><button type="button" data-jump="record-conclusion"><b>04</b><span>现场结论<small data-progress></small></span></button></div>
   <section class="record-card" id="record-needs"><div class="record-heading"><div><span>01 / REQUIREMENTS</span><h2>项目需求与工况</h2><p>先写清楚要完成什么，以及现场有哪些约束。</p></div></div><div class="record-grid">
    ${field('project','项目名称',f.project,'例如：托盘工件定位')}${field('owner','填写人',f.owner,'例如：视觉工程师')}${field('date','记录日期',f.date,'',false,'date')}${field('cycle','节拍要求',f.cycle,'例如：每件 ≤ 2 s')}
    ${area('goal','应用目标与输出',f.goal,'例如：识别工件位置和角度，输出到机器人')}${area('part','工件材质与关键特征',f.part,'例如：哑光金属，定位孔与外轮廓')}${area('area','拍摄／测量范围与安装空间',f.area,'例如：范围 150 × 120 mm，工作距离待确认')}${area('accuracy','允许误差或判定要求',f.accuracy,'写明测量对象、单位与判定方式')}${area('environment','现场环境',f.environment,'例如：振动、环境光、温度或防护要求')}
   </div></section>
   <section class="record-card" id="record-selection"><div class="record-heading"><div><span>02 / SELECTION</span><h2>选型与待确认</h2><p>可读取本次浏览中打开过的选型工具，也可以自行填写。</p></div></div><div class="record-import"><div><strong>读取当前选型输入</strong><p>读取会替换下方的选型来源和摘要；其他需求和样件记录保留。工具的默认值和案例假设需要核对。</p><p class="record-import-message" data-import-message role="status">${esc(importMessage)}</p></div><div><button type="button" data-import="2d">读取 2D 条件</button><button type="button" data-import="3d">读取 3D 条件</button><button type="button" data-undo ${undo?'':'hidden'}>撤销上一步</button></div></div><div class="record-grid">
    ${field('selectionSource','选型来源',f.selectionSource,'例如：2D 联合选型或手工填写',true)}${area('selectionSummary','选型条件摘要',f.selectionSummary,'写下视野、工作距离、采样、候选方案或读取当前工具')}${area('setup','相机、镜头、光源或传感器布置',f.setup,'记录型号、安装位置、照明方向及待比较方案')}${area('coordinates','标定、坐标和机器人接口',f.coordinates,'按项目填写坐标系、TCP、触发或通信约定')}${area('pending','待确认事项',f.pending,'例如：实际视野边缘、产品高度、夹爪避让')}
   </div></section>
   <section class="record-card" id="record-samples"><div class="record-heading"><div><span>03 / SAMPLE TEST</span><h2>样件验证</h2><p>每条记录对应一件样品或一次试验；判定由填写人选择。</p></div><button type="button" data-add>＋ 添加样件</button></div><div class="record-grid">${area('testConditions','共同拍样条件',f.testConditions,'记录相机安装、曝光、光源、标定或传感器配置')}${area('acceptance','验收标准及依据',f.acceptance,'写明参考标准、单位与判断方式')}</div><div class="record-sample-list">${state.samples.length?state.samples.map(sample).join(''):'<p class="record-empty">还没有样件条目，可点击“添加样件”。</p>'}</div></section>
   <section class="record-card" id="record-conclusion"><div class="record-heading"><div><span>04 / RESULT</span><h2>现场结论与下一步</h2><p>说明依据和未完成的验证，便于交接。</p></div></div><div class="record-grid"><label class="record-field"><span>填写人选择的状态</span><select data-field="status">${option(M.statusOptions,f.status)}</select></label>${area('conclusion','结论与依据',f.conclusion,'记录实测结果、异常和仍需确认的部分')}${area('nextAction','下一步及负责人',f.nextAction,'例如：补拍最差位置样件并复核误差')}</div></section>
   <section class="record-actions"><div><strong>保存与交接</strong><p>本机只保留一份已保存记录；再次保存会更新它。站内切换暂存当前内容，刷新前请保存或下载备份。</p></div><div class="record-action-buttons"><button type="button" data-save>保存到本机</button><button type="button" data-load>读取本机记录</button><button type="button" data-text>下载文本</button><button type="button" data-json>下载 JSON 备份</button><label class="record-file">导入 JSON 备份<input type="file" accept="application/json,.json" data-file></label><button type="button" data-clear>清空当前内容</button><button type="button" data-undo ${undo?'':'hidden'}>撤销上一步</button></div><p class="record-message" role="status" data-message>${esc(message)}</p></section>
   <details class="record-preview"><summary>预览导出的文本</summary><pre data-preview-text></pre></details>`;updateDerived()}
  function change(fn,notice,keepImportMessage=false){undo=M.clean(state);fn();remember();message=notice;if(!keepImportMessage)importMessage='';render()}
  function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function filename(ext){const title=(state.fields.project.trim()||'视觉项目记录').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,48);return title+'.'+ext}
  function edit(event){const el=event.target;if(el.matches('[data-field]')){state.fields[el.dataset.field]=el.value;undo=null;remember();updateDerived()}else if(el.matches('[data-row][data-key]')){const row=state.samples[Number(el.dataset.row)];if(row){row[el.dataset.key]=el.value;undo=null;remember();updateDerived()}}}
  page.addEventListener('input',edit);page.addEventListener('change',async event=>{
   const el=event.target;if(el.matches('select[data-field],select[data-row][data-key]')){edit(event);return}if(!el.matches('[data-file]'))return;
   const file=el.files&&el.files[0];if(!file)return;el.value='';
   if(file.size>2*1024*1024){setMessage('备份文件超过 2 MB，未导入。');return}
   const priorRevision=revision;try{const raw=await file.text();if(priorRevision!==revision){setMessage('读取期间内容已改变，请重新导入备份。');return}const data=M.decode(raw);if(!data){setMessage('备份格式无效或版本不支持，当前内容未改变。');return}change(()=>{state=data},'已导入备份；可撤销上一步。')}catch(e){setMessage('无法读取文件，当前内容未改变。')}
  });
  page.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button)return;
   if(button.hasAttribute('data-jump')){page.querySelector('#'+button.dataset.jump)?.scrollIntoView({behavior:'smooth',block:'start'});return}
   if(button.hasAttribute('data-example')){change(()=>{state=M.example()},'已载入演示记录；可撤销上一步。');return}
   if(button.hasAttribute('data-add')){if(state.samples.length>=50){setMessage('最多保留 50 条样件记录。');return}change(()=>state.samples.push(M.blankSample()),'已添加一条待填写的样件记录。');return}
   if(button.hasAttribute('data-remove')){const index=Number(button.dataset.remove);if(Number.isInteger(index)&&index>=0&&index<state.samples.length)change(()=>state.samples.splice(index,1),'已删除该条样件记录；可撤销上一步。');return}
   if(button.hasAttribute('data-undo')){if(!undo)return;state=undo;undo=null;remember();message='已撤销上一步；本机已保存记录未改动。';importMessage='';render();return}
   if(button.hasAttribute('data-clear')){change(()=>{state=M.blank()},'已清空当前内容；本机已保存记录未改动。');return}
   if(button.hasAttribute('data-import')){const mode=button.dataset.import,snapshot=mode==='2d'?root.VisionSelection.getDraft():root.VisionChoiceUI.getDraft(),result=mode==='2d'?M.from2d(snapshot):M.from3d(snapshot);if(!result){importMessage='本次浏览还没有打开过 '+mode.toUpperCase()+' 选型；请先到对应工具查看或填写。';page.querySelector('[data-import-message]').textContent=importMessage;setMessage(importMessage);return}importMessage='已读取选型条件；只替换了选型来源和摘要，可撤销上一步。';change(()=>{state.fields.selectionSource=result.source;state.fields.selectionSummary=result.summary},importMessage,true);return}
   if(button.hasAttribute('data-save')){const raw=M.encode(state);if(!raw){setMessage('当前记录格式无效，未保存。');return}try{localStorage.setItem(key,raw);setMessage('已保存到当前浏览器。')}catch(e){setMessage('浏览器存储不可用；请下载备份。')}return}
   if(button.hasAttribute('data-load')){try{const raw=localStorage.getItem(key),data=raw?M.decode(raw):null;if(!data){setMessage('没有找到可读取的本机记录。');return}change(()=>{state=data},'已读取本机记录；可撤销上一步。')}catch(e){setMessage('无法读取本机记录，当前内容未改变。')}return}
   if(button.hasAttribute('data-text')){const result=M.toText(state);if(!result){setMessage('当前记录格式无效，无法导出。');return}download(filename('txt'),'\ufeff'+result,'text/plain;charset=utf-8');setMessage('已生成文本记录。');return}
   if(button.hasAttribute('data-json')){const result=M.encode(state);if(!result){setMessage('当前记录格式无效，无法备份。');return}download(filename('json'),result,'application/json;charset=utf-8');setMessage('已生成 JSON 备份，可在其他浏览器导入。')}
  });
  render();remember();
 }
 root.VisionProjectRecord={mount};
})(window);
