/* 2D 项目：合成图像、ROI、形态学与逐槽位检测。 */
(function(root){
 'use strict';
 const api=root.VISION_PROJECTS,M=root.VisionTerminalCase,oldMount=api.mount;
 const item={id:'terminal-missing',title:'连接器端子检测：缺失、歪斜与间距',label:'端子检测',desc:'切换端子状态，并用多张合成样本比较阈值、误报和漏检。',links:['article:2d-threshold','project:blob-regions','tool:image-lab'],steps:['确认要求','设置 ROI','阈值分割','形态学','Blob 与槽位','形状与间距','输出判断']};
 api.projects.push(item);
 const options=(key,label,values)=>'<label class="term-select" for="terminal-'+key+'">'+label+'<select id="terminal-'+key+'" data-term-param="'+key+'">'+values.map(v=>'<option value="'+v[0]+'">'+v[1]+'</option>').join('')+'</select></label>';
 const range=(key,label,min,max,step,unit)=>'<label class="term-range" for="terminal-'+key+'"><span>'+label+' <output data-term-value="'+key+'"></output></span><input id="terminal-'+key+'" aria-label="'+label+'" data-term-param="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'"><small>'+unit+'</small></label>';
 function mount(target){
  if(!target)return;
  let state={...M.defaults},step=0,pending=false;
  const scenarios=[
   {id:'missing',label:'缺失 + 干扰',changes:{}},
   {id:'normal',label:'正常五端子',changes:{missing:0,noise:false}},
   {id:'tilt',label:'3 号歪斜',changes:{missing:0,noise:false,tilt:15}},
   {id:'bridge',label:'2 / 3 相邻连通',changes:{missing:0,noise:false,bridge:true}},
   {id:'shift',label:'3 号中心偏移',changes:{missing:0,noise:false,shift:5}}
  ];
  const scenarioButtons=()=>'<div class="term-scenarios" role="group" aria-label="合成端子场景">'+scenarios.map(x=>'<button type="button" data-term-scenario="'+x.id+'" aria-pressed="false">'+x.label+'</button>').join('')+'</div>';
  const controls=options('missing','模拟缺失位置',[[0,'没有缺失'],[1,'缺失 1 号'],[2,'缺失 2 号'],[3,'缺失 3 号'],[4,'缺失 4 号'],[5,'缺失 5 号']])+
   options('noise','模拟槽外亮点干扰',[[1,'开启'],[0,'关闭']])+
   range('tilt','3 号模拟倾斜',-20,20,1,'°；向图像下方时朝右倾为正')+
   range('shift','3 号模拟水平偏移',-6,6,1,'px；画面向右为正')+
   options('bridge','模拟 2 / 3 号连通',[[0,'关闭'],[1,'开启']])+
   range('brightness','模拟端子灰度',50,220,10,'ROI 背景最高灰度为 40，灰度越大越亮')+
   range('threshold','亮前景阈值',0,255,1,'灰度 ≥ 阈值视为前景')+
   range('roiRight','ROI 右边界',60,205,1,'图像像素；左上角固定为 (10, 20)')+
   options('morphology','形态学操作',[['none','不处理'],['open','开运算：先腐蚀后膨胀'],['close','闭运算：先膨胀后腐蚀'],['dilate','膨胀'],['erode','腐蚀']])+
   options('kernelSize','方形核大小',[[3,'3 × 3 px'],[5,'5 × 5 px']])+
   range('minArea','最小候选面积',1,900,1,'px²；未达到面积的 Blob 不参与判断');
  target.innerHTML='<div class="project-workspace field-case terminal-case"><div class="term-batch-jump"><span>想对比误报与漏检？</span><button type="button" data-term-batch-jump>打开多样本实验 ↓</button></div><div class="project-steps" role="group" aria-label="案例步骤">'+item.steps.map((x,i)=>'<button type="button" class="project-step" data-term-step="'+i+'" aria-pressed="'+String(i===0)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+x+'</button>').join('')+'</div><div class="project-columns">'+
   '<section class="project-scene-card"><div class="project-scene-head"><span>IMAGE / 合成连接器</span><span>示例计算 · 非实拍</span></div><div class="term-mobile-scenarios"><strong>一键切换场景</strong><p>切换后看图像，向下查看数量、角度和间距。</p>'+scenarioButtons()+'</div><div class="term-images"><figure><figcaption>① 合成原图</figcaption><canvas data-term-source aria-label="合成连接器原图与 ROI"></canvas></figure><figure><figcaption data-term-view-title>② 当前步骤图像</figcaption><canvas data-term-view aria-label="当前步骤的图像处理结果"></canvas></figure></div><div class="term-slots" data-term-slots aria-label="预设槽位状态"></div><div class="term-legend">绿色：候选位于槽位　红色：槽位未找到候选　橙色：ROI 或待复核<br>第 6 步的线段：由二值前景计算出的候选主轴。</div><p class="project-model-note">五个固定槽位和亮度均为合成数据，左图橙圈标记模拟干扰。本例假定工件位置和图像方向固定；示例仅用于理解，不能直接用于产线判断。端子灰度比 ROI 最高背景灰度至少高 20，且最高背景灰度 &lt; 阈值 ≤ 端子灰度，这不是通用现场标准。真实工件需验证定位、光照、曝光和样件。ROI 外按背景处理。</p><p class="algo-reference">关联：<a href="#image-lab">图像实验区 →</a> · <a href="#project/blob-regions">Blob 连通域案例 →</a></p></section>'+
   '<section class="project-info-card"><div class="project-current"><span class="project-current-step" data-term-current></span><h2 class="project-current-title" data-term-title></h2></div><div class="field-stages"><div><strong>准备</strong><p data-term-prepare></p></div><div><strong>算法</strong><p data-term-algorithm></p></div></div><div class="project-input-heading"><strong>场景与参数</strong><button type="button" class="project-reset" data-term-reset>重置参数</button></div><div class="term-info-scenarios"><p class="term-scenario-hint">点击场景，直接观察第 6 步的数量、倾角和间距。</p>'+scenarioButtons()+'</div><details class="term-details"><summary>展开调整端子和图像参数</summary><div class="term-controls">'+controls+'</div></details><div class="project-output" aria-live="polite"><strong>当前步骤输出</strong><div data-term-output></div></div><div class="project-action"><button type="button" class="project-prev" data-term-prev>← 上一步</button><span class="project-progress" data-term-progress></span><button type="button" class="project-next" data-term-next>下一步 →</button></div></section></div></div><div data-term-batch></div>';
  const q=selector=>target.querySelector(selector);
  function draw(canvas,r,kind,showSlots){
   canvas.width=M.W;canvas.height=M.H;
   const ctx=canvas.getContext('2d'),image=ctx.createImageData(M.W,M.H),binary=kind!=='source',pixels=kind==='threshold'?r.result.thresholdMask:kind==='processed'?r.result.mask:r.gray;
   for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){
    const i=y*M.W+x,k=i*4,inside=x>=r.roi.x&&x<r.roi.x+r.roi.w&&y>=r.roi.y&&y<r.roi.y+r.roi.h;
    const v=binary?(inside?(pixels[i]?255:0):60):pixels[i];image.data[k]=image.data[k+1]=image.data[k+2]=v;image.data[k+3]=255;
   }
   ctx.putImageData(image,0,0);
   if(kind==='source'&&step>=1){ctx.strokeStyle='#ffc875';ctx.lineWidth=1;ctx.setLineDash([3,2]);ctx.strokeRect(r.roi.x+.5,r.roi.y+.5,r.roi.w-1,r.roi.h-1);ctx.setLineDash([])}
   if(kind==='source'&&state.noise){ctx.strokeStyle='#ffb96f';ctx.lineWidth=1;ctx.beginPath();ctx.arc(15,92,4,0,Math.PI*2);ctx.stroke()}
   if(showSlots){
    const colors={found:'#6fe2bd',missing:'#ff8f88',uncovered:'#ffd28b',unverified:'#ffd28b',ambiguous:'#ffd28b'};
    ctx.font='bold 7px sans-serif';ctx.lineWidth=1;
    for(const p of r.slots){ctx.strokeStyle=colors[p.state];ctx.fillStyle=colors[p.state];ctx.setLineDash([2,1]);ctx.strokeRect(p.x+.5,p.y+.5,p.w-1,p.h-1);ctx.setLineDash([]);ctx.fillText(String(p.id),p.x+6,p.y-2)}
    if(binary){ctx.strokeStyle='#ffcf77';ctx.lineWidth=.8;for(const c of r.result.components)ctx.strokeRect(c.x,c.y,c.w,c.h)}
    if(binary&&step>=5)for(const p of r.slots)if(p.angle!==null){
     const c=p.components[0],a=p.angle*Math.PI/180,dx=Math.sin(a)*20,dy=Math.cos(a)*20;
     ctx.strokeStyle=Math.abs(p.angle)>M.ANGLE_LIMIT?'#ff8881':'#70e8cf';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(c.cx-dx,c.cy-dy);ctx.lineTo(c.cx+dx,c.cy+dy);ctx.stroke();
    }
   }
  }
  function update(){
   if(!target.isConnected)return;
   const r=M.analyze(state),raw=r.result,missing=r.missing.join('、')||'无',op={none:'不处理',open:'开运算',close:'闭运算',dilate:'膨胀',erode:'腐蚀'}[state.morphology];
   const view=step<2?'source':step===2?'threshold':'processed';
   draw(q('[data-term-source]'),r,'source',step>=4);draw(q('[data-term-view]'),r,view,step>=4);
   q('[data-term-view-title]').textContent=['② 当前原图','② ROI 范围','② 阈值分割','② 形态学结果','② Blob 与槽位','② 主轴与槽位','② 检测结果'][step];
   const labels={found:'有候选',missing:'无候选',uncovered:'未覆盖',unverified:'待复核',ambiguous:'候选不明确'};
   q('[data-term-slots]').innerHTML=r.slots.map(p=>'<span class="term-slot '+(step>=4?'is-'+p.state:'')+'">'+p.id+' 号 '+(step>=4?labels[p.state]:'待检查')+'</span>').join('');
   const outputValid=r.coverage&&r.quality;
   const trap=raw.acceptedCount===5&&(r.missing.length>0||r.extras.length>0)?'<br><strong>虽然候选总数恰好是 5，但不能只凭数量判定。</strong>':'';
   const angles=r.slots.map(p=>{const bad=p.angle!==null&&Math.abs(p.angle)>M.ANGLE_LIMIT;return '<span class="term-reading'+(bad?' is-outside':'')+'">'+p.id+' 号 '+(p.angle===null?'—':p.angle.toFixed(1)+'°'+(bad?' 超限':''))+'</span>'}).join(' ');
   const pitches=r.pairs.map(p=>'<span class="term-reading'+(p.ok===false?' is-outside':'')+'">'+p.from+'–'+p.to+' '+(p.distance===null?'—':p.distance.toFixed(1)+' px'+(p.ok===false?' 超限':''))+'</span>').join(' ');
   const measurements='<div class="term-measurements"><p><strong>数量</strong> 面积筛选后 '+raw.acceptedCount+' 个候选，'+r.found+' 个槽位找到唯一候选。</p><p><strong>方向</strong> '+angles+'<br><small>图像向下为 0°，向右倾为正；示例范围 ±'+M.ANGLE_LIMIT+'°。</small></p><p><strong>间距</strong> '+pitches+'<br><small>相邻候选质心的水平像素差；示例 '+M.PITCH+' ± '+M.PITCH_TOLERANCE+' px。</small></p></div><small>“—”表示无法可靠计算；图像角度不是机器人 R，像素间距也不是毫米。</small>';
   const descriptions=[
    ['要求五个固定槽位各有一个端子。','当前合成条件：'+(state.missing?'模拟 '+state.missing+' 号缺失':'没有模拟缺失')+'；槽外亮点'+(state.noise?'开启':'关闭')+'。','原图 '+M.W+' × '+M.H+' px；这是生成的灰度图，不是真实拍照。'],
    ['在原图中设置检测区域。','检查 ROI 是否完整覆盖全部预设槽位。','ROI 左上 (10, 20)，右边界 '+state.roiRight+' px；'+(r.coverage?'已覆盖全部槽位。':'部分槽位未完整覆盖，最终只能待复核。')],
    ['使用亮前景规则对 ROI 内像素分割。','本例 ROI 背景最高灰度为 '+M.BG+'，端子灰度为 '+state.brightness+'，灰度 ≥ '+state.threshold+' 作为白色前景。','阈值前景 '+raw.thresholdForeground+' px；'+(r.quality?'本例的已知亮度条件通过。':'示例亮度条件未通过，请检查阈值和对比度。')],
    ['以阈值二值图作为输入。','当前：'+op+'，方形核 '+state.kernelSize+' × '+state.kernelSize+' px。切换方式不会叠加。','前景 '+raw.thresholdForeground+' → '+raw.foreground+' px。开运算可尝试去除较小亮点，也可能改变真实目标。'],
    ['按 8 邻域提取连通域。','面积至少 '+state.minArea+' px² 的候选框，需完整落在某个预设槽位内才分配到该槽位。','连通域 '+raw.allCount+' 个，面积筛选后 '+raw.acceptedCount+' 个；'+(outputValid?'已匹配 '+r.found+' 个槽位，槽外 '+r.extras.length+' 个。':'图像条件或 ROI 未通过，槽位结果需复核。')+trap],
    ['数量相同也可能方向或间距异常。','从处理后的前景像素计算单个候选主轴，再用相邻候选质心的 X 差计算水平间距。两个候选连成一个时不猜测其独立结果。',measurements],
    ['汇总图像条件、槽位、方向和间距。','先确认可以判断，再核对每个槽位与示例限值。相邻连通也可能由反光或阈值等造成。','']
   ][step];
   const status=r.status==='ok'?'OK · 示例通过':r.status==='ng'?'NG · 示例条件未满足':'待复核 · 不输出有效 OK/NG';
   const final='<span class="term-verdict is-'+r.status+'">'+status+'</span><br>'+r.reason+(r.missing.length?'<br>无候选槽位：'+missing+'。这不是对真实工件缺失的确认。':'')+(outputValid?'<br>面积筛选后 '+raw.acceptedCount+' 个候选，槽外 '+r.extras.length+' 个。':'')+trap+measurements;
   q('[data-term-current]').textContent='第 '+(step+1)+' / '+item.steps.length+' 步';q('[data-term-title]').textContent=item.steps[step];
   q('[data-term-prepare]').textContent=descriptions[0];q('[data-term-algorithm]').textContent=descriptions[1];q('[data-term-output]').innerHTML=step===6?final:descriptions[2];
   q('[data-term-progress]').textContent=(step+1)+' / '+item.steps.length;q('[data-term-prev]').disabled=step===0;q('[data-term-next]').disabled=step===item.steps.length-1;
   target.querySelectorAll('[data-term-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.termStep)===step)));
   target.querySelectorAll('[data-term-param]').forEach(el=>{const key=el.dataset.termParam;el.value=['noise','bridge'].includes(key)?(state[key]?'1':'0'):state[key];const out=q('[data-term-value="'+key+'"]');if(out)out.textContent=state[key]+(key==='minArea'?' px²':key==='roiRight'||key==='shift'?' px':key==='tilt'?'°':'')});
   target.querySelectorAll('[data-term-scenario]').forEach(b=>{const scenario=scenarios.find(x=>x.id===b.dataset.termScenario),expected={...M.defaults,...scenario.changes};b.setAttribute('aria-pressed',String(Object.keys(expected).every(k=>state[k]===expected[k])))});
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
  target.querySelectorAll('[data-term-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.termStep);update()}));
  target.querySelectorAll('[data-term-param]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.termParam;state[key]=key==='morphology'?el.value:['noise','bridge'].includes(key)?el.value==='1':Number(el.value);schedule()}));
  target.querySelectorAll('[data-term-scenario]').forEach(b=>b.addEventListener('click',()=>{const scenario=scenarios.find(x=>x.id===b.dataset.termScenario);state={...M.defaults,...scenario.changes};step=5;update()}));
  q('[data-term-prev]').addEventListener('click',()=>{step=Math.max(0,step-1);update()});q('[data-term-next]').addEventListener('click',()=>{step=Math.min(item.steps.length-1,step+1);update()});
  q('[data-term-reset]').addEventListener('click',()=>{state={...M.defaults};step=0;update()});
  q('[data-term-batch-jump]').addEventListener('click',()=>q('.terminal-batch').scrollIntoView({behavior:'smooth',block:'start'}));
  update();
  if(root.VisionTerminalBatchUI)root.VisionTerminalBatchUI.mount(q('[data-term-batch]'));
 }
 api.mount=(target,id)=>id===item.id?mount(target):oldMount(target,id);
})(window);
