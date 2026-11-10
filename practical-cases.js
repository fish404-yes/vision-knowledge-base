(function(root,factory){
 const model=typeof module==='object'&&module.exports?require('./vision-choice-model.js'):root.VisionChoiceModel;
 const api=factory(root,model);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionPracticalCases=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,model){
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
   ]},
  {id:'selection-planar-pick',kind:'selection',title:'平面取料：为什么先看 2D？',label:'选型案例 · 平面定位',desc:'从平面 XYR、视野和最小特征出发，理解相机、镜头与光源怎样一起选。',tags:['2D选型','平面抓取','视觉定位','视野','采样'],links:['tool:choice','tool:selection','case:two-mark','article:calib-handeye'],visual:'planar-selection',
   scenario:'假设机械手从托盘取哑光工件：工件可以平移和转动，拍照时高度、倾斜可控；项目只要求平面 X、Y 和方向角。',
   focus:'先明确输出是平面位置与方向，再按变化范围和最小可辨特征选择成像方案。',
   sources:[['Cognex：视觉引导取放与标定','https://docs.cognex.com/isvs_2610/web/EN/InSight_Sheet/Content/Topics/HowTo/VGR/VGR-guide-pick-or-place.htm']],
   stages:[
    {title:'先写清项目要求',prepare:'示例假设需覆盖的活动范围为 150 × 120 mm；范围已考虑工件平移和旋转，最小定位特征宽 2 mm。',algorithm:'拍照时产品停稳，工件位于已知平面；确认机器人需要 X、Y 和角度，以及可接受的定位与抓取误差。',output:'输入：工件外观和可控平面；输出：约定坐标系下的平面位姿。',clue:'XYR 的 R 是约定方向的平面角，不能直接当成所有机器人控制器的姿态值。'},
    {title:'判断 2D 或 3D',prepare:'确认工件高度和倾斜在使用范围内可控，特征不会被遮挡，夹爪有已示教的抓取关系。',algorithm:'先评估 2D 拍照、特征定位和平面标定；若高度、倾斜或堆叠变化影响抓取，再比较机械限位、补偿或 3D。',output:'本例初选：2D 面阵成像 + 平面标定 + 机器人抓取补偿。',clue:'工件有厚度不必然要用 3D；但单张 2D 图像不能可靠给出任意未知高度与空间姿态。',links:[['打开 2D / 3D 判断','#tools']]},
    {title:'估算成像条件',prepare:'示例范围 150 × 120 mm、余量 10%、最小特征 2 mm、目标采样 5 px；可一键带入 2D 选型。',algorithm:'视野至少约 165 × 132 mm；按示例采样目标，物面采样间距应不大于 2 ÷ 5 = 0.4 mm/px。再按相机传感器尺寸和工作距离试算镜头。',output:'优先比较视野覆盖、相机有效像素、镜头视野与成像圈；根据表面和特征试环形或侧向照明。',clue:'0.4 mm/px 是示例采样目标，不等于定位或抓取精度；光源类型也需用样件试出来。',transfer:true},
    {title:'联调并验证',prepare:'准备不同位置、角度和批次的样件，确认机械手拍照位、工具 TCP 和机器人侧示教抓取位。',algorithm:'验证图像到约定物理坐标的映射、角度正负、机器人补偿和实际抓取；记录失败图、偏差及周期。',output:'形成视野边缘、角度变化和重复抓取的验证记录，再决定具体设备。',clue:'相机在手上时，各次拍照需要对应的机器人位姿；不要对已经转换到基坐标的数据重复变换。',links:[['查看眼在手上双 Mark 案例','#case/two-mark']]}
   ]},
  {id:'selection-step-height',kind:'selection',title:'台阶测高：从轮廓到线频',label:'选型案例 · 高度测量',desc:'用输送中的台阶检测示例，连接线激光范围、点间距、线频和基准面。',tags:['3D选型','台阶测高','线激光','编码器','基准面','线频'],links:['tool:selection3d','demo:laser-scan-cloud','demo:plane-height','article:3d-laser'],visual:'height-selection',
   scenario:'假设工件沿输送方向运动，需要检测工件一片区域的台阶高度；示例范围为 100 × 50 mm，工艺允许误差假设为 0.1 mm。',
   focus:'高度需要相对基准测量；整面轮廓来自多条线及其对应位置。',
   sources:[['Cognex：轮廓采集与运动','https://docs.cognex.com/vpro_980sr1/web/en/help/html/1ae429e2-2cba-4874-9be7-90afb6eefbb4.htm'],['Cognex：点到基准面的距离示例','https://docs.cognex.com/vpronine_924/web/EN/help/html/f345f738-b58c-4d83-8905-813305228cb1.htm']],
   stages:[
    {title:'确定测什么高度',prepare:'假设需覆盖 100 × 50 mm 区域，最近与最远工作距离为 300～350 mm；高度结果相对指定基准面。',algorithm:'与工艺确认测量区域、基准面、点到面的方向、允许误差及测量节拍。',output:'输入：带台阶工件；输出：按约定定义计算的台阶高度。',clue:'0.1 mm 是虚构项目允许误差，不是传感器精度，也不是全部误差预算。'},
    {title:'判断采集范围',prepare:'一条轮廓能够观察单个截面；如果整个区域都要检查，就要确认是否允许工件与线激光相对运动。',algorithm:'本例先比较线激光加位置反馈扫描；也可按视野、时间和遮挡条件比较面扫描。只测固定点时可另评估位移传感器。',output:'本例初选：多条线轮廓 + 运动位置，组成可测量的表面数据。',clue:'线轮廓不能自行给出整面；运动、同步、遮挡和范围都需要验证。',links:[['看轮廓如何组成点云','#demo/laser-scan-cloud']]},
    {title:'估算采样和线频',prepare:'假设速度为 200 mm/s，目标轮廓间距为 0.2 mm，计划扫描行程 120 mm。',algorithm:'理论线频 = 200 ÷ 0.2 = 1000 条/秒；匀速行程约 120 ÷ 200 = 0.6 秒。横向假设最小特征 1 mm、目标 5 点，点间距参考不大于 0.2 mm。',output:'可将案例及下方当前速度、间距带入 3D 工具，核对工作距离、有效宽度、点间距和线频。',clue:'0.6 秒不包含加减速、处理与机器人动作；点间距、线频和 Z 重复性都不能单独证明工艺精度。',transfer:true},
    {title:'基准面与样件验证',prepare:'确认基准面可见，准备不同高度、表面、位置及方向的工件，检查编码器和触发信号。',algorithm:'从有效基准点拟合或建立基准面，按工艺定义测量目标高度；用已知高度的标准件和实际样件重复比较。',output:'记录高度误差、无效点、最差位置、扫描及处理时间。',clue:'基准面选择、缺点和反光都可能改变结果；按实际设备文档确认距离和误差定义。',links:[['操作点云基准面测高','#demo/plane-height']]}
   ]},
  {id:'selection-bin-pick',kind:'selection',title:'散乱抓取：从料箱到抓取姿态',label:'选型案例 · 3D 抓取',desc:'从料箱深度、遮挡和机器人路径出发，理解为什么要评估整面 3D 与实际抓取。',tags:['3D选型','散乱抓取','料箱','空间姿态','遮挡','碰撞'],links:['tool:selection3d','article:3d-handeye','demo:depth-cloud','demo:3d-compare'],visual:'bin-selection',
   scenario:'假设哑光非对称工件在料箱中堆叠，位置、高度和朝向均不固定；机器人需要从中抓取单个可达工件。',
   focus:'除了找到工件，还要判断高度、方向、可抓取面和机械手能否安全到达。',
   sources:[['Zivid：料箱视野、ROI 与校验','https://support.zivid.com/en/latest/camera/academy/applications/bin-picking/prepare-for-production.html'],['Zivid：料箱场景的相机位置与遮挡','https://support.zivid.com/en/v2.13/academy/applications/bin-picking/positioning-correctly.html']],
   stages:[
    {title:'描述料箱与目标',prepare:'示例假设需覆盖 550 × 400 mm 的范围，目标在相机参考距离约 700～1000 mm 内；工件可能相互遮挡。',algorithm:'确认箱口、箱底、最高堆叠、最小可辨特征、工件材质、可抓取面和每件节拍。',output:'输入：箱内随机工件；输出：可抓取目标的位置、所需方向及有效状态。',clue:'如果工件形状对称或关键面被遮挡，单次图像可能无法唯一确定完整方向。'},
    {title:'判断为什么考虑 3D',prepare:'位置、高度和倾斜都可能改变，平面标定的固定工作面假设不再覆盖整个场景。',algorithm:'先评估能覆盖箱内体积的 3D 采集；若还需识别颜色或字符，可结合 2D 图像。',output:'本例初选：3D 场景采集 + 工件识别 + 可抓取姿态筛选。',clue:'3D 也可能出现遮挡、反光或缺点；采到点云不代表已经算出可执行抓取姿态。',links:[['比较常见 3D 方法','#demo/3d-compare']]},
    {title:'核对覆盖与安装',prepare:'从箱口到箱底核对视野、距离和分辨能力；确认相机安装、机器人和夹爪的空间关系。',algorithm:'比较固定安装或机器人携带相机，检查近远处视野、遮挡、曝光、采集及处理时间。',output:'可将示例范围和距离带入 3D 选型页，形成待比较的采集方案。',clue:'案例未给出的特征尺寸、采样要求和设备规格需要补充；按实际设备视野图核对。',transfer:true},
    {title:'验证抓取得了吗',prepare:'准备满箱、半箱、少件以及靠箱壁、遮挡、不同朝向的样件，完成相机与机器人的坐标标定。',algorithm:'逐一验证目标识别、坐标变换、TCP、夹爪碰撞与可达路径；记录抓取成功率、失败原因和完整节拍。',output:'得到可复核的点云、位姿、抓取结果和最差场景记录，再确定设备与工艺。',clue:'视觉输出的目标位姿不自动包含夹爪避碰、路径规划或抓取成功保证。',links:[['查看深度图与点云','#demo/depth-cloud']]}
   ]}
 ];
 let pendingTransfer=null;
 function createTransfer(id,demo={}){
  if(id==='selection-planar-pick')return {mode:'2d',id,title:'平面取料：为什么先看 2D？',values:{width:150,height:120,margin:10,distance:500,feature:2,featurePixels:5,sensorWidth:8.45,sensorHeight:7.07},context:{material:'matte',goal:'presence',backlight:'unknown',color:'unknown',lens:'fixed',speed:'0',exposure:'2'},note:'已带入高度可控的案例范围和采样目标。工作距离 500 mm、传感器 8.45 × 7.07 mm、曝光 2 ms 及普通定焦为演示假设；请按实际设备、特征和试光结果修改。'};
  if(id==='selection-step-height'){
   const speed=typeof demo.speed==='string'&&demo.speed.trim()!==''?Number(demo.speed):NaN,spacing=typeof demo.spacing==='string'&&demo.spacing.trim()!==''?Number(demo.spacing):NaN;
   if(!model.line(speed,spacing,null))return null;
   const example=model.example();return {mode:'3d',id,title:'台阶测高：从轮廓到线频',context:{task:'depth',coverage:'surface',motion:'moving',material:'unknown'},req:{...example.req,speed,spacing},spec:example.spec,note:'已带入案例条件和刚才调整的速度、间距；案例未指定表面材质，带入时留作待确认。初始设备 A/B 为虚构演示规格，请按实际设备资料修改。'};
  }
  if(id==='selection-bin-pick')return {mode:'3d',id,title:'散乱抓取：从料箱到抓取姿态',context:{task:'pose',coverage:'surface',motion:'unknown',material:'matte'},req:{width:550,height:400,near:700,far:1000},spec:{},note:'已带入料箱示例的范围、距离和任务；案例未提供运动方式、最小特征、采样点数和设备规格，带入时留作待确认。'};
  return null;
 }
 function consumeTransfer(mode){const result=pendingTransfer;pendingTransfer=null;return result&&result.mode===mode?result:null}
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function illustration(type,step){
  let body='';
  if(type==='scratch')body='<rect x="86" y="94" width="360" height="110" rx="14" fill="#78938f" stroke="#388778" stroke-width="3"/><circle cx="140" cy="150" r="14" fill="#264c51"/><circle cx="394" cy="150" r="14" fill="#264c51"/><path d="M230 172l25-22 17-3 24-25" fill="none" stroke="#ffcf84" stroke-width="4"/><path d="M48 58L166 94 134 94Z" fill="#f4c681" opacity=".4"/><text x="55" y="50">光源</text><text x="240" y="193">表面划痕</text>';
  if(type==='mark')body='<rect x="90" y="115" width="340" height="58" rx="7" fill="none" stroke="#a8bdc0" stroke-dasharray="6 5" stroke-width="3"/><g transform="rotate(-12 270 145)"><rect x="90" y="115" width="340" height="58" rx="7" fill="#cbe8dc" stroke="#388e7c" stroke-width="3"/><path d="M119 145H405" stroke="#268b76" stroke-width="3"/><circle cx="119" cy="145" r="8" fill="#f5a66a"/><circle cx="405" cy="145" r="8" fill="#548ec2"/><circle cx="262" cy="145" r="6" fill="white" stroke="#278d79" stroke-width="3"/><text x="102" y="128">M1</text><text x="390" y="128">M2</text></g><path d="M54 216h40m-40 0v-40" stroke="#658b87" stroke-width="2"/><text x="97" y="219">X</text><text x="49" y="170">Y</text>';
  if(type==='holes')body='<rect x="83" y="78" width="360" height="138" rx="14" fill="#cbe8dc" stroke="#388e7c" stroke-width="3"/><circle cx="167" cy="147" r="32" fill="#edf6ef" stroke="#4f9c87" stroke-width="3"/><circle cx="360" cy="147" r="32" fill="#edf6ef" stroke="#4f9c87" stroke-width="3"/><path d="M157 147h20m-10-10v20 M350 147h20m-10-10v20" stroke="#d88f58" stroke-width="3"/><path d="M167 228H360 M167 222v12 M360 222v12" stroke="#bd8150" stroke-width="2"/><text x="220" y="247">中心距 D</text>';
  if(type==='planar-selection')body='<rect x="75" y="74" width="365" height="142" rx="12" fill="#d8eee4" stroke="#4c9d88" stroke-width="3" stroke-dasharray="7 5"/><g transform="rotate(-12 265 145)"><rect x="174" y="112" width="180" height="66" rx="8" fill="#9ecdb9" stroke="#287e6e" stroke-width="3"/><circle cx="210" cy="145" r="8" fill="#df975b"/><circle cx="320" cy="145" r="8" fill="#df975b"/><path d="M210 145H320" stroke="#287e6e" stroke-width="2"/></g><path d="M96 228H160 M96 228V187" stroke="#587d76" stroke-width="2"/><text x="162" y="233">X</text><text x="89" y="182">Y</text><text x="86" y="67">需覆盖的活动范围</text><text x="197" y="208">定位特征 → 平面 XYR</text>';
  if(type==='height-selection')body='<rect x="64" y="176" width="390" height="26" rx="7" fill="#82bca9"/><path d="M108 176v-35h125v-25h90v60" fill="#cee3d9" stroke="#468d7b" stroke-width="3"/><rect x="213" y="44" width="94" height="45" rx="8" fill="#2d605b"/><text x="225" y="72" fill="#fff">线激光</text><path d="M255 89L205 141M265 89L323 116" stroke="#e29c56" stroke-width="2"/><path d="M110 221h292" stroke="#578a7e" stroke-width="2"/><path d="M394 216l9 5-9 5" fill="none" stroke="#578a7e" stroke-width="2"/><text x="204" y="240">输送方向</text><text x="335" y="135">台阶</text>';
  if(type==='bin-selection')body='<path d="M100 103l165-45 164 48-164 52z" fill="#d7eee3" stroke="#4f9b87" stroke-width="3"/><path d="M100 103v93l165 48v-86z" fill="#9ec8bb" stroke="#4f9b87" stroke-width="3"/><path d="M429 106v90l-164 48v-86z" fill="#b8d9cc" stroke="#4f9b87" stroke-width="3"/><path d="M163 123l38-13 32 12-36 14z M246 121l38-13 34 11-36 15z M202 147l39-13 32 12-35 14z" fill="#688d8b" stroke="#315f60" stroke-width="2"/><rect x="221" y="18" width="90" height="30" rx="7" fill="#2d605b"/><text x="233" y="38" fill="#fff">3D 相机</text><path d="M227 50L138 105 M304 50L384 106" stroke="#d69c5d" stroke-width="2" stroke-dasharray="5 4"/><text x="315" y="214">箱底 / 遮挡</text>';
  if(Number.isInteger(step)){
   const labels={scratch:['确认工件与目标','比较照明方向','框选检测区域','样件与结果复核'],mark:['记录基准方向','两次拍照各自映射','计算中点和角度','示教抓取补偿'],holes:['观察两孔边缘','提取边缘并拟合','转换后计算中心距','标准件重复验证'],'planar-selection':['明确平面定位需求','比较高度条件','视野与采样','标定与抓取验证'],'height-selection':['确定测量区域','轮廓随运动扫描','速度与轮廓间距','相对基准面测高'],'bin-selection':['观察料箱范围','比较采集范围','核查近远距离','验证夹爪能否到达']};
   const overlays={
    scratch:['<rect x="80" y="88" width="372" height="122" rx="17" fill="none" stroke="#e7a95e" stroke-width="3" stroke-dasharray="7 5"/>','<path d="M48 58L166 94 134 94Z" fill="#f2a43c" opacity=".55"/>','<rect x="213" y="108" width="100" height="78" rx="8" fill="none" stroke="#e7a95e" stroke-width="3" stroke-dasharray="6 4"/>','<circle cx="436" cy="76" r="16" fill="#3b9b80"/><path d="M428 76l5 5 10-12" fill="none" stroke="white" stroke-width="3"/>'],
    mark:['<path d="M118 104H406" stroke="#d58d59" stroke-width="3" stroke-dasharray="6 4"/>','<path d="M120 53v37 M405 53v37" stroke="#e4a564" stroke-width="3"/><text x="92" y="49">拍位 1</text><text x="375" y="49">拍位 2</text>','<circle cx="262" cy="145" r="18" fill="none" stroke="#e4a564" stroke-width="3"/>','<path d="M266 145l78 62" stroke="#e4a564" stroke-width="3"/><circle cx="344" cy="207" r="9" fill="#e4a564"/><text x="356" y="212">工具目标</text>'],
    holes:['<path d="M167 104v-18 M360 104v-18" stroke="#e4a564" stroke-width="3"/>','<circle cx="167" cy="147" r="36" fill="none" stroke="#e4a564" stroke-width="2" stroke-dasharray="4 4"/><circle cx="360" cy="147" r="36" fill="none" stroke="#e4a564" stroke-width="2" stroke-dasharray="4 4"/>','<path d="M167 228H360" stroke="#e4a564" stroke-width="5"/>','<circle cx="435" cy="65" r="16" fill="#3b9b80"/><path d="M427 65l5 5 10-12" fill="none" stroke="white" stroke-width="3"/>'],
    'planar-selection':['<path d="M160 96h210v100H160z" fill="none" stroke="#d78a4f" stroke-width="3" stroke-dasharray="5 4"/>','<path d="M265 62v28m-9-9 9 9 9-9" stroke="#d78a4f" stroke-width="3" fill="none"/>','<path d="M75 56h365 M75 50v12 M440 50v12" stroke="#d78a4f" stroke-width="3"/>','<circle cx="265" cy="145" r="17" fill="none" stroke="#d78a4f" stroke-width="3"/><path d="M265 145l82 50" stroke="#d78a4f" stroke-width="3"/>'],
    'height-selection':['<path d="M108 138h125v-25h90" fill="none" stroke="#e5a258" stroke-width="5"/>','<path d="M138 154v15 M176 154v15 M214 154v15 M252 132v34 M290 132v34" stroke="#e5a258" stroke-width="3" stroke-dasharray="4 3"/>','<path d="M117 220h166" stroke="#e5a258" stroke-width="5"/><text x="291" y="225">轮廓间距 Δy</text>','<path d="M341 116v25 M335 116h12 M335 141h12" stroke="#e5a258" stroke-width="3"/><text x="351" y="131">高度 h</text>'],
    'bin-selection':['<path d="M92 98l173-48 174 52" fill="none" stroke="#e5a258" stroke-width="3" stroke-dasharray="6 4"/>','<circle cx="200" cy="125" r="19" fill="none" stroke="#e5a258" stroke-width="3"/><circle cx="282" cy="123" r="19" fill="none" stroke="#e5a258" stroke-width="3"/>','<path d="M449 93v104 M442 93h14 M442 197h14" stroke="#e5a258" stroke-width="3"/>','<circle cx="201" cy="125" r="20" fill="none" stroke="#e5a258" stroke-width="3"/><path d="M202 95v-17m-6 6 6-6 6 6" stroke="#e5a258" stroke-width="3" fill="none"/>']
   };
   body+=overlays[type][step]+'<rect x="15" y="12" width="180" height="25" rx="7" fill="#d7efe1"/><text x="26" y="29" fill="#206c59" font-weight="700">'+labels[type][step]+'</text>';
  }
  return '<svg viewBox="0 0 520 270" role="img" aria-label="案例场景合成示意"><rect width="520" height="270" rx="12" fill="#edf6ef"/><g fill="#496f65" font-family="sans-serif" font-size="13">'+body+'</g><text x="352" y="28" fill="#6e9388" font-size="11" font-family="sans-serif">SCHEMATIC / 示意</text></svg>';
 }
 function mountIndex(target){
  const cards=list=>'<div class="practical-list">'+list.map(c=>'<a class="practical-card" href="#case/'+esc(c.id)+'"><div class="practical-thumb">'+illustration(c.visual)+'</div><div class="practical-card-copy"><span>'+esc(c.label)+' · '+c.stages.length+' 步</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.desc)+'</p><strong>查看完整案例 →</strong></div></a>').join('')+'</div>';
  target.innerHTML='<div class="wrap practical-page"><div class="page-head"><div class="eyebrow">APPLICATION STORIES</div><h1>应用示例</h1><p>从工件和目标出发，逐步看成像、处理、输出和验证。</p></div><div class="practical-intro">这里的图像、数值和流程是为理解制作的示例；具体设备、参数与结果需结合样件验证。</div><section class="practical-group"><h2>从需求到方案选型</h2><p>比较三种任务，理解为什么评估 2D、3D 或组合。</p>'+cards(cases.filter(c=>c.kind==='selection'))+'</section><section class="practical-group"><h2>成像、定位与测量</h2><p>从现场问题逐步看处理方法与验证。</p>'+cards(cases.filter(c=>c.kind!=='selection'))+'</section></div>';
 }
 function mountDetail(target,id,related){
  const item=cases.find(c=>c.id===id);if(!item)return false;let step=0;
  const demo={height:'controlled',speed:'200',spacing:'0.2',coverage:'surface'};
  const sources=item.sources?'<section class="practical-sources"><strong>参考资料</strong><p>以下资料用于说明相关原理，示例工况与数值由网站假设。</p><div>'+item.sources.map(s=>'<a href="'+esc(s[1])+'" target="_blank" rel="noopener noreferrer">'+esc(s[0])+' ↗</a>').join('')+'</div></section>':'';
  target.innerHTML='<div class="wrap practical-page"><div class="practical-breadcrumb"><a href="#cases">← 全部应用案例</a><span> / '+esc(item.label)+'</span></div><div class="page-head"><div class="eyebrow">APPLICATION STORY / '+esc(item.label)+'</div><h1>'+esc(item.title)+'</h1><p>'+esc(item.scenario)+'</p></div><div class="practical-detail"><div class="practical-stage-visual"><div class="practical-diagram">'+illustration(item.visual)+'</div><div class="practical-focus"><span>这个案例先看什么</span><strong>'+esc(item.focus)+'</strong><small>示意图 · 非实拍</small></div><div class="practical-steps" aria-label="案例步骤"></div></div><div class="practical-stage-content" aria-live="polite"></div></div>'+sources+'<div class="practical-related">'+(related||'')+'</div></div>';
  const steps=target.querySelector('.practical-steps'),content=target.querySelector('.practical-stage-content');
  function miniMarkup(){
   if(id==='selection-planar-pick'&&step===1)return '<div class="practical-mini" data-mini="height"><strong>动手试：高度条件变化</strong><div><button type="button" data-choice="controlled">高度可控</button><button type="button" data-choice="variable">高度有变化</button></div><p data-mini-result aria-live="polite"></p><small>仅改变本图解的判断，不会改动选型工具。</small></div>';
   if(id==='selection-step-height'&&step===2)return '<div class="practical-mini" data-mini="scan"><strong>动手试：修改速度或间距</strong><div class="practical-mini-fields"><label>速度（mm/s）<input data-mini-speed type="number" min="0" step="any" value="'+esc(demo.speed)+'"></label><label>轮廓间距（mm）<input data-mini-spacing type="number" min="0.000001" step="any" value="'+esc(demo.spacing)+'"></label></div><p data-mini-result aria-live="polite"></p><small>估算匀速理论线频；点击下方按钮时才会将当前数值带入选型工具。</small></div>';
   if(id==='selection-bin-pick'&&step===1)return '<div class="practical-mini" data-mini="coverage"><strong>动手试：改变采集范围</strong><div><button type="button" data-choice="surface">采集整面</button><button type="button" data-choice="point">只测单点</button></div><p data-mini-result aria-live="polite"></p><small>仅用于比较；带入选型时使用本案例的整面采集条件。</small></div>';
   return '';
  }
  function mountMini(){
   const box=content.querySelector('[data-mini]');if(!box)return;
   const model=root.VisionChoiceModel,result=box.querySelector('[data-mini-result]');
   function refresh(){
    if(box.dataset.mini==='height'){
     const r=model.dimension('xy',demo.height);result.textContent=r.title+'：'+r.reason;
    }else if(box.dataset.mini==='coverage'){
     const r=model.method({task:'pose',coverage:demo.coverage,motion:'static',material:'matte'});result.textContent=demo.coverage==='point'?'只测单点不足以完成本例。'+r.check.find(x=>x.includes('完整空间姿态')):r.title+'。'+r.why;
    }else{
     const speed=demo.speed.trim()===''?null:Number(demo.speed),spacing=demo.spacing.trim()===''?null:Number(demo.spacing),r=model.line(speed,spacing,null);
     result.textContent=!r?'请输入非负速度和大于 0 的间距。':r.stationary?'速度为 0：理论线频为 0；静止不能完成非零行程扫描。':'理论线频约 '+Number(r.frequency.toPrecision(6))+' 条/秒。';
    }
    box.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===demo[box.dataset.mini])));
   }
   box.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{demo[box.dataset.mini]=b.dataset.choice;refresh()}));
   if(box.dataset.mini==='scan'){
    box.querySelector('[data-mini-speed]').addEventListener('input',e=>{demo.speed=e.target.value;refresh()});
    box.querySelector('[data-mini-spacing]').addEventListener('input',e=>{demo.spacing=e.target.value;refresh()});
   }
   refresh();
  }
  function update(){
   const stage=item.stages[step],links=[...(stage.links||[])];if(item.kind==='selection'&&step===3)links.push(['填写项目与样件记录','#project-record']);
   target.querySelector('.practical-diagram').innerHTML=illustration(item.visual,step);
   steps.innerHTML=item.stages.map((s,i)=>'<button type="button" data-step="'+i+'" aria-pressed="'+String(i===step)+'"><span>0'+(i+1)+'</span>'+esc(s.title)+'</button>').join('');
   content.innerHTML='<span class="practical-step-badge">第 '+(step+1)+' / '+item.stages.length+' 步</span><h2>'+esc(stage.title)+'</h2><div class="practical-block"><span>准备</span><p>'+esc(stage.prepare)+'</p></div><div class="practical-block"><span>操作</span><p>'+esc(stage.algorithm)+'</p></div><div class="practical-block"><span>输出</span><p>'+esc(stage.output)+'</p></div><div class="practical-clue"><strong>观察与注意</strong><p>'+esc(stage.clue)+'</p></div>'+miniMarkup()+(stage.transfer?'<div class="practical-transfer"><button type="button" data-transfer>一键带入'+(id==='selection-planar-pick'?' 2D':' 3D')+' 选型 →</button><small>示例条件会填入当前页面，不会覆盖已保存方案。</small><p data-transfer-message role="status"></p></div>':'')+(links.length?'<div class="practical-inline-links">'+links.map(l=>'<a href="'+esc(l[1])+'">'+esc(l[0])+' →</a>').join('')+'</div>':'')+'<div class="practical-arrows"><button type="button" data-prev '+(step===0?'disabled':'')+'>← 上一步</button><span>'+(step+1)+' / '+item.stages.length+'</span><button type="button" data-next '+(step===item.stages.length-1?'disabled':'')+'>下一步 →</button></div>';
   mountMini();
   const transferButton=content.querySelector('[data-transfer]');if(transferButton)transferButton.addEventListener('click',()=>{const value=createTransfer(id,demo);if(!value){content.querySelector('[data-transfer-message]').textContent='请先填写非负速度和大于 0 的轮廓间距。';return}pendingTransfer=value;root.location.hash='#tools/'+value.mode});
   steps.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update();steps.querySelector('[data-step="'+step+'"]').focus()}));
   content.querySelector('[data-prev]').addEventListener('click',()=>{if(step>0){step--;update();const nextFocus=content.querySelector('[data-prev]:not(:disabled)')||content.querySelector('[data-next]:not(:disabled)');if(nextFocus)nextFocus.focus()}});
   content.querySelector('[data-next]').addEventListener('click',()=>{if(step<item.stages.length-1){step++;update();const nextFocus=content.querySelector('[data-next]:not(:disabled)')||content.querySelector('[data-prev]:not(:disabled)');if(nextFocus)nextFocus.focus()}});
  }
  update();return true;
 }
 return{cases,mountIndex,mountDetail,createTransfer,consumeTransfer};
});
