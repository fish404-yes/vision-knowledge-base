(function(root){
'use strict';
const M=root.VisionProjectsModel;
const projects=[
{id:'single',title:'单相机两次拍摄双 Mark',label:'眼在手上',desc:'相机随机械手移动，分别拍两点，再换算到基坐标系。',steps:['基准产品','拍 Mark 1','拍 Mark 2','统一坐标','计算偏差','机器人补偿'],color:'mint'},
{id:'dual',title:'双相机同时定位双 Mark',label:'双固定相机',desc:'两台相机各用自己的映射，将各自的点统一到物理坐标。',steps:['建立基准','相机 1','相机 2','统一坐标','计算偏差','机器人补偿'],color:'blue'},
{id:'placement',title:'上下相机对位贴合',label:'取料与贴合',desc:'分别处理来料、取后偏差与托盘姿态，计算工具目标。',steps:['拍来料','拍取后产品','拍托盘','计算放置'],color:'amber'},
{id:'measure',title:'二维尺寸与 ROI 测量',label:'图像测量',desc:'从图像边缘到像素距离，再转换为毫米并比较公差。',links:['demo:roi-coordinates','demo:edge-scan'],steps:['模拟图像','查看 ROI','提取边缘','换算毫米','比较公差'],color:'purple'}
];
const fmt=n=>Math.abs(n)<0.0005?'0.0':Number(n).toFixed(1);
const pt=p=>`(${fmt(p.x)}, ${fmt(p.y)})`;
const pose=p=>`(${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.r)}°)`;
const smallImage=(img,name)=>{let x=20+img.u/640*130,y=12+img.v/480*90;return `<div class="shot-card"><span>${name}</span><svg viewBox="0 0 170 115" role="img" aria-label="${name}的模拟图像"><rect x="20" y="12" width="130" height="90" rx="4" fill="#0a1728" stroke="#6584a2"/><path d="M85 12v90 M20 57h130" stroke="#283d54" stroke-dasharray="3 4"/>${img.valid?`<circle cx="${x}" cy="${y}" r="5" fill="#efae70"/><text x="${x+7}" y="${y-6}" fill="#e0f6ee" font-size="9">Mark</text>`:`<text x="36" y="62" fill="#ffbf9a" font-size="11">Mark 超出视野</text>`}</svg><small>${img.valid?`u ${fmt(img.u)}，v ${fmt(img.v)} px`:'不可识别，无法输出'}</small></div>`};
const modelControls=[
{key:'dx',name:'实际中心 X 偏移',min:-140,max:140,unit:'mm'},
{key:'dy',name:'实际中心 Y 偏移',min:-110,max:110,unit:'mm'},
{key:'a',name:'实际产品旋转',min:-40,max:40,unit:'°'}];
const placeControls=[
{key:'inX',name:'来料 X 偏移',min:-50,max:50,unit:'mm'},
{key:'inR',name:'来料方向',min:-40,max:40,unit:'°'},
{key:'holdX',name:'产品相对工具 X',min:-30,max:30,unit:'mm'},
{key:'holdY',name:'产品相对工具 Y',min:-30,max:30,unit:'mm'},
{key:'holdR',name:'产品相对工具角度',min:-45,max:45,unit:'°'},
{key:'trayX',name:'托盘中心 X 偏移',min:-50,max:50,unit:'mm'},
{key:'trayY',name:'托盘中心 Y 偏移',min:-45,max:45,unit:'mm'},
{key:'trayR',name:'托盘方向',min:-60,max:60,unit:'°'}];
const measureControls=[
{key:'left',name:'左边缘（原图）',min:100,max:220,unit:'px'},
{key:'right',name:'右边缘（原图）',min:320,max:500,unit:'px'},
{key:'scale',name:'平面标定比例',min:50,max:200,unit:'μm/px'}];
const initial={single:{dx:40,dy:20,a:15},dual:{dx:40,dy:20,a:15},placement:{inX:0,inR:15,holdX:10,holdY:0,holdR:10,trayX:0,trayY:0,trayR:30},measure:{left:160,right:460,scale:100}};
const palette={base:'#79a9ff',actual:'#60dec2',camera:'#f3c77b',tool:'#d9a7ff',muted:'#9eb5c9'};
function dimsShell(body,label){let grid='';for(let x=20;x<=700;x+=40)grid+=`<path d="M${x} 0V420"/>`;for(let y=20;y<=420;y+=40)grid+=`<path d="M0 ${y}H720"/>`;return `<svg class="project-svg" viewBox="0 0 720 420" role="img" aria-label="${label}"><rect width="720" height="420" rx="12" fill="#0b182b"/><g stroke="#203449" stroke-width="1">${grid}</g>${body}</svg>`}
function xy(p){return{x:50+p.x*.72,y:365-p.y*.72}}
function label(p,text,color){let q=xy(p);return `<text x="${q.x+9}" y="${q.y-11}" fill="${color}" font-size="14">${text}</text>`}
function mark(p,id,color){let q=xy(p);return `<circle cx="${q.x}" cy="${q.y}" r="7" fill="${color}"/>${label(p,id,color)}`}
function center(p,title,color){let q=xy(p);return `<circle cx="${q.x}" cy="${q.y}" r="9" fill="#0b182b" stroke="${color}" stroke-width="2"/><path d="M${q.x-12} ${q.y}h24 M${q.x} ${q.y-12}v24" stroke="${color}"/>${label(p,title,color)}`}
function product(p,color,dashed=false){let q=xy(p.center);return `<g transform="translate(${q.x} ${q.y}) rotate(${-p.r})"><rect x="-108" y="-25" width="216" height="50" rx="4" fill="${color}" fill-opacity=".11" stroke="${color}" stroke-width="2" ${dashed?'stroke-dasharray="6 5"':''}/><path d="M-108 0H108" stroke="${color}" stroke-width="2" stroke-dasharray="4 5"/></g>`}
function camera(c,name,color){let q=xy(c);return `<rect x="${q.x-115.2}" y="${q.y-86.4}" width="230.4" height="172.8" rx="7" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="7 5" opacity=".7"/><rect x="${q.x-28}" y="${q.y-101}" width="56" height="19" rx="5" fill="#273d58" stroke="${color}"/><text x="${q.x-23}" y="${q.y-87}" fill="${color}" font-size="10">${name}</text>`}
function flange(p,color,name){let q=xy(p);return `<g transform="translate(${q.x} ${q.y}) rotate(${-p.r})" fill="none" stroke="${color}" stroke-width="3"><path d="M-19 -13h-13v26h13 M19 -13h13v26H19 M0 0h25"/><circle r="5" fill="${color}"/></g><text x="${q.x+10}" y="${q.y+25}" fill="${color}" font-size="12">${name}</text>`}
function axis(){return `<path d="M40 385h65 M40 385v-65" stroke="#a9bdd0" stroke-width="2"/><text x="110" y="390" fill="#adc4d2" font-size="13">X</text><text x="35" y="315" fill="#adc4d2" font-size="13">Y</text><text x="130" y="390" fill="#839fb0" font-size="11">物理坐标系 B · mm · 逆时针为正</text>`}
function line(a,b,color){let p=xy(a),q=xy(b);return `<path d="M${p.x} ${p.y}L${q.x} ${q.y}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5 5"/>`}
function renderMarks(id,s,step){const dual=id==='dual',m=M.twoMark(s.dx,s.dy,s.a,dual),baseline=m.baseline,actual=m.actual;let g=product(baseline,palette.base,true);g+=mark(baseline.p1,'基准 M1',palette.base)+mark(baseline.p2,'基准 M2',palette.base);
if(step>=1){g+=product(actual,palette.actual)+mark(actual.p1,'实际 M1',palette.actual)+mark(actual.p2,'实际 M2',palette.actual)}
if(step===1)g+=camera(m.c1,dual?'相机 1':'拍照位 1',palette.camera);
if(step===2)g+=camera(m.c2,dual?'相机 2':'拍照位 2',palette.camera);
if(step>=3){g+=center(baseline.center,'基准中点',palette.base);if(m.valid)g+=center(m.ap.center,'实际中点',palette.actual)}
let taught={x:385,y:155,r:10},target=m.valid?M.robotGoal(m.bp.center,m.ap.center,m.delta,taught):null;
if(step===5&&target)g+=line(baseline.center,taught,palette.camera)+flange(taught,palette.camera,'示教工具')+line(m.ap.center,target,palette.tool)+flange(target,palette.tool,'目标工具');
let scene=dimsShell(g+axis(),dual?'两台固定相机定位双 Mark 的工作台俯视图':'单相机移动两次定位双 Mark 的工作台俯视图');
let shots=step===1?smallImage(m.i1,'第 1 张 · Mark 1'):step>=2?smallImage(m.i1,'第 1 张 · Mark 1')+smallImage(m.i2,'第 2 张 · Mark 2'):'';
let data,explain;
if(step===0){explain='基准产品的两点已经在同一个基坐标系中。先保存中点和 Mark 1 → Mark 2 的方向。';data=`基准 M1 ${pt(baseline.p1)} mm<br>基准 M2 ${pt(baseline.p2)} mm<br>基准中点 ${pt(m.bp.center)} mm；基准方向 ${fmt(m.bp.angle)}°`}
if(step===1){explain=dual?'固定相机 1 拍 Mark 1；像素位置属于相机 1 的图像坐标。':'机械手将相机移到拍照位 1，模拟识别 Mark 1。记录这张图对应的拍照位姿。';data=`相机 1 / 拍照位 1 的基座中心 ${pt(m.c1)} mm<br>${m.i1.valid?`识别 M1 像素 (${fmt(m.i1.u)}, ${fmt(m.i1.v)}) px`:'M1 超出视野，本次不能识别。'}`}
if(step===2){explain=dual?'固定相机 2 拍 Mark 2。本示例特意设定相机 2 图像水平镜像，不能直接将两张图的像素相加。':'机械手带相机移到拍照位 2，模拟识别 Mark 2。第二张图要使用第二次的相机位姿。';data=`相机 2 / 拍照位 2 的基座中心 ${pt(m.c2)} mm<br>${m.i2.valid?`识别 M2 像素 (${fmt(m.i2.u)}, ${fmt(m.i2.v)}) px`:'M2 超出视野，本次不能识别。'}${dual?'<br>示例：第 2 张图像水平镜像。':''}`}
if(step===3){explain='每张图都使用自己对应的映射。将识别点转换为同一个基坐标系后，才能求物理中点。';data=m.valid?`M1：X = 170 + (u₁ − 320) / 2 = ${fmt(m.p1.x)} mm<br>　　 Y = 230 − (v₁ − 240) / 2 = ${fmt(m.p1.y)} mm<br>M2：X = 470 ${dual?'−':'+'} (u₂ − 320) / 2 = ${fmt(m.p2.x)} mm<br>　　 Y = 230 − (v₂ − 240) / 2 = ${fmt(m.p2.y)} mm<br>实际中点 = 两个物理点的平均 = ${pt(m.ap.center)} mm`:'至少一个 Mark 不在视野内，无法获得有效的两个物理点；请调整产品参数。'}
if(step===4){explain='实际连线方向减去基准连线方向，得到相对基准旋转；中点之差是产品参考点偏移。';data=m.valid?`实际方向 atan2(ΔY, ΔX) = ${fmt(m.ap.angle)}°<br>旋转偏差 = ${fmt(m.ap.angle)}° − ${fmt(m.bp.angle)}° = ${fmt(m.delta)}°<br>中点偏移 = ${pt({x:m.ap.center.x-m.bp.center.x,y:m.ap.center.y-m.bp.center.y})} mm`:'识别无效时，不应输出角度或产品位姿。'}
if(step===5){explain='机器人侧使用基准示教建立“产品中点 → 工具”的关系，随产品偏差旋转后计算工具目标。视觉侧不必知道夹爪基准方向。';data=m.valid?`【视觉侧】产品中点 ${pt(m.ap.center)} mm，角偏差 ${fmt(m.delta)}°<br>【机器人侧示意】示教工具 ${pose(taught)}<br>旋转后中点→工具偏置 ${pt(target.vector)} mm<br>目标工具 ${pose(target)}　（基座）<br>此方向是二维基座平面角；现场需确认 TCP 和控制器的姿态约定。`:'视觉结果无效，机器人侧不应使用本次结果生成目标。'}
return{scene,shots,data,explain,note:`二维已知平面；基准方向 0°。相机像素映射为本例人为设定：2 px/mm，图像 640×480；${dual?'相机 2 的图像假设水平镜像。':'两次拍摄姿态分别已知。'}滑块实时生成模拟图像，不是真实拍摄。`};}
function shortPart(p,color,title){let q=xy(p);return `<g transform="translate(${q.x} ${q.y}) rotate(${-p.r})"><rect x="-43" y="-20" width="86" height="40" rx="4" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-width="2"/><path d="M-38 0H38" stroke="${color}" stroke-dasharray="4 4"/><circle cx="-34" r="4" fill="${color}"/><circle cx="34" r="4" fill="${color}"/></g>${label(p,title,color)}`}
function boxTray(p){let q=xy(p);return `<g transform="translate(${q.x} ${q.y}) rotate(${-p.r})"><rect x="-60" y="-36" width="120" height="72" rx="6" fill="#65d8bd" fill-opacity=".07" stroke="#65d8bd" stroke-width="2" stroke-dasharray="7 4"/><path d="M-48 0H48 M0 -25V25" stroke="#65d8bd" opacity=".5"/></g>${label(p,'托盘 / 产品目标','#65d8bd')}`}
function camTag(p,name){let q=xy(p);return `<rect x="${q.x-35}" y="${q.y-88}" width="70" height="25" rx="6" fill="#355b78" stroke="#8cc5df"/><text x="${q.x-29}" y="${q.y-70}" fill="#d6f2fa" font-size="11">${name}</text><path d="M${q.x} ${q.y-62}V${q.y-35}" stroke="#8cc5df" stroke-dasharray="4 4"/>`}
function renderPlacement(s,step){let m=M.placement(s),g='',data,explain;
if(step===0){g=shortPart(m.incoming,palette.actual,'来料产品')+camTag(m.incoming,'上相机 ↓');explain='上相机随工具到来料上方。识别来料特征，并结合拍照位姿转换到基座，为取料提供参考。';data=`模拟来料参考位姿（基座）<br>X=${fmt(m.incoming.x)}，Y=${fmt(m.incoming.y)} mm，方向=${fmt(m.incoming.r)}°<br>取料之前的结果，不能代替取料后的夹持测量。`}
if(step===1){g=shortPart(m.heldBase,palette.actual,'取后产品')+flange(m.shot,palette.base,'工具拍照位')+line(m.shot,m.heldBase,palette.camera);let p=xy(m.heldBase);g+=`<rect x="${p.x-42}" y="${p.y+75}" width="84" height="26" rx="6" fill="#355b78" stroke="#f3c77b"/><text x="${p.x-30}" y="${p.y+93}" fill="#f4d2a1" font-size="12">下相机 ↑</text><path d="M${p.x} ${p.y+75}V${p.y+32}" stroke="#f3c77b" stroke-dasharray="4 4"/>`;explain='取料后，下相机测产品。结合固定相机标定和曝光时工具位姿，得到本次产品相对工具的实际关系。';data=`模拟工具拍照位（基座） ${pose(m.shot)}<br>模拟产品位姿（基座） ${pose(m.heldBase)}<br>产品相对工具 ${pose(m.held)}<br>这里直接给出下相机换算结果，不模拟识别像素。`}
if(step===2){g=boxTray(m.tray)+camTag(m.tray,'上相机 ↓')+center(m.tray,'产品目标',palette.actual);explain='上相机拍托盘，结合曝光时的工具位姿得到托盘基座位姿；再加入工艺定义得到产品目标。';data=`托盘基准位姿（基座） ${pose(m.tray)}<br>本示例假设产品目标与托盘基准重合。<br>若不重合，还需乘以工艺定义的固定偏置。`}
if(step===3){g=boxTray(m.tray)+shortPart(m.tray,palette.actual,'产品目标')+flange(m.tool,palette.tool,'工具目标')+line(m.tool,m.tray,palette.camera);explain='产品目标 × 产品相对工具关系的逆，得到工具目标。视觉可输出产品关系与目标，机器人侧按约定完成计算。';data=`产品目标（基座） ${pose(m.tray)}<br>产品相对工具 ${pose(m.held)}<br>目标工具方向 = ${fmt(m.tray.r)}° − ${fmt(m.held.r)}° = ${fmt(m.tool.r)}°<br>旋转后工具→产品偏置 ${pt(m.offset)} mm<br>目标工具（基座） ${pose(m.tool)}`}
return{scene:dimsShell(g+axis(),'上下相机对位贴合的平面示意'),shots:'',data,explain,note:'二维刚体与已知工作平面示意；下相机拍照后产品相对工具保持不变。未模拟相机成像、真实夹持、机器人六维姿态或运动安全。'};}
function renderMeasure(s,step){const m=M.measure(s.left,s.right,s.scale),sx=x=>60+x*.95;let g=`<rect x="60" y="90" width="608" height="220" rx="8" fill="#17293c" stroke="#537087"/><rect x="${sx(s.left)}" y="151" width="${(s.right-s.left)*.95}" height="105" fill="#68d9bd" fill-opacity=".24" stroke="#69dcc2" stroke-width="2"/><text x="75" y="113" fill="#bcd1db" font-size="13">合成图像 · 横坐标 u 向右（px）</text><path d="M60 327H668" stroke="#88a5b5"/><text x="60" y="349" fill="#9eb5c9" font-size="12">0 px</text><text x="627" y="349" fill="#9eb5c9" font-size="12">640 px</text>`;
if(step>=1)g+=`<rect x="${sx(50)}" y="120" width="${500*.95}" height="165" fill="none" stroke="#f2c77e" stroke-width="2" stroke-dasharray="7 5"/><text x="${sx(50)+8}" y="140" fill="#f2c77e" font-size="12">ROI：原图 u=50…550</text>`;
if(step>=2)g+=`<path d="M${sx(s.left)} 132V280 M${sx(s.right)} 132V280" stroke="#e8aa75" stroke-width="2"/><circle cx="${sx(s.left)}" cy="205" r="5" fill="#f3c77b"/><circle cx="${sx(s.right)}" cy="205" r="5" fill="#f3c77b"/><text x="${sx(s.left)-10}" y="130" fill="#f3c77b" font-size="12">${s.left}</text><text x="${sx(s.right)-10}" y="130" fill="#f3c77b" font-size="12">${s.right}</text>`;
let data,explain;
if(step===0){explain='相机得到一张图像。此处使用合成矩形，示意产品左右边缘；没有调用真实相机。';data=`模拟图像宽度 640 px<br>绿色区域代表待测产品。<br>调节左右边缘可改变模拟图像。`}
if(step===1){explain='只处理 ROI 里的特征时，算法可能返回局部坐标。要加上 ROI 在原图中的起点才能还原。';data=`ROI 左边界在原图 u=50 px<br>局部左边缘 = ${s.left} − 50 = ${s.left-50} px<br>局部右边缘 = ${s.right} − 50 = ${s.right-50} px`}
if(step===2){explain='假设边缘识别已经成功，先在同一张原图中计算左右边缘的像素差。';data=`原图左边缘 = ${s.left} px<br>原图右边缘 = ${s.right} px<br>像素宽度 = ${s.right} − ${s.left} = ${m.px} px`}
if(step===3){explain='使用对应工作平面的标定比例，将像素宽度换算为毫米。这里人为设定比例，真实系统需完成标定并验证。';data=`标定比例 = ${s.scale} μm/px = ${m.scale.toFixed(3)} mm/px<br>宽度 = ${m.px} × ${m.scale.toFixed(3)} = ${m.width.toFixed(2)} mm`}
if(step===4){explain='把计算结果与工艺给出的尺寸范围比较。本例阈值仅供演示，不代表现场允许的误差。';data=`示例目标 30.00 mm，公差 ±1.00 mm<br>允许范围 29.00 ～ 31.00 mm<br>当前结果 ${m.width.toFixed(2)} mm：${m.within?'在示例范围内':'超出示例范围'}`}
return{scene:dimsShell(g,'二维尺寸测量与 ROI 的合成图像'),shots:'',data,explain,note:'一维像素间距在已知平面上恒定，边缘直接用理想数值给出；未模拟镜头畸变、亚像素、噪声和实机测量误差。'};}
function settings(project,s,uid){const defs=project.id==='placement'?placeControls:project.id==='measure'?measureControls:modelControls;return defs.map(d=>`<label class="project-range" for="pr-${uid}-${d.key}"><span>${d.name}<output data-out="${d.key}">${s[d.key]} ${d.unit}</output></span><input id="pr-${uid}-${d.key}" type="range" data-input="${d.key}" min="${d.min}" max="${d.max}" value="${s[d.key]}"></label>`).join('')}
function mount(target,id){const project=projects.find(p=>p.id===id);if(!target||!project)return;const uid=id+'-'+Math.random().toString(36).slice(2,7);let state={...initial[id]},step=0;
const legend=id==='measure'?'<span><i class="p-actual"></i>待测产品</span><span><i class="p-camera"></i>ROI 范围</span><span><i class="p-edge"></i>测量边缘</span>':'<span><i class="p-base"></i>基准 / 工具</span><span><i class="p-actual"></i>实际 / 目标</span><span><i class="p-camera"></i>相机 / 偏置</span><span><i class="p-tool"></i>工具目标</span>';
target.innerHTML=`<div class="project-workspace"><div class="project-steps" role="group" aria-label="案例步骤">${project.steps.map((x,i)=>`<button type="button" class="project-step" data-step="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${x}</button>`).join('')}</div><div class="project-columns"><section class="project-scene-card"><div class="project-scene-head"><span>SCENE / 场景示意</span><span>二维仿真 · 非实时设备</span></div><div class="project-figure" tabindex="0" role="region" aria-label="案例场景图，小屏幕可左右滚动"></div><div class="project-legend">${legend}</div><div class="project-shots"></div><p class="project-model-note"></p></section><section class="project-info-card"><div class="project-current"><span class="project-current-step"></span><h2 class="project-current-title"></h2><p class="project-explain"></p></div><div class="project-input-heading"><strong>模拟参数</strong><button type="button" class="project-reset">重置参数</button></div><p class="project-input-note">参数变化会实时更新本步骤的示意数据。</p><div class="project-controls">${settings(project,state,uid)}</div><div class="project-output" aria-live="polite"></div><div class="project-action"><button type="button" class="project-prev">← 上一步</button><span class="project-progress"></span><button type="button" class="project-next">下一步 →</button></div></section></div></div>`;
function update(){const result=id==='placement'?renderPlacement(state,step):id==='measure'?renderMeasure(state,step):renderMarks(id,state,step);target.querySelector('.project-figure').innerHTML=result.scene;target.querySelector('.project-shots').innerHTML=result.shots;target.querySelector('.project-shots').hidden=!result.shots;target.querySelector('.project-explain').textContent=result.explain;target.querySelector('.project-output').innerHTML=result.data;target.querySelector('.project-model-note').textContent=result.note;target.querySelector('.project-current-step').textContent=`第 ${step+1} / ${project.steps.length} 步`;target.querySelector('.project-current-title').textContent=project.steps[step];target.querySelector('.project-progress').textContent=`${step+1} / ${project.steps.length}`;target.querySelector('.project-prev').disabled=step===0;target.querySelector('.project-next').disabled=step===project.steps.length-1;target.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.step===step)));target.querySelectorAll('[data-input]').forEach(e=>{e.value=state[e.dataset.input];const d=(id==='placement'?placeControls:id==='measure'?measureControls:modelControls).find(x=>x.key===e.dataset.input);target.querySelector(`[data-out="${d.key}"]`).textContent=state[d.key]+' '+d.unit})}
target.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);update()}));target.querySelectorAll('[data-input]').forEach(e=>e.addEventListener('input',()=>{state[e.dataset.input]=Number(e.value);update()}));target.querySelector('.project-prev').addEventListener('click',()=>{step=Math.max(0,step-1);update()});target.querySelector('.project-next').addEventListener('click',()=>{step=Math.min(project.steps.length-1,step+1);update()});target.querySelector('.project-reset').addEventListener('click',()=>{state={...initial[id]};step=0;update()});update();}
root.VISION_PROJECTS={projects,mount};
})(window);
