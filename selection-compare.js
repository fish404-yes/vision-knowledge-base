(function(root){
 'use strict';
 const M=root.VisionCompareModel;
 const storageKey='vision-selection-compare-v1';
 const defaults={A:{sensorWidth:'8.45',sensorHeight:'7.07',pixelsWidth:'2448',pixelsHeight:'2048',mode:'fixed',optic:'12',light:'ring',cameraColor:'mono',exposure:'2'},B:{sensorWidth:'8.45',sensorHeight:'7.07',pixelsWidth:'3072',pixelsHeight:'2560',mode:'fixed',optic:'16',light:'back',cameraColor:'mono',exposure:'1'}};
 const materials={matte:'哑光表面','flat-metal':'平整反光面','curved-metal':'曲面反光件',transparent:'透明件'};
 const goals={outline:'外轮廓／孔位',scratch:'划痕／表面纹理',text:'字符／图案',presence:'有无／位置'};
 const access={yes:'背部可布光',no:'背部无法布光',unknown:'背部空间待确认'};
 const colorNeed={yes:'需区分颜色',no:'不依赖颜色',unknown:'颜色需求待确认'};
 const num=(n,d=2)=>Number(n).toFixed(d);
 const label=(id,title,unit,step='any')=>`<label><span>${title} <small>${unit}</small></span><input type="number" step="${step}" min="0" data-field="${id}"></label>`;
 const select=(id,title,options)=>`<label><span>${title}</span><select data-field="${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
 function card(id){return `<article class="compare-card" data-plan="${id}" aria-labelledby="compare-title-${id}"><div class="compare-card-head"><div><span class="compare-index">方案 ${id}</span><h3 id="compare-title-${id}">${id==='A'?'候选方案 A':'候选方案 B'}</h3></div><button type="button" data-fill="${id}">填入当前初选</button></div><div class="compare-graphic" data-graphic="${id}" role="img" aria-label="预测视野和所需视野的覆盖关系图"></div><div class="compare-result" data-result="${id}" aria-live="polite"></div><div class="compare-fields"><h4>候选相机与镜头</h4><div class="compare-grid">${label('sensorWidth','传感器有效宽度','mm')}${label('sensorHeight','传感器有效高度','mm')}${label('pixelsWidth','水平有效像素','px','1')}${label('pixelsHeight','垂直有效像素','px','1')}${select('mode','镜头类型',[['fixed','普通定焦'],['telecentric','物方远心']])}<label><span data-optic-label>镜头焦距 <small>mm</small></span><input type="number" step="any" min="0" data-field="optic"></label>${select('cameraColor','相机类型',[['mono','黑白'],['color','彩色'],['unknown','待确定']])}${select('light','候选光源',Object.entries(M.lights))}${label('exposure','拟用曝光时间','ms')}</div><p>请按同一相机的有效成像区域填写宽、高和像素；填写初选后还需换成具体设备规格。</p></div></article>`}
 function diagram(result,scaleW,scaleH){
  if(!result.valid)return '<div class="compare-graphic-empty">等待有效的方案参数</div>';
  const scale=Math.min(222/scaleW,104/scaleH),vw=result.viewWidth*scale,vh=result.viewHeight*scale,tw=result.neededWidth*scale,th=result.neededHeight*scale;
  return `<svg viewBox="0 0 260 140" aria-hidden="true"><rect x="${num(130-vw/2)}" y="${num(70-vh/2)}" width="${num(vw)}" height="${num(vh)}" class="compare-view" rx="3"/><rect x="${num(130-tw/2)}" y="${num(70-th/2)}" width="${num(tw)}" height="${num(th)}" class="compare-target" rx="3"/><path d="M125 70h10 M130 65v10" class="compare-cross"/></svg><div class="compare-legend"><span>■ 预测视野</span><span>▱ 所需视野（含余量）</span></div>`;
 }
 function resultHtml(r,shared,plan,limit){
  if(!r.valid)return `<div class="compare-invalid" role="status">${r.error}</div>`;
  const badge=(condition,good,bad)=>`<span class="compare-state ${condition?'is-ok':'is-warn'}">${condition?good:bad}</span>`;
  const light=r.lightBlocked?'背面无安装空间，当前背光布置需调整。':r.lightUnknown?'使用背光前先确认背部安装空间。':'效果取决于角度、尺寸和波长，需用样件试光。';
  const directions=[r.suggestedLight,r.alternativeLight].filter((name,index,all)=>name&&all.indexOf(name)===index&&!(shared.context.backlight==='no'&&name==='back')).map(name=>M.lights[name]);
  const lightHint=directions.length?`按工件条件可先试 ${directions.join(' / ')}。`:'需结合安装空间另选光源并试样。';
  const color=r.colorConcern?'<p class="compare-warning">需要区分颜色，当前相机类型需进一步核对。</p>':'';
  const aspect=r.aspectMismatch?'<p class="compare-warning">宽高像素与传感器比例差异较大，请确认 ROI、缩放或像素规格。</p>':'';
  const tele=plan.mode==='telecentric'?'<p class="compare-warning">远心工作距离不能由倍率推定，需核对镜头规格。</p>':'';
  return `<div class="compare-metric"><div><b>视野覆盖</b>${badge(r.covered,'预计覆盖','覆盖不足')}</div><strong>${num(r.viewWidth,1)} × ${num(r.viewHeight,1)} mm</strong><small>所需 ${num(r.neededWidth,1)} × ${num(r.neededHeight,1)} mm</small></div>
  <div class="compare-metric"><div><b>最小特征采样</b>${badge(r.sampled,'达到采样目标','低于采样目标')}</div><strong>水平 ${num(r.featureX)} / 垂直 ${num(r.featureY)} px</strong><small>目标 ≥ ${num(shared.values.featurePixels,1)} px；${num(r.spacingX,4)} / ${num(r.spacingY,4)} mm/px</small></div>
  <div class="compare-metric"><div><b>曝光期间位移</b>${badge(r.withinMotion,'未超过参考值','超过参考值')}</div><strong>${num(r.move,3)} mm</strong><small>水平约 ${num(r.blurX)} / 垂直约 ${num(r.blurY)} px；参考上限 ${num(limit)} px</small></div>
  <div class="compare-light"><b>${M.lights[plan.light]} · 试光候选</b><span>${light}</span><span>${lightHint}</span></div>${color}${aspect}${tele}`;
 }
 function mount(target,bridge){
  if(!target)return null;
  target.innerHTML=`<section class="compare-panel" id="selection-compare" aria-labelledby="compare-heading"><div class="compare-heading"><div><span class="compare-kicker">SIDE BY SIDE / 方案对比</span><h2 id="compare-heading">同一个工件，比较两套成像方案</h2><p>上方工件、检测特征和运动速度作为共同条件；A、B 的相机、镜头、光源和曝光时间分别填写。上方曝光时间仅在填入初选时带入。</p></div><a href="#tools" data-top>调整共同条件 ↑</a></div><div class="compare-shared" data-shared></div><div class="compare-toolbar"><label>曝光位移参考上限 <input type="number" min="0.00001" step="any" value="1" data-limit> px</label><span>按物面水平／垂直方向分别估算；1 px 只是可修改的参考目标。</span><button type="button" data-copy>将 A 复制到 B</button></div><div class="compare-columns">${card('A')}${card('B')}</div><div class="compare-conclusion" data-conclusion aria-live="polite"></div><div class="compare-save"><div><strong>保存与分享对比</strong><p>保存在当前浏览器，包含共同条件及 A/B 参数；会覆盖上一次保存的对比。清除浏览器数据可能丢失。</p></div><div><button type="button" data-save>保存对比</button><button type="button" data-load>载入上次对比</button><button type="button" data-export>下载对比清单</button></div><p data-message role="status"></p></div><p class="compare-note">图形和数值只用于初选。定焦按针孔模型估算，远心按倍率估算；假设视野中心一致且目标位于同一工作平面。实际还须核对镜头像场、接口、工作距离、景深、传输、照明和样件成像。采样间距不是测量精度，光源不能仅凭名称判断效果。<a href="https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-focal-length-and-field-of-view/">焦距与视野</a> · <a href="https://docs.baslerweb.com/optimizing-image-quality">曝光与成像质量</a></p></section>`;
  const fieldNodes=id=>[...target.querySelectorAll(`[data-plan="${id}"] [data-field]`)];
  const write=(id,data)=>fieldNodes(id).forEach(el=>{if(Object.hasOwn(data,el.dataset.field))el.value=String(data[el.dataset.field])});
  const read=id=>Object.fromEntries(fieldNodes(id).map(el=>[el.dataset.field,el.tagName==='SELECT'?el.value:(el.value.trim()===''?NaN:Number(el.value))]));
  const getLimit=()=>{const value=target.querySelector('[data-limit]').value;return value.trim()===''?NaN:Number(value)};
  const message=target.querySelector('[data-message]');
  write('A',defaults.A);write('B',defaults.B);
  function update(){
   const shared=bridge.readShared(),limit=getLimit(),a=read('A'),b=read('B'),ra=M.calculate(shared,a,limit),rb=M.calculate(shared,b,limit);
   const v=shared.values,c=shared.context;
   target.querySelector('[data-shared]').textContent=!M.sharedProblem(shared,limit)?`共同条件：目标 ${num(v.width,1)} × ${num(v.height,1)} mm · 视野余量 ${num(v.margin,0)}% · 工作距离 ${num(v.distance,0)} mm · 最小特征 ${num(v.feature,2)} mm / 目标 ${num(v.featurePixels,1)} px · ${materials[c.material]} / ${goals[c.goal]} · ${access[c.backlight]} · ${colorNeed[c.color]} · 相对速度 ${num(c.speed,1)} mm/s`:M.sharedProblem(shared,limit);
   const valid=[ra,rb].filter(x=>x.valid),scaleW=Math.max(...valid.flatMap(x=>[x.viewWidth,x.neededWidth]),1),scaleH=Math.max(...valid.flatMap(x=>[x.viewHeight,x.neededHeight]),1);
   for(const [id,p,r] of [['A',a,ra],['B',b,rb]]){
    target.querySelector(`[data-graphic="${id}"]`).innerHTML=diagram(r,scaleW,scaleH);
    target.querySelector(`[data-result="${id}"]`).innerHTML=resultHtml(r,shared,p,limit);
    target.querySelector(`[data-plan="${id}"] [data-optic-label]`).innerHTML=p.mode==='telecentric'?'物方倍率 <small>×</small>':'镜头焦距 <small>mm</small>';
   }
   const conclusion=target.querySelector('[data-conclusion]');
   if(!ra.valid||!rb.valid)conclusion.textContent='请先补全两套方案，才能一起比较。';
   else {
    const geometric=[['A',ra],['B',rb]].filter(([,r])=>r.covered&&r.sampled).map(([id])=>id);
    const lead=geometric.length===0?'两套方案均有视野或采样未达到目标，请调整参数。':geometric.length===2?'两套方案的视野与采样均达到输入目标。':`方案 ${geometric[0]} 的视野与采样达到输入目标；另一方案仍需调整。`;
    const motion=!ra.withinMotion||!rb.withinMotion?' 至少一套方案的曝光位移超过参考值。':'';
    conclusion.textContent=lead+motion+' 光源、镜头兼容性和实际精度仍需拍样确认。';
   }
  }
  target.addEventListener('input',event=>{if(event.target.matches('[data-field],[data-limit]'))update()});
  target.addEventListener('change',event=>{if(event.target.matches('[data-field]'))update()});
  target.querySelector('[data-copy]').addEventListener('click',()=>{write('B',read('A'));update();message.textContent='已将 A 的设备参数复制到 B。';});
  target.querySelectorAll('[data-fill]').forEach(button=>button.addEventListener('click',()=>{
   const shared=bridge.readShared(),s=root.VisionSystemSelection.calculate(shared.values,shared.context);
   if(!s.camera||!s.lens||(s.lens.mode==='fixed'&&s.lens.focal===null)){message.textContent='当前初选没有可用的镜头与相机估算，请检查上方条件。';return;}
   write(button.dataset.fill,{sensorWidth:shared.values.sensorWidth,sensorHeight:shared.values.sensorHeight,pixelsWidth:s.camera.pixelsWidth,pixelsHeight:s.camera.pixelsHeight,mode:s.lens.mode,optic:s.lens.mode==='fixed'?s.lens.focal:s.lens.maxMagnification,light:s.lighting.first,cameraColor:shared.context.color==='yes'?'color':shared.context.color==='no'?'mono':'unknown',exposure:shared.context.exposure});
   update();message.textContent=`已填入方案 ${button.dataset.fill} 的估算起点；像素为理论下限，并非相机实际规格，请按设备资料修改。`;
  }));
  target.querySelector('[data-save]').addEventListener('click',()=>{
   const shared=bridge.readShared(),A=read('A'),B=read('B'),limit=getLimit();
   if(!bridge.canWriteShared(shared)||!M.calculate(shared,A,limit).valid||!M.calculate(shared,B,limit).valid){message.textContent='请先输入有效的共同工况、上方初选参数和两套方案参数。';return;}
   try{localStorage.setItem(storageKey,JSON.stringify({version:1,shared,A,B,limit}));message.textContent='已保存到当前浏览器；之前保存的对比已更新。';}catch(e){message.textContent='浏览器存储不可用，未能保存对比。';}
  });
  target.querySelector('[data-load]').addEventListener('click',()=>{
   try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(!saved||saved.version!==1||!M.calculate(saved.shared,saved.A,saved.limit).valid||!M.calculate(saved.shared,saved.B,saved.limit).valid){message.textContent='没有可载入的有效对比记录。';return;}
    if(!bridge.writeShared(saved.shared)){message.textContent='保存的共同条件不完整，无法载入。';return;}write('A',saved.A);write('B',saved.B);target.querySelector('[data-limit]').value=saved.limit;update();message.textContent='已载入共同条件及 A/B 方案。';
   }catch(e){message.textContent='无法读取保存的对比，请检查浏览器存储。';}
  });
  target.querySelector('[data-export]').addEventListener('click',()=>{
   const shared=bridge.readShared(),A=read('A'),B=read('B'),limit=getLimit();
   if(!M.calculate(shared,A,limit).valid||!M.calculate(shared,B,limit).valid){message.textContent='请先输入有效的共同工况和两套方案参数。';return;}
   const describe=(name,p)=>[`方案 ${name}`,'传感器有效面积：'+p.sensorWidth+' × '+p.sensorHeight+' mm','有效像素：'+p.pixelsWidth+' × '+p.pixelsHeight+' px',p.mode==='fixed'?'普通定焦镜头：'+p.optic+' mm':'物方远心镜头：'+p.optic+'×','相机类型：'+({mono:'黑白',color:'彩色',unknown:'待确定'}[p.cameraColor]),'光源：'+M.lights[p.light],'曝光时间：'+p.exposure+' ms',target.querySelector(`[data-result="${name}"]`).innerText];
   const lines=['机器视觉 A/B 选型对比（初步估算）',target.querySelector('[data-shared]').textContent,'曝光位移参考上限：'+limit+' px','',...describe('A',A),'',...describe('B',B),'','对比提示：'+target.querySelector('[data-conclusion]').textContent,'','视野和采样为理想估算；镜头适配、照明与实际精度需按规格和样件验证。'];
   const link=document.createElement('a');link.href=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));link.download='机器视觉AB选型对比.txt';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);message.textContent='已生成 A/B 对比清单。';
  });
  target.querySelector('[data-top]').addEventListener('click',event=>{event.preventDefault();document.querySelector('#selector-title').scrollIntoView({behavior:'smooth',block:'start'});});
  update();return {update};
 }
 root.VisionSelectionCompare={mount};
})(window);
