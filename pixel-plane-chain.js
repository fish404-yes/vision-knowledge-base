/* 假设已知工作平面映射：将 ROI 缩放坐标还原后再映射到毫米。 */
(function(root){
 'use strict';
 const M=root.Vision2DBasics;
 let serial=0;
 const fmt=n=>{const x=Math.abs(n)<1e-9?0:n;return Number(x.toFixed(3)).toString()};
 const uv=p=>'('+fmt(p.u)+', '+fmt(p.v)+')';
 const xy=p=>'('+fmt(p.x)+', '+fmt(p.y)+')';
 const control=(uid,key,label,min,max,value)=>'<label class="chain-range" for="chain-'+uid+'-'+key+'"><span>'+label+' <output data-chain-value="'+key+'">'+value+' px</output></span><input id="chain-'+uid+'-'+key+'" data-chain-range="'+key+'" aria-label="'+label+'" type="range" min="'+min+'" max="'+max+'" step="1" value="'+value+'"></label>';
 function scene(s,r,step,compare){
  const point=r.resize.point, sourceX=34,sourceY=66,k=12, outX=348,outY=66;
  const outputK=Math.min(192/r.resize.width,144/r.resize.height);
  const color=step===0||step===1||step===4?'#62dec0':'#42616c';
  const outColor=step===2||step===3?'#62dec0':'#42616c';
  const planeColor=step===5?'#62dec0':'#42616c';
  let srcGrid='',outGrid='',planeGrid='';
  for(let i=1;i<16;i++)srcGrid+='<path d="M'+(sourceX+i*k)+' '+sourceY+'v144"/>';
  for(let i=1;i<12;i++)srcGrid+='<path d="M'+sourceX+' '+(sourceY+i*k)+'h192"/>';
  for(let i=1;i<r.resize.width;i++)outGrid+='<path d="M'+(outX+i*outputK)+' '+outY+'v'+(r.resize.height*outputK)+'"/>';
  for(let i=1;i<r.resize.height;i++)outGrid+='<path d="M'+outX+' '+(outY+i*outputK)+'h'+(r.resize.width*outputK)+'"/>';
  for(let i=1;i<8;i++)planeGrid+='<path d="M'+(649+i*24)+' 66v144"/>';
  for(let i=1;i<6;i++)planeGrid+='<path d="M649 '+(66+i*24)+'h192"/>';
  const sourcePoint='<circle cx="'+(sourceX+(s.u+.5)*k)+'" cy="'+(sourceY+(s.v+.5)*k)+'" r="6" fill="#ffb878" stroke="#fff" stroke-width="1.4"/>';
  const roi='<rect x="'+(sourceX+s.x*k)+'" y="'+(sourceY+s.y*k)+'" width="'+(s.width*k)+'" height="'+(s.height*k)+'" fill="#69dcb9" fill-opacity=".12" stroke="#7de4c7" stroke-width="2"/>';
  const scaledPoint=point&&step>=2?'<circle cx="'+(outX+(point.scaled.u+.5)*outputK)+'" cy="'+(outY+(point.scaled.v+.5)*outputK)+'" r="6" fill="#ffb878" stroke="#fff" stroke-width="1.4"/>':'';
  const planePoint=point&&step===5?'<circle cx="'+(649+(point.original.u+.5)*k)+'" cy="'+(66+(point.original.v+.5)*k)+'" r="6" fill="#77e1bd" stroke="#fff" stroke-width="1.4"/>':'';
  let wrongPoint='';
  if(point&&step===5&&compare&&point.wrong.u>=0&&point.wrong.u<16&&point.wrong.v>=0&&point.wrong.v<12){
   const x1=649+(point.original.u+.5)*k,y1=66+(point.original.v+.5)*k,x2=649+(point.wrong.u+.5)*k,y2=66+(point.wrong.v+.5)*k;
   wrongPoint='<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="#ffb878" stroke-width="2" stroke-dasharray="4 3"/><circle cx="'+x2+'" cy="'+y2+'" r="6" fill="#ffb878" stroke="#fff" stroke-width="1.4"/>';
  }
  return '<svg viewBox="0 0 890 280" role="img" aria-label="原图、缩放后的 ROI 和物理平面的坐标示意">'+
   '<defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#9cc8bc"/></marker></defs>'+
   '<rect width="890" height="280" rx="10" fill="#102638"/>'+
   '<text x="34" y="35" fill="#daece7" font-size="15">① 原图 · 16 × 12 px</text><text x="348" y="35" fill="#daece7" font-size="15">② 缩放后的 ROI</text><text x="649" y="35" fill="#daece7" font-size="15">③ 已标定的物理平面</text>'+
   '<rect x="34" y="66" width="192" height="144" fill="#1c4050" stroke="'+color+'" stroke-width="3"/><g stroke="#78949b" stroke-opacity=".4" stroke-width=".7">'+srcGrid+'</g>'+roi+sourcePoint+
   '<rect x="'+outX+'" y="'+outY+'" width="'+(r.resize.width*outputK)+'" height="'+(r.resize.height*outputK)+'" fill="#224e4d" stroke="'+outColor+'" stroke-width="3"/><g stroke="#8aaba9" stroke-opacity=".46" stroke-width=".7">'+outGrid+'</g>'+scaledPoint+
   '<rect x="649" y="66" width="192" height="144" fill="#1f4248" stroke="'+planeColor+'" stroke-width="3"/><g stroke="#89aaa1" stroke-opacity=".35" stroke-width=".7">'+planeGrid+'</g>'+planePoint+wrongPoint+
   '<path d="M243 139H321 M558 139H624" stroke="#9cc8bc" stroke-width="2" marker-end="url(#chain-arrow)"/>'+
   '<text x="249" y="126" fill="#a9c8c4" font-size="11">裁剪 / 缩放</text><text x="562" y="126" fill="#a9c8c4" font-size="11">还原 / 标定</text>'+
   '<text x="34" y="233" fill="#a8c7c6" font-size="12">u →　v ↓　绿框：ROI</text><text x="348" y="233" fill="#a8c7c6" font-size="12">'+r.resize.width+' × '+r.resize.height+' px　坐标示意</text><text x="649" y="233" fill="#a8c7c6" font-size="12">X →　Y ↑　单位 mm</text>'+
   '<text x="34" y="258" fill="#8fb4b8" font-size="11">橙点为假设特征；图中不进行真实图像缩放、识别或标定。</text></svg>';
 }
 function mount(target){
  if(!target)return;
  const uid=++serial,initial={x:2,y:1,width:8,height:6,u:6,v:4,percent:200,mode:'origin',detected:true,compare:false};
  const labels=['原图','裁剪 ROI','缩放后识别','还原局部','还原原图','物理坐标'];
  let s={...initial},step=0;
  target.innerHTML='<section class="chain-demo"><header class="chain-head"><div><span>PIXEL TO PLANE / 互动图解</span><h2>一个点，怎样从图片走到物理平面？</h2><p>跟随同一个假设特征，依次查看它在哪张图、属于哪个坐标系。</p></div><button type="button" data-chain-reset>恢复示例</button></header>'+
   '<nav class="chain-steps" aria-label="坐标转换步骤">'+labels.map((label,i)=>'<button type="button" data-chain-step="'+i+'" aria-pressed="'+(i===0)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+label+'</button>').join('')+'</nav>'+
   '<div class="chain-guide" aria-live="polite"><div><span data-chain-step-label></span><h3 data-chain-title></h3><p data-chain-explain></p><div class="chain-math" data-chain-math></div></div><div class="chain-nav"><button type="button" data-chain-prev>← 上一步</button><button type="button" data-chain-next>下一步 →</button></div></div>'+
   '<div class="chain-scene" tabindex="0" role="region" aria-label="图像和物理平面示意图，小屏可左右滑动" data-chain-scene></div><p class="chain-scroll">← 左右滑动查看完整流程图 →</p>'+
   '<div class="chain-controls"><fieldset><legend>1 · 调整原图与 ROI</legend><div class="chain-ranges">'+control(uid,'x','ROI 左上 u',0,8,2)+control(uid,'y','ROI 左上 v',0,6,1)+control(uid,'width','ROI 宽度',1,14,8)+control(uid,'height','ROI 高度',1,11,6)+control(uid,'u','假设特征 u',0,15,6)+control(uid,'v','假设特征 v',0,11,4)+'</div></fieldset>'+
   '<fieldset><legend>2 · 缩放和模拟识别</legend><div class="chain-selects"><label>缩放到<select data-chain-percent><option value="50">50%</option><option value="100">100%</option><option value="150">150%</option><option value="200" selected>200%</option><option value="300">300%</option></select></label><label>缩放坐标约定<select data-chain-mode><option value="origin">原点比例</option><option value="half-pixel">像素中心对齐（半像素）</option></select></label></div><label class="chain-check"><input type="checkbox" data-chain-fail> 模拟识别失败</label><p>输出尺寸按示例规则取整；X、Y 按实际尺寸分别计算比例。</p></fieldset></div>'+
   '<div class="chain-path" data-chain-path aria-label="本次坐标路径" aria-live="polite"></div>'+
   '<div class="chain-compare"><label class="chain-check"><input type="checkbox" data-chain-compare> 对比：漏掉缩放还原会怎样？</label><div data-chain-comparison></div></div>'+
   '<div class="chain-note">本例假设已得到平面映射：X = 100 + 0.5u，Y = 200 − 0.5v（mm），输入是<strong>原图坐标</strong>。显示数值最多保留三位小数，计算使用完整精度。这是人为设定的示例，不会执行真实标定或图像识别。物理坐标系是否就是机器人基坐标，取决于实际定义；眼在手上时还需核对拍照位姿、手眼关系和工作平面。<br><a href="https://onnx.ai/onnx/operators/onnx__Resize.html">参考：缩放坐标约定</a> · <a href="https://docs.opencv.org/4.10.0/d9/dab/tutorial_homography.html">参考：平面映射</a> · <a href="#demo/roi-coordinates">复习 ROI 与缩放 →</a> · <a href="#project/calibration-nine">查看九点平面标定 →</a></div></section>';
  const q=selector=>target.querySelector(selector);
  function update(){
   const r=M.calibrationChain(s,s.percent,s.mode,s.detected),p=r.resize.point;
   const invalid=r.status==='outside'?'特征在 ROI 外，本次无法识别。':r.status==='not-found'?'模拟识别失败，本次没有有效结果。':'';
   const scale='sx = '+fmt(r.resize.sx)+'，sy = '+fmt(r.resize.sy);
   const formula=s.mode==='origin'?'缩放点分别除以 sx、sy':'(缩放点 + 0.5) 分别除以 sx、sy，再减 0.5';
   const reverse=p?(s.mode==='origin'?'('+fmt(p.scaled.u)+' ÷ sx, '+fmt(p.scaled.v)+' ÷ sy)':'(('+fmt(p.scaled.u)+' + 0.5) ÷ sx − 0.5, ('+fmt(p.scaled.v)+' + 0.5) ÷ sy − 0.5)'):'';
   const guides=[
    ['原图里的假设特征','橙点是假设的特征位置；原图左上角为原点，u 向右、v 向下。','原图点 = ('+s.u+', '+s.v+') px'],
    ['先在原图里截取 ROI','绿色框是图中需要处理的区域；坐标还要记住框的左上角。','ROI 起点 = ('+s.x+', '+s.y+') px；大小 = '+s.width+' × '+s.height+' px'],
    ['在缩放后的 ROI 中模拟识别','本例根据假设点计算缩放后的模拟位置；结果属于缩放后的图，不是原图。',p?s.width+' × '+s.height+' → '+r.resize.width+' × '+r.resize.height+' px；模拟识别点 = '+uv(p.scaled)+' px':invalid],
    ['先还原 ROI 局部坐标',formula+'。实际输出宽高取整后，两轴比例可能不同。',p?reverse+' ≈ '+uv(p.local)+' px；'+scale:invalid],
    ['加回 ROI 原点，回到原图','用还原的局部点加上 ROI 左上角，结果才对应本例标定所用的原图。',p?uv(p.local)+' + ('+s.x+', '+s.y+') = '+uv(p.original)+' px':invalid],
    ['把原图点送入平面映射','本例的映射输入为原图坐标，输出是示例物理平面上的毫米坐标。',p?'X = 100 + 0.5 × '+fmt(p.original.u)+' = '+fmt(r.physical.x)+' mm；Y = 200 − 0.5 × '+fmt(p.original.v)+' = '+fmt(r.physical.y)+' mm':invalid]
   ];
   q('[data-chain-step-label]').textContent='第 '+(step+1)+' / '+labels.length+' 步';
   q('[data-chain-title]').textContent=guides[step][0];
   q('[data-chain-explain]').textContent=guides[step][1];
   q('[data-chain-math]').textContent=guides[step][2];
   target.querySelectorAll('[data-chain-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.chainStep)===step)));
   q('[data-chain-prev]').disabled=step===0;q('[data-chain-next]').disabled=step===labels.length-1;
   q('[data-chain-scene]').innerHTML=scene(s,r,step,s.compare);
   for(const key of ['x','y','width','height','u','v']){
    const el=q('[data-chain-range="'+key+'"]');
    el.max=({x:16-s.width,y:12-s.height,width:16-s.x,height:12-s.y,u:15,v:11})[key];el.value=s[key];
    q('[data-chain-value="'+key+'"]').textContent=s[key]+' px';
   }
   q('[data-chain-percent]').value=String(s.percent);q('[data-chain-mode]').value=s.mode;q('[data-chain-fail]').checked=!s.detected;q('[data-chain-compare]').checked=s.compare;
   const cards=[
    ['原图假设点','('+s.u+', '+s.v+') px',step===0||step===1],
    ['缩放图识别点',p?uv(p.scaled)+' px':'无有效点',step===2],
    ['还原 ROI 局部',p?uv(p.local)+' px':'无有效点',step===3],
    ['还原原图',p?uv(p.original)+' px':'无有效点',step===4],
    ['物理平面坐标',p?xy(r.physical)+' mm':'无有效点',step===5]
   ];
   q('[data-chain-path]').innerHTML=cards.map(c=>'<div class="'+(c[2]?'is-current':'')+'"><span>'+c[0]+'</span><strong>'+c[1]+'</strong></div>').join('');
   if(!s.compare)q('[data-chain-comparison]').textContent='打开后可对照正确位置与漏做缩放还原的位置。';
   else if(!p)q('[data-chain-comparison]').textContent=invalid+' 因此不输出对照位置。';
   else {
    const same=Math.abs(r.error.x)<1e-9&&Math.abs(r.error.y)<1e-9;
    q('[data-chain-comparison]').innerHTML='正确：先还原后映射 → <strong>'+xy(r.physical)+' mm</strong><br>错误：把缩放点直接加 ROI 起点，误当原图点 '+uv(p.wrong)+' px → <strong>'+xy(r.wrongPhysical)+' mm</strong><br>'+(same?'当前条件下两者碰巧一致；可换个倍率或移动特征再比较。':'错误位置 − 正确位置 = ('+fmt(r.error.x)+', '+fmt(r.error.y)+') mm。右侧物理平面中的橙点仅在错误点位于显示范围内时出现。');
   }
  }
  target.querySelectorAll('[data-chain-range]').forEach(el=>el.addEventListener('input',()=>{s[el.dataset.chainRange]=Number(el.value);update()}));
  target.querySelectorAll('[data-chain-step]').forEach(el=>el.addEventListener('click',()=>{step=Number(el.dataset.chainStep);update()}));
  q('[data-chain-prev]').addEventListener('click',()=>{step=Math.max(0,step-1);update()});
  q('[data-chain-next]').addEventListener('click',()=>{step=Math.min(labels.length-1,step+1);update()});
  q('[data-chain-percent]').addEventListener('change',e=>{s.percent=Number(e.target.value);update()});
  q('[data-chain-mode]').addEventListener('change',e=>{s.mode=e.target.value;update()});
  q('[data-chain-fail]').addEventListener('change',e=>{s.detected=!e.target.checked;update()});
  q('[data-chain-compare]').addEventListener('change',e=>{s.compare=e.target.checked;if(s.compare)step=5;update()});
  q('[data-chain-reset]').addEventListener('click',()=>{s={...initial};step=0;update()});
  update();
 }
 root.VisionPixelPlaneChain={mount};
})(window);
