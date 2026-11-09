/* 可重现的合成 3D 点云示例。 */
(function(root){
 'use strict';
 const M=root.VisionPlaneFitModel;
 const fmt=(n,d=2)=>Number(n).toFixed(d);
 const stages=[
  {short:'认识点云',title:'先看两类点分别做什么',text:'绿色点来自周围基准区域，橙色点来自凸起区域。灰色叉号是人为标记的无效点；它只显示模拟位置，不参与计算。',focus:'map'},
  {short:'选择基准',title:'用分布在平面上的有效点拟合',text:'普通最小二乘用绿色有效点估计平面。仅剩一列时，点在一条线上，无法唯一确定这个平面。',focus:'map'},
  {short:'对比平面',title:'看拟合平面和合成真值的差别',text:'截面图在 Y = 10 mm 处对比合成真值与拟合结果；残差只描述被用于拟合的点，残差小也不保证整个区域都准确。',focus:'slice'},
  {short:'目标测高',title:'只用有效目标点计算平均高度',text:'计算每个有效橙点到拟合面的法向距离，再求平均。试试让较低一侧缺失，对比有效点均值和完整区域的合成真值。',focus:'result'}
 ];
 const presets=[
  {id:'clean',label:'① 完整对照',changes:{}},
  {id:'noise',label:'② 加入扰动',changes:{noise:1.5}},
  {id:'line',label:'③ 基准仅一列',changes:{reference:'line'}},
  {id:'missing',label:'④ 缺低位目标',changes:{target:'high'}},
  {id:'mixed',label:'⑤ 目标混入基准',changes:{contamination:true}},
  {id:'invalid',label:'⑥ 目标全部无效',changes:{target:'none'}}
 ];
 function dotMap(r,contamination){
  const sx=x=>205+x*3.8,sy=y=>160-y*3.8;
  const points=r.points.map(p=>{
   const x=fmt(sx(p.x),1),y=fmt(sy(p.y),1);
   if(!p.valid)return `<path d="M${fmt(sx(p.x)-4,1)} ${fmt(sy(p.y)-4,1)}l8 8m0 -8l-8 8" fill="none" stroke="#899ca4" stroke-width="2"/>`;
   const color=p.kind==='target'?'#f2a75e':'#6fe1bd';
   return `<circle cx="${x}" cy="${y}" r="5.5" fill="${color}"/>${p.kind==='target'&&contamination?`<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#dcb0ff" stroke-width="2"/>`:''}`;
  }).join('');
  return `<svg viewBox="0 0 420 330" role="img" aria-label="合成点的俯视分布：有效基准点 ${r.refs.length} 个，有效目标点 ${r.targets.length} 个">
   <defs><pattern id="fit-map-grid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" fill="none" stroke="#234852" stroke-width="1"/></pattern></defs>
   <rect width="420" height="330" rx="10" fill="#102b37"/><rect width="420" height="330" fill="url(#fit-map-grid)"/>
   <rect x="224" y="65" width="114" height="114" rx="5" fill="#f2a75e" fill-opacity=".10" stroke="#f2a75e" stroke-dasharray="5 4"/>
   ${points}<path d="M35 295h40M35 295v-40" fill="none" stroke="#8db1b2" stroke-width="1.5"/><text x="80" y="300" fill="#c2ded9" font-size="13">X</text><text x="31" y="249" fill="#c2ded9" font-size="13">Y</text>
   <text x="140" y="318" fill="#b6d5d0" font-size="12">橙框内：目标测量区</text></svg>`;
 }
 function sliceSvg(r,contamination){
  const xTo=x=>70+(x+40)*4.5,zTo=z=>270-(z-35)*4.5, yy=10,t=M.truth;
  const line=(a,b,c)=>`M${fmt(xTo(-40),2)} ${fmt(zTo(a*-40+b*yy+c),2)} L${fmt(xTo(40),2)} ${fmt(zTo(a*40+b*yy+c),2)}`;
  const fitPath=r.fit?`<path d="${line(r.fit.a,r.fit.b,r.fit.c)}" fill="none" stroke="#dcb0ff" stroke-width="3" stroke-dasharray="7 5"/>`:'';
  const dots=r.points.filter(p=>p.y===yy).map(p=>{
   const z=p.valid?p.z:p.idealZ,x=fmt(xTo(p.x),2),y=fmt(zTo(z),2);
   if(!p.valid)return `<path d="M${fmt(xTo(p.x)-4,2)} ${fmt(zTo(z)-4,2)}l8 8m0 -8l-8 8" stroke="#899ca4" stroke-width="2"/>`;
   return `<circle cx="${x}" cy="${y}" r="5" fill="${p.kind==='target'?'#f2a75e':'#6fe1bd'}"/>${p.kind==='target'&&contamination?`<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#dcb0ff" stroke-width="2"/>`:''}`;
  }).join('');
  return `<svg viewBox="0 0 500 320" role="img" aria-label="Y 等于 10 毫米处的局部截面：${r.fit?'合成真值和拟合基准面':'拟合失败，只有合成真值参考线'}">
   <defs><pattern id="fit-slice-grid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#234852" stroke-width="1"/></pattern></defs>
   <rect width="500" height="320" rx="10" fill="#102b37"/><rect width="500" height="320" fill="url(#fit-slice-grid)"/>
   <path d="${line(t.a,t.b,t.c)}" fill="none" stroke="#70dec0" stroke-width="3"/>${fitPath}${dots}
   <path d="M55 270H450M55 275V45" fill="none" stroke="#789da0" stroke-width="1.5"/><text x="455" y="275" fill="#c2ded9" font-size="13">X</text><text x="47" y="38" fill="#c2ded9" font-size="13">Z</text>
   <text x="70" y="301" fill="#b6d5d0" font-size="12">截面 Y = 10 mm；横、纵单位比例相同</text></svg>`;
 }
 function mount(target){
  if(!target||!M)return;
  let state={...M.defaults},stage=0;
  target.innerHTML=`<section class="fit3d" aria-labelledby="fit3d-title">
   <header class="fit3d-head"><div><span>3D VISION / 点云分步案例</span><h2 id="fit3d-title">用多点拟合基准面，再测高度</h2><p>先看点的分布，再切换缺失和干扰，观察拟合面与平均高度如何变化。</p></div><button type="button" data-reset>恢复示例</button></header>
   <div class="fit3d-steps" role="group" aria-label="案例步骤">${stages.map((s,i)=>`<button type="button" data-stage="${i}" aria-pressed="${i===0}"><b>${String(i+1).padStart(2,'0')}</b>${s.short}</button>`).join('')}</div>
   <div class="fit3d-guide"><div><span data-stage-count></span><h3 data-stage-title></h3><p data-stage-text></p></div><div><button type="button" data-prev>← 上一步</button><button type="button" data-next>下一步 →</button></div></div>
   <div class="fit3d-presets"><strong>一键观察</strong><div role="group" aria-label="合成场景对照">${presets.map(p=>`<button type="button" data-preset="${p.id}" aria-pressed="false">${p.label}</button>`).join('')}</div></div>
   <div class="fit3d-controls"><label><span>人为 Z 扰动幅值 <output data-noise-out></output></span><input type="range" min="0" max="2" step=".1" data-noise><small>对有效点叠加可复现的固定图案，非真实相机噪声模型。</small></label>
    <label><span>基准区域有效点</span><select data-reference><option value="all">全部保留</option><option value="left">只保留左侧</option><option value="line">只保留最左一列</option><option value="none">全部无效</option></select></label>
    <label><span>目标区域有效点</span><select data-target><option value="all">全部保留</option><option value="high">低位一侧无效</option><option value="none">全部无效</option></select></label>
    <label class="fit3d-check"><input type="checkbox" data-contamination> 将有效目标点误混入基准拟合</label></div>
   <div class="fit3d-grid"><article class="fit3d-card" data-card="map"><span>01 / POINTS</span><h3>俯视：哪些点有效？</h3><div data-map></div><div class="fit3d-legend"><span><i class="ref"></i>有效基准点</span><span><i class="target"></i>有效目标点</span><span><i class="missing">×</i>无效点</span><span><i class="mixed"></i>误混入基准</span></div><p>目标是 3 × 3 个位置；灰色叉号仅用于标记模拟缺失的位置。</p></article>
    <article class="fit3d-card" data-card="slice"><span>02 / CROSS SECTION</span><h3>截面：基准面拟合得怎样？</h3><div data-slice></div><div class="fit3d-legend"><span><i class="truth"></i>合成真值平面</span><span><i class="fit"></i>拟合平面</span></div><p>这是 Y = 10 mm 的局部截面；只在模拟中知道真值平面。</p></article></div>
   <div class="fit3d-result" data-card="result" aria-live="polite"><h3>拟合和测量结果</h3><div class="fit3d-metrics" data-metrics></div><p class="fit3d-conclusion" data-conclusion></p><details><summary>查看本例的计算方式</summary><p data-formula></p></details></div>
   <p class="fit3d-foot">点云和扰动均为合成数据：参考面真值 Z = 0.12X + 0.06Y + 50；完整目标的法向高度分别为 7、8、9 mm，完整区域平均 8 mm。拟合采用 Z 方向的普通最小二乘；测量是有效目标点到拟合面的平均有符号法向距离。无效点不当作零，灰叉所在位置仅供说明。此示例不模拟真实反光、遮挡机理、设备噪声或点云标定误差；真实工件需要独立样件、覆盖与算法验证。<br><a href="#demo/plane-height">先看：为什么要有基准面 →</a> · <a href="#demo/depth-cloud">查看：深度图与无效点 →</a> · <a href="https://pointclouds.org/documentation/tutorials/planar_segmentation.html" target="_blank" rel="noopener noreferrer">参考：PCL 平面分割 ↗</a></p>
  </section>`;
  const q=s=>target.querySelector(s);
  function updateStage(){
   const s=stages[stage];q('[data-stage-count]').textContent='第 '+(stage+1)+' / '+stages.length+' 步';
   q('[data-stage-title]').textContent=s.title;q('[data-stage-text]').textContent=s.text;
   target.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===stage)));
   target.querySelectorAll('[data-card]').forEach(c=>c.classList.toggle('is-focused',c.dataset.card===s.focus));
   q('[data-prev]').disabled=stage===0;q('[data-next]').disabled=stage===stages.length-1;
  }
  function update(){
   const r=M.evaluate(state);
   q('[data-map]').innerHTML=dotMap(r,state.contamination);q('[data-slice]').innerHTML=sliceSvg(r,state.contamination);
   q('[data-noise]').value=state.noise;q('[data-noise-out]').textContent='± '+fmt(state.noise,1)+' mm';
   q('[data-reference]').value=state.reference;q('[data-target]').value=state.target;q('[data-contamination]').checked=state.contamination;
   target.querySelectorAll('[data-preset]').forEach(b=>{const p=presets.find(x=>x.id===b.dataset.preset),expected={...M.defaults,...p.changes};b.setAttribute('aria-pressed',String(Object.keys(expected).every(k=>expected[k]===state[k])))});
   const metrics=[
    ['基准点',r.refs.length+' / 54',state.contamination?'另有 '+r.targets.length+' 个目标点误混入':'仅统计有效基准点'],
    ['目标有效点',r.targets.length+' / 9','仅这些点参与测高'],
    ['拟合平面',r.fit?'已计算':'无法确定',r.fit?'基准法向残差 RMS '+fmt(r.fit.rms,3)+' mm':(r.refInputCount<3?'有效拟合点不足 3 个':'点的分布退化，无法唯一拟合')],
    ['有效点平均高度',r.mean===null?'无有效结果':fmt(r.mean)+' mm',r.mean===null?'未输出，不能当成 0':'仅代表本次可见点']
   ];
   q('[data-metrics]').innerHTML=metrics.map(([label,value,note])=>`<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
   const parts=[];
   if(!r.fit)parts.push('没有可用的基准面，因此即使目标点存在也无法计算高度。');
   else if(!r.targets.length)parts.push('没有有效目标点，不能计算平均高度。');
   else{
    parts.push('完整目标的合成真值为 '+fmt(r.truthMean)+' mm；当前有效点平均 '+fmt(r.mean)+' mm，差值 '+(r.error>=0?'+':'')+fmt(r.error)+' mm。');
    if(r.targets.length<9)parts.push('目标有缺失：当前均值只代表可见点，不等于完整区域均值。');
    if(r.extrapolates)parts.push('基准点分布未覆盖目标位置，结果涉及外推。');
    if(state.contamination)parts.push('目标点被误当作基准点，普通最小二乘拟合会受其影响。');
    if(state.noise>0)parts.push('扰动既影响平面拟合，也影响目标点；拟合残差不是实际精度保证。');
   }
   q('[data-conclusion]').textContent=parts.join(' ');
   q('[data-formula]').textContent=r.fit?'基准面 Z = '+fmt(r.fit.a,4)+'X + '+fmt(r.fit.b,4)+'Y + '+fmt(r.fit.c,3)+'；实际参与拟合 '+r.refInputCount+' 点。先按 Z 方向残差最小求出平面，再计算每个有效目标点的有符号法向距离并求均值。':'参考点不足或分布退化，无法确定 Z = aX + bY + c 的唯一解；本例不输出高度。';
  }
  target.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{stage=Number(b.dataset.stage);updateStage()}));
  q('[data-prev]').addEventListener('click',()=>{stage=Math.max(0,stage-1);updateStage()});
  q('[data-next]').addEventListener('click',()=>{stage=Math.min(stages.length-1,stage+1);updateStage()});
  target.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state={...M.defaults,...presets.find(p=>p.id===b.dataset.preset).changes};update()}));
  q('[data-noise]').addEventListener('input',e=>{state.noise=Number(e.target.value);update()});
  for(const key of ['reference','target'])q('[data-'+key+']').addEventListener('change',e=>{state[key]=e.target.value;update()});
  q('[data-contamination]').addEventListener('change',e=>{state.contamination=e.target.checked;update()});
  q('[data-reset]').addEventListener('click',()=>{state={...M.defaults};stage=0;updateStage();update()});
  updateStage();update();
 }
 root.VisionPlaneFitDemo={mount};
})(window);
