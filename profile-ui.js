(function(root){
 'use strict';
 const model=root.VisionProfileModel;
 function mount(target){
  target.innerHTML=[
   '<section class="profile-lab" aria-labelledby="profile-title">',
   '<div class="profile-heading"><div><span>EDGE PROFILE / 找边示意</span><h2 id="profile-title" tabindex="-1">画一条线，看看灰度如何变化</h2><p>在测量线图像上拖动起点到终点，也可以输入坐标；测量线独立于上方 ROI。</p></div><span class="profile-badge">工作图像坐标</span></div>',
   '<div class="profile-grid"><section class="profile-panel"><div class="profile-subhead"><strong>① 画测量线</strong><span>拖动绘制</span></div><div class="profile-image-wrap"><canvas class="profile-image" tabindex="0" aria-label="测量线图像，可拖动画线或使用坐标输入"></canvas></div><div class="profile-points"><label>起点 X<input type="number" step="1" data-coordinate="x1"></label><label>起点 Y<input type="number" step="1" data-coordinate="y1"></label><label>终点 X<input type="number" step="1" data-coordinate="x2"></label><label>终点 Y<input type="number" step="1" data-coordinate="y2"></label></div><div class="profile-actions"><button type="button" data-apply-line>应用坐标</button><button type="button" data-reset-line>恢复示例线</button></div><p class="profile-status" role="status"></p></section>',
   '<section class="profile-panel"><div class="profile-subhead"><strong>② 灰度曲线与候选边缘</strong><span>沿起点 → 终点</span></div><canvas class="profile-graph" width="600" height="220" role="img" aria-label="沿测量线的灰度曲线和候选边缘"></canvas><p>横轴为沿线距离（px），纵轴为灰度（0～255）；竖线表示候选边缘，A、B 标出当前选择。</p><label class="profile-range"><span>相邻样本差值阈值 <output data-profile-threshold-output>30</output></span><input type="range" min="1" max="255" value="30" data-profile-threshold aria-label="找边差值阈值"></label><label class="profile-label">灰度变化方向<select data-profile-direction><option value="both">明暗变化都找</option><option value="rising">由暗到亮</option><option value="falling">由亮到暗</option></select></label><p class="profile-count" aria-live="polite"></p></section></div>',
   '<section class="profile-measure"><div><span>③ 选择两个候选边缘</span><h3>计算沿线距离</h3><p>边缘由相邻样本差分估算；可在下方选择要测量的两条边。</p></div><div class="profile-measure-inputs"><label>边缘 A<select data-edge-a></select></label><label>边缘 B<select data-edge-b></select></label><label>工作图像比例（mm/px，可选）<input type="number" min="0.000001" step="any" placeholder="例如 0.05" data-scale></label></div><div class="profile-result" role="status" aria-live="polite"></div></section>',
   '<p class="profile-foot">找边方法：按像素采样，对连续同向且达到差值阈值的变化取最强处，位置画在相邻样本中间；未做平滑、拟合或亚像素标定。毫米值只按输入比例粗算，要求测量平面、方向及工作图像比例适用；更换图像会清空比例，图像缩小后应重新核对比例，透视或畸变明显时不能直接使用。真实精度须用标准件验证。<a href="https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html">了解图像梯度 →</a></p>',
   '</section>'
  ].join('');
  const canvas=target.querySelector('.profile-image'),ctx=canvas.getContext('2d');
  const graph=target.querySelector('.profile-graph'),g=graph.getContext('2d');
  const threshold=target.querySelector('[data-profile-threshold]'),direction=target.querySelector('[data-profile-direction]');
  const a=target.querySelector('[data-edge-a]'),b=target.querySelector('[data-edge-b]'),scale=target.querySelector('[data-scale]');
  const status=target.querySelector('.profile-status'),result=target.querySelector('.profile-result');
  let image=null,line=null,profile=null,drag=null;
  const round=n=>Number(n).toFixed(1);
  function defaultLine(){if(image.w===1)return{x1:0,y1:0,x2:0,y2:image.h-1};const y=Math.max(0,Math.min(image.h-1,Math.round(image.h*.315)));return{x1:Math.max(0,Math.round((image.w-1)*.04)),y1:y,x2:Math.max(1,Math.round((image.w-1)*.96)),y2:y}}
  function validLine(p){return p&&[p.x1,p.y1,p.x2,p.y2].every(Number.isInteger)&&p.x1>=0&&p.x1<image.w&&p.x2>=0&&p.x2<image.w&&p.y1>=0&&p.y1<image.h&&p.y2>=0&&p.y2<image.h&&(p.x1!==p.x2||p.y1!==p.y2)}
  function sync(){for(const k of ['x1','y1','x2','y2'])target.querySelector('[data-coordinate="'+k+'"]').value=line[k]}
  function drawImage(preview){
   if(!image)return;const l=preview||line;ctx.clearRect(0,0,image.w,image.h);ctx.drawImage(image.buffer,0,0);
   const lw=Math.max(2,image.w/240),rad=Math.max(4,image.w/100);
   ctx.lineWidth=lw;ctx.strokeStyle='#00e7bc';ctx.beginPath();ctx.moveTo(l.x1,l.y1);ctx.lineTo(l.x2,l.y2);ctx.stroke();
   for(const [x,y,col] of [[l.x1,l.y1,'#20dfad'],[l.x2,l.y2,'#ffb35d']]){ctx.fillStyle=col;ctx.strokeStyle='#102d35';ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();ctx.stroke()}
   if(!preview&&profile){for(const [select,label,col] of [[a,'A','#ffbc6a'],[b,'B','#a8c7ff']]){const i=select.value===''?-1:Number(select.value),edge=profile.edges[i];if(!edge)continue;ctx.fillStyle=col;ctx.strokeStyle='#102d35';ctx.beginPath();ctx.arc(edge.x,edge.y,rad*1.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='bold '+Math.max(5,Math.min(18,Math.min(image.w,image.h)/20))+'px sans-serif';ctx.strokeStyle='#102d35';ctx.lineWidth=lw;ctx.strokeText(label,edge.x+rad,Math.max(rad*2,edge.y-rad));ctx.fillText(label,edge.x+rad,Math.max(rad*2,edge.y-rad))}}
  }
  function drawGraph(){
   const w=graph.width,h=graph.height,cssWidth=graph.getBoundingClientRect().width||w,font=Math.max(12,Math.min(28,Math.round(11*w/cssWidth))),left=Math.max(32,font*2.2),right=12,top=Math.max(14,font),bottom=Math.max(25,font*1.5),pw=w-left-right,ph=h-top-bottom;
   g.fillStyle='#112e35';g.fillRect(0,0,w,h);g.strokeStyle='#2e5053';g.lineWidth=1;g.fillStyle='#bcd3ca';g.font=font+'px sans-serif';
   for(const val of [0,64,128,192,255]){const y=top+(255-val)/255*ph;g.beginPath();g.moveTo(left,y);g.lineTo(w-right,y);g.stroke();g.fillText(String(val),3,y+font*.35)}
   if(!profile)return;
   g.strokeStyle='#8fe4c2';g.lineWidth=2;g.beginPath();profile.values.forEach((v,i)=>{const x=left+i/profile.steps*pw,y=top+(255-v)/255*ph;if(i===0)g.moveTo(x,y);else g.lineTo(x,y)});g.stroke();
   const ai=a.value===''?-1:Number(a.value),bi=b.value===''?-1:Number(b.value);profile.edges.forEach((edge,i)=>{const x=left+edge.distance/profile.length*pw,chosen=i===ai||i===bi;g.strokeStyle=i===ai?'#ffc369':i===bi?'#a8c7ff':'#5c8079';g.beginPath();g.moveTo(x,top);g.lineTo(x,h-bottom);g.stroke();if(chosen){g.fillStyle=g.strokeStyle;g.fillText((i===ai?'A':'')+(i===bi?'B':''),Math.min(w-right-font,x+3),top+font)}});
   const endLabel=round(profile.length)+' px';g.fillStyle='#bcd3ca';g.fillText('0 px',left,h-6);g.fillText(endLabel,Math.max(left,w-right-g.measureText(endLabel).width),h-6);
  }
  function drawResult(){
   const av=a.value===''?-1:Number(a.value),bv=b.value===''?-1:Number(b.value),raw=scale.value.trim(),number=raw===''?null:Number(raw);
   if(raw!==''&&(!Number.isFinite(number)||number<=0||(profile&&!Number.isFinite(profile.length*number)))){result.textContent='比例必须是大于 0 的有效数字，且不能使结果溢出；留空可只查看像素距离。';return}
   if(!profile||profile.edges.length<2){result.textContent='候选边缘少于两个；可改变测量线、差值阈值或灰度变化方向。';return}
   const distance=model.measure(profile,av,bv,number);
   if(!distance){result.textContent='请选择两个不同的候选边缘。';return}
   result.textContent='沿线距离 '+distance.pixels.toFixed(2)+' px'+(distance.mm===null?'；输入工作图像比例后可估算毫米。':' ≈ '+distance.mm.toFixed(3)+' mm（按输入比例估算）。');
  }
  function render(){
   if(!image||!validLine(line))return;
   profile=model.sample(image.gray,image.w,image.h,line,{threshold:Number(threshold.value),direction:direction.value});
   target.querySelector('[data-profile-threshold-output]').textContent=threshold.value;
   const oldA=a.value,oldB=b.value,edges=profile.edges;
   const options=edges.map((e,i)=>'<option value="'+i+'">边缘 '+(i+1)+' · '+round(e.distance)+' px · Δ'+(e.delta>0?'+':'')+e.delta+'</option>').join('');
   a.innerHTML=b.innerHTML=options||'<option value="">无候选边缘</option>';
   if(edges.length){a.value=oldA!==''&&Number(oldA)<edges.length?oldA:'0';b.value=oldB!==''&&Number(oldB)<edges.length?oldB:String(Math.min(1,edges.length-1))}
   a.disabled=b.disabled=edges.length===0;
   target.querySelector('.profile-count').textContent='线长 '+round(profile.length)+' px；找到 '+edges.length+' 个候选边缘。';
   drawImage();drawGraph();drawResult();
  }
  function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(image.w-1,Math.round((e.clientX-r.left)*image.w/r.width))),y:Math.max(0,Math.min(image.h-1,Math.round((e.clientY-r.top)*image.h/r.height)))}}
  canvas.addEventListener('pointerdown',e=>{if(!image||e.button!==0)return;e.preventDefault();drag=point(e);canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);drawImage({x1:drag.x,y1:drag.y,x2:p.x,y2:p.y})});
  canvas.addEventListener('pointerup',e=>{if(!drag)return;const p=point(e),next={x1:drag.x,y1:drag.y,x2:p.x,y2:p.y};drag=null;if(!validLine(next)){status.textContent='测量线起点和终点不能重合，仍显示上一条有效测量线。';drawImage();return}line=next;sync();status.textContent='测量线已更新。';render()});
  canvas.addEventListener('pointercancel',()=>{drag=null;drawImage()});
  target.querySelector('[data-apply-line]').addEventListener('click',()=>{const next={};for(const k of ['x1','y1','x2','y2']){const v=target.querySelector('[data-coordinate="'+k+'"]').value.trim();next[k]=v===''?NaN:Number(v)}if(!validLine(next)){status.textContent='请输入图像范围内的整数坐标，起点和终点不能重合；仍显示上一条有效测量线。';return}line=next;status.textContent='测量线已更新。';render()});
  target.querySelector('[data-reset-line]').addEventListener('click',()=>{line=defaultLine();sync();status.textContent='已恢复示例线。';render()});
  for(const input of [threshold,direction])input.addEventListener('input',render);
  for(const input of [a,b])input.addEventListener('change',()=>{drawImage();drawGraph();drawResult()});
  scale.addEventListener('input',drawResult);
  const resizeGraph=()=>drawGraph();window.addEventListener('resize',resizeGraph);window.addEventListener('hashchange',()=>window.removeEventListener('resize',resizeGraph),{once:true});
  return{setImage(gray,w,h,buffer){image={gray,w,h,buffer};scale.value='';a.innerHTML=b.innerHTML='';canvas.width=w;canvas.height=h;canvas.style.maxWidth=(320*w/h)+'px';line=defaultLine();sync();if(!validLine(line)){profile=null;a.innerHTML=b.innerHTML='<option value="">无候选边缘</option>';a.disabled=b.disabled=true;target.querySelector('.profile-count').textContent='图像太小，无法画出测量线。';status.textContent='当前图像只有一个像素。';drawImage();drawGraph();drawResult();return}status.textContent='当前工作图像 '+w+' × '+h+' px。';render()}};
 }
 root.VisionProfileUI={mount};
})(window);
