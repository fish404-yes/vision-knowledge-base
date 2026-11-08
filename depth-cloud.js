(function(root){
 'use strict';
 const M=root.VisionDepthCloudModel;
 const initial={distance:400,angle:20,occluder:false,missing:0,u:64,v:48,view:35};
 const steps=[
  {title:'先看相机和工件',text:'相机始终朝向桌面参考点；调整距离和倾斜角，观察同一工件在固定分辨率下占据多少像素。侧视图只表达关系，尺寸不按比例。'},
  {title:'每个像素存一个深度',text:'深度图的每个有效像素记录相机光轴方向的 Z 值。点击图像或移动 u、v，查看该像素的深度；灰暗背景和粉色模拟无效点都没有深度。'},
  {title:'用内参变成三维点',text:'选择的像素配合深度和相机内参，计算相机坐标系中的 X、Y、Z。有效像素逐个转换，就形成右侧点云。旋转点云视图只改变观察角度。'},
  {title:'区别遮挡和无效深度',text:'打开挡板后，原本属于工件的某些像素会被更近的挡板占据；它们不一定是无效像素。另一个滑块人为模拟工件表面无效深度。'}
 ];
 const f=(n,d=1)=>Number(n).toFixed(d);
 const color=(z,lo,hi)=>{const t=hi>lo?Math.min(1,Math.max(0,(z-lo)/(hi-lo))):0.5;return [Math.round(72+169*t),Math.round(207-49*t),Math.round(194-92*t)]};
 function sceneSvg(state){
  const a=state.angle*Math.PI/180,cx=320-190*Math.sin(a),cy=155-(state.distance-250)*.13;
  const board=state.occluder?'<rect x="245" y="174" width="12" height="112" rx="2" fill="#e6a46b"/><text x="207" y="168" fill="#d79b65" font-size="13">挡板</text>':'';
  return `<svg viewBox="0 0 600 340" role="img" aria-label="相机观察工件和挡板的侧视示意图"><defs><pattern id="cloud-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#21404f" stroke-width="1"/></pattern></defs><rect width="600" height="340" rx="10" fill="#102537"/><rect width="600" height="340" fill="url(#cloud-grid)"/><path d="M${cx} ${cy+18}L290 234 M${cx} ${cy+18}L365 234" fill="none" stroke="#6acdb6" stroke-dasharray="6 5" stroke-width="2"/><path d="M${cx} ${cy+18}L325 284" stroke="#9fdac9" stroke-dasharray="3 5"/><rect x="${cx-29}" y="${cy-13}" width="58" height="30" rx="7" fill="#69b9aa"/><circle cx="${cx}" cy="${cy+20}" r="9" fill="#d1f3e3"/><text x="${Math.min(510,cx+38)}" y="${cy+6}" fill="#d9f1eb" font-size="14">3D 相机</text><path d="M65 286H535" stroke="#849eaa" stroke-width="4"/><rect x="290" y="232" width="75" height="54" rx="3" fill="#479b89" stroke="#9de3cd" stroke-width="2"/><text x="297" y="262" fill="#e7fbf1" font-size="13">工件</text>${board}<text x="65" y="318" fill="#a8c6ce" font-size="12">桌面参考点 · 侧视关系示意（非比例图）</text><text x="407" y="42" fill="#c9e3e4" font-size="13">距离 ${state.distance} mm</text><text x="407" y="62" fill="#c9e3e4" font-size="13">倾斜 ${state.angle}°</text></svg>`;
 }
 function mount(target){
  if(!target)return;
  let state={...initial},stage=0,data=null,range={lo:0,hi:1};
  target.innerHTML=`<section class="cloud-lab" aria-labelledby="cloud-title"><header class="cloud-heading"><div><span>3D VISION / 互动示意</span><h2 id="cloud-title">从深度图到三维点云</h2><p>按步骤看图，再改变相机和遮挡条件；深度图和点云使用同一组模拟数据，场景图不按比例。</p></div><button type="button" data-reset>恢复示例</button></header>
   <div class="cloud-steps" role="group" aria-label="演示步骤">${['相机与工件','深度图','生成点云','遮挡与无效点'].map((s,i)=>`<button type="button" data-stage="${i}" aria-pressed="${i===0}"><b>${String(i+1).padStart(2,'0')}</b>${s}</button>`).join('')}</div>
   <div class="cloud-guide"><div><span data-stage-number></span><h3 data-stage-title></h3><p data-stage-text></p></div><div class="cloud-stage-nav"><button type="button" data-prev>← 上一步</button><button type="button" data-next>下一步 →</button></div></div>
   <div class="cloud-controls"><label><span>相机到参考点的距离 <output data-distance-out></output></span><input type="range" min="300" max="700" step="10" aria-label="相机到参考点的距离" data-distance></label><label><span>相机倾斜角 <output data-angle-out></output></span><input type="range" min="0" max="40" step="1" aria-label="相机倾斜角" data-angle></label><label><span>工件模拟无效比例（约） <output data-missing-out></output></span><input type="range" min="0" max="60" step="5" aria-label="工件模拟无效像素比例" data-missing></label><label class="cloud-check"><input type="checkbox" data-occluder><span>放置挡板遮挡工件</span></label></div>
   <div class="cloud-grid"><article class="cloud-card" data-card="scene"><div class="cloud-card-head"><div><span>01 / SCENE</span><h3>相机与工件</h3></div><small>侧视示意</small></div><div data-scene></div><p>改变距离或倾斜角，相机会围绕桌面参考点观察；打开挡板后，可查看前景遮挡。</p></article>
   <article class="cloud-card" data-card="depth"><div class="cloud-card-head"><div><span>02 / DEPTH</span><h3>深度图</h3></div><small>128 × 96 px</small></div><div class="cloud-canvas-wrap"><canvas width="128" height="96" data-depth role="img" aria-label="可点击选择像素的合成深度图"></canvas></div><div class="cloud-depth-legend"><span>近 <b data-near></b></span><div></div><span>远 <b data-far></b></span></div><p>颜色按当前画面的深度范围自动映射；深色是背景，粉色是模拟无效点。</p><div class="cloud-pixel-inputs"><label>像素 u <output data-u-out></output><input type="range" min="0" max="127" step="1" aria-label="深度图像素 u" data-u></label><label>像素 v <output data-v-out></output><input type="range" min="0" max="95" step="1" aria-label="深度图像素 v" data-v></label></div></article>
   <article class="cloud-card" data-card="points"><div class="cloud-card-head"><div><span>03 / POINT CLOUD</span><h3>相机坐标点云</h3></div><small>每个有效像素一个点</small></div><div class="cloud-canvas-wrap"><canvas width="640" height="420" data-cloud role="img" aria-label="从合成深度图反投影得到的相机坐标点云"></canvas></div><label class="cloud-view-control"><span>旋转点云视图 <output data-view-out></output></span><input type="range" min="-90" max="90" step="1" aria-label="旋转点云视图" data-view></label><p>只旋转观察视角，不改变点云数据；白圈标出选中的有效像素。</p></article></div>
   <div class="cloud-readout"><div><span>当前像素 → 相机坐标</span><div data-selected aria-live="polite"></div></div><div class="cloud-metrics" aria-live="polite"><div><span>工件可见像素</span><strong data-visible></strong><small>遮挡后、模拟无效前</small></div><div><span>工件被挡住</span><strong data-hidden></strong><small>前景可能替换为挡板</small></div><div><span>人为模拟无效</span><strong data-invalid></strong><small>仅在可见工件上注入</small></div><div><span>输出点云点数</span><strong data-points></strong><small>包含可见桌面及挡板</small></div></div></div>
   <p class="cloud-foot">本例采用理想针孔相机：fx = fy = 125 px，主点 (63.5, 47.5) px；Z 是沿光轴的深度，不是到相机的直线距离。点云在<strong>相机坐标系</strong>：X 向右、Y 向下、Z 向前；转到机器人基坐标还需要标定与位姿。无效深度按像素位置近似比例人为注入，不模拟任何具体相机、材质或精度。<a href="https://www.open3d.org/docs/latest/cpp_api/classopen3d_1_1t_1_1geometry_1_1_point_cloud.html">参考：Open3D 深度图生成点云</a></p></section>`;
  const q=s=>target.querySelector(s),depthCanvas=q('[data-depth]'),depthCtx=depthCanvas.getContext('2d'),pointCanvas=q('[data-cloud]'),pointCtx=pointCanvas.getContext('2d');
  function drawDepth(){
   const image=depthCtx.createImageData(M.camera.width,M.camera.height);
   for(let i=0;i<data.kind.length;i++){
    const k=data.kind[i],col=k===4?[234,110,164]:k===0?[15,34,48]:color(data.depth[i],range.lo,range.hi),j=i*4;
    image.data[j]=col[0];image.data[j+1]=col[1];image.data[j+2]=col[2];image.data[j+3]=255;
   }
   depthCtx.putImageData(image,0,0);depthCtx.strokeStyle='#ffffff';depthCtx.lineWidth=1;depthCtx.strokeRect(state.u-2.5,state.v-2.5,5,5);
  }
  function drawCloud(){
   const ctx=pointCtx,w=pointCanvas.width,h=pointCanvas.height,yaw=state.view*Math.PI/180,pitch=-25*Math.PI/180,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),scale=1.65;
   const project=(x,y,z)=>{const rx=cy*x+sy*z,rz=-sy*x+cy*z;return {x:w/2+scale*rx,y:h/2+scale*(cp*y-sp*rz),depth:sp*y+cp*rz}};
   ctx.fillStyle='#102537';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#244354';ctx.lineWidth=1;for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
   const drawn=data.points.map(p=>({p,s:project(p.x,p.y,p.z-state.distance)})).sort((a,b)=>b.s.depth-a.s.depth);
   for(const {p,s} of drawn){const col=color(p.z,range.lo,range.hi);ctx.fillStyle=`rgb(${col[0]},${col[1]},${col[2]})`;ctx.fillRect(s.x-1.7,s.y-1.7,3.4,3.4);}
   const selected=drawn.find(item=>item.p.u===state.u&&item.p.v===state.v);if(selected){ctx.beginPath();ctx.arc(selected.s.x,selected.s.y,8,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}
   const axes=[['Xc',65,0,0,'#f0b678'],['Yc',0,65,0,'#8bcea9'],['Zc',0,0,65,'#8eb7fb']],anchor=project(0,0,0);
   ctx.font='15px sans-serif';for(const [name,x,y,z,col] of axes){const end=project(x,y,z),dx=(end.x-anchor.x)*.55,dy=(end.y-anchor.y)*.55;ctx.beginPath();ctx.moveTo(52,357);ctx.lineTo(52+dx,357+dy);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=col;ctx.fillText(name,55+dx,355+dy);}
  }
  function selectInfo(){
   const idx=state.v*M.camera.width+state.u,k=data.kind[idx],z=data.depth[idx],box=q('[data-selected]');
   if(k===0){box.innerHTML=`像素 <strong>(${state.u}, ${state.v})</strong>：视野背景，没有采到场景表面，不能生成三维点。`;return;}
   if(k===4){box.innerHTML=`像素 <strong>(${state.u}, ${state.v})</strong>：人为模拟无效深度，不生成三维点。`;return;}
   const p=M.backProject(state.u,state.v,z),kind={1:'桌面',2:'工件',3:'挡板'}[k];
   box.innerHTML=`像素 <strong>(${state.u}, ${state.v}) px</strong> · ${kind} · 光轴深度 Z = <strong>${f(z)} mm</strong><br>X = (u − cx) × Z / fx；Y = (v − cy) × Z / fy<br>相机坐标 <strong>(${f(p.x)}, ${f(p.y)}, ${f(p.z)}) mm</strong>`;
  }
  function update(recalculate=true){
   if(recalculate){data=M.scene(state);const values=data.points.map(p=>p.z);range=values.length?{lo:Math.min(...values),hi:Math.max(...values)}:{lo:0,hi:1};}
   q('[data-scene]').innerHTML=sceneSvg(state);drawDepth();drawCloud();selectInfo();
   q('[data-near]').textContent=f(range.lo,0)+' mm';q('[data-far]').textContent=f(range.hi,0)+' mm';
   q('[data-visible]').textContent=data.stats.productVisible+' px';q('[data-hidden]').textContent=data.stats.productOccluded+' px';q('[data-invalid]').textContent=data.stats.productMissing+' px';q('[data-points]').textContent=data.stats.valid+' 点';
   for(const key of ['distance','angle','missing','u','v','view']){q(`[data-${key}]`).value=state[key];q(`[data-${key}-out]`).textContent=state[key]+({distance:' mm',angle:'°',missing:'%',u:' px',v:' px',view:'°'}[key]);}
   q('[data-occluder]').checked=state.occluder;
   q('[data-stage-number]').textContent=`第 ${stage+1} / ${steps.length} 步`;q('[data-stage-title]').textContent=steps[stage].title;q('[data-stage-text]').textContent=steps[stage].text;
   target.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===stage)));
   target.querySelectorAll('[data-card]').forEach(card=>card.classList.toggle('is-focused',card.dataset.card===['scene','depth','points','scene'][stage]));
   q('[data-prev]').disabled=stage===0;q('[data-next]').disabled=stage===steps.length-1;
  }
  for(const key of ['distance','angle','missing'])q(`[data-${key}]`).addEventListener('input',e=>{state[key]=Number(e.target.value);update()});
  for(const key of ['u','v','view'])q(`[data-${key}]`).addEventListener('input',e=>{state[key]=Number(e.target.value);update(false)});
  q('[data-occluder]').addEventListener('change',e=>{state.occluder=e.target.checked;update()});
  depthCanvas.addEventListener('click',e=>{const r=depthCanvas.getBoundingClientRect();state.u=Math.max(0,Math.min(M.camera.width-1,Math.floor((e.clientX-r.left)/r.width*M.camera.width)));state.v=Math.max(0,Math.min(M.camera.height-1,Math.floor((e.clientY-r.top)/r.height*M.camera.height)));update(false)});
  target.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{stage=Number(b.dataset.stage);update(false)}));
  q('[data-prev]').addEventListener('click',()=>{stage=Math.max(0,stage-1);update(false)});q('[data-next]').addEventListener('click',()=>{stage=Math.min(steps.length-1,stage+1);update(false)});
  q('[data-reset]').addEventListener('click',()=>{state={...initial};stage=0;update()});update();
 }
 root.VisionDepthCloud={mount};
})(window);
