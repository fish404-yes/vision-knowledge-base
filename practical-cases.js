(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionPracticalCases=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const cases=[
  {id:'scratch',title:'反光金属表面划痕检测',label:'外观检测',desc:'从表面和缺陷入手，比较光源，再观察 ROI、分割与样件验证。',tags:['反光','划痕','低角度光','外观','缺陷'],links:['demo:light-compare','project:defect-threshold','tool:image-lab'],visual:'scratch',
   scenario:'工件为表面反光的金属板，目标是在指定区域识别可能的划痕。划痕方向、大小和允许的缺陷范围由具体工艺给出。',
   focus:'先让目标与背景产生稳定对比，再选择图像处理方法。',
   stages:[
    {title:'明确检测目标',prepare:'收集正常件和包含不同位置、方向划痕的样件，确认检测范围与可接受缺陷。',algorithm:'检查安装空间、工件位置变化、相机视野和节拍；先记录原始图像。',output:'得到需要看清的特征、检测区域和待验证的样件条件。',clue:'只看到工件不代表细划痕一定能被区分；尺寸、公差和缺陷标准应由项目确定。'},
    {title:'比较照明效果',prepare:'固定相机与工件，从环形光、低角度光或条形侧光等方向开始试光。',algorithm:'改变照射方向、距离和曝光，并比较相同位置的划痕与背景；背光可另用于检查轮廓。',output:'选出值得进一步验证的一组布光条件，并保存原图。',clue:'低角度光对某些划痕可能有效，但方向和材质会改变效果；不能保证所有划痕都变亮。',links:[['对比三种光源示意','#demo/light-compare']]},
    {title:'设置检测区域',prepare:'在清晰原图上排除固定孔位、边缘及无关区域，设置 ROI。',algorithm:'根据实际明暗特征尝试灰度阈值、面积筛选等，逐一检查中间结果。',output:'得到候选区域以及相应的像素面积或数量。',clue:'阈值和面积只是方法示例；纹理、高光、油污和噪点都可能造成误检或漏检。',links:[['打开图像实验区','#image-lab'],['查看阈值分步案例','#project/defect-threshold']]},
    {title:'用样件验证',prepare:'使用不同批次、位置和方向的正常与缺陷样件，复核相机、光源和工装状态。',algorithm:'记录漏检、误检和不确定结果；按项目规定比较结果，必要时调整照明和算法。',output:'形成可复查的原图、参数和样件验证记录。',clue:'结果是否满足现场要求，需要依据真实样件、工艺标准和重复性测试判断。'}
   ]},
  {id:'two-mark',title:'双 Mark 引导机械手抓取',label:'视觉定位',desc:'分别拍照、统一坐标、计算产品偏差，再衔接机器人示教补偿。',tags:['双Mark','眼在手上','抓取','坐标','机器人'],links:['project:single','demo:marks','article:2d-mark'],visual:'mark',
   scenario:'大工件上的两个 Mark 不能同时进入相机视野；相机安装在机械手末端，机械手移动后分别拍摄。',
   focus:'两次图像先各自映射到同一物理坐标系，再计算产品位置和方向。',
   stages:[
    {title:'建立基准',prepare:'固定基准产品，记录两次拍照位姿和对应的 Mark 身份，并示教可用抓取位姿。',algorithm:'分别将两点转换到约定的基坐标，记录基准中点和 M1 → M2 的连线角。',output:'基准参考点 C₀、基准方向 θ₀ 和机器人示教抓取姿态。',clue:'双 Mark 中点是定位参考，不一定是产品几何中心或夹爪中心。'},
    {title:'分别拍摄两点',prepare:'机械手到达第一、第二拍照位，分别读取对应图像和拍照时的机器人位姿。',algorithm:'识别每个 Mark，并按该次拍照的位姿、手眼关系和工作平面映射到同一坐标系。',output:'当前的物理点 M1、M2；识别失败或映射无效时不输出有效姿态。',clue:'像素坐标、局部物理坐标与机器人基坐标不能直接混用；现场接口是否已做补偿要核对。',links:[['查看两次拍照分步演示','#project/single']]},
    {title:'求位置与角度偏差',prepare:'确保 M1、M2 身份及连线方向与基准一致。',algorithm:'求当前中点 C；用 atan2(Y₂−Y₁, X₂−X₁) 求当前角 θ，再计算并归一化 θ−θ₀。',output:'中点偏移和产品相对基准的旋转偏差 Δθ。',clue:'两点交换可能造成约 180° 的方向变化；两点重合时方向无定义。',links:[['操作双 Mark 图解','#demo/marks']]},
    {title:'衔接抓取补偿',prepare:'机器人侧已经有正确的示教抓取姿态，且工件可近似为二维刚体。',algorithm:'将基准参考点到示教抓取点的偏移随 Δθ 旋转，再加到当前参考点；方向也按约定补偿。',output:'在双方约定下得到目标抓取位置与方向；控制器继续完成路径和姿态处理。',clue:'TCP、坐标系、姿态表示和角度正负须与机器人约定并验证；示意不替代实际运动与安全验证。',links:[['查看抓取偏差排查','#issues?q=%E4%BA%A7%E5%93%81%E8%BD%AC%E5%BE%97%E8%B6%8A%E5%A4%9A']]}
   ]},
  {id:'hole-pitch',title:'两个孔的中心距测量',label:'尺寸测量',desc:'从孔边和拟合圆开始，转换坐标并检查测量结果。',tags:['孔距','找圆','拟合圆','尺寸测量','标定'],links:['project:circle-calipers','project:measure','tool:image-lab','article:2d-measure'],visual:'holes',
   scenario:'平面板上有两个孔，需要得到孔中心距。相机、工件平面和测量要求需要保持在标定适用范围内。',
   focus:'测量的是两个孔中心的距离；边缘质量、拟合与坐标换算都会影响结果。',
   stages:[
    {title:'看清孔的边缘',prepare:'确认孔距范围和测量公差，安排能覆盖两孔的视野与合适光照。',algorithm:'检查对焦、孔边对比、遮挡与工件高度变化；可在具备条件时比较背光效果。',output:'两孔边缘清晰、适合后续处理的图像。',clue:'一个像素对应的物面尺寸不等于实际测量精度。',links:[['比较背光效果','#demo/light-compare']]},
    {title:'提取并拟合圆',prepare:'为两个孔分别设置搜索范围，避免把其他边缘混入。',algorithm:'提取孔边缘点并分别拟合圆，检查拟合残差和有效边缘是否充足。',output:'工作图像中的两个圆心及半径。',clue:'反光、遮挡或椭圆透视会影响拟合；拟合出圆并不自动代表结果准确。'},
    {title:'换算并计算距离',prepare:'使用适用于同一测量平面和工作图像的有效标定结果。',algorithm:'将两个圆心分别转换到同一物理坐标系，再计算两点之间的欧氏距离。',output:'示例：圆心间距 150 px、各向同性比例 0.05 mm/px 时，估算距离为 7.50 mm。',clue:'示例仅用于说明；透视、畸变或各方向比例不同时，不能直接用一个比例换算。',links:[['操作多测量线拟合圆','#project/circle-calipers'],['打开尺寸测量分步案例','#project/measure'],['打开图像实验区：测量线在页面下方','#image-lab']]},
    {title:'核查实际误差',prepare:'使用已知尺寸的标准件，覆盖视野中心与边缘，以及工件可能的高度范围。',algorithm:'重复测量并记录结果，检查漂移、重复性、标定及环境变化。',output:'一份可供判断是否满足工艺公差的验证记录。',clue:'示例数值和页面计算不能替代设备、标定及现场精度验收。'}
   ]}
 ];
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function illustration(type,step){
  let body='';
  if(type==='scratch')body='<rect x="86" y="94" width="360" height="110" rx="14" fill="#78938f" stroke="#388778" stroke-width="3"/><circle cx="140" cy="150" r="14" fill="#264c51"/><circle cx="394" cy="150" r="14" fill="#264c51"/><path d="M230 172l25-22 17-3 24-25" fill="none" stroke="#ffcf84" stroke-width="4"/><path d="M48 58L166 94 134 94Z" fill="#f4c681" opacity=".4"/><text x="55" y="50">光源</text><text x="240" y="193">表面划痕</text>';
  if(type==='mark')body='<rect x="90" y="115" width="340" height="58" rx="7" fill="none" stroke="#a8bdc0" stroke-dasharray="6 5" stroke-width="3"/><g transform="rotate(-12 270 145)"><rect x="90" y="115" width="340" height="58" rx="7" fill="#cbe8dc" stroke="#388e7c" stroke-width="3"/><path d="M119 145H405" stroke="#268b76" stroke-width="3"/><circle cx="119" cy="145" r="8" fill="#f5a66a"/><circle cx="405" cy="145" r="8" fill="#548ec2"/><circle cx="262" cy="145" r="6" fill="white" stroke="#278d79" stroke-width="3"/><text x="102" y="128">M1</text><text x="390" y="128">M2</text></g><path d="M54 216h40m-40 0v-40" stroke="#658b87" stroke-width="2"/><text x="97" y="219">X</text><text x="49" y="170">Y</text>';
  if(type==='holes')body='<rect x="83" y="78" width="360" height="138" rx="14" fill="#cbe8dc" stroke="#388e7c" stroke-width="3"/><circle cx="167" cy="147" r="32" fill="#edf6ef" stroke="#4f9c87" stroke-width="3"/><circle cx="360" cy="147" r="32" fill="#edf6ef" stroke="#4f9c87" stroke-width="3"/><path d="M157 147h20m-10-10v20 M350 147h20m-10-10v20" stroke="#d88f58" stroke-width="3"/><path d="M167 228H360 M167 222v12 M360 222v12" stroke="#bd8150" stroke-width="2"/><text x="220" y="247">中心距 D</text>';
  if(Number.isInteger(step)){
   const labels={scratch:['确认工件与目标','比较照明方向','框选检测区域','样件与结果复核'],mark:['记录基准方向','两次拍照各自映射','计算中点和角度','示教抓取补偿'],holes:['观察两孔边缘','提取边缘并拟合','转换后计算中心距','标准件重复验证']};
   const overlays={
    scratch:['<rect x="80" y="88" width="372" height="122" rx="17" fill="none" stroke="#e7a95e" stroke-width="3" stroke-dasharray="7 5"/>','<path d="M48 58L166 94 134 94Z" fill="#f2a43c" opacity=".55"/>','<rect x="213" y="108" width="100" height="78" rx="8" fill="none" stroke="#e7a95e" stroke-width="3" stroke-dasharray="6 4"/>','<circle cx="436" cy="76" r="16" fill="#3b9b80"/><path d="M428 76l5 5 10-12" fill="none" stroke="white" stroke-width="3"/>'],
    mark:['<path d="M118 104H406" stroke="#d58d59" stroke-width="3" stroke-dasharray="6 4"/>','<path d="M120 53v37 M405 53v37" stroke="#e4a564" stroke-width="3"/><text x="92" y="49">拍位 1</text><text x="375" y="49">拍位 2</text>','<circle cx="262" cy="145" r="18" fill="none" stroke="#e4a564" stroke-width="3"/>','<path d="M266 145l78 62" stroke="#e4a564" stroke-width="3"/><circle cx="344" cy="207" r="9" fill="#e4a564"/><text x="356" y="212">工具目标</text>'],
    holes:['<path d="M167 104v-18 M360 104v-18" stroke="#e4a564" stroke-width="3"/>','<circle cx="167" cy="147" r="36" fill="none" stroke="#e4a564" stroke-width="2" stroke-dasharray="4 4"/><circle cx="360" cy="147" r="36" fill="none" stroke="#e4a564" stroke-width="2" stroke-dasharray="4 4"/>','<path d="M167 228H360" stroke="#e4a564" stroke-width="5"/>','<circle cx="435" cy="65" r="16" fill="#3b9b80"/><path d="M427 65l5 5 10-12" fill="none" stroke="white" stroke-width="3"/>']
   };
   body+=overlays[type][step]+'<rect x="15" y="12" width="180" height="25" rx="7" fill="#d7efe1"/><text x="26" y="29" fill="#206c59" font-weight="700">'+labels[type][step]+'</text>';
  }
  return '<svg viewBox="0 0 520 270" role="img" aria-label="案例场景合成示意"><rect width="520" height="270" rx="12" fill="#edf6ef"/><g fill="#496f65" font-family="sans-serif" font-size="13">'+body+'</g><text x="352" y="28" fill="#6e9388" font-size="11" font-family="sans-serif">SCHEMATIC / 示意</text></svg>';
 }
 function mountIndex(target){
  target.innerHTML='<div class="wrap practical-page"><div class="page-head"><div class="eyebrow">APPLICATION STORIES</div><h1>现场应用案例</h1><p>从工件和目标出发，逐步看成像、处理、输出和验证。</p></div><div class="practical-intro">这里的图像、数值和流程是为理解制作的示例；具体设备、参数与结果需结合样件验证。</div><div class="practical-list">'+cases.map(c=>'<a class="practical-card" href="#case/'+esc(c.id)+'"><div class="practical-thumb">'+illustration(c.visual)+'</div><div class="practical-card-copy"><span>'+esc(c.label)+' · '+c.stages.length+' 步</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.desc)+'</p><strong>查看完整案例 →</strong></div></a>').join('')+'</div></div>';
 }
 function mountDetail(target,id,related){
  const item=cases.find(c=>c.id===id);if(!item)return false;let step=0;
  target.innerHTML='<div class="wrap practical-page"><div class="practical-breadcrumb"><a href="#cases">← 全部现场案例</a><span> / '+esc(item.label)+'</span></div><div class="page-head"><div class="eyebrow">APPLICATION STORY / '+esc(item.label)+'</div><h1>'+esc(item.title)+'</h1><p>'+esc(item.scenario)+'</p></div><div class="practical-detail"><div class="practical-stage-visual"><div class="practical-diagram">'+illustration(item.visual)+'</div><div class="practical-focus"><span>这个案例先看什么</span><strong>'+esc(item.focus)+'</strong><small>示意图 · 非实拍</small></div><div class="practical-steps" aria-label="案例步骤"></div></div><div class="practical-stage-content" aria-live="polite"></div></div><div class="practical-related">'+(related||'')+'</div></div>';
  const steps=target.querySelector('.practical-steps'),content=target.querySelector('.practical-stage-content');
  function update(){
   const stage=item.stages[step];
   target.querySelector('.practical-diagram').innerHTML=illustration(item.visual,step);
   steps.innerHTML=item.stages.map((s,i)=>'<button type="button" data-step="'+i+'" aria-pressed="'+String(i===step)+'"><span>0'+(i+1)+'</span>'+esc(s.title)+'</button>').join('');
   content.innerHTML='<span class="practical-step-badge">第 '+(step+1)+' / '+item.stages.length+' 步</span><h2>'+esc(stage.title)+'</h2><div class="practical-block"><span>准备</span><p>'+esc(stage.prepare)+'</p></div><div class="practical-block"><span>操作</span><p>'+esc(stage.algorithm)+'</p></div><div class="practical-block"><span>输出</span><p>'+esc(stage.output)+'</p></div><div class="practical-clue"><strong>观察与注意</strong><p>'+esc(stage.clue)+'</p></div>'+(stage.links?'<div class="practical-inline-links">'+stage.links.map(l=>'<a href="'+esc(l[1])+'">'+esc(l[0])+' →</a>').join('')+'</div>':'')+'<div class="practical-arrows"><button type="button" data-prev '+(step===0?'disabled':'')+'>← 上一步</button><span>'+(step+1)+' / '+item.stages.length+'</span><button type="button" data-next '+(step===item.stages.length-1?'disabled':'')+'>下一步 →</button></div>';
   steps.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update();steps.querySelector('[data-step="'+step+'"]').focus()}));
   content.querySelector('[data-prev]').addEventListener('click',()=>{if(step>0){step--;update();const nextFocus=content.querySelector('[data-prev]:not(:disabled)')||content.querySelector('[data-next]:not(:disabled)');if(nextFocus)nextFocus.focus()}});
   content.querySelector('[data-next]').addEventListener('click',()=>{if(step<item.stages.length-1){step++;update();const nextFocus=content.querySelector('[data-next]:not(:disabled)')||content.querySelector('[data-prev]:not(:disabled)');if(nextFocus)nextFocus.focus()}});
  }
  update();return true;
 }
 return{cases,mountIndex,mountDetail};
});
