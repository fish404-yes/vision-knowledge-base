(function(root){
 'use strict';
 const models=root.VisionScenarioModels,api=root.VISION_PROJECTS;
 const originalMount=api.mount;
 const extra=[
  {id:'defect-threshold',title:'灰度阈值与缺陷初筛',label:'表面检测',desc:'通过合成灰度图，分步观察 ROI、二值化、像素统计和阈值判断。',steps:['观察图像','确定 ROI','灰度分割','统计像素','判断结果']},
  {id:'code-verify',title:'读码结果与工艺校验',label:'读码应用',desc:'区分模拟读码失败、识别结果与预期不一致，以及校验通过。',steps:['查看工件','模拟读码','取得文本','比对结果']}
 ];
 api.projects.push(...extra);
 const defs={
  'defect-threshold':[{key:'gray',name:'模拟暗区灰度',min:0,max:255,unit:''},{key:'threshold',name:'分割阈值',min:0,max:255,unit:''},{key:'area',name:'判 NG 的像素数下限',min:1,max:30,unit:'px'}],
  'code-verify':[{key:'read',name:'模拟读码状态（0 失败 / 1 成功）',min:0,max:1,unit:''},{key:'digit',name:'模拟读出文本的末位数字',min:0,max:9,unit:''}]
 };
 const defaults={'defect-threshold':{gray:80,threshold:120,area:3},'code-verify':{read:1,digit:6}};
 let serial=0;
 function scene(body,label){return `<svg class="project-svg" viewBox="0 0 720 420" role="img" aria-label="${label}"><rect width="720" height="420" rx="12" fill="#0b182b"/><g stroke="#203449" stroke-width="1"><path d="M0 70H720 M0 140H720 M0 210H720 M0 280H720 M0 350H720 M90 0V420 M180 0V420 M270 0V420 M360 0V420 M450 0V420 M540 0V420 M630 0V420"/></g>${body}</svg>`}
 function defectView(s,step){
  const r=models.defect(s.gray,s.threshold,s.area);
  let cells='';for(let i=0;i<30;i++){
   const row=Math.floor(i/6),col=i%6,patch=(row===1||row===2)&&(col===2||col===3),v=patch?s.gray:200;
   const mask=step>=2,highlight=v<=s.threshold,fill=mask?(highlight?'#60dec2':'#1f3143'):`rgb(${v},${v},${v})`,color=mask?'#eaf7f2':v<125?'#fff':'#24343c';
   cells+=`<rect x="${150+col*61}" y="${72+row*54}" width="57" height="50" rx="4" fill="${fill}" stroke="#526b7c"/><text x="${178+col*61}" y="${102+row*54}" fill="${color}" text-anchor="middle" font-size="13">${mask?(highlight?'1':'0'):v}</text>`;
  }
  let overlay=step>=1?'<rect x="140" y="62" width="376" height="280" rx="8" fill="none" stroke="#f3c77b" stroke-width="2" stroke-dasharray="7 5"/><text x="144" y="53" fill="#f3c77b" font-size="13">ROI = 全部 30 个像素</text>':'';
  const text=[
   ['合成图像中有 30 个灰度像素；中央 4 个是人为设定的暗区，不是真实拍摄。',`背景灰度 = 200<br>中央暗区灰度 = ${s.gray}<br>拖动滑块观察暗区变化。`],
   ['本例的 ROI 包含全部像素，实际项目应根据工件与位置变化选择稳定的检测范围。','ROI = 6 × 5 = 30 px<br>中央暗区包含 4 px<br>只示意检测区域，不模拟位置修正。'],
   ['灰度小于或等于阈值时标为前景；在真实图像中阈值还可能受到亮度变化和噪声影响。',`当前阈值 = ${s.threshold}<br>规则：灰度 ≤ ${s.threshold} → 前景 1<br>其余像素 → 背景 0`],
   ['这里统计 ROI 中所有前景像素，不计算连通域；背景被分成前景时也会计入。',`暗区前景 = ${r.patch} px<br>背景前景 = ${r.background} px<br>前景合计 = ${r.total} px`],
   ['仅按前景像素总数与示例下限比较。暗区漏检或背景误检时，结果可能误导。',`前景 ${r.total} px；NG 下限 ${s.area} px<br>示例判断：<strong>${r.result}</strong><br>${r.patch===0?'注意：暗区没有被分出；未检出不等于没有缺陷。 ':''}${r.background>0?'注意：背景也被分为前景，可能误报。':''}${r.patch>0&&r.background===0?'还需真实样件和误检漏检验证。':''}`]
  ][step];
  return {scene:scene(`<text x="30" y="28" fill="#c3d6dd" font-size="14">${step>=2?'二值分割结果（1 = 前景）':'合成灰度图（0 ～ 255）'}</text>${cells}${overlay}<text x="150" y="382" fill="#9dbbc5" font-size="12">每格代表一个合成像素；没有实际尺寸</text>`,'合成灰度与阈值像素示意'),explain:text[0],data:text[1],note:'只统计合成像素，不模拟真实缺陷、Blob 连通域、图像噪声或实际检测准确率。'};
 }
 function codeView(s,step){
  const r=models.code(s.read,s.digit,6),bars=Array.from({length:28},(_,i)=>{const widths=[2,5,3,2,6,3,4];let x=175+i*12;return `<rect x="${x}" y="113" width="${widths[i%widths.length]}" height="105" fill="#1c2d39"/>`}).join('');
  let overlay=step>=1?`<rect x="148" y="83" width="390" height="170" fill="none" stroke="${s.read?'#61dec0':'#ffb37f'}" stroke-width="3" stroke-dasharray="8 5"/><text x="153" y="76" fill="#f3c77b" font-size="13">模拟检测区域</text>`:'';
  const texts=[
   ['相机拍摄带码工件。图上的条纹仅用于示意，并不是可解码条码。','准备：确认码区完整、对焦和照明。<br>输出：一张待识别的模拟图像。'],
   ['本例直接用滑块指定读码成功或失败，不运行真实读码算法。',`模拟状态：${s.read?'读码成功':'读码失败'}<br>失败时不能把旧文本当作当前结果。`],
   ['假设算法返回一条文本，供后续工艺校验；读码失败时没有有效文本。',`当前识别文本：<strong>${r.text||'无有效文本'}</strong><br>文本为演示用模拟数据。`],
   ['把本次有效文本与预期内容比较。没有读到时维持未判定，具体重试或剔除策略由工艺决定。',`预期：PART-1006<br>识别：${r.text||'无有效文本'}<br>示例结果：<strong>${r.result}</strong>`]
  ][step];
  return {scene:scene(`<rect x="92" y="65" width="520" height="230" rx="12" fill="#c6dfd6" stroke="#6faba0" stroke-width="2"/><rect x="160" y="102" width="360" height="130" rx="5" fill="#f4f8f4"/>${bars}${overlay}<text x="145" y="343" fill="#a9c5ce" font-size="13">条纹为装饰示意，不编码文字内容</text>`,'读码流程的工件与码区示意'),explain:texts[0],data:texts[1],note:'读码结果由模拟参数直接给出；不代表相机读码能力、码制、校验位或实际生产逻辑。'};
 }
 function mount(target,id){
  const p=extra.find(x=>x.id===id);if(!p||!target)return;
  const fields=defs[id],uid=++serial;let state={...defaults[id]},step=0;
  target.innerHTML=`<div class="project-workspace"><div class="project-steps" role="group" aria-label="案例步骤">${p.steps.map((x,i)=>`<button type="button" class="project-step" data-step="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${x}</button>`).join('')}</div><div class="project-columns"><section class="project-scene-card"><div class="project-scene-head"><span>SCENE / 场景示意</span><span>合成数据 · 非真实设备</span></div><div class="project-figure" tabindex="0" role="region" aria-label="案例场景图，小屏幕可左右滚动"></div><p class="project-model-note"></p></section><section class="project-info-card"><div class="project-current"><span class="project-current-step"></span><h2 class="project-current-title"></h2><p class="project-explain"></p></div><div class="project-input-heading"><strong>模拟参数</strong><button type="button" class="project-reset">重置参数</button></div><p class="project-input-note">参数变化会实时更新当前步骤。</p><div class="project-controls">${fields.map(d=>`<label class="project-range" for="extra-${uid}-${d.key}"><span>${d.name}<output data-out="${d.key}"></output></span><input id="extra-${uid}-${d.key}" type="range" data-input="${d.key}" min="${d.min}" max="${d.max}" step="1"></label>`).join('')}</div><div class="project-output" aria-live="polite"></div><div class="project-action"><button type="button" class="project-prev">← 上一步</button><span class="project-progress"></span><button type="button" class="project-next">下一步 →</button></div></section></div></div>`;
  function update(){const view=id==='defect-threshold'?defectView(state,step):codeView(state,step);target.querySelector('.project-figure').innerHTML=view.scene;target.querySelector('.project-explain').textContent=view.explain;target.querySelector('.project-output').innerHTML=view.data;target.querySelector('.project-model-note').textContent=view.note;target.querySelector('.project-current-step').textContent=`第 ${step+1} / ${p.steps.length} 步`;target.querySelector('.project-current-title').textContent=p.steps[step];target.querySelector('.project-progress').textContent=`${step+1} / ${p.steps.length}`;target.querySelector('.project-prev').disabled=step===0;target.querySelector('.project-next').disabled=step===p.steps.length-1;target.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));fields.forEach(d=>{target.querySelector(`[data-input="${d.key}"]`).value=state[d.key];const text=d.key==='read'?(state.read?'1 · 成功':'0 · 失败'):state[d.key]+(d.unit?' '+d.unit:'');target.querySelector(`[data-out="${d.key}"]`).textContent=text})}
  target.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update()}));target.querySelectorAll('[data-input]').forEach(e=>e.addEventListener('input',()=>{state[e.dataset.input]=Number(e.value);update()}));target.querySelector('.project-prev').addEventListener('click',()=>{step=Math.max(0,step-1);update()});target.querySelector('.project-next').addEventListener('click',()=>{step=Math.min(p.steps.length-1,step+1);update()});target.querySelector('.project-reset').addEventListener('click',()=>{state={...defaults[id]};step=0;update()});update();
 }
 api.mount=(target,id)=>extra.some(p=>p.id===id)?mount(target,id):originalMount(target,id);
})(window);
