(function(root){
 'use strict';
 const api=root.VISION_PROJECTS,C=root.VisionFieldCaseModels,L=root.VisionImageLabModel,oldMount=api.mount;
 const extra=[
  {id:'calibration-nine',title:'九点平面标定与独立验证',label:'二维标定',desc:'用九组模拟对应点拟合平面仿射映射，再用未参与拟合的点检查偏差。',steps:['采集点对','拟合映射','独立点检查','换算目标']},
  {id:'blob-regions',title:'Blob 连通域与面积筛选',label:'图像处理',desc:'在合成灰度图中依次设置 ROI、阈值、连通方式与面积筛选。',links:['demo:roi-coordinates'],steps:['查看灰度','设置 ROI','阈值分割','连通域','面积筛选']}
 ];
 api.projects.push(...extra);
 const f=(n,d=2)=>Number(n).toFixed(d),point=p=>`(${f(p.x)}, ${f(p.y)})`;
 function shell(body,label){return `<svg class="project-svg field-svg" viewBox="0 0 720 420" role="img" aria-label="${label}"><rect width="720" height="420" rx="12" fill="#0b182b"/><g stroke="#203449"><path d="M0 70H720 M0 140H720 M0 210H720 M0 280H720 M0 350H720 M90 0V420 M180 0V420 M270 0V420 M360 0V420 M450 0V420 M540 0V420 M630 0V420"/></g>${body}</svg>`}
 function calScene(r,step){
  let shapes='<rect x="40" y="42" width="280" height="302" rx="8" fill="#15283a" stroke="#577b91"/><rect x="385" y="42" width="280" height="302" rx="8" fill="#163934" stroke="#4b8879"/><text x="52" y="31" fill="#b8d2dd" font-size="13">图像点 (u,v) / px</text><text x="397" y="31" fill="#b8e5d8" font-size="13">工作平面点 (X,Y) / mm</text>';
  r.pairs.forEach((p,i)=>{const x=46+p.u*.49,y=50+p.v*.65,X=398+(p.x-100)*1.8,Y=328-(p.y-290)*2.0,color=i===4?'#f2b978':'#73d9bd';shapes+=`<circle cx="${x}" cy="${y}" r="6" fill="${color}"/><text x="${x+8}" y="${y-5}" fill="${color}" font-size="11">P${i+1}</text><circle cx="${X}" cy="${Y}" r="6" fill="${color}"/><text x="${X+8}" y="${Y-5}" fill="${color}" font-size="11">P${i+1}</text>`});
  if(step>=2){const p=r.check,ix=46+p.u*.49,iy=50+p.v*.65,px=398+(p.ref.x-100)*1.8,py=328-(p.ref.y-290)*2.0;shapes+=`<path d="M${ix-7} ${iy}h14 M${ix} ${iy-7}v14 M${px-7} ${py}h14 M${px} ${py-7}v14" stroke="#d7aaff" stroke-width="3"/><text x="${ix+9}" y="${iy-8}" fill="#d7aaff" font-size="11">独立点</text><text x="${px+9}" y="${py-8}" fill="#d7aaff" font-size="11">独立点</text>`}
  if(step>=3){const p=r.target,ix=46+p.u*.49,iy=50+p.v*.65,px=398+(p.pred.x-100)*1.8,py=328-(p.pred.y-290)*2.0;shapes+=`<circle cx="${ix}" cy="${iy}" r="8" fill="none" stroke="#ffd981" stroke-width="3"/><circle cx="${px}" cy="${py}" r="8" fill="none" stroke="#ffd981" stroke-width="3"/><text x="${ix+10}" y="${iy+4}" fill="#ffd981" font-size="11">目标</text><text x="${px+10}" y="${py+4}" fill="#ffd981" font-size="11">映射结果</text>`}
  return shell(shapes+'<text x="46" y="385" fill="#9dbbc5" font-size="12">示例仅适用于固定平面和本次拍照条件；两边图形比例为示意。</text>','九组图像点和物理点的二维平面仿射标定示意');
 }
 function calView(s,step){
  const r=C.calibration(s.error),a=r.fit.coeff,details=`<details class="field-details"><summary>查看九组模拟点对</summary><div class="field-table-wrap"><table><thead><tr><th>点</th><th>图像 (u,v) px</th><th>物理 (X,Y) mm</th></tr></thead><tbody>${r.pairs.map((p,i)=>`<tr><td>P${i+1}</td><td>(${p.u}, ${p.v})</td><td>(${f(p.x)}, ${f(p.y)})</td></tr>`).join('')}</tbody></table></div></details>`;
  const rows=[
   ['在固定拍照条件和已知工作平面采集点。','把每个图像点与同一个物理点配对；P5 可用滑块模拟录入偏差。',`共 ${r.pairs.length} 组点。P5 图像 (${r.pairs[4].u}, ${r.pairs[4].v}) px；物理 ${point(r.pairs[4])} mm。${details}`],
   ['检查九组点覆盖工作区域。','用普通最小二乘拟合二维仿射映射：X、Y 各由 u、v 和常数项计算。',`X = ${f(a[0],4)}u + ${f(a[1],4)}v + ${f(a[2],2)}<br>Y = ${f(a[3],4)}u + ${f(a[4],4)}v + ${f(a[5],2)}<br>拟合点的平面距离均方根残差：${f(r.fit.rms,3)} mm`],
   ['选择未参与拟合的独立检查点。','把检查点的图像坐标带入映射，并与示例参考坐标比较。',`独立图像点 (${r.check.u}, ${r.check.v}) px<br>示例参考 ${point(r.check.ref)} mm<br>映射结果 ${point(r.check.pred)} mm<br>平面距离偏差 ${f(r.check.error,3)} mm`],
   ['确认目标点位于已验证的工作区域内。','使用刚求出的平面映射换算目标图像坐标。',`目标图像点 (${r.target.u}, ${r.target.v}) px<br>映射到本例工作平面 ${point(r.target.pred)} mm<br>结果是否属于机器人基座坐标，取决于标定时物理坐标的定义。`]
  ][step];
  return{scene:calScene(r,step),prepare:rows[0],algorithm:rows[1],output:rows[2],note:'合成示例使用二维仿射最小二乘，物理坐标由示例函数生成；独立点不参与拟合。实际需验证畸变、工作高度与覆盖范围；相机随机械手移动时还需对应拍照位姿和手眼关系。'};
 }
 function blobScene(s,step,result,all){
  const sample=C.blobSample(),cell=42,left=80,top=34;let body='';
  for(let y=0;y<sample.h;y++)for(let x=0;x<sample.w;x++){const i=y*sample.w+x,g=sample.gray[i],inR=x>=sample.roi.x&&x<sample.roi.x+sample.roi.w&&y>=sample.roi.y&&y<sample.roi.y+sample.roi.h,v=step>=2?(inR?(result.mask[i]?'#edf8f3':'#263d4c'):'#475359'):`rgb(${g},${g},${g})`,text=step>=2?(inR?(result.mask[i]?'1':'0'):'·'):g,col=step>=2?(result.mask[i]?'#17372e':'#b9cbd0'):(g<125?'#fff':'#20363e');body+=`<rect x="${left+x*cell}" y="${top+y*cell}" width="39" height="39" rx="3" fill="${v}" stroke="#59707c"/><text x="${left+x*cell+19.5}" y="${top+y*cell+25}" text-anchor="middle" fill="${col}" font-size="12">${text}</text>`}
  if(step>=1)body+=`<rect x="${left+sample.roi.x*cell-3}" y="${top+sample.roi.y*cell-3}" width="${sample.roi.w*cell+3}" height="${sample.roi.h*cell+3}" rx="5" fill="none" stroke="#f3c77b" stroke-width="3" stroke-dasharray="7 5"/>`;
  const shown=step>=4?result:all;if(step>=3)for(const c of shown.components)body+=`<rect x="${left+c.x*cell-2}" y="${top+c.y*cell-2}" width="${c.w*cell}" height="${c.h*cell}" rx="3" fill="none" stroke="#6be1bf" stroke-width="3"/><text x="${left+c.x*cell+3}" y="${top+c.y*cell+13}" fill="#ff9d70" font-size="12">#${c.id}</text>`;
  body+='<text x="82" y="394" fill="#a7c0cd" font-size="12">每格为一个合成像素；原图坐标原点在左上角。</text>';
  return shell(body,'Blob 合成灰度图、ROI 和连通域筛选示意');
 }
 function blobView(s,step){
  const sample=C.blobSample(),opts={roi:sample.roi,threshold:s.threshold,polarity:'dark',connectivity:s.connectivity,minArea:s.area},result=L.analyze(sample.gray,sample.w,sample.h,opts),all=L.analyze(sample.gray,sample.w,sample.h,{...opts,minArea:1});
  const listed=result.components.map(c=>`#${c.id}：面积 ${c.area} px²，质心 (${f(c.cx,1)}, ${f(c.cy,1)}) px`).join('<br>')||'当前没有通过面积筛选的连通域。';
  const rows=[
   ['获取一张图像；这里是 12 × 8 的合成灰度图。','每格是一个像素，灰度范围为 0～255。','观察深色区域，先确认待识别特征。'],
   ['为稳定的检测位置设置 ROI。','只在橙色框内处理；本例 ROI 为原图 X=1～10、Y=1～6。','ROI 共 60 个像素；ROI 外的点不参与统计。'],
   ['在 ROI 中设定前景亮暗和阈值。',`本例灰度 ≤ ${s.threshold} 判为前景 1，其他为背景 0。`,`前景 ${result.foreground} px；阈值过高或过低都可能使目标合并或漏掉。`],
   ['得到二值前景后设置连接方式。',`按 ${s.connectivity} 邻域将相邻前景像素归组；对角相接在两种方式下可能不同。`,`筛选前共 ${all.allCount} 个连通域。编号是本次扫描顺序。`],
   ['按工艺需求设定最小面积。',`保留面积 ≥ ${s.area} px² 的连通域，计算其像素面积和原图质心。`,`通过 ${result.acceptedCount} 个：<br>${listed}<br>面积与位置均为图像像素，不是物理尺寸。`]
  ][step];
  return{scene:blobScene(s,step,result,all),prepare:rows[0],algorithm:rows[1],output:rows[2],note:'合成灰度数据；质心是原图像素索引的平均位置，面积是前景像素个数。阈值、连通方式和面积筛选不能保证真实缺陷检出率。'};
 }
 let serial=0;
 function mount(target,id){
  const p=extra.find(x=>x.id===id);if(!target||!p)return;const uid=++serial,isCal=id==='calibration-nine';let step=0,state=isCal?{error:0}:{threshold:120,area:3,connectivity:8};
  target.innerHTML=`<div class="project-workspace field-case"><div class="project-steps" role="group" aria-label="案例步骤">${p.steps.map((x,i)=>`<button type="button" class="project-step" data-step="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${x}</button>`).join('')}</div><div class="project-columns"><section class="project-scene-card"><div class="project-scene-head"><span>SCENE / 场景示意</span><span>合成数据 · 非实时设备</span></div><div class="project-figure" tabindex="0" role="region" aria-label="案例图示，小屏幕可左右滚动"></div><p class="project-model-note"></p></section><section class="project-info-card"><div class="project-current"><span class="project-current-step"></span><h2 class="project-current-title"></h2></div><div class="field-stages"><div><strong>准备</strong><p data-prepare></p></div><div><strong>算法</strong><p data-algorithm></p></div></div><div class="project-input-heading"><strong>模拟参数</strong><button type="button" class="project-reset">重置参数</button></div><div class="field-controls">${isCal?`<label for="field-${uid}-error">P5 物理 X 录入偏差 <output data-out="error"></output><input id="field-${uid}-error" data-input="error" type="range" min="0" max="12" step="0.5"></label>`:`<label for="field-${uid}-threshold">灰度阈值 <output data-out="threshold"></output><input id="field-${uid}-threshold" data-input="threshold" type="range" min="0" max="255" step="1"></label><label for="field-${uid}-area">最小面积 <output data-out="area"></output><input id="field-${uid}-area" data-input="area" type="range" min="1" max="12" step="1"></label><label for="field-${uid}-connectivity">连接方式 <select id="field-${uid}-connectivity" data-input="connectivity"><option value="8">8 邻域</option><option value="4">4 邻域</option></select></label>`}</div><div class="project-output" aria-live="polite"><strong>输出</strong><div data-output></div></div><div class="project-action"><button type="button" class="project-prev">← 上一步</button><span class="project-progress"></span><button type="button" class="project-next">下一步 →</button></div></section></div></div>`;
  function update(){const v=isCal?calView(state,step):blobView(state,step);target.querySelector('.project-figure').innerHTML=v.scene;target.querySelector('.project-model-note').textContent=v.note;target.querySelector('[data-prepare]').textContent=v.prepare;target.querySelector('[data-algorithm]').textContent=v.algorithm;target.querySelector('[data-output]').innerHTML=v.output;target.querySelector('.project-current-step').textContent=`第 ${step+1} / ${p.steps.length} 步`;target.querySelector('.project-current-title').textContent=p.steps[step];target.querySelector('.project-progress').textContent=`${step+1} / ${p.steps.length}`;target.querySelector('.project-prev').disabled=step===0;target.querySelector('.project-next').disabled=step===p.steps.length-1;target.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));target.querySelectorAll('[data-input]').forEach(el=>{el.value=state[el.dataset.input];const out=target.querySelector('[data-out="'+el.dataset.input+'"]');if(out)out.textContent=state[el.dataset.input]+(el.dataset.input==='error'?' mm':el.dataset.input==='area'?' px²':'')})}
  target.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update()}));target.querySelectorAll('[data-input]').forEach(el=>el.addEventListener('input',()=>{state[el.dataset.input]=Number(el.value);update()}));target.querySelector('.project-prev').addEventListener('click',()=>{step=Math.max(0,step-1);update()});target.querySelector('.project-next').addEventListener('click',()=>{step=Math.min(p.steps.length-1,step+1);update()});target.querySelector('.project-reset').addEventListener('click',()=>{state=isCal?{error:0}:{threshold:120,area:3,connectivity:8};step=0;update()});update();
 }
 api.mount=(target,id)=>extra.some(p=>p.id===id)?mount(target,id):oldMount(target,id);
})(window);
