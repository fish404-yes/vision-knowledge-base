/* 两个分步互动均使用纯几何合成数据，不连接实际设备。 */
(function(root){
 'use strict';
 const M=root.Vision3DLabsModel;
 const f=(n,d=1)=>Number(n).toFixed(d);
 const stepHeader=steps=>`<div class="three-steps" role="group" aria-label="图解步骤">${steps.map((s,i)=>`<button type="button" data-stage="${i}" aria-pressed="${i===0}"><b>${String(i+1).padStart(2,'0')}</b>${s.short}</button>`).join('')}</div><div class="three-guide"><div><span data-stage-count></span><h3 data-stage-title></h3><p data-stage-text></p></div><div class="three-nav"><button type="button" data-prev>← 上一步</button><button type="button" data-next>下一步 →</button></div></div>`;
 function wireStages(target,steps,onChange){
  let stage=0;const q=s=>target.querySelector(s);
  function update(){
   q('[data-stage-count]').textContent='第 '+(stage+1)+' / '+steps.length+' 步';
   q('[data-stage-title]').textContent=steps[stage].title;q('[data-stage-text]').textContent=steps[stage].text;
   target.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===stage)));
   target.querySelectorAll('[data-card]').forEach(c=>c.classList.toggle('is-focused',c.dataset.card===steps[stage].card));
   q('[data-prev]').disabled=stage===0;q('[data-next]').disabled=stage===steps.length-1;
  }
  target.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{stage=Number(b.dataset.stage);update()}));
  q('[data-prev]').addEventListener('click',()=>{stage=Math.max(0,stage-1);update()});
  q('[data-next]').addEventListener('click',()=>{stage=Math.min(steps.length-1,stage+1);update()});
  update();return ()=>{stage=0;update();if(onChange)onChange()};
 }
 function sceneSvg(r){
  const py=28+r.selected.actual*1.85;
  return `<svg viewBox="0 0 320 260" role="img" aria-label="工件俯视示意，选中轮廓实际位置 Y ${f(r.selected.actual)} 毫米">
   <rect width="320" height="260" rx="10" fill="#102b37"/><rect x="100" y="28" width="120" height="185" fill="#203f48" stroke="#729b9c" stroke-width="2"/>
   <rect x="136" y="83.5" width="48" height="74" fill="#4bcba7" opacity=".55" stroke="#a4f0d2" stroke-width="2"/>
   <line x1="84" y1="${py}" x2="236" y2="${py}" stroke="#ffc269" stroke-width="4"/><text x="242" y="${py+4}" fill="#ffcf87" font-size="12">当前线</text>
   <text x="21" y="27" fill="#c1dedb" font-size="12">工件俯视 · X 横向</text><text x="25" y="51" fill="#c1dedb" font-size="12">Y 扫描方向 ↓</text><text x="21" y="240" fill="#a6c8c8" font-size="12">绿色区域：实际凸台 Y = 30～70 mm</text></svg>`;
 }
 function profileSvg(r){
  const p=r.selected.raised?'40,195 118,195 118,123 202,123 202,195 280,195':'40,195 280,195';
  return `<svg viewBox="0 0 320 260" role="img" aria-label="当前扫描线的 XZ 轮廓，${r.selected.raised?'经过凸台，凸台相对底面高度 8 毫米':'没有经过凸台'}">
   <rect width="320" height="260" rx="10" fill="#102b37"/><path d="M40 45V210H290" fill="none" stroke="#88a7aa" stroke-width="1.5"/>
   <polyline points="${p}" fill="none" stroke="#ffc269" stroke-width="4" stroke-linejoin="round"/>
   <text x="44" y="32" fill="#c1dedb" font-size="12">Z ↑</text><text x="282" y="228" fill="#c1dedb" font-size="12">X →</text>
   <text x="20" y="242" fill="#a6c8c8" font-size="12">${r.selected.raised?'本条扫到凸台：相对高度 8 mm':'本条只扫到底面：高度 0 mm'}</text></svg>`;
 }
 function cloudSvg(r){
  const dots=[];
  for(const row of r.rows){
   for(let x=-30;x<=30;x+=3){
    const z=row.raised&&x>=-12&&x<=12?8:0;
    const sx=70+(x+30)*1.8+row.output*1.05,sy=240-row.output*.65-z*5.5;
    const selected=row.index===r.selected.index;
    dots.push(`<circle cx="${f(sx,2)}" cy="${f(sy,2)}" r="${selected?'2.5':'1.65'}" fill="${selected?'#ffc269':z?'#68dfb9':'#87aeb5'}"/>`);
   }
  }
  return `<svg viewBox="0 0 420 300" role="img" aria-label="合成点云投影，共 ${r.count} 条轮廓，按重建位置排列">
   <rect width="420" height="300" rx="10" fill="#102b37"/><path d="M70 240h108M70 240l105 -65M70 240v-70" fill="none" stroke="#6d9196" stroke-width="1.4"/>
   ${dots.join('')}<text x="182" y="244" fill="#c1dedb" font-size="12">X</text><text x="178" y="171" fill="#c1dedb" font-size="12">Y（重建）</text><text x="58" y="165" fill="#c1dedb" font-size="12">Z</text>
   <text x="18" y="280" fill="#a6c8c8" font-size="12">橙色：当前轮廓　绿色：凸台　灰蓝：底面</text></svg>`;
 }
 function mountScan(target){
  let state={...M.scanDefaults};
  const steps=[
   {short:'扫描场景',title:'先认识扫描方向',text:'绿色是工件上的凸台，橙线是当前采集位置。相机或工件相对移动时，扫描线依次经过不同位置。',card:'scene'},
   {short:'单条轮廓',title:'每次得到一条 XZ 轮廓',text:'每条轮廓横向是 X，高低是 Z；拖动扫描位置，观察截面经过凸台前后的变化。',card:'profile'},
   {short:'拼成点云',title:'用每条轮廓的位置排成三维点',text:'每条轮廓中的点放到对应 Y 位置，才有 X、Y、Z。橙色点是当前轮廓，切换采集方式可改变点的 Y。',card:'cloud'},
   {short:'速度与间距',title:'比较时间采集和编码器采集',text:'点击“速度翻倍”，定时采集仍按 40 mm/s 假定速度重建，会得到错误长度；再切换到理想编码器模式对比。',card:'summary'}
  ];
  target.innerHTML=`<section class="three-lab" aria-labelledby="scan3d-title"><header class="three-head"><div><span>3D VISION / 分步互动</span><h2 id="scan3d-title">激光轮廓如何拼成点云？</h2><p>先看一条截面，再看多条截面如何沿 Y 排列。改变速度，观察轮廓间距和重建位置。</p></div><button type="button" data-reset>恢复示例</button></header>
   ${stepHeader(steps)}
   <div class="three-controls"><div><strong>轮廓采集方式</strong><div class="three-buttons" role="group" aria-label="轮廓采集方式"><button type="button" data-mode="time" aria-pressed="true">定时采集</button><button type="button" data-mode="encoder" aria-pressed="false">理想编码器等距</button><button type="button" data-fast>速度翻倍体验</button></div><p>定时：固定 20 条/秒，重建假定速度 40 mm/s；编码器：每移动 2 mm 一条，并使用真实位移。</p></div>
   <label><span>实际相对速度 <output data-speed-out></output></span><input type="range" min="20" max="80" step="5" data-speed><small>本例一次扫描内速度恒定。</small></label>
   <label><span>想查看的 Y 位置 <output data-position-out></output></span><input type="range" min="0" max="100" step="1" data-position><small>自动选取最近的实际采样轮廓。</small></label></div>
   <div class="three-grid"><article class="three-card" data-card="scene"><span>01 / SCENE</span><h3>扫描工件</h3><div data-scene></div><p>底面长 100 mm；凸台实际 Y 范围 30～70 mm。</p></article>
   <article class="three-card" data-card="profile"><span>02 / PROFILE</span><h3>当前一条轮廓</h3><div data-profile></div><p>每次只得到一条 XZ 截面；需要位移信息确定它在 Y 轴上的位置。</p></article>
   <article class="three-card" data-card="cloud"><span>03 / POINT CLOUD</span><h3>轮廓组成点云</h3><div data-cloud></div><p>每条轮廓以重建的 Y 排列，橙色点对应左侧橙线。</p></article></div>
   <div class="three-result" data-card="summary" aria-live="polite"><h3>同一批轮廓，位置是怎么来的？</h3><div class="three-metrics" data-metrics></div><p data-explanation></p></div>
   <p class="three-foot">理想示意：合成凸台相对底面高 8 mm、X 间隔 3 mm；只按 0～100 mm 实际行程采样，不模拟激光三角测量或真实照片。定时模式特意用固定速度 40 mm/s 重建；若使用正确速度或位置反馈，结果会不同。编码器模式假定无打滑、方向和比例正确，设备能跟上所需线频；实际还需核查曝光、反光、遮挡和触发上限。<br><a href="#demo/plane-height">继续看：如何相对基准面测高 →</a> · <a href="https://docs.cognex.com/is-usp_2420/web/EN/InSight_EZ3D/Content/Topics/USPSheet3D/point-cloud-settings.htm" target="_blank" rel="noopener noreferrer">参考：扫描长度与速度设置 ↗</a></p></section>`;
  const q=s=>target.querySelector(s),resetStages=wireStages(target,steps);
  function update(){
   const r=M.scan(state);
   q('[data-scene]').innerHTML=sceneSvg(r);q('[data-profile]').innerHTML=profileSvg(r);q('[data-cloud]').innerHTML=cloudSvg(r);
   q('[data-speed]').value=state.speed;q('[data-speed-out]').textContent=state.speed+' mm/s';
   q('[data-position]').value=state.position;q('[data-position-out]').textContent=state.position+' mm';
   target.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
   const feat=r.feature;
   q('[data-metrics]').innerHTML=`<div><span>采样轮廓</span><strong>${r.count} 条</strong><small>实际间隔 ${f(r.actualStep,2)} mm</small></div>
    <div><span>当前轮廓 Y</span><strong>${f(r.selected.actual)} → ${f(r.selected.output)} mm</strong><small>实际位置 → 重建位置</small></div>
    <div><span>扫描末条 Y</span><strong>${f(r.actualEnd)} → ${f(r.outputEnd)} mm</strong><small>实际位置 → 重建位置</small></div>
    <div><span>凸台采样 Y 范围</span><strong>${feat?f(feat.outputFrom)+'～'+f(feat.outputTo)+' mm':'无采样'}</strong><small>${feat?'实际采样 '+f(feat.actualFrom)+'～'+f(feat.actualTo)+' mm':'未在凸台范围采到轮廓'}</small></div>`;
   q('[data-explanation]').textContent=state.mode==='time'
    ?'定时采集：实际间隔 = 速度 ÷ 20；此处重建间隔固定 2 mm。'+(state.speed===40?'当前实际速度与假定速度相同，位置一致；试试“速度翻倍体验”。':'速度与假定值不同，重建 Y 会'+(state.speed>40?'缩短':'拉长')+'。范围仅表示采到的首尾点，不等于拟合后的精确边界。')
    :'理想编码器：每移动 2 mm 采一条，以正确位移排列；当前需要 '+f(r.requiredRate,1)+' 条/秒。能否达到需核对设备线频、曝光和触发能力。';
  }
  q('[data-speed]').addEventListener('input',e=>{state.speed=Number(e.target.value);update()});
  q('[data-position]').addEventListener('input',e=>{state.position=Number(e.target.value);update()});
  target.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;update()}));
  q('[data-fast]').addEventListener('click',()=>{state.speed=80;state.mode='time';update()});
  q('[data-reset]').addEventListener('click',()=>{state={...M.scanDefaults};resetStages();update()});update();
 }
 function planeSvg(r,valid){
  const xx=x=>300+x*2.5,zz=z=>310-z*2.5;
  const foot=r.foot,p=r.idealPoint,planeZ=x=>r.a*x+r.offset;
  const vertical=`<line x1="${f(xx(p.x),2)}" y1="${f(zz(planeZ(p.x)),2)}" x2="${f(xx(p.x),2)}" y2="${f(zz(p.z),2)}" stroke="#f5ad66" stroke-width="2" stroke-dasharray="5 4"/>`;
  return `<svg viewBox="0 0 600 350" role="img" aria-label="${valid?'有效目标点与倾斜基准面的测高示意':'目标点无效，无法测高'}">
   <defs><pattern id="plane-lab-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#264b53" stroke-width="1"/></pattern></defs>
   <rect width="600" height="350" rx="10" fill="#102b37"/><rect width="600" height="350" fill="url(#plane-lab-grid)"/>
   <path d="M45 310H555M300 320V35" fill="none" stroke="#71969a" stroke-width="1.5"/><text x="560" y="314" fill="#c1dedb" font-size="14">X</text><text x="292" y="30" fill="#c1dedb" font-size="14">Z</text>
   <path d="M${f(xx(-60),2)} ${f(zz(planeZ(-60)),2)} L${f(xx(60),2)} ${f(zz(planeZ(60)),2)}" stroke="#70dec0" stroke-width="5"/>
   <text x="410" y="42" fill="#a9ebd7" font-size="14">绿色：基准面</text>
   <circle cx="${f(xx(foot.x),2)}" cy="${f(zz(foot.z),2)}" r="5" fill="#a9ebd7"/>
   ${valid?vertical:''}<line x1="${f(xx(foot.x),2)}" y1="${f(zz(foot.z),2)}" x2="${f(xx(p.x),2)}" y2="${f(zz(p.z),2)}" stroke="${valid?'#f7d27e':'#849ba0'}" stroke-width="4" ${valid?'':'stroke-dasharray="5 4"'}/>
   <circle cx="${f(xx(p.x),2)}" cy="${f(zz(p.z),2)}" r="7" fill="${valid?'#ffa85b':'#849ba0'}" stroke="#ffffff" stroke-width="2"/>
   <text x="${f(xx(p.x)+(p.x>25?-12:12),2)}" y="${f(zz(p.z)-8,2)}" text-anchor="${p.x>25?'end':'start'}" fill="#f4ded0" font-size="13">${valid?'有效点':'点无效'}</text>
   <text x="84" y="336" fill="#a6c8c8" font-size="12">侧视：示例坐标 X 向右、Z 向上</text></svg>`;
 }
 function mountPlane(target){
  let state={...M.planeDefaults};
  const steps=[
   {short:'认识 Z',title:'先看目标点的坐标 Z',text:'橙点是一个有效的表面点。Z 是它在本例坐标系里的位置，不一定等于凸起高度。',card:'figure'},
   {short:'认识基准面',title:'测高度前，先定从哪里开始',text:'绿色线是已知基准平面的侧视。改变平面的整体高度或倾斜角，观察目标点 Z 和参考面的变化。',card:'figure'},
   {short:'法向测高',title:'量点到平面的垂直距离',text:'黄色线代表本例采用的法向高度；橙色虚线是同 X 位置的竖直 Z 差，平面倾斜时两者一般不同。',card:'result'},
   {short:'无效点',title:'没有有效点，就不输出高度',text:'勾选“模拟目标点无效”：灰点仅标出合成场景中的理论位置，不能当成设备测量值，更不能把高度写成 0。',card:'result'}
  ];
  target.innerHTML=`<section class="three-lab" aria-labelledby="plane3d-title"><header class="three-head"><div><span>3D VISION / 分步互动</span><h2 id="plane3d-title">为什么测高度需要基准面？</h2><p>移动、抬高或倾斜基准面，看同一个凸起的原始 Z 与相对高度。</p></div><button type="button" data-reset>恢复示例</button></header>
   ${stepHeader(steps)}
   <div class="three-plane-layout"><article class="three-card" data-card="figure"><span>01 / REFERENCE PLANE</span><h3>点与基准面 · 侧视图</h3><div data-figure></div><p>绿色：基准面；黄色：法向距离；橙色虚线：竖直 Z 差。图中 Y 方向省略。</p></article>
    <div class="three-plane-controls"><strong>试着改变条件</strong><label><span>基准面倾斜 <output data-angle-out></output></span><input type="range" min="-15" max="15" step="1" data-angle></label><label><span>基准面在 X = 0 时的 Z <output data-offset-out></output></span><input type="range" min="30" max="70" step="1" data-offset></label><label><span>凸起底点的 X <output data-x-out></output></span><input type="range" min="-40" max="40" step="1" data-x></label><label><span>预设凸起高度（沿法向） <output data-height-out></output></span><input type="range" min="2" max="20" step="1" data-height></label><label class="three-check"><input type="checkbox" data-invalid> 模拟目标点无效</label><p>滑动位置和基准面参数，观察点的 Z 如何变化；测量方向以图中黄色法线为准。</p></div></div>
   <div class="three-result" data-card="result" aria-live="polite"><h3>目标点的位置与高度</h3><div class="three-metrics" data-metrics></div><p data-explanation></p><details><summary>查看本例的计算关系</summary><p>基准线：Z = tan(倾角) × X + 截距。<br>竖直 Z 差 = 点的 Z − 同 X 位置基准面的 Z。<br>法向有符号距离 = 竖直 Z 差 ÷ √(1 + tan²(倾角))。</p></details></div>
   <p class="three-foot">示例采用已知理想平面 Z = aX + c，沿法向构造一个目标点；没有从真实点云拟合平面，也没有模拟噪声或标定误差。图中的 Z 向上是自定义坐标；深度相机的光轴 Z、传感器坐标与工艺高度可能不同。不同软件的高度方向、符号及统计口径可能不同。<br><a href="#demo/plane-fit">继续看：多点拟合与缺失 →</a> · <a href="#demo/laser-scan-cloud">返回：激光轮廓拼接点云 →</a> · <a href="#demo/depth-cloud">查看：深度图到点云 →</a> · <a href="https://docs.cognex.com/vpronine_924/web/EN/help/html/f345f738-b58c-4d83-8905-813305228cb1.htm" target="_blank" rel="noopener noreferrer">参考：相对基准面的高度 ↗</a></p></section>`;
  const q=s=>target.querySelector(s),resetStages=wireStages(target,steps);
  function update(){
   const r=M.plane(state);q('[data-figure]').innerHTML=planeSvg(r,state.valid);
   for(const key of ['angle','offset','x','height']){q('[data-'+key+']').value=state[key];q('[data-'+key+'-out]').textContent=state[key]+(key==='angle'?'°':' mm')}
   q('[data-invalid]').checked=!state.valid;
   q('[data-metrics]').innerHTML=state.valid
    ?`<div><span>目标点 Z</span><strong>${f(r.point.z,2)} mm</strong><small>示例坐标下的位置</small></div><div><span>同 X 处基准面 Z</span><strong>${f(r.planeAtPoint,2)} mm</strong><small>绿色面在该位置的高度</small></div><div><span>竖直 Z 差</span><strong>${f(r.vertical,2)} mm</strong><small>沿示例 Z 轴</small></div><div><span>相对基准面的高度</span><strong>${f(r.height,2)} mm</strong><small>本例取垂直于平面方向</small></div>`
    :'<div class="three-no-data"><span>目标点无效</span><strong>无有效高度</strong><small>灰点只是合成场景的理论位置，不参与计算。</small></div>';
   q('[data-explanation]').textContent=state.valid?'同一个凸起相对基准面的法向高度保持 '+f(r.height,2)+' mm；平面位置和倾角会改变点的原始 Z。':'当前没有有效点坐标，因此不输出点的 Z 或高度；不能用 0 mm 代替无效值。';
  }
  for(const key of ['angle','offset','x','height'])q('[data-'+key+']').addEventListener('input',e=>{state[key]=Number(e.target.value);update()});
  q('[data-invalid]').addEventListener('change',e=>{state.valid=!e.target.checked;update()});
  q('[data-reset]').addEventListener('click',()=>{state={...M.planeDefaults};resetStages();update()});update();
 }
 root.Vision3DLabs={mount(target,id){if(!target||!M)return;if(id==='laser-scan-cloud')mountScan(target);else if(id==='plane-height')mountPlane(target)}};
})(window);
