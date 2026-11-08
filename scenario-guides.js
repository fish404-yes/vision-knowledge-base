(function(root){
 'use strict';
 const model=root.VisionScenarioModels;
 const lightNames={ring:'环形光',bar:'条形侧光',back:'背光',dark:'低角度光',coax:'同轴光',dome:'穹顶漫射光'};
 const materials={matte:'哑光表面','flat-metal':'平整反光面','curved-metal':'曲面反光件',transparent:'透明件'};
 const goals={outline:'外轮廓／孔位',scratch:'划痕／表面纹理',text:'字符／图案',presence:'有无／位置'};
 let serial=0;

 function lightScene(material,mode,id){
  const fixture={
   ring:'<rect x="122" y="106" width="56" height="20" rx="5"/><rect x="382" y="106" width="56" height="20" rx="5"/><path d="M150 128L230 220 M410 128L330 220"/>',
   bar:'<rect x="60" y="140" width="68" height="22" rx="5"/><path d="M128 150L230 220 M128 158L275 220"/>',
   back:'<rect x="125" y="268" width="310" height="18" rx="4"/><path d="M150 266V185 M410 266V185" stroke-dasharray="5 5"/>',
   dark:'<rect x="62" y="230" width="65" height="20" rx="5"/><path d="M127 236L230 216 M127 244L280 220"/>',
   coax:'<rect x="391" y="108" width="70" height="22" rx="5"/><path d="M391 119H280V220 M391 126H290V220"/>',
   dome:'<path d="M120 220Q120 70 280 70Q440 70 440 220" stroke-width="11"/><path d="M160 170L225 220 M225 110L260 220 M335 110L300 220 M400 170L335 220"/>'
  };
  const fill=material==='transparent'?'#8ec9d6':'#90c4aa';
  return `<svg viewBox="0 0 560 320" role="img" aria-label="${lightNames[mode]}照明与${materials[material]}的布置示意" class="scenario-svg"><rect width="560" height="320" rx="14" fill="#102539"/><path d="M40 230H520" stroke="#3c5a65" stroke-dasharray="5 6"/><rect x="238" y="22" width="84" height="44" rx="9" fill="#326c64" stroke="#8dd9bc"/><circle cx="280" cy="68" r="9" fill="#b1e6cd"/><text x="250" y="50" fill="#e8fbf3" font-size="15">相机</text><path d="M280 78V202" stroke="#92b6b1" stroke-dasharray="6 5"/><g fill="#f0bc77" fill-opacity=".9" stroke="#f0bc77" stroke-width="3">${fixture[mode]}</g><rect x="170" y="220" width="220" height="34" rx="5" fill="${fill}" fill-opacity="${material==='transparent'?'.38':'.8'}" stroke="#b7ead8" stroke-width="2"/><text x="205" y="243" fill="#edf9f5" font-size="14">${materials[material]}</text><text x="30" y="306" fill="#b9d5d4" font-size="13">${lightNames[mode]} · 照明位置示意，不是实拍效果</text></svg>`;
 }

 function lightGuide(target){
  const uid=++serial;
  target.innerHTML=`<section class="scenario-guide"><div class="scenario-head"><span class="tag">场景试选 · 互动示意</span><h2>从工件与特征开始试光</h2><p>先选材料和想看的特征，再切换照明方式，观察布置思路。</p></div><div class="scenario-layout"><div><div class="scenario-figure"></div><p class="scenario-note">图中只展示照明位置，未模拟相机照片和真实反射；不同工件必须用样件试光。</p></div><div class="scenario-panel"><div class="scenario-fields"><label for="material-${uid}">工件表面<select id="material-${uid}" data-material>${Object.entries(materials).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label for="goal-${uid}">想看什么<select id="goal-${uid}" data-goal>${Object.entries(goals).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div><div class="scenario-recommend" aria-live="polite"></div><div class="scenario-label">切换照明布置</div><div class="scenario-buttons">${Object.entries(lightNames).map(([k,v])=>`<button type="button" data-light="${k}" aria-pressed="false">${v}</button>`).join('')}</div><p class="scenario-current" aria-live="polite"></p></div></div><div class="scenario-foot"><strong>选光检查：</strong>先确认目标与表面，再比较光照方向、尺寸、工作距离和波长；最后结合曝光、相机视野与样件验证。<br><a href="https://www.keyence.com/products/vision/resources/vision-resources/basics-of-lighting-selection.jsp">参考：KEYENCE 照明选型</a> · <a href="#demo/lighting">查看六种照明示意 →</a></div></section>`;
  const mat=target.querySelector('[data-material]'),goal=target.querySelector('[data-goal]');
  let current='back';
  function update(reset){
   const r=model.lighting(mat.value,goal.value);if(!r)return;
   if(reset)current=r.first;
   target.querySelector('.scenario-figure').innerHTML=lightScene(mat.value,current,uid);
   target.querySelector('.scenario-recommend').innerHTML=`<span>可以先试</span><strong>${lightNames[r.first]}</strong><p>${r.why}</p><p>也可比较：${lightNames[r.second]}。${r.check}</p>`;
   target.querySelector('.scenario-current').textContent=`当前示意：${lightNames[current]}；可点击其他方式对比布置。`;
   target.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===current)));
  }
  mat.addEventListener('change',()=>update(true));goal.addEventListener('change',()=>update(true));
  target.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{current=b.dataset.light;update(false)}));
  update(true);
 }

 const methods={
  stereo:{title:'双目视觉',badge:'两路图像 · 视差',principle:'两台相机从不同位置观察同一特征，根据对应点视差与标定关系计算深度；部分系统也会投射纹理辅助匹配。',uses:'适合有纹理的场景，以及部分工件定位、体积或距离应用。',limits:'弱纹理、重复纹理、遮挡和反光可能导致匹配失败；深度范围与精度依设备、基线和距离而定。',link:'#demo/stereo',linkText:'试试双目视差'},
  structured:{title:'结构光',badge:'投射图案 · 重建表面',principle:'把已知条纹或其他图案投到工件上，由相机观察图案变化，再结合系统标定计算深度。',uses:'可评估用于表面形状、三维定位和尺寸检测。',limits:'环境光、遮挡、透明或高反光表面可能影响结果；多帧投影方案需考虑工件运动。',link:'#category/vision3d',linkText:'查看 3D 视觉知识'},
  laser:{title:'激光轮廓',badge:'激光线 · 一条截面',principle:'激光线投到表面后由相机观察，利用三角测量得到一条轮廓；相对运动可形成多条截面。',uses:'焊缝、台阶、截面轮廓或随输送运动的工件检测。',limits:'需要核对线宽覆盖、遮挡、表面反光、采样速度和运动同步，结果依具体设备而定。',link:'#demo/profile',linkText:'查看截面轮廓'},
  tof:{title:'飞行时间 ToF',badge:'发光 · 接收回波',principle:'发出调制光或光脉冲，通过回波的时间或相位信息估计距离，具体实现因设备而异。',uses:'可评估用于距离、占用、空间感知和较大范围的深度采集。',limits:'强环境光、反射率、多路径和距离范围可能影响结果；不要仅凭技术名称判断精度。',link:'#category/vision3d',linkText:'查看 3D 视觉知识'}
 };
 function methodScene(id){
  const secondary={stereo:'<rect x="370" y="48" width="105" height="46" rx="9" fill="#376a88"/><text x="390" y="77">右相机</text><path d="M420 96L296 224" stroke="#79b9d2"/>',structured:'<rect x="370" y="48" width="105" height="46" rx="9" fill="#916d44"/><text x="386" y="77">投影器</text><path d="M420 96L260 224 M430 96L300 224 M440 96L340 224" stroke="#f1bf80"/>',laser:'<rect x="370" y="48" width="105" height="46" rx="9" fill="#914f52"/><text x="391" y="77">激光器</text><path d="M420 96L300 224" stroke="#ff8a88" stroke-width="4"/>',tof:'<rect x="370" y="48" width="105" height="46" rx="9" fill="#916d44"/><text x="381" y="77">发光单元</text><path d="M420 96L310 224" stroke="#f1bf80" stroke-dasharray="7 5"/>'};
  const hint={stereo:'两视图匹配 → 视差 → 深度',structured:'投射已知图案 → 观察变化 → 深度',laser:'激光线 → 一条轮廓；多截面需相对运动',tof:'发光 → 回波 → 时间 / 相位 → 距离'};
  return `<svg viewBox="0 0 560 320" class="scenario-svg" role="img" aria-label="${methods[id].title}原理示意"><rect width="560" height="320" rx="14" fill="#102539"/><style>text{font:15px 'Microsoft YaHei',sans-serif;fill:#e3f5ee}</style><rect x="76" y="48" width="105" height="46" rx="9" fill="#326c64"/><text x="95" y="77">${id==='stereo'?'左相机':id==='tof'?'接收器':'相机'}</text><path d="M128 96L260 224" stroke="#86d9bd" stroke-width="2"/>${secondary[id]}<rect x="180" y="220" width="200" height="36" rx="5" fill="#91c6ad" fill-opacity=".5" stroke="#a9e9d0" stroke-width="2"/><text x="257" y="243">工件</text><text x="28" y="298" font-size="12">${hint[id]}</text></svg>`;
 }
 function compareGuide(target){
  target.innerHTML=`<section class="scenario-guide"><div class="scenario-head"><span class="tag">方法对比 · 互动示意</span><h2>常见 3D 方法怎么区分？</h2><p>点击方法，查看它从什么信息得到深度、适合讨论什么任务以及需要核对的条件。</p></div><div class="scenario-buttons scenario-methods" role="group" aria-label="三维视觉方法">${Object.entries(methods).map(([k,v])=>`<button type="button" data-method="${k}" aria-pressed="false">${v.title}</button>`).join('')}</div><div class="scenario-layout"><div><div class="scenario-figure"></div><p class="scenario-note">原理是简化示意，不代表所有产品的硬件布局；技术之间可以组合。</p></div><div class="scenario-panel scenario-method-result" aria-live="polite"></div></div><div class="scenario-foot">没有一种方法适合所有工件。先定义视野、工作距离、节拍、精度和材质，再按具体设备的规格及样件测试比较。<br><a href="https://www.baslerweb.com/en/learning/time-of-flight-stereovision/">参考：Basler ToF 与双目比较</a> · <a href="#category/vision3d">查看 3D 知识目录 →</a></div></section>`;
  function select(id){const m=methods[id];target.querySelector('.scenario-figure').innerHTML=methodScene(id);target.querySelector('.scenario-method-result').innerHTML=`<span class="scenario-kicker">${m.badge}</span><h3>${m.title}</h3><p><strong>怎么得到深度：</strong>${m.principle}</p><p><strong>常见任务：</strong>${m.uses}</p><p><strong>需要核对：</strong>${m.limits}</p><a href="${m.link}">${m.linkText} →</a>`;target.querySelectorAll('[data-method]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.method===id)))}
  target.querySelectorAll('[data-method]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.method)));select('stereo');
 }
 root.VisionScenarioGuides={lightScene,mount(target,id){if(id==='lighting-guide')lightGuide(target);else if(id==='3d-compare')compareGuide(target)}};
})(window);
