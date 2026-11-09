/* 2D 项目：合成图像、ROI、形态学与逐槽位检测。 */
(function(root){
 'use strict';
 const api=root.VISION_PROJECTS,M=root.VisionTerminalCase,oldMount=api.mount;
 const item={id:'terminal-missing',title:'连接器端子缺失检测',label:'缺失检测',desc:'用合成连接器图像串联 ROI、阈值、形态学与 Blob，按槽位检查端子。',links:['article:2d-threshold','project:blob-regions','tool:image-lab'],steps:['确认要求','设置 ROI','阈值分割','形态学','Blob 与槽位','输出判断']};
 api.projects.push(item);
 const options=(key,label,values)=>'<label class="term-select" for="terminal-'+key+'">'+label+'<select id="terminal-'+key+'" data-term-param="'+key+'">'+values.map(v=>'<option value="'+v[0]+'">'+v[1]+'</option>').join('')+'</select></label>';
 const range=(key,label,min,max,step,unit)=>'<label class="term-range" for="terminal-'+key+'"><span>'+label+' <output data-term-value="'+key+'"></output></span><input id="terminal-'+key+'" aria-label="'+label+'" data-term-param="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'"><small>'+unit+'</small></label>';
 function mount(target){
  if(!target)return;
  let state={...M.defaults},step=0,pending=false;
  const controls=options('missing','模拟缺失位置',[[0,'没有缺失'],[1,'缺失 1 号'],[2,'缺失 2 号'],[3,'缺失 3 号'],[4,'缺失 4 号'],[5,'缺失 5 号']])+
   options('noise','模拟槽外亮点干扰',[[1,'开启'],[0,'关闭']])+
   range('brightness','模拟端子灰度',50,220,10,'ROI 背景最高灰度为 40，灰度越大越亮')+
   range('threshold','亮前景阈值',0,255,1,'灰度 ≥ 阈值视为前景')+
   range('roiRight','ROI 右边界',60,205,1,'图像像素；左上角固定为 (10, 20)')+
   options('morphology','形态学操作',[['none','不处理'],['open','开运算：先腐蚀后膨胀'],['close','闭运算：先膨胀后腐蚀'],['dilate','膨胀'],['erode','腐蚀']])+
   options('kernelSize','方形核大小',[[3,'3 × 3 px'],[5,'5 × 5 px']])+
   range('minArea','最小候选面积',1,900,1,'px²；未达到面积的 Blob 不参与判断');
  target.innerHTML='<div class="project-workspace field-case terminal-case"><div class="project-steps" role="group" aria-label="案例步骤">'+item.steps.map((x,i)=>'<button type="button" class="project-step" data-term-step="'+i+'" aria-pressed="'+String(i===0)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+x+'</button>').join('')+'</div><div class="project-columns">'+
   '<section class="project-scene-card"><div class="project-scene-head"><span>IMAGE / 合成连接器</span><span>示例计算 · 非实拍</span></div><div class="term-images"><figure><figcaption>① 合成原图</figcaption><canvas data-term-source aria-label="合成连接器原图与 ROI"></canvas></figure><figure><figcaption data-term-view-title>② 当前步骤图像</figcaption><canvas data-term-view aria-label="当前步骤的图像处理结果"></canvas></figure></div><div class="term-slots" data-term-slots aria-label="预设槽位状态"></div><div class="term-legend">绿色：候选位于槽位　红色：槽位未找到候选　橙色：ROI 或待复核</div><p class="project-model-note">五个固定槽位和亮度均为合成数据，左图橙圈标记模拟干扰。本例用已知灰度设置演示条件：端子灰度比 ROI 最高背景灰度至少高 20，且最高背景灰度 &lt; 阈值 ≤ 端子灰度；这不是通用现场标准。槽位内干扰、遮挡与工件偏移仍可能造成误判；实际还需验证工件定位、照明、曝光和样件。ROI 外按背景处理。</p><p class="algo-reference">关联：<a href="#image-lab">图像实验区 →</a> · <a href="#project/blob-regions">Blob 连通域案例 →</a></p></section>'+
   '<section class="project-info-card"><div class="project-current"><span class="project-current-step" data-term-current></span><h2 class="project-current-title" data-term-title></h2></div><div class="field-stages"><div><strong>准备</strong><p data-term-prepare></p></div><div><strong>算法</strong><p data-term-algorithm></p></div></div><div class="project-input-heading"><strong>调节模拟条件</strong><button type="button" class="project-reset" data-term-reset>重置参数</button></div><div class="term-controls">'+controls+'</div><div class="project-output" aria-live="polite"><strong>当前步骤输出</strong><div data-term-output></div></div><div class="project-action"><button type="button" class="project-prev" data-term-prev>← 上一步</button><span class="project-progress" data-term-progress></span><button type="button" class="project-next" data-term-next>下一步 →</button></div></section></div></div>';
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
   }
  }
  function update(){
   if(!target.isConnected)return;
   const r=M.analyze(state),raw=r.result,missing=r.missing.join('、')||'无',op={none:'不处理',open:'开运算',close:'闭运算',dilate:'膨胀',erode:'腐蚀'}[state.morphology];
   const view=step<2?'source':step===2?'threshold':'processed';
   draw(q('[data-term-source]'),r,'source',step>=4);draw(q('[data-term-view]'),r,view,step>=4);
   q('[data-term-view-title]').textContent=['② 当前原图','② ROI 范围','② 阈值分割','② 形态学结果','② Blob 与槽位','② 检测结果'][step];
   const labels={found:'有候选',missing:'无候选',uncovered:'未覆盖',unverified:'待复核',ambiguous:'候选不明确'};
   q('[data-term-slots]').innerHTML=r.slots.map(p=>'<span class="term-slot '+(step>=4?'is-'+p.state:'')+'">'+p.id+' 号 '+(step>=4?labels[p.state]:'待检查')+'</span>').join('');
   const outputValid=r.coverage&&r.quality;
   const trap=raw.acceptedCount===5&&(r.missing.length>0||r.extras.length>0)?'<br><strong>虽然候选总数恰好是 5，但不能只凭数量判定。</strong>':'';
   const descriptions=[
    ['要求五个固定槽位各有一个端子。','当前合成条件：'+(state.missing?'模拟 '+state.missing+' 号缺失':'没有模拟缺失')+'；槽外亮点'+(state.noise?'开启':'关闭')+'。','原图 '+M.W+' × '+M.H+' px；这是生成的灰度图，不是真实拍照。'],
    ['在原图中设置检测区域。','检查 ROI 是否完整覆盖全部预设槽位。','ROI 左上 (10, 20)，右边界 '+state.roiRight+' px；'+(r.coverage?'已覆盖全部槽位。':'部分槽位未完整覆盖，最终只能待复核。')],
    ['使用亮前景规则对 ROI 内像素分割。','本例 ROI 背景最高灰度为 '+M.BG+'，端子灰度为 '+state.brightness+'，灰度 ≥ '+state.threshold+' 作为白色前景。','阈值前景 '+raw.thresholdForeground+' px；'+(r.quality?'本例的已知亮度条件通过。':'示例亮度条件未通过，请检查阈值和对比度。')],
    ['以阈值二值图作为输入。','当前：'+op+'，方形核 '+state.kernelSize+' × '+state.kernelSize+' px。切换方式不会叠加。','前景 '+raw.thresholdForeground+' → '+raw.foreground+' px。开运算可尝试去除较小亮点，也可能改变真实目标。'],
    ['按 8 邻域提取连通域。','面积至少 '+state.minArea+' px² 的候选框，需完整落在某个预设槽位内才分配到该槽位。','连通域 '+raw.allCount+' 个，面积筛选后 '+raw.acceptedCount+' 个；'+(outputValid?'已匹配 '+r.found+' 个槽位，槽外 '+r.extras.length+' 个。':'图像条件或 ROI 未通过，槽位结果需复核。')+trap],
    ['汇总图像条件、ROI 与槽位结果。','先检查能否作出有效判断，再看每个槽位，而不是只比较 Blob 总数。','']
   ][step];
   const status=r.status==='ok'?'OK · 示例通过':r.status==='ng'?'NG · 槽位未找到候选':'待复核 · 不输出有效 OK/NG';
   const final='<span class="term-verdict is-'+r.status+'">'+status+'</span><br>'+r.reason+(r.status==='ng'?'<br>无候选槽位：'+missing+'。这不是对真实工件缺失的确认。':'')+(outputValid?'<br>面积筛选后 '+raw.acceptedCount+' 个候选，槽外 '+r.extras.length+' 个。':'')+trap;
   q('[data-term-current]').textContent='第 '+(step+1)+' / '+item.steps.length+' 步';q('[data-term-title]').textContent=item.steps[step];
   q('[data-term-prepare]').textContent=descriptions[0];q('[data-term-algorithm]').textContent=descriptions[1];q('[data-term-output]').innerHTML=step===5?final:descriptions[2];
   q('[data-term-progress]').textContent=(step+1)+' / '+item.steps.length;q('[data-term-prev]').disabled=step===0;q('[data-term-next]').disabled=step===item.steps.length-1;
   target.querySelectorAll('[data-term-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.termStep)===step)));
   target.querySelectorAll('[data-term-param]').forEach(el=>{const key=el.dataset.termParam;el.value=key==='noise'?(state.noise?'1':'0'):state[key];const out=q('[data-term-value="'+key+'"]');if(out)out.textContent=state[key]+(key==='minArea'?' px²':key==='roiRight'?' px':'')});
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
  target.querySelectorAll('[data-term-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.termStep);update()}));
  target.querySelectorAll('[data-term-param]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.termParam;state[key]=key==='morphology'?el.value:key==='noise'?el.value==='1':Number(el.value);schedule()}));
  q('[data-term-prev]').addEventListener('click',()=>{step=Math.max(0,step-1);update()});q('[data-term-next]').addEventListener('click',()=>{step=Math.min(item.steps.length-1,step+1);update()});
  q('[data-term-reset]').addEventListener('click',()=>{state={...M.defaults};step=0;update()});
  update();
 }
 api.mount=(target,id)=>id===item.id?mount(target):oldMount(target,id);
})(window);
