(function(root){
 'use strict';
 const M=root.Vision2DBasics;
 let serial=0;
 const range=(uid,key,label,min,max,value,unit='px')=>`<label class="basic-range" for="basic-${uid}-${key}"><span>${label}<output data-show="${key}">${value} ${unit}</output></span><input id="basic-${uid}-${key}" type="range" min="${min}" max="${max}" step="1" value="${value}" data-range="${key}" aria-label="${label}"></label>`;
 const nav=(steps)=>`<div class="basic-steps" role="group" aria-label="演示步骤">${steps.map((s,i)=>`<button type="button" data-step="${i}" aria-pressed="${i===0}"><b>${String(i+1).padStart(2,'0')}</b>${s}</button>`).join('')}</div><div class="basic-guide"><div><span data-step-no></span><h3 data-step-title></h3><p data-step-text></p></div><div class="basic-nav"><button type="button" data-prev>← 上一步</button><button type="button" data-next>下一步 →</button></div></div>`;
 const cell=(u,v)=>u>=3&&u<=13&&v>=2&&v<=9?'#426e6b':'#203b50';
 function original(s){
  const ox=28,oy=34,k=19;let cells='';for(let v=0;v<12;v++)for(let u=0;u<16;u++)cells+=`<rect x="${ox+u*k}" y="${oy+v*k}" width="${k}" height="${k}" fill="${cell(u,v)}" stroke="#628086" stroke-opacity=".32" stroke-width=".6"/>`;
  const px=ox+(s.u+.5)*k,py=oy+(s.v+.5)*k;
  return `<svg viewBox="0 0 360 310" role="img" aria-label="原图中的 ROI 和假设特征点，点击图中像素可改变特征点"><rect width="360" height="310" rx="8" fill="#112638"/><text x="28" y="22" fill="#b7d1d6" font-size="12">原图坐标：u →，v ↓</text>${cells}<rect x="${ox+s.x*k}" y="${oy+s.y*k}" width="${s.width*k}" height="${s.height*k}" fill="#71d9ba" fill-opacity=".08" stroke="#78e3c4" stroke-width="2.5"/><circle cx="${px}" cy="${py}" r="6" fill="#f5ae69" stroke="#fff" stroke-width="1.5"/><path d="M${px-10} ${py}H${px+10} M${px} ${py-10}V${py+10}" stroke="#ffe3c5" stroke-width="1"/><text x="28" y="281" fill="#a9c8ce" font-size="12">原图 16 × 12 px · 点 (${s.u}, ${s.v})</text><text x="28" y="298" fill="#86aab5" font-size="11">点击图中像素移动假设特征点</text></svg>`;
 }
 function cropped(s,r){
  const ox=28,oy=35,k=Math.min(300/s.width,220/s.height);let cells='';
  for(let v=0;v<s.height;v++)for(let u=0;u<s.width;u++)cells+=`<rect x="${ox+u*k}" y="${oy+v*k}" width="${k}" height="${k}" fill="${cell(s.x+u,s.y+v)}" stroke="#9abdb7" stroke-opacity=".5" stroke-width=".7"/>`;
  const dot=r.inside?`<circle cx="${ox+(r.local.u+.5)*k}" cy="${oy+(r.local.v+.5)*k}" r="${Math.min(8,k*.28)}" fill="#f5ae69" stroke="#fff" stroke-width="1.5"/>`:'';
  return `<svg viewBox="0 0 360 310" role="img" aria-label="ROI 局部视图及局部原点"><rect width="360" height="310" rx="8" fill="#112638"/><text x="28" y="22" fill="#b7d1d6" font-size="12">ROI 局部坐标：左上像素为 (0, 0)</text>${cells}<rect x="${ox}" y="${oy}" width="${s.width*k}" height="${s.height*k}" fill="none" stroke="#78e3c4" stroke-width="2"/>${dot}<text x="28" y="281" fill="#a9c8ce" font-size="12">${r.inside?`局部点 (${r.local.u}, ${r.local.v})`:'特征点在 ROI 外，不生成局部点'}</text><text x="28" y="298" fill="#86aab5" font-size="11">仅为显示放大；像素坐标没有缩放</text></svg>`;
 }
 function mountRoi(target){
  const uid=++serial,initial={x:3,y:2,width:8,height:6,u:6,v:4},steps=['查看原图','设置 ROI','换算局部坐标','返回原图'];let state={...initial},step=0,scaling=null;
  target.innerHTML=`<section class="basic-lab"><header class="basic-head"><div><span>2D INTERACTIVE / ROI</span><h2>一个点，为什么会有两组坐标？</h2><p>先看原图与局部图，再调整 ROI 和特征点；接着观察裁剪后缩放的坐标还原。</p></div><button type="button" data-reset>恢复示例</button></header>${nav(steps)}<div class="basic-visual-grid"><article class="basic-card" data-card="original"><div class="basic-card-head"><strong>① 原图与 ROI</strong><span>绿色框：ROI</span></div><div class="basic-original" data-original></div></article><article class="basic-card" data-card="crop"><div class="basic-card-head"><strong>② ROI 局部视图</strong><span>显示放大</span></div><div data-crop></div></article></div><div class="basic-control-grid"><fieldset><legend>调整 ROI <small>自动限制在原图范围内</small></legend><div class="basic-fields">${range(uid,'x','ROI 左上 u',0,8,3)}${range(uid,'y','ROI 左上 v',0,6,2)}${range(uid,'width','ROI 宽度',1,13,8)}${range(uid,'height','ROI 高度',1,10,6)}</div></fieldset><fieldset><legend>调整假设特征点</legend><div class="basic-fields">${range(uid,'u','原图特征 u',0,15,6)}${range(uid,'v','原图特征 v',0,11,4)}</div><p>也可以直接点击左侧原图中的像素。</p></fieldset></div><div class="basic-result" data-result aria-live="polite"></div><div data-roi-scaling></div><div class="basic-foot">示例以原图左上为 (0,0)，u 向右、v 向下；ROI 包含左上像素，不包含右下边界。局部图仅做显示放大，未对数据重采样。实际若使用缩放、旋转或其他坐标约定，还需按软件接口还原；像素坐标不等于机器人基坐标。<br><a href="https://docs.opencv.org/4.7.0/d2/d44/classcv_1_1Rect__.html">参考：OpenCV 矩形与边界</a> · <a href="#project/measure">查看二维尺寸与 ROI 项目 →</a> · <a href="#image-lab">用图片试 ROI →</a></div></section>`;
  const q=x=>target.querySelector(x),update=()=>{
   const r=M.roi(state),inside=r.inside,local=inside?`(${r.local.u}, ${r.local.v})`:'未包含';
   const guide=[
    ['先看原图','图像左上角是原点。橙色点是假设的识别特征；点击原图可移动它，坐标单位都是像素。'],
    ['确定搜索范围','绿色框是 ROI。它只决定本例要看的区域；框外特征可能被漏掉，拖动滑块观察。'],
    ['原图点减去 ROI 起点','如果点在框内，用原图点减去 ROI 左上角，就得到局部图中的坐标。框外没有本例有效的局部点。'],
    ['局部坐标加回起点','本例未经数据缩放；将局部点加上 ROI 起点，可还原原图坐标，不能直接当作物理坐标。']
   ][step];
   q('[data-original]').innerHTML=original(state);q('[data-crop]').innerHTML=cropped(state,r);
   q('[data-result]').innerHTML=`<strong>原图特征点：(${state.u}, ${state.v}) px</strong><br>ROI 左上：(${state.x}, ${state.y}) px；大小：${state.width} × ${state.height} px（${r.pixels} / ${r.total} 个像素）<br>${inside?`局部点 = (${state.u} − ${state.x}, ${state.v} − ${state.y}) = <strong>${local} px</strong><br>还原原图 = ${local} + (${state.x}, ${state.y}) = (${state.u}, ${state.v}) px`:'<strong>特征点不在 ROI 内，本例不输出有效局部坐标。</strong>'}`;
   for(const key of ['x','y','width','height','u','v']){const el=q(`[data-range="${key}"]`);el.max=({x:16-state.width,y:12-state.height,width:16-state.x,height:12-state.y,u:15,v:11})[key];el.value=state[key];q(`[data-show="${key}"]`).textContent=state[key]+' px';}
   q('[data-step-no]').textContent=`第 ${step+1} / ${steps.length} 步`;q('[data-step-title]').textContent=guide[0];q('[data-step-text]').textContent=guide[1];
   target.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));
   target.querySelectorAll('[data-card]').forEach(c=>c.classList.toggle('is-active',c.dataset.card===(step===0?'original':step===1?'original':'crop')));
   q('[data-prev]').disabled=step===0;q('[data-next]').disabled=step===steps.length-1;if(scaling)scaling.update();
  };
  target.querySelectorAll('[data-range]').forEach(e=>e.addEventListener('input',()=>{state[e.dataset.range]=Number(e.value);update()}));
  q('[data-original]').addEventListener('click',e=>{const svg=e.target.closest('svg');if(!svg)return;const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*360,y=(e.clientY-r.top)/r.height*310,u=Math.floor((x-28)/19),v=Math.floor((y-34)/19);if(u>=0&&u<16&&v>=0&&v<12){state.u=u;state.v=v;update()}});
  target.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update()}));q('[data-prev]').addEventListener('click',()=>{step=Math.max(0,step-1);update()});q('[data-next]').addEventListener('click',()=>{step=Math.min(steps.length-1,step+1);update()});q('[data-reset]').addEventListener('click',()=>{state={...initial};step=0;if(scaling)scaling.reset();update()});scaling=root.VisionRoiScaling.mount(q('[data-roi-scaling]'),()=>state);update();
 }
 function edgeStrip(s,result,uid){
  const left=43,top=63,k=17.8;let cells='';for(let i=0;i<32;i++){const n=result.gray[i];cells+=`<rect x="${left+i*k}" y="${top}" width="${k+.2}" height="65" fill="rgb(${n},${n},${n})"/>`}
  const edges=result.result.edges.map((e,i)=>`<path d="M${left+(e.x+.5)*k} 54V137" stroke="#ffbb75" stroke-width="2" stroke-dasharray="4 3"/><text x="${Math.max(45,Math.min(600,left+(e.x+.5)*k+3))}" y="151" fill="#ffca8f" font-size="11">${i+1}</text>`).join('');
  const x1=s.reverse?left+32*k:left,x2=s.reverse?left:left+32*k;
  return `<svg viewBox="0 0 660 205" role="img" aria-label="合成灰度带、扫描方向和候选边缘"><defs><marker id="edge-arrow-${uid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#82e0c0"/></marker></defs><rect width="660" height="205" rx="8" fill="#112638"/><text x="42" y="25" fill="#b9d5d8" font-size="12">原图像素 u：0 → 31；每格一个采样</text>${cells}<path d="M${x1} 43H${x2}" stroke="#82e0c0" stroke-width="3" marker-end="url(#edge-arrow-${uid})"/>${edges}<text x="42" y="181" fill="#a5c4cc" font-size="12">绿色箭头 = 扫描方向　·　橙虚线 = 候选边缘</text></svg>`;
 }
 function edgeGraph(result){
  const left=46,top=25,w=570,h=150,p=result.result,points=p.values.map((v,i)=>`${left+i*w/31},${top+(255-v)*h/255}`).join(' ');
  const markers=p.edges.map((e,i)=>{const x=left+e.distance*w/31;return `<path d="M${x} ${top}V${top+h}" stroke="#f3ba79" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${Math.min(603,x+3)}" y="${top+13}" fill="#f3ba79" font-size="11">${i+1}</text>`}).join('');
  return `<svg viewBox="0 0 660 220" role="img" aria-label="沿扫描方向的灰度曲线和候选边缘"><rect width="660" height="220" rx="8" fill="#112638"/><path d="M${left} ${top}V${top+h}H${left+w}" fill="none" stroke="#73939c"/><path d="M${left} ${top+h/2}H${left+w}" stroke="#294958" stroke-dasharray="4 5"/><polyline points="${points}" fill="none" stroke="#79dfc1" stroke-width="3" stroke-linejoin="round"/>${markers}<text x="10" y="30" fill="#a9c7ce" font-size="11">255</text><text x="24" y="180" fill="#a9c7ce" font-size="11">0</text><text x="46" y="200" fill="#a9c7ce" font-size="11">起点 0 px</text><text x="535" y="200" fill="#a9c7ce" font-size="11">终点 31 px</text></svg>`;
 }
 function mountEdge(target){
  const uid=++serial,initial={contrast:120,threshold:30,direction:'both',reverse:false,noise:false},steps=['查看测量线','观察灰度','设置找边条件','查看候选边缘'];let state={...initial},step=0;
  target.innerHTML=`<section class="basic-lab"><header class="basic-head"><div><span>2D INTERACTIVE / EDGE</span><h2>沿一条线，怎样找到边缘？</h2><p>观察一条合成灰度带；改变对比、扫描方向、极性与阈值，看候选边缘如何变化。</p></div><button type="button" data-reset>恢复示例</button></header>${nav(steps)}<div class="basic-edge-grid"><article class="basic-card" data-card="strip"><div class="basic-card-head"><strong>① 合成灰度带</strong><span>沿箭头扫描</span></div><div class="basic-edge-scroll" data-strip tabindex="0" role="region" aria-label="合成灰度带，小屏可左右滑动"></div><p class="basic-scroll-note">← 左右滑动查看完整灰度带 →</p></article><article class="basic-card" data-card="graph"><div class="basic-card-head"><strong>② 沿线灰度曲线</strong><span>横轴是扫描距离</span></div><div class="basic-edge-scroll" data-graph tabindex="0" role="region" aria-label="灰度曲线，小屏可左右滑动"></div><p class="basic-scroll-note">← 左右滑动查看完整曲线 →</p></article></div><div class="basic-control-grid"><fieldset><legend>灰度与阈值</legend><div class="basic-fields">${range(uid,'contrast','目标与背景灰度差',0,200,120,'灰度')}${range(uid,'threshold','相邻样本差值阈值',1,255,30,'灰度')}</div><p>阈值针对相邻样本的变化量，不是亮度分割阈值。</p></fieldset><fieldset><legend>扫描与边缘方向</legend><label class="basic-select">选择极性<select data-direction aria-label="选择找边极性"><option value="both">两种变化都找</option><option value="rising">沿扫描方向：暗 → 亮</option><option value="falling">沿扫描方向：亮 → 暗</option></select></label><div class="basic-checks"><label><input type="checkbox" data-reverse> 从右向左扫描</label><label><input type="checkbox" data-noise> 加入单像素亮点干扰</label></div></fieldset></div><div class="basic-result" data-result aria-live="polite"></div><div class="basic-foot">本例沿 32 个合成像素采样，比较相邻灰度；连续同方向且达阈值时取差值最大处，位置标在两像素中心之间。扫描反向时，同一条物理边缘的明暗方向会反转。灰度带和干扰均为示意；这不是完整工业卡尺或亚像素精度保证。<br><a href="https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html">参考：OpenCV 图像梯度</a> · <a href="#project/circle-calipers">查看多测量线拟合圆项目 →</a> · <a href="#image-lab">用图片试测量线 →</a></div></section>`;
  const q=x=>target.querySelector(x),update=()=>{
   const result=M.edge(state),p=result.result;
   const guide=[['先沿一条线采样','绿色箭头给出扫描方向，每一格是一枚合成灰度像素。改变方向时，采样顺序会反过来。'],['把亮暗画成曲线','横轴是从扫描起点开始的距离，纵轴是灰度值；突变位置可能是边缘，也可能是干扰。'],['设置极性与差值阈值','逐对比较相邻采样：差值达到阈值且方向符合条件，才形成候选；扫描反向时极性也会反转。'],['检查候选点','橙色虚线标出本例候选边缘。打开亮点干扰后可能出现额外候选，现场还要结合 ROI 和拟合规则筛选。']][step];
   q('[data-strip]').innerHTML=edgeStrip(state,result,uid);q('[data-graph]').innerHTML=edgeGraph(result);
   const edges=p.edges.map((e,i)=>`<li>边缘 ${i+1}：原图 u ≈ ${e.x.toFixed(1)} px；沿线 ${e.distance.toFixed(1)} px；灰度变化 ${e.delta>0?'+':''}${e.delta}（${e.delta>0?'暗 → 亮':'亮 → 暗'}）</li>`).join('');
   q('[data-result]').innerHTML=p.edges.length?`<strong>找到 ${p.edges.length} 个候选边缘</strong><ul>${edges}</ul><span>候选点仍需检查是否属于目标边缘。</span>`:'<strong>没有找到符合当前条件的候选边缘。</strong><br>可以调整对比、阈值或找边方向，再观察曲线。';
   for(const key of ['contrast','threshold']){q(`[data-range="${key}"]`).value=state[key];q(`[data-show="${key}"]`).textContent=state[key]+' 灰度';}
   q('[data-direction]').value=state.direction;q('[data-reverse]').checked=state.reverse;q('[data-noise]').checked=state.noise;
   q('[data-step-no]').textContent=`第 ${step+1} / ${steps.length} 步`;q('[data-step-title]').textContent=guide[0];q('[data-step-text]').textContent=guide[1];
   target.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));
   target.querySelectorAll('[data-card]').forEach(c=>c.classList.toggle('is-active',c.dataset.card===(step===0?'strip':'graph')));
   q('[data-prev]').disabled=step===0;q('[data-next]').disabled=step===steps.length-1;
  };
  target.querySelectorAll('[data-range]').forEach(e=>e.addEventListener('input',()=>{state[e.dataset.range]=Number(e.value);update()}));q('[data-direction]').addEventListener('change',e=>{state.direction=e.target.value;update()});for(const key of ['reverse','noise'])q(`[data-${key}]`).addEventListener('change',e=>{state[key]=e.target.checked;update()});
  target.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update()}));q('[data-prev]').addEventListener('click',()=>{step=Math.max(0,step-1);update()});q('[data-next]').addEventListener('click',()=>{step=Math.min(steps.length-1,step+1);update()});q('[data-reset]').addEventListener('click',()=>{state={...initial};step=0;update()});update();
 }
 root.Vision2DBasicDemos={mount(target,id){if(!target)return;if(id==='roi-coordinates')mountRoi(target);else if(id==='edge-scan')mountEdge(target)}};
})(window);
