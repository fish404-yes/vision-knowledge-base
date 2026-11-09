/* 2D / 3D 方案初选；用户规格仅保存在本机，数值核对不等于产线验收。 */
(function(root){
 'use strict';
 const M=root.VisionChoiceModel,key='vision-3d-selection-draft-v1';
 let shared={task:'unknown',height:'unknown',coverage:'unknown',motion:'unknown',material:'unknown'},memoryDraft=null;
 const taskOptions=[['unknown','请选择'],['appearance','颜色、字符或表面纹理'],['xy','平面 X、Y 与角度'],['depth','高度、台阶或截面'],['pose','空间位置与姿态'],['both','外观和高度都要']];
 const heightOptions=[['unknown','还不确定'],['controlled','可以控制'],['variable','有明显变化']];
 const coverOptions=[['unknown','请选择'],['point','固定一个点'],['profile','一条截面轮廓'],['surface','一个区域或整面']];
 const moveOptions=[['unknown','还不确定'],['static','拍摄时可停稳'],['moving','输送或工件持续运动'],['robot','相机或传感器随机器人移动']];
 const materialOptions=[['unknown','还不确定'],['matte','哑光或漫反射'],['reflective','高反光或金属'],['transparent','透明或半透明'],['mixed','多种材质 / 明暗差异大']];
 const types=[['unknown','请选择'],['point','单点位移'],['line','线激光轮廓'],['area','面扫描 / 深度相机']];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=v=>v===''?null:Number(v);
 const fmt=n=>!Number.isFinite(n)?'—':n!==0&&(Math.abs(n)<1e-4||Math.abs(n)>=1e9)?n.toExponential(4):Number(n.toFixed(4)).toString();
 const option=(list,value)=>list.map(([v,label])=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(label)}</option>`).join('');
 const nav=active=>`<nav class="choice-nav" aria-label="选型工具分类"><a href="#tools" ${active==='guide'?'aria-current="page"':''}><span>01</span> 先判断 2D / 3D</a><a href="#tools/2d" ${active==='2d'?'aria-current="page"':''}><span>02</span> 2D 成像选型</a><a href="#tools/3d" ${active==='3d'?'aria-current="page"':''}><span>03</span> 3D 方案初选</a></nav>`;
 function guide(target){
  const examples=[
   {id:'print',label:'字符 / 印刷检测',task:'appearance',height:'controlled'},
   {id:'planar',label:'平面定位抓取',task:'xy',height:'controlled'},
   {id:'variable',label:'高度变化的定位',task:'xy',height:'variable'},
   {id:'height',label:'台阶高度检测',task:'depth',height:'unknown'},
   {id:'picking',label:'散乱件抓取',task:'pose',height:'variable'},
   {id:'both',label:'外观 + 高度',task:'both',height:'unknown'}
  ];
  target.innerHTML=`<section class="choice-panel" aria-labelledby="choice-title"><div class="choice-head"><div><span>START WITH THE TASK</span><h2 id="choice-title">先想清楚：需要得到什么？</h2><p>不要只看工件是平的还是立体的；先看项目最终需要输出什么信息。</p></div></div>
   <div class="choice-principle"><article><b>2D</b><strong>图像里的信息</strong><span>颜色、字符、轮廓、平面位置</span></article><article><b>3D / 位移</b><strong>空间里的信息</strong><span>高度、截面、表面形状或姿态</span></article><article><b>组合</b><strong>两类信息都需要</strong><span>按工艺将 2D 与高度测量配合</span></article></div>
   <div class="choice-examples"><strong>试试常见任务</strong><div role="group" aria-label="2D 与 3D 场景示例">${examples.map(x=>`<button type="button" data-example="${x.id}">${x.label}</button>`).join('')}</div><p>示例只改变下方条件，最终仍需核对工件、节拍和拍样。</p></div>
   <div class="choice-guide-grid"><div class="choice-guide-fields"><label><span>项目需要得到什么？</span><select data-task>${option(taskOptions,shared.task)}</select><small>看的是任务要求，不是工件外形。</small></label><label><span>拍摄时工件高度和倾斜能控制吗？</span><select data-height>${option(heightOptions,shared.height)}</select><small>例如平面定位时，高度变化可能影响成像和抓取。</small></label></div><div class="choice-verdict" data-verdict aria-live="polite"></div></div>
   <p class="choice-foot">判断只是初选，不替代成像、测量精度和现场验证。<a href="#article/3d-overview">查看 2D 与 3D 知识 →</a> · <a href="#demo/3d-compare">比较常见 3D 方法 →</a></p></section>`;
  const q=s=>target.querySelector(s);
  function update(){
   q('[data-task]').value=shared.task;q('[data-height]').value=shared.height;
   const r=M.dimension(shared.task,shared.height);
   q('[data-verdict]').innerHTML=`<span>初步判断</span><h3>${esc(r.title)}</h3><p>${esc(r.reason)}</p><div><a href="#tools/2d">进入 2D 成像选型 →</a><a href="#tools/3d">进入 3D 方案初选 →</a></div>`;
   target.querySelectorAll('[data-example]').forEach(b=>{const e=examples.find(x=>x.id===b.dataset.example);b.setAttribute('aria-pressed',String(shared.task===e.task&&shared.height===e.height))});
  }
  q('[data-task]').addEventListener('change',e=>{shared.task=e.target.value;update()});
  q('[data-height]').addEventListener('change',e=>{shared.height=e.target.value;update()});
  target.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{const e=examples.find(x=>x.id===b.dataset.example);shared.task=e.task;shared.height=e.height;update()}));
  update();
 }
 const reqFields=[
  ['width','所需覆盖宽度（已含余量）','mm','沿横向需要覆盖的范围。'],
  ['height','所需覆盖长度 / 高度（已含余量）','mm','面扫描为第二方向范围；线扫需另核对扫描行程。'],
  ['near','最近工作距离','mm','工作范围中目标最近处距设备的距离。'],
  ['far','最远工作距离','mm','工作范围中目标最远处距设备的距离。'],
  ['feature','最小横向特征','mm','希望识别的最小特征尺寸。'],
  ['samples','该特征期望采样点数','点','自行设定的采样目标，须结合实际算法和样件。'],
  ['tolerance','工艺允许误差','mm','按现场定义填写；不是相机精度推荐值。']
 ];
 const scanFields=[
  ['speed','相对运动速度','mm/s','线扫方向速度；0 表示静止。'],
  ['spacing','期望轮廓间距','mm','相邻轮廓在运动方向上的目标距离。'],
  ['length','计划扫描行程','mm','从首条轮廓开始的目标行程。']
 ];
 const specFields=[
  ['name','候选名称','text','手工填写，不代表网站推荐型号。'],
  ['width','全深度范围内的最小有效宽度','number','面扫描或线轮廓可填写。'],
  ['height','全深度范围内的最小有效高度','number','仅按面扫描字段对照；线扫要看行程。'],
  ['near','规格最近工作距离','number','与所需距离使用相同参考位置。'],
  ['far','规格最远工作距离','number','与所需距离使用相同参考位置。'],
  ['pitch','最差位置 X 点间距','number','填写目标工作范围内可核对的值。'],
  ['frequency','对应曝光下可用线频','number','仅线激光核对；单位 条/s。'],
  ['repeatability','Z 重复性','number','仅展示；需注明统计和测量条件。'],
  ['source','规格来源及条件','text','例如规格书版本、工作距离及曝光条件。']
 ];
 function reqField([id,label,unit,help]){
  return `<label><span>${esc(label)} <small>(${esc(unit)})</small></span><input type="number" inputmode="decimal" step="${id==='samples'?'1':'any'}" min="${id==='speed'?'0':'0.000001'}" data-req="${id}" placeholder="待填写"><small>${esc(help)}</small></label>`;
 }
 function card(id){
  return `<article class="choice-spec"><div class="choice-spec-head"><span>方案 ${id}</span><strong>手工填写设备规格</strong></div><label><span>设备类型</span><select data-spec="${id}" data-key="type">${option(types,'unknown')}</select></label><div class="choice-spec-fields">${specFields.map(([k,l,t,h])=>`<label><span>${esc(l)}${t==='number'?'<small>（'+(k==='frequency'?'条/s':'mm')+'）</small>':''}</span><input type="${t}" ${t==='number'?'inputmode="decimal" min="0.000001" step="any"':'maxlength="120"'} data-spec="${id}" data-key="${k}" placeholder="待填写"><small>${esc(h)}</small></label>`).join('')}</div><div class="choice-spec-result" data-spec-result="${id}" aria-live="polite"></div></article>`;
 }
 function diagram(req){
  const value=(n,unit)=>typeof n==='number'&&Number.isFinite(n)&&n>0?fmt(n)+' '+unit:'待填写';
  return `<svg viewBox="0 0 620 285" role="img" aria-label="所需覆盖范围和最近、最远工作距离的概念示意，不代表具体相机视野"><rect width="620" height="285" rx="12" fill="#102b37"/><path d="M70 42H550M70 42V250" stroke="#416670" stroke-width="1" stroke-dasharray="5 5"/><rect x="72" y="88" width="94" height="54" rx="8" fill="#458e80"/><circle cx="163" cy="115" r="12" fill="#a8e7d1"/><text x="87" y="121" fill="#effbf5" font-size="15">3D 设备</text><path d="M178 104L410 53M178 127L410 225" stroke="#85cdb9" stroke-width="2" stroke-dasharray="6 5"/><path d="M360 63L505 82V224L360 204Z" fill="#82b4ed" fill-opacity=".24" stroke="#8fbff3" stroke-width="2"/><path d="M410 53V225" stroke="#f2bd78" stroke-width="2"/><text x="373" y="45" fill="#ffd29b" font-size="13">目标范围示意</text><text x="260" y="247" fill="#b9d9d5" font-size="12">最近 ${value(req.near,'mm')}　最远 ${value(req.far,'mm')}</text><text x="269" y="270" fill="#b9d9d5" font-size="12">所需范围 ${value(req.width,'mm')} × ${value(req.height,'mm')}</text></svg>`;
 }
 const stateText={pass:['规格数值覆盖','ok'],below:['规格数值不足','warn'],missing:['待填写 / 待确认','neutral'],invalid:['输入无效，请检查','warn'],na:['此项不适用','neutral'],scan:['需另核对扫描行程','neutral'],provided:['已填写，需看条件','neutral']};
 function mount3d(target){
  target.innerHTML=`<section class="choice-panel choice-3d" aria-labelledby="choice-3d-title">
   <div class="choice-head"><div><span>3D SELECTION / INITIAL GUIDE</span><h2 id="choice-3d-title">先选采集方式，再核对参数</h2><p>没有设备规格也可以先判断方向；不确定的项目留空，页面不会当成 0 或通过。</p></div><button type="button" data-example3d>套用线扫示例</button></div>
   <div class="choice-context"><label><span>任务需要什么</span><select data-context="task">${option(taskOptions,shared.task)}</select></label><label><span>需要采集的范围</span><select data-context="coverage">${option(coverOptions,shared.coverage)}</select></label><label><span>采集时如何运动</span><select data-context="motion">${option(moveOptions,shared.motion)}</select></label><label><span>工件表面</span><select data-context="material">${option(materialOptions,shared.material)}</select></label></div>
   <div class="choice-method" data-method aria-live="polite"></div>
   <div class="choice-section-head"><span>01 / WORKING VOLUME</span><h3>明确范围与测量要求</h3><p>下面填写项目要求；请把旋转、位置变化与安全余量考虑进去。最近 / 最远距离应使用同一设备参考位置。</p></div>
   <div class="choice-volume"><div><div data-volume></div><p>只示意目标体积和距离关系，不计算实际相机视野或盲区。<a href="#demo/depth-cloud">看看深度图与点云 →</a></p></div><div class="choice-fields">${reqFields.map(reqField).join('')}</div></div>
   <div class="choice-sampling" data-sampling aria-live="polite"></div>
   <div class="choice-section-head"><span>02 / LINE SCAN</span><h3>线激光扫描：速度与轮廓间距</h3><p>如果方案包含沿运动方向的轮廓扫描，可以填写；面扫描和单点静态测量可留空。</p></div>
   <div class="choice-fields choice-scan-fields">${scanFields.map(reqField).join('')}</div><div class="choice-scan-result" data-scan aria-live="polite"></div>
   <p class="choice-foot">近似线频 = 相对速度 ÷ 轮廓间距；忽略加减速、触发丢失和额外处理时间。应按实际曝光、编码器及设备规格核对。<a href="#demo/laser-scan-cloud">看一条轮廓如何拼成点云 →</a> · <a href="https://docs.cognex.com/vpro_980sr1/web/en/help/html/1ae429e2-2cba-4874-9be7-90afb6eefbb4.htm" target="_blank" rel="noopener noreferrer">参考：速度与轮廓采集 ↗</a></p>
   <details class="choice-compare"><summary><span>03 / 设备规格 A/B 核对</span><strong>已有规格书？展开手工对照</strong><small>所有规格都由你填写；空项显示待确认。</small></summary>
    <p>填写目标工作范围内的有效规格。数值覆盖只表示输入条件下的对照，不能证明拍样精度、有效率或产线合格。</p><div class="choice-spec-grid">${card('A')}${card('B')}</div><p>Z 重复性只显示输入状态；它不是绝对精度、最终测量误差或工艺合格结论。线扫的 Y 方向覆盖需结合行程与同步条件另行核对。</p></details>
   <div class="choice-save"><div><strong>保存这份 3D 条件</strong><p>站内切换会暂存当前输入；刷新前可保存到当前浏览器，需要时读取，不会改写 2D 已保存方案。</p></div><div><button type="button" data-save>保存到本机</button><button type="button" data-load>读取草稿</button><button type="button" data-export>下载清单</button><button type="button" data-reset>清空当前输入</button></div><p role="status" data-message></p></div>
   <p class="choice-foot">这是方案初选和规格人工核对，不推荐具体型号。真实结果受表面、遮挡、标定、距离、曝光、节拍和环境影响，需要用实际工件和条件验证。<a href="#demo/plane-height">查看：基准面与测高 →</a> · <a href="https://support.zivid.com/en/latest/camera/academy/applications/piece-picking/camera-selector.html" target="_blank" rel="noopener noreferrer">参考：3D 场景范围 ↗</a></p>
  </section>`;
  const q=s=>target.querySelector(s),qa=s=>Array.from(target.querySelectorAll(s));
  function readReq(){return Object.fromEntries(qa('[data-req]').map(el=>[el.dataset.req,num(el.value.trim())]))}
  function readSpec(id){const out={};qa('[data-spec="'+id+'"]').forEach(el=>{out[el.dataset.key]=el.type==='number'?num(el.value.trim()):el.value});return out}
  function renderSpec(id,req){
   const spec=readSpec(id),r=M.compare(req,spec);if(!r)return;
   const items=[['宽度',r.width],['第二方向覆盖',r.height],['工作距离',r.range],['横向点间距',r.pitch],['轮廓线频',r.frequency],['Z 重复性',r.repeatability]];
   let scope='';
   if(spec.type==='point'&&shared.coverage==='surface')scope='单点不能直接获得整面：需评估两方向扫描、遮挡与节拍。';
   else if(spec.type==='line'&&shared.coverage==='surface')scope='线轮廓需相对运动与同步后才能组成整面；另核对行程和节拍。';
   else if(spec.type==='point'&&shared.task==='pose')scope='单点位移不能独立给出一般工件的完整空间姿态。';
   else if(spec.type==='unknown')scope='先选择设备类型，才能按对应方式核对规格。';
   q('[data-spec-result="'+id+'"]').innerHTML=(scope?`<p class="choice-spec-scope">${esc(scope)}</p>`:'')+items.map(([label,status])=>`<div><span>${label}</span><strong class="is-${stateText[status][1]}">${stateText[status][0]}</strong></div>`).join('');
  }
  function update(){
   qa('[data-context]').forEach(el=>{shared[el.dataset.context]=el.value});
   const req=readReq(),r=M.method(shared);
   q('[data-method]').innerHTML=`<span>方案初选 · 根据已填条件</span><h3>${esc(r.title)}</h3><p>${esc(r.why)}</p><ul>${r.check.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a href="#demo/3d-compare">了解四种 3D 方法 →</a>`;
   q('[data-volume]').innerHTML=diagram(req);
   const pitch=M.sampling(req.feature,req.samples);
   const allFields=[...reqFields,...scanFields],bad=allFields.filter(([id])=>req[id]!==null&&(!Number.isFinite(req[id])||(id==='speed'?req[id]<0:req[id]<=0)||(id==='samples'&&!Number.isSafeInteger(req[id])))).map(x=>x[1]);
   let geometry=bad.length?'请检查输入：'+bad.join('、')+'。 ':'';
   if(req.near!==null&&req.far!==null&&(!Number.isFinite(req.near)||!Number.isFinite(req.far)||req.near<=0||req.far<=0||req.near>req.far))geometry+='最近 / 最远距离需为正数，且最近距离不大于最远距离。 ';
   q('[data-sampling]').textContent=geometry+(pitch!==null?'按你的目标采样数，横向平均点间距参考 ≤ '+fmt(pitch)+' mm；采样间距不等于测量精度。':'填写正的最小特征和正整数目标点数后，可计算横向采样间距参考。');
   const scan=M.line(req.speed,req.spacing,req.length);
   if(!scan)q('[data-scan]').textContent='填写非负速度和正的轮廓间距后显示理论线频；行程可选填，填写时必须大于 0。';
   else if(scan.stationary)q('[data-scan]').textContent='速度为 0：理论线频为 0 条/秒；静止状态不能完成非零扫描行程。';
   else q('[data-scan]').textContent='理论线频约 '+fmt(scan.frequency)+' 条/秒'+(scan.duration!==null?'；匀速行程约 '+fmt(scan.duration)+' 秒；按起点含一条估算 '+scan.positions+' 个采样位置，末条在 '+fmt(scan.last)+' mm。':'。填写扫描行程后可估算时间和采样位置数。');
   renderSpec('A',req);renderSpec('B',req);memoryDraft=snapshot();
  }
  qa('[data-context],[data-req],[data-spec]').forEach(el=>{el.addEventListener('input',update);el.addEventListener('change',update)});
  q('[data-example3d]').addEventListener('click',()=>{
   const c={task:'depth',coverage:'surface',motion:'moving',material:'matte'};
   Object.entries(c).forEach(([k,v])=>q('[data-context="'+k+'"]').value=v);
   const v={width:'100',height:'50',near:'300',far:'350',feature:'1',samples:'5',tolerance:'0.1',speed:'200',spacing:'0.2',length:'120'};
   Object.entries(v).forEach(([k,n])=>q('[data-req="'+k+'"]').value=n);
   q('[data-message]').textContent='已填入虚构的线扫示例；设备 A/B 规格未自动填写。';update();
  });
  function snapshot(){return {context:Object.fromEntries(qa('[data-context]').map(e=>[e.dataset.context,e.value])),req:Object.fromEntries(qa('[data-req]').map(e=>[e.dataset.req,e.value])),spec:Object.fromEntries(['A','B'].map(id=>[id,Object.fromEntries(qa('[data-spec="'+id+'"]').map(e=>[e.dataset.key,e.value]))]))}}
  q('[data-save]').addEventListener('click',()=>{try{localStorage.setItem(key,JSON.stringify(snapshot()));q('[data-message]').textContent='已保存到当前浏览器。'}catch(e){q('[data-message]').textContent='浏览器存储不可用，未能保存。'}});
  q('[data-load]').addEventListener('click',()=>{try{
   const data=JSON.parse(localStorage.getItem(key)||'null');if(!data||typeof data!=='object'||!data.context||!data.req||!data.spec)throw new Error('missing');
   qa('[data-context]').forEach(el=>{const v=data.context[el.dataset.context];if(typeof v==='string'&&Array.from(el.options).some(o=>o.value===v))el.value=v});
   qa('[data-req]').forEach(el=>{const v=data.req[el.dataset.req];if(typeof v==='string')el.value=v});
   qa('[data-spec]').forEach(el=>{const v=data.spec[el.dataset.spec]?.[el.dataset.key];if(typeof v==='string'&&(el.tagName!=='SELECT'||Array.from(el.options).some(o=>o.value===v)))el.value=v});
   q('[data-message]').textContent='已读取当前浏览器中的 3D 草稿。';update();
  }catch(e){q('[data-message]').textContent='未找到可读取的 3D 草稿。'}});
  q('[data-export]').addEventListener('click',()=>{
   const data=snapshot(),req=readReq(),pitch=M.sampling(req.feature,req.samples),scan=M.line(req.speed,req.spacing,req.length);
   const lines=['3D 视觉方案初选清单（非设备验收）','',...qa('[data-context]').map(e=>e.closest('label').querySelector('span').textContent+'：'+e.selectedOptions[0].textContent),'',...qa('[data-req]').map(e=>e.closest('label').querySelector('span').textContent+'：'+(e.value||'待填写')),'横向采样间距参考：'+(pitch===null?'待确认':fmt(pitch)+' mm'),'线扫理论线频：'+(scan===null?'待确认':fmt(scan.frequency)+' 条/s'),''];
   for(const id of ['A','B']){lines.push('方案 '+id,...qa('[data-spec="'+id+'"]').map(e=>e.closest('label').querySelector('span').textContent+'：'+(e.tagName==='SELECT'?e.selectedOptions[0].textContent:(e.value||'待填写'))),'')}
   lines.push('提示：数值核对不等于现场精度或有效率；实际需结合设备规格和样件验证。');
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));a.download='3D视觉方案初选清单.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);q('[data-message]').textContent='已生成 3D 方案初选清单。';
  });
  q('[data-reset]').addEventListener('click',()=>{qa('[data-context]').forEach(el=>el.value='unknown');qa('[data-req]').forEach(el=>el.value='');qa('[data-spec]').forEach(el=>el.value=el.tagName==='SELECT'?'unknown':'');q('[data-message]').textContent='当前输入已清空；本机已保存的草稿未删除。';update()});
  if(memoryDraft){
   qa('[data-req]').forEach(el=>{const v=memoryDraft.req[el.dataset.req];if(typeof v==='string')el.value=v});
   qa('[data-spec]').forEach(el=>{const v=memoryDraft.spec[el.dataset.spec]?.[el.dataset.key];if(typeof v==='string'&&(el.tagName!=='SELECT'||Array.from(el.options).some(o=>o.value===v)))el.value=v});
  }
  update();
 }
 root.VisionChoiceUI={nav,mount(target,mode){if(!target||!M)return;if(mode==='guide')guide(target);else if(mode==='3d')mount3d(target)}};
})(window);
