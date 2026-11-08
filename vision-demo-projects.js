(function(root){
 'use strict';
 const api=root.VISION_PROJECTS,T=root.VisionTemplateDemo,C=root.VisionCircleDemo,oldMount=api.mount;
 const items=[
  {id:'template-localize',title:'模板匹配定位：从图像到坐标',label:'匹配定位',desc:'选择模板、搜索范围与角度，观察相关分数和示例平面坐标。',links:['article:2d-match','issue:matching'],steps:['选择模板','限定范围','匹配输出','物理转换']},
  {id:'circle-calipers',title:'孔距测量：多测量线与圆拟合',label:'尺寸测量',desc:'在合成图像上找孔边、拟合两个圆，再计算圆心间距。',links:['article:2d-measure','case:hole-pitch','tool:image-lab'],steps:['查看工件','布置测量线','采样找边','拟合圆心','计算孔距']}
 ];
 api.projects.push(...items);
 const f=(n,d=1)=>{const x=Math.abs(n)<1e-9?0:n;return Number(x).toFixed(d)};
 const range=(key,label,min,max,step,unit)=>'<label class="project-range" for="algo-'+key+'"><span>'+label+' <output data-display="'+key+'"></output></span><input id="algo-'+key+'" data-param="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'"></label>';
 const select=(key,label,opts)=>'<label class="algo-select" for="algo-'+key+'">'+label+'<select id="algo-'+key+'" data-param="'+key+'">'+opts.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('')+'</select></label>';
 function grayImage(canvas,gray,w,h){canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),out=ctx.createImageData(w,h);for(let i=0;i<gray.length;i++){const k=4*i;out.data[k]=out.data[k+1]=out.data[k+2]=gray[i];out.data[k+3]=255}ctx.putImageData(out,0,0);return ctx}
 function cross(ctx,x,y,color){ctx.strokeStyle=color;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-2.5,y);ctx.lineTo(x+2.5,y);ctx.moveTo(x,y-2.5);ctx.lineTo(x,y+2.5);ctx.stroke()}
 function mount(target,id){
  const item=items.find(p=>p.id===id);if(!item||!target)return;
  const isMatch=id==='template-localize';
  const defaults=isMatch?{x:68,y:38,angle:20,occlusion:0,kind:'A',roi:'all',limit:50,threshold:.8}:{count:24,missing:0,threshold:25,interference:0,scale:'0.05'};
  let state={...defaults},step=0,pending=false;
  const fields=isMatch?
   select('kind','选择模板',[['A','模板 A（工件的基准）'],['B','模板 B（不同特征）']])+
   range('x','工件中心 u',16,95,1,'px')+range('y','工件中心 v',16,59,1,'px')+
   range('angle','图像角度（顺时针为正）',-50,50,10,'°')+range('occlusion','模拟遮挡',0,80,10,'%')+
   select('roi','搜索中心范围',[['all','完整可搜索区域'],['center','中间搜索框']])+
   select('limit','允许角度范围',[['50','−50°～+50°'],['20','−20°～+20°'],['0','仅 0°']])+
   range('threshold','相关分数阈值',.3,.95,.05,''):
   range('count','每个孔的测量线数量',4,24,4,'条')+
   select('missing','模拟缺边角度',[['0','无缺边'],['90','缺边 90°'],['180','缺边 180°'],['270','缺边 270°']])+
   range('threshold','相邻采样差值阈值',10,220,5,'')+
   select('interference','模拟孔内高亮干扰',[['0','关闭'],['1','开启']])+
   '<label class="algo-select" for="algo-scale">示例平面比例（mm/px，可选）<input id="algo-scale" data-param="scale" type="number" min="0.000001" step="any" placeholder="留空仅看像素"></label>';
  target.innerHTML='<div class="project-workspace field-case algo-project"><div class="project-steps" role="group" aria-label="案例步骤">'+item.steps.map((x,i)=>'<button type="button" class="project-step" data-step="'+i+'" aria-pressed="'+String(i===0)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+x+'</button>').join('')+'</div><div class="project-columns"><section class="project-scene-card"><div class="project-scene-head"><span>IMAGE / 合成灰度图</span><span>示例计算 · 非实拍</span></div><div class="algo-visual">'+(isMatch?'<div class="algo-template-box"><span>选择的模板</span><canvas class="algo-template" aria-label="选择的合成模板"></canvas><strong data-template-name></strong></div>':'')+'<div class="algo-image-box"><canvas class="algo-image" aria-label="'+(isMatch?'模板匹配的合成灰度图及搜索结果':'双孔灰度图与测量线拟合示意')+'"></canvas></div></div><div class="algo-legend"></div><p class="project-model-note"></p><p class="algo-reference">参考：<a href="'+(isMatch?'https://docs.opencv.org/4.x/de/da9/tutorial_template_matching.html':'https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html')+'">'+(isMatch?'OpenCV 模板匹配基础':'OpenCV 图像梯度与边缘')+' ↗</a></p></section><section class="project-info-card"><div class="project-current"><span class="project-current-step"></span><h2 class="project-current-title"></h2></div><div class="field-stages"><div><strong>准备</strong><p data-prepare></p></div><div><strong>算法</strong><p data-algorithm></p></div></div><div class="project-input-heading"><strong>调节示例</strong><button type="button" class="project-reset">重置参数</button></div><div class="algo-controls">'+fields+'</div><div class="project-output" aria-live="polite"><strong>当前步骤输出</strong><div data-output></div></div><div class="project-action"><button type="button" class="project-prev">← 上一步</button><span class="project-progress"></span><button type="button" class="project-next">下一步 →</button></div></section></div></div>';
  const canvas=target.querySelector('.algo-image'),output=target.querySelector('[data-output]');
  function drawMatch(image,res){
   const ctx=grayImage(canvas,image.gray,image.w,image.h),preview=target.querySelector('.algo-template');
   grayImage(preview,T.template(state.kind),T.S,T.S);target.querySelector('[data-template-name]').textContent='模板 '+state.kind;
   if(step>=1){const b=res.box;ctx.strokeStyle='#ffca7a';ctx.lineWidth=.65;ctx.setLineDash([2,1]);ctx.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);ctx.setLineDash([])}
   if(step>=2){cross(ctx,image.truth.x,image.truth.y,'#fca866');if(res.accepted){const p=res.best;cross(ctx,p.x,p.y,'#5ff2c8');ctx.strokeStyle='#5ff2c8';ctx.lineWidth=.65;const a=p.angle*Math.PI/180;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+12*Math.cos(a),p.y+12*Math.sin(a));ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,T.R+.5,0,2*Math.PI);ctx.stroke()}}
   target.querySelector('.algo-legend').textContent=step<1?'模板图与当前合成图分别显示。':step===1?'黄色虚框限定候选中心范围，模板边缘可超出此框。':'黄色虚框：搜索中心范围 · 橙色十字：合成真实中心 · 青色：有效匹配结果。';
  }
  function drawCircle(image,a,b){
   const ctx=grayImage(canvas,image.gray,image.w,image.h),sets=[a,b];
   if(step>=1){ctx.lineWidth=.45;ctx.strokeStyle='rgba(255,185,90,.8)';for(const s of sets)for(const ray of s.rays){ctx.beginPath();ctx.moveTo(ray.x1,ray.y1);ctx.lineTo(ray.x2,ray.y2);ctx.stroke()}}
   if(step>=2){ctx.fillStyle='#ffdc82';for(const s of sets)for(const p of s.points){ctx.beginPath();ctx.arc(p.x,p.y,1.4,0,2*Math.PI);ctx.fill()}}
   if(step>=3){for(const s of sets)if(s.fit){ctx.lineWidth=.85;ctx.strokeStyle='#50f4c5';ctx.beginPath();ctx.arc(s.fit.x,s.fit.y,s.fit.radius,0,2*Math.PI);ctx.stroke();cross(ctx,s.fit.x,s.fit.y,'#50f4c5')}}
   if(step>=4&&a.fit&&b.fit){ctx.strokeStyle='#ffbd73';ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(a.fit.x,a.fit.y);ctx.lineTo(b.fit.x,b.fit.y);ctx.stroke()}
   target.querySelector('.algo-legend').textContent=step===0?'两个深色区域是合成孔图像；先观察灰度。':step===1?'橙色线：从已知示例中心向外采样。':step===2?'橙线：测量线 · 黄色点：本次找到的候选边缘。':step===3?'黄点：候选边缘 · 青色圆与十字：拟合结果。':'黄点：候选边缘 · 青色圆与十字：拟合结果 · 橙线：圆心间距。';
  }
  function controls(){
   for(const el of target.querySelectorAll('[data-param]')){
    const key=el.dataset.param;if(document.activeElement!==el)el.value=state[key];
    const label=target.querySelector('[data-display="'+key+'"]');
    if(label)label.textContent=key==='threshold'&&isMatch?f(state[key],2):state[key]+({x:' px',y:' px',angle:'°',occlusion:'%',count:' 条'}[key]||'');
   }
  }
  function matchView(){
   const image=T.scene(state),res=T.match(image,state.roi,Number(state.limit),Number(state.threshold),state.kind),p=T.physical(res);
   const observations=[
    ['给定一张基准图里的模板，示例工件由模板 A 生成。','尝试切换模板 A / B；模板保持固定，工件位置可以移动。','当前选择模板 '+state.kind+'；模板是 21 × 21 px，实际参与相关计算的是半径 8 px 的圆形区域。'],
    ['选定模板后，设定候选中心的搜索范围和允许角度。','在黄色虚框内搜索候选中心；角度每 10° 尝试一次，模板边缘可超出搜索中心范围。','搜索中心 u='+res.box.left+'～'+res.box.right+'、v='+res.box.top+'～'+res.box.bottom+' px；允许角度 ±'+state.limit+'°。'+(!res.truthInside?' 合成真实中心不在搜索框内，仍需防止误匹配。':' 合成真实中心在搜索框内。')],
    ['给定当前图像、模板和阈值。','计算每个候选位置和离散角度的去均值归一化相关，取最高分；分数达到阈值才输出。',(res.best?'最高相关分 '+f(res.best.score,3)+'，阈值 '+f(state.threshold,2)+'。':'没有可比较的有效候选。')+(res.accepted?'<br>阈值通过：匹配中心 ('+res.best.x+', '+res.best.y+') px；图像角度 '+res.best.angle+'°。<br>与合成真实中心相差 '+f(Math.hypot(res.best.x-image.truth.x,res.best.y-image.truth.y),1)+' px（仅示例可知真值）。':'<br>未达到阈值，本例不输出有效位置或角度。')+(!res.truthInside?'<br>合成真实中心在搜索框外；即使出现高分也可能是误匹配。':'')],
    ['只对通过阈值的结果进行示例坐标转换。','人为设定固定平面映射：X=100+0.2u、Y=200−0.2v（mm）；图像 v 向下、角度顺时针为正；平面 X 向右、Y 向上、逆时针为正。',p?'输入像素 ('+res.best.x+', '+res.best.y+') px，图像角度 '+res.best.angle+'°。<br>示例平面坐标 X='+f(p.x,1)+'，Y='+f(p.y,1)+' mm；平面方向 '+f(p.angle,0)+'°。<br>与合成真实中心相差 '+f(Math.hypot(res.best.x-image.truth.x,res.best.y-image.truth.y),1)+' px；阈值通过不保证结果正确。':'匹配未通过阈值，不进行位置或角度转换。']
   ][step];
   drawMatch(image,res);
   target.querySelector('.project-model-note').textContent='本例对合成灰度图使用去均值归一化相关，角度按 10° 离散搜索；分数不是成功概率，也不等同商业软件的分数。平面映射是人为设定的演示，不自动代表机器人基坐标。';
   return observations;
  }
  function circleView(){
   const image=C.scene(state),a=C.scan(image,C.HOLES[0],Number(state.count),Number(state.threshold)),b=C.scan(image,C.HOLES[1],Number(state.count),Number(state.threshold)),raw=String(state.scale).trim(),scale=raw===''?null:Number(raw),badScale=raw!==''&&(!Number.isFinite(scale)||scale<=0||!Number.isFinite(Math.hypot(C.W,C.H)*scale)),distance=C.measure(a,b,badScale?null:scale);
   const detail=(name,part)=>name+'：有效边缘 '+part.points.length+' / '+state.count+'，角覆盖 '+f(part.coverage,0)+'°；'+(part.fit?'圆心 ('+f(part.fit.x,2)+', '+f(part.fit.y,2)+') px，半径 '+f(part.fit.radius,2)+' px，径向残差 RMS '+f(part.fit.rms,2)+' px。':part.reason+'，不输出有效圆。');
   const observations=[
    ['给定一张有两个深色圆孔的合成灰度图。','已知示例搜索中心和半径范围；可以模拟孔边缺失与内部高亮干扰。','图像 '+C.W+' × '+C.H+' px。搜索中心由示例给定并与合成中心重合；圆心由边缘点拟合。'],
    ['在两个示例搜索中心周围布置测量线。','每条线从中心附近向外扫描；本例每孔 '+state.count+' 条，按角度均匀分布。','橙线显示扫描范围。现场搜索中心、宽度和方向也需要事先设置。'],
    ['沿每条测量线读取灰度。','从暗到亮寻找最大的相邻采样跳变；达到差值阈值 '+state.threshold+' 才保留一个候选点。','孔 A：'+a.points.length+' / '+state.count+' 个候选边缘；孔 B：'+b.points.length+' / '+state.count+' 个。<br>高亮干扰可能被当成孔边。'],
    ['收集两组候选边缘点。','每组用代数最小二乘拟合圆；本例要求至少 5 个点，方向覆盖 = 360° − 最大空档，且不小于 120°。',detail('孔 A',a)+'<br>'+detail('孔 B',b)+'<br>覆盖条件是本演示设置，不是通用的现场验收标准。'],
    ['只有两个孔都得到有效拟合时，才计算中心距。','在图像中计算两圆心欧氏距离；输入比例时仅按均匀平面比例作演示换算。',distance?'中心距 '+f(distance.pixels,2)+' px'+(badScale?'；比例无效，请输入大于 0 且不过大的有效数值。':distance.mm===null?'；未输入比例，暂不换算毫米。':' ≈ '+f(distance.mm,3)+' mm（示例比例）。')+'<br>孔 A / B 拟合 RMS：'+f(a.fit.rms,2)+' / '+f(b.fit.rms,2)+' px。'+(state.interference?'当前存在合成干扰，请对比边缘点和残差，不要仅凭结果数值判断合格。':''):'至少一个孔的边缘点不足、覆盖不足或拟合失败；不输出有效中心距。']
   ][step];
   drawCircle(image,a,b);
   target.querySelector('.project-model-note').textContent='使用合成图像、已知示例搜索中心和径向灰度差分；拟合为代数最小二乘，未做鲁棒剔除。缺边、反光和干扰可能产生错误边缘。示例平面比例不代表真实标定或测量精度。';
   return observations;
  }
  function update(){
   if(!target.isConnected)return;controls();
   const row=isMatch?matchView():circleView();
   target.querySelector('[data-prepare]').textContent=row[0];target.querySelector('[data-algorithm]').textContent=row[1];output.innerHTML=row[2];
   target.querySelector('.project-current-step').textContent='第 '+(step+1)+' / '+item.steps.length+' 步';
   target.querySelector('.project-current-title').textContent=item.steps[step];
   target.querySelector('.project-progress').textContent=(step+1)+' / '+item.steps.length;
   target.querySelector('.project-prev').disabled=step===0;target.querySelector('.project-next').disabled=step===item.steps.length-1;
   target.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
  target.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update()}));
  target.querySelectorAll('[data-param]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.param;state[key]=['kind','roi','scale'].includes(key)?el.value:Number(el.value);schedule()}));
  target.querySelector('.project-prev').addEventListener('click',()=>{step=Math.max(0,step-1);update()});
  target.querySelector('.project-next').addEventListener('click',()=>{step=Math.min(item.steps.length-1,step+1);update()});
  target.querySelector('.project-reset').addEventListener('click',()=>{state={...defaults};step=0;target.querySelectorAll('[data-param]').forEach(el=>{el.value=state[el.dataset.param]});update()});
  target.querySelectorAll('[data-param]').forEach(el=>{el.value=state[el.dataset.param]});update();
 }
 api.mount=(target,id)=>items.some(p=>p.id===id)?mount(target,id):oldMount(target,id);
})(window);
