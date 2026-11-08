(function(root){
'use strict';
const M=root.VisionModels,E=root.VisionEstimate;let serial=0;
const fmt=n=>Math.abs(n)<.0005?'0.0':Number(n).toFixed(1);
const point=p=>`(${fmt(p.x)}, ${fmt(p.y)})`;
const range=(key,label,min,max,unit)=>({key,label,min,max,unit});
const catalogue=[
{id:'view',title:'视野与像素密度',category:'相机与镜头',desc:'改变视野宽度和像素数，看工件覆盖与特征采样如何变化。',article:'camera-selection'},
{id:'thinlens',title:'凸透镜成像与放大倍率',category:'镜头与成像',desc:'调整物距和焦距，观察光路、像距和成像方向。',article:'lens-fov'},
{id:'lens-height',title:'工件高度与成像倍率',category:'镜头与成像',desc:'改变工件高度，比较普通镜头与理想物方远心镜头的成像宽度。',article:'telecentric'},
{id:'shutter',title:'全局快门与滚动快门',category:'相机与采集',desc:'比较移动物体在不同时序下的形状差异。',article:'sensor-shutter'},
{id:'lighting',title:'六种照明方式',category:'光源与照明',desc:'切换环形、条形、背光、低角度、同轴和穹顶光。',article:'light-selection'},
{id:'lighting-guide',title:'按工件与特征试选光源',category:'光源与照明',desc:'选择表面和检测目标，比较照明建议与布置示意。',article:'light-selection'},
{id:'light-compare',title:'同一工件的光源成像对照',category:'光源与照明',desc:'切换环形光、低角度光和背光，比较金属板划痕和孔位的合成成像示意。',article:'light-selection'},
{id:'threshold',title:'灰度与二值阈值',category:'2D 视觉',desc:'改变阈值，看同一组像素如何变成前景或背景。',article:'2d-threshold'},
{id:'marks',title:'双 Mark 位置与方向',category:'2D 视觉',desc:'平移、旋转和交换 Mark，观察中点与方向角。',article:'2d-mark'},
{id:'stereo',title:'双目视差与距离',category:'3D 视觉',desc:'改变基线与目标距离，观察理想双目视差变化。',article:'3d-stereo'},
{id:'depth-cloud',title:'深度图到点云：遮挡与无效点',category:'3D 视觉',desc:'调整相机距离和视角，观察深度像素、点云、遮挡与模拟无效点。',article:'3d-pointcloud'},
{id:'3d-compare',title:'四种 3D 方法对比',category:'3D 视觉',desc:'比较双目、结构光、激光轮廓和 ToF 的原理与适用条件。',article:'3d-overview'},
{id:'profile',title:'激光轮廓与高度',category:'3D 视觉',desc:'调整工件截面高度，观察一条模拟轮廓线。',article:'3d-laser'},
{id:'frames',title:'像素与物理坐标',category:'标定与坐标',desc:'移动图像点，看简单平面标定如何映射到物理位置。',article:'calib-frames'},
{id:'handeye-poses',title:'眼在手上：两次拍照与坐标',category:'标定与坐标',desc:'相机移动时，同一个 Mark 的像素如何配合各自拍照位姿映射到基座。',article:'calib-handeye'},
{id:'placement',title:'上下相机贴合偏置',category:'应用与排查',desc:'改变产品在工具上的偏移和目标方向，反算工具位姿。',article:'app-alignment'}
];
const byArticle={'camera-selection':'view','lens-fov':'view','sensor-shutter':'shutter','light-selection':'lighting','backlight':'lighting','coaxial-dome':'lighting','ring-bar':'lighting','2d-threshold':'threshold','2d-mark':'marks','3d-stereo':'stereo','3d-pointcloud':'depth-cloud','3d-confidence':'depth-cloud','3d-laser':'profile','calib-frames':'frames','calib-planar':'frames','app-alignment':'placement'};
const lightInfo={ring:{title:'环形光',what:'从镜头周围照明，可通过角度和工作距离调整表面特征的对比。',care:'反光工件可能出现高光或环形反射，需要实际试光。'},bar:{title:'条形光',what:'从侧面提供有方向的照明，可通过角度突出局部特征。',care:'光源位置、阴影和物体方向会影响结果。'},back:{title:'背光',what:'从工件背后照射，有助于显示轮廓、孔洞或间隙。',care:'通常不适合直接观察不透光工件的正面纹理；实际需留出背面空间。'},dark:{title:'低角度光',what:'从较低角度照射，尝试突出边缘、纹理或刻痕。',care:'表面材质和缺陷方向会改变效果，需用真实样件试光。'},coax:{title:'同轴光',what:'沿相机观察方向照明，可尝试观察某些平整反光面。',care:'曲面、透明材质和局部倾斜可能得到不同结果。'},dome:{title:'穹顶漫射光',what:'从多个方向形成较柔和的照明，可尝试改善部分反光。',care:'有效距离、开口与实际安装空间应按光源规格验证。'}};
const grey=Array.from({length:48},(_,i)=>{const r=Math.floor(i/8),c=i%8;return c>=2&&c<=5&&r>=1&&r<=4?160+(r*19+c*11)%65:35+(r*13+c*7)%75});
const defs={
view:{title:'视野与像素密度',summary:'调整视野与相机横向像素，观察物体覆盖和采样量级。',initial:{fov:200,pixels:2000},ranges:[range('fov','水平视野宽度',80,300,'mm')],choices:{key:'pixels',label:'横向有效像素',items:[[1000,'1000 px'],[2000,'2000 px'],[4000,'4000 px']]},note:'假设工件与成像平面平行、比例均匀；绿色图形宽 100 mm，特征宽 1 mm。采样间距不等于真实测量精度。'},
thinlens:{title:'凸透镜：物距、像距与倍率',summary:'改变物距 u 和焦距 f，观察光线如何形成像。箭头代表物体和它的像。',initial:{u:150,f:50},ranges:[range('u','物距 u',20,400,'mm'),range('f','焦距 f',20,100,'mm')],note:'理想薄凸透镜示意，距离以理想透镜位置为基准。真实工业镜头由多片镜片组成，镜头前端到工件的机械工作距离不一定等于理论物距。此图是独立示例；网站选型工具使用更简化的针孔近似。'},
shutter:{title:'全局快门与滚动快门',summary:'改变逐行曝光期间物体的位移，比较形状示意。',initial:{shift:50},ranges:[range('shift','首行到末行期间的水平位移',0,90,'px')],note:'假设物体匀速、曝光足够短。全局示意的各行同时曝光；滚动示意逐行曝光。未模拟曝光模糊和真实传感器时序。'},
lighting:{title:'照明位置与可见特征',summary:'切换光源，观察照明几何与常见试光方向。',initial:{mode:'back'},ranges:[],choices:{key:'mode',label:'照明方式',items:[['ring','环形'],['bar','条形'],['back','背光'],['dark','低角度'],['coax','同轴'],['dome','穹顶']]},note:'图为布置示意，不是模拟照片或选型保证。表面反射、安装角度与空间需用样件验证。'},
threshold:{title:'灰度与二值阈值',summary:'移动阈值，查看同一组像素被分为黑白的结果。',initial:{threshold:120},ranges:[range('threshold','二值阈值',0,255,'')],note:'合成 8×6 灰度像素；灰度值严格大于阈值时设为白色，否则设为黑色。不是现场实拍图。'},
marks:{title:'双 Mark：位置与方向',summary:'移动和旋转产品，观察两点、中点与基准角的关系。',initial:{dx:20,dy:30,a:30,swap:false,zero:false},ranges:[range('dx','Mark 中点 X 偏移',-50,50,'mm'),range('dy','Mark 中点 Y 偏移',-45,45,'mm'),range('a','产品旋转',-180,180,'°')],toggles:[['swap','交换 Mark 身份'],['zero','模拟两点重合']],note:'二维刚体、已知平面；基座 X 向右、Y 向上、逆时针为正。中点是定位参考，不一定是几何中心；两点重合时方向无定义。'},
stereo:{title:'双目视差与距离',summary:'改变双目基线和目标距离，观察理想模型的视差。',initial:{baseline:80,distance:800},ranges:[range('baseline','双目基线',30,150,'mm'),range('distance','目标距离',400,1500,'mm')],note:'理想水平校正双目：焦距 fx = 800 px、主点已对齐，视差 d = fx × B / Z。图中几何不按比例；真实匹配受纹理、遮挡、畸变和标定影响。'},
profile:{title:'激光截面与高度',summary:'改变表面起伏，查看一条模拟截面轮廓。',initial:{height:24},ranges:[range('height','凸起最大高度',0,50,'mm')],note:'示意为单条理想截面，未模拟激光三角测量、反光或无效点。实际形成面数据需结合相对运动或设备采集方式。'},
frames:{title:'从像素到物理平面',summary:'移动图像中的点，观察一个已知平面映射。',initial:{u:250,v:150},ranges:[range('u','像素横坐标 u',0,400,'px'),range('v','像素纵坐标 v',0,300,'px')],note:'人为设定 X = 100 + 0.1u、Y = 200 − 0.1v（mm）。图像 v 向下、物理 Y 向上；右图仅显示物理坐标的局部窗口，不是物理原点。实际标定可能有旋转、透视、畸变及高度限制。'},
placement:{title:'取后偏移与贴合目标',summary:'改变产品相对工具的姿态及产品目标角度，观察反算结果。',initial:{x:10,y:0,r:10,target:30},ranges:[range('x','产品相对工具 X',-30,30,'mm'),range('y','产品相对工具 Y',-30,30,'mm'),range('r','产品相对工具方向',-60,60,'°'),range('target','产品目标方向',-90,90,'°')],note:'二维刚体，基座 X 向右、Y 向上；产品目标中心固定为 (500,300) mm。假设取后不滑移且产品目标与托盘基准重合，不模拟真实机器人姿态字段。'}
};
function frame(body,label){return `<svg viewBox="0 0 560 260" role="img" aria-label="${label}" class="experience-svg"><style>text{font:12px 'Microsoft YaHei',sans-serif;fill:#496c60}.minor{font-size:11px;fill:#78958a}.caption{font-size:13px;font-weight:700;fill:#315d51}</style><rect x="0" y="0" width="560" height="260" rx="10" fill="#eff7f1"/>${body}</svg>`}
function show(type,s,uid){
if(type==='thinlens'){
 const r=M.thinLens(s.u,s.f),cx=280,axis=130,valid=r.kind!=='focus',v=valid?r.imageDistance:null;
 const left=Math.max(s.u,s.f,valid&&v<0?-v:0),right=Math.max(s.f,valid&&v>0?v:0),scale=Math.min(200/left,205/right);
 const ox=cx-s.u*scale,fx1=cx-s.f*scale,fx2=cx+s.f*scale;
 const oh=valid?Math.min(65,65/r.magnitude):60,oy=axis-oh;
 let ix=0,iy=0,rays='',image='',distanceLabel='',explain='';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 if(r.kind==='real'){
  ix=cx+v*scale;iy=axis+oh*r.magnitude;
  rays=`<path d="M${ox} ${oy}H${cx}L${ix} ${iy} M${ox} ${oy}L${ix} ${iy}" fill="none" stroke="#e6a15e" stroke-width="2"/>`;
  image=`<path d="M${ix} 47V215" stroke="#a78dbe" stroke-width="2" stroke-dasharray="5 4"/><path d="M${ix} ${axis}V${iy}" stroke="#a06bc2" stroke-width="4" marker-end="url(#thin-img-${uid})"/><text x="${clamp(ix-22,10,475)}" y="36">像面</text><text x="${clamp(ix+8,10,490)}" y="${clamp(iy+16,45,216)}">倒立实像</text>`;
  distanceLabel=`<path d="M${cx} 244H${ix}" stroke="#8aa79b"/><text x="${clamp((cx+ix)/2-35,10,445)}" y="256" class="minor">像距 v = ${fmt(v)} mm</text>`;
  explain=`<strong>倒立实像</strong>：像距 v = ${fmt(v)} mm<br>倍率大小 M = v ÷ u = <strong>${r.magnitude.toFixed(3)} 倍</strong>；带方向的倍率 m = −v/u = ${r.signedMagnification.toFixed(3)}。<br>1/u + 1/v = 1/f<br>实像时：u = f × (1 + 1/M)`;
 }else if(r.kind==='virtual'){
  ix=cx+v*scale;iy=axis-oh*r.magnitude;const end=530,y1=oy+(end-cx)*oh/(s.f*scale),y2=axis+(end-cx)*oh/(s.u*scale);
  rays=`<path d="M${ox} ${oy}H${cx}L${end} ${y1} M${ox} ${oy}L${cx} ${axis}L${end} ${y2}" fill="none" stroke="#e6a15e" stroke-width="2"/><path d="M${cx} ${oy}L${ix} ${iy} M${cx} ${axis}L${ix} ${iy}" fill="none" stroke="#e6a15e" stroke-width="2" stroke-dasharray="5 4"/>`;
  image=`<path d="M${ix} ${axis}V${iy}" stroke="#a06bc2" stroke-width="4" stroke-dasharray="5 3" marker-end="url(#thin-img-${uid})"/><text x="${clamp(ix-15,10,465)}" y="${clamp(iy-10,35,110)}">正立虚像</text>`;
  explain=`<strong>正立虚像</strong>：u &lt; f，像在物体同侧。<br>带符号像距 v = ${fmt(v)} mm；倍率 m = +${r.magnitude.toFixed(3)}。<br>虚线是光线的反向延长线，虚像不能直接投到传感器上。<br>1/u + 1/v = 1/f`;
 }else{
  const end=530,y1=oy+(end-cx)*oh/(s.f*scale),y2=axis+(end-cx)*oh/(s.u*scale);
  rays=`<path d="M${ox} ${oy}H${cx}L${end} ${y1} M${ox} ${oy}L${cx} ${axis}L${end} ${y2}" fill="none" stroke="#e6a15e" stroke-width="2"/>`;
  explain='<strong>物体在焦点上</strong>：u = f，出射光平行；像距趋向无穷远，不会在有限位置形成清晰实像。';
 }
 const svg=frame(`<defs><marker id="thin-obj-${uid}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#26967a"/></marker><marker id="thin-img-${uid}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#a06bc2"/></marker></defs><path d="M20 ${axis}H540" stroke="#829f93" stroke-dasharray="5 4"/><path d="M${cx} 45Q${cx-18} ${axis} ${cx} 215Q${cx+18} ${axis} ${cx} 45Z" fill="#9ed7c5" fill-opacity=".38" stroke="#519d87" stroke-width="2"/>${rays}<path d="M${ox} ${axis}V${oy}" stroke="#26967a" stroke-width="4" marker-end="url(#thin-obj-${uid})"/>${image}<circle cx="${fx1}" cy="${axis}" r="3" fill="#d8995c"/><circle cx="${fx2}" cy="${axis}" r="3" fill="#d8995c"/><text x="${clamp(fx1-7,8,525)}" y="${axis+17}" class="minor">F</text><text x="${clamp(fx2-7,8,525)}" y="${axis+17}" class="minor">F′</text><text x="${clamp(ox-15,10,495)}" y="${clamp(oy-10,35,112)}">物体</text><text x="249" y="29" class="caption">薄凸透镜</text><text x="20" y="22" class="minor">焦距 f = ${s.f} mm</text><path d="M${ox} 221H${cx}" stroke="#8aa79b"/><text x="${clamp((ox+cx)/2-35,10,445)}" y="236" class="minor">物距 u = ${s.u} mm</text>${distanceLabel}`, '薄凸透镜的物体、焦点、光路与成像示意');
 return{svg,out:explain};
}
if(type==='view'){
 let w=100/s.fov*290,x=45+145-w/2,sample=E.sampling(s.fov,s.pixels,1);let clipped=s.fov<100;
 return{svg:frame(`<defs><clipPath id="fov-${uid}"><rect x="45" y="48" width="290" height="150" rx="8"/></clipPath></defs><rect x="45" y="48" width="290" height="150" rx="8" fill="#fff" stroke="#9fcbb5"/><g clip-path="url(#fov-${uid})"><rect x="${x}" y="97" width="${w}" height="50" rx="5" fill="#c9e9d6" stroke="#438f76" stroke-width="2"/><circle cx="${x+15}" cy="122" r="5" fill="#dc995e"/><circle cx="${x+w-15}" cy="122" r="5" fill="#dc995e"/></g><path d="M45 218H335 M45 212V224 M335 212V224" stroke="#659584"/><text x="128" y="239">视野宽度 ${s.fov} mm</text><text x="367" y="83" class="caption">横向 ${s.pixels} px</text><text x="367" y="108">工件宽 100 mm</text><text x="367" y="132">最小特征 1 mm</text><text x="367" y="160">${clipped?'工件超出视野':'工件可被视野覆盖'}</text>`, '视野与工件覆盖示意'),out:`每像素约 <strong>${sample.spacing.toFixed(4)} mm/px</strong>；1 mm 特征约 <strong>${sample.featurePx.toFixed(1)} px</strong>。${clipped?' 工件部分超出视野。':''}`};
}
if(type==='shutter'){
 let rows='';for(let i=0;i<12;i++){let y=52+i*13,dx=s.shift*i/11;rows+=`<rect x="${83}" y="${y}" width="27" height="12" fill="#55aa8b"/><rect x="${331+dx}" y="${y}" width="27" height="12" fill="#dd9b64"/>`}
 return{svg:frame(`<rect x="30" y="42" width="210" height="170" rx="8" fill="#fff" stroke="#a1c8b5"/><rect x="270" y="42" width="250" height="170" rx="8" fill="#fff" stroke="#e3c3a5"/><text x="40" y="28" class="caption">全局快门：同时曝光</text><text x="282" y="28" class="caption">滚动快门：逐行曝光</text>${rows}<text x="61" y="233">同一时刻，各行对齐</text><text x="289" y="233">行与行之间，位置变化</text>`,'全局和滚动快门示意'),out:`滚动示意中，末行相对首行偏移约 <strong>${s.shift} px</strong>。全局曝光仍可能因曝光时间过长出现模糊。`};
}
if(type==='lighting'){
 let mode=s.mode, paths={ring:`<rect x="130" y="78" width="45" height="20" rx="4" fill="#f3bd7a"/><rect x="385" y="78" width="45" height="20" rx="4" fill="#f3bd7a"/><path d="M150 100L225 165 M410 100L335 165" stroke="#e9aa58" stroke-width="3"/>`,bar:`<rect x="50" y="92" width="75" height="22" rx="4" fill="#f3bd7a"/><path d="M125 100L240 165 M125 110L280 165" stroke="#e9aa58" stroke-width="3"/>`,back:`<rect x="120" y="210" width="320" height="20" rx="3" fill="#f6c781"/><path d="M185 210v-8 M280 210v-8 M370 210v-8" stroke="#eebd69" stroke-width="3"/><path d="M125 208V105 M435 208V105" stroke="#eebd69" stroke-width="3" stroke-dasharray="5 4"/><text x="40" y="142" class="minor">工件遮挡背光</text>`,dark:`<rect x="44" y="184" width="70" height="20" rx="4" fill="#f3bd7a"/><path d="M114 190L230 168 M114 198L270 170" stroke="#e9aa58" stroke-width="3"/>`,coax:`<rect x="388" y="78" width="70" height="24" rx="5" fill="#f3bd7a"/><path d="M388 90H280V165 M388 98H290V165" fill="none" stroke="#e9aa58" stroke-width="3"/>`,dome:`<path d="M120 165Q120 40 280 40Q440 40 440 165" fill="none" stroke="#edb772" stroke-width="12"/><path d="M155 135L220 165 M215 79L250 165 M345 79L310 165 M405 135L340 165" stroke="#edb772" stroke-width="3"/>`};
 let c=lightInfo[mode];return{svg:frame(`<rect x="241" y="12" width="78" height="35" rx="8" fill="#275a55"/><circle cx="280" cy="47" r="7" fill="#90cfb0"/><rect x="150" y="166" width="255" height="35" rx="4" fill="#b5d9c5" stroke="#6ca58d"/><text x="245" y="188">工件截面</text>${paths[mode]}<text x="227" y="251" class="minor">相机向下观察 · ${c.title}布置示意</text>`,'照明布置示意'),out:`<strong>${c.title}</strong>：${c.what}<br>${c.care}`};
}
if(type==='threshold'){
 let result=M.threshold(grey,s.threshold),cells='';for(let i=0;i<48;i++){let col=i%8,row=Math.floor(i/8),x=35+col*22,y=50+row*22,v=grey[i],w=result[i];cells+=`<rect x="${x}" y="${y}" width="21" height="21" fill="rgb(${v},${v},${v})"/><rect x="${x+280}" y="${y}" width="21" height="21" fill="rgb(${w},${w},${w})"/>`}
 let count=result.filter(v=>v===255).length;return{svg:frame(`<text x="35" y="30" class="caption">输入：灰度像素</text><text x="315" y="30" class="caption">输出：阈值后的黑白</text>${cells}<text x="35" y="210" class="minor">每一格代表一个合成像素</text><text x="315" y="210" class="minor">白色 = 灰度值大于阈值</text>`,'灰度与阈值结果对比'),out:`当前阈值 <strong>${s.threshold}</strong>；48 个合成像素中有 <strong>${count}</strong> 个变为白色。阈值会影响目标与背景分离。`};
}
if(type==='marks'){
 let m=M.mark(s.dx,s.dy,s.a,s.swap,s.zero),sx=x=>55+(x-30)*1.1,sy=y=>245-(y-5)*1.1;
 let svg=`<path d="M${sx(100)} ${sy(100)}H${sx(200)}" stroke="#9bb5c2" stroke-width="3" stroke-dasharray="7 5"/><line x1="${sx(m.p1.x)}" y1="${sy(m.p1.y)}" x2="${sx(m.p2.x)}" y2="${sy(m.p2.y)}" stroke="#278a77" stroke-width="4"/><circle cx="${sx(m.p1.x)}" cy="${sy(m.p1.y)}" r="7" fill="#e79d62"/><circle cx="${sx(m.p2.x)}" cy="${sy(m.p2.y)}" r="7" fill="#6e9fc6"/><circle cx="${sx(m.center.x)}" cy="${sy(m.center.y)}" r="5" fill="#fff" stroke="#268976" stroke-width="2"/><text x="${sx(m.p1.x)+8}" y="${sy(m.p1.y)-10}">M1</text><text x="${sx(m.p2.x)+8}" y="${sy(m.p2.y)-10}">M2</text><text x="350" y="40" class="caption">虚线：基准 0°</text><text x="350" y="61">实线：实际连线</text><text x="350" y="82">X → · Y ↑</text>`;
 return{svg:frame(svg,'双 Mark 基准和实际位置'),out:`M1 ${point(m.p1)} mm；M2 ${point(m.p2)} mm<br>${m.offset===null?'<strong>两点重合，方向无定义，无法输出有效位姿。</strong>':`中点 ${point(m.center)} mm；方向 <strong>${fmt(m.center.angle)}°</strong>；相对基准偏差 <strong>${fmt(m.offset)}°</strong>。`}`};
}
if(type==='stereo'){
 let d=M.stereo(s.baseline,s.distance,800),left=280-s.baseline*.8,right=280+s.baseline*.8,oy=195-(s.distance-400)/1100*115;
 return{svg:frame(`<circle cx="${left}" cy="212" r="12" fill="#4a9b84"/><circle cx="${right}" cy="212" r="12" fill="#5d90b7"/><circle cx="280" cy="${oy}" r="8" fill="#e19b5f"/><line x1="${left}" y1="212" x2="280" y2="${oy}" stroke="#4a9b84" stroke-width="2"/><line x1="${right}" y1="212" x2="280" y2="${oy}" stroke="#5d90b7" stroke-width="2"/><path d="M${left} 235H${right}" stroke="#71978a"/><text x="${left-25}" y="252" class="minor">左相机</text><text x="${right-20}" y="252" class="minor">右相机</text><text x="293" y="${oy-10}">目标</text><text x="20" y="30" class="caption">双目测距关系 · 示意不按比例</text><text x="20" y="52">fx = 800 px</text><text x="20" y="72">B = ${s.baseline} mm</text><text x="20" y="92">Z = ${s.distance} mm</text><rect x="416" y="35" width="115" height="38" rx="5" fill="#fff" stroke="#b3d2c1"/><rect x="416" y="82" width="115" height="38" rx="5" fill="#fff" stroke="#b3d2c1"/><path d="M473 35v38 M473 82v38" stroke="#aec7ba" stroke-dasharray="3 3"/><circle cx="${473+d*.1}" cy="54" r="5" fill="#e19b5f"/><circle cx="${473-d*.1}" cy="101" r="5" fill="#e19b5f"/><text x="423" y="49" class="minor">左图</text><text x="423" y="96" class="minor">右图</text><text x="416" y="138" class="minor">点差：视差示意</text>`,'双目基线、距离和图像视差示意'),out:`理想视差 d = 800 × ${s.baseline} ÷ ${s.distance} ≈ <strong>${d.toFixed(1)} px</strong>。距离增大时，其他条件不变，视差减小。`};
}
if(type==='profile'){
 let points=[];for(let i=-60;i<=60;i+=2)points.push(`${280+i*2},${210-M.profile(i,s.height)*2.3}`);
 return{svg:frame(`<path d="M150 210H410 M150 210V72" fill="none" stroke="#789d90" stroke-width="2"/><polyline points="${points.join(' ')}" fill="none" stroke="#2b9279" stroke-width="4"/><path d="M280 210V${210-s.height*2.3}" stroke="#e4a36a" stroke-dasharray="5 4"/><text x="420" y="215">横向 X</text><text x="125" y="65">高度 Z</text><text x="288" y="${Math.max(25,200-s.height*2.3)}">${s.height} mm</text><text x="23" y="28" class="caption">一条截面轮廓 · 合成示意</text>`,'激光轮廓截面示意'),out:`模拟截面的最大凸起高度 <strong>${s.height} mm</strong>。连续采集多条截面可在满足运动和标定条件时形成表面数据。`};
}
if(type==='frames'){
 let px=45+s.u/400*180,py=55+s.v/300*140,x=100+s.u*.1,y=200-s.v*.1,qx=320+s.u/400*180,qy=55+s.v/300*140;
 return{svg:frame(`<rect x="45" y="55" width="180" height="140" fill="#fff" stroke="#9abfac"/><rect x="320" y="55" width="180" height="140" fill="#fff" stroke="#9abfac"/><circle cx="${px}" cy="${py}" r="7" fill="#dc995e"/><circle cx="${qx}" cy="${qy}" r="7" fill="#2a927a"/><path d="M45 55h45 M45 55v40 M320 195h45 M320 195v-40" stroke="#789b8d" stroke-width="2"/><text x="45" y="34" class="caption">图像 u →、v ↓</text><text x="320" y="34" class="caption">物理 X →、Y ↑</text><text x="45" y="220">图像点 (${s.u}, ${s.v}) px</text><text x="320" y="220">物理点 (${fmt(x)}, ${fmt(y)}) mm</text>`,'图像与物理坐标的平面映射'),out:`图像点 (${s.u}, ${s.v}) px → 物理点 <strong>(${fmt(x)}, ${fmt(y)}) mm</strong>。物理参考原点由本示例人为定义。`};
}
if(type==='placement'){
 let target={x:500,y:300,r:s.target},held={x:s.x,y:s.y,r:s.r},tool=M.toolTarget(target,held),dx=(tool.x-target.x)*2.3,dy=(tool.y-target.y)*2.3,arrow=M.rotate({x:42,y:0},tool.r),axis=M.rotate({x:55,y:0},target.r);
 return{svg:frame(`<circle cx="280" cy="125" r="8" fill="#4cae89"/><circle cx="${280+dx}" cy="${125-dy}" r="8" fill="#a77aba"/><line x1="${280+dx}" y1="${125-dy}" x2="280" y2="125" stroke="#dc995e" stroke-width="3"/><line x1="280" y1="125" x2="${280+axis.x}" y2="${125-axis.y}" stroke="#43a786" stroke-width="3"/><line x1="${280+dx}" y1="${125-dy}" x2="${280+dx+arrow.x}" y2="${125-dy-arrow.y}" stroke="#a77aba" stroke-width="3"/><text x="298" y="110">产品目标</text><text x="${290+dx}" y="${148-dy}">工具目标</text><text x="30" y="30" class="caption">圆点：参考位置　短线：参考方向</text><text x="30" y="235" class="minor">连线是产品与工具的示意偏移</text>`,'产品目标与工具目标的二维关系'),out:`产品目标 (500, 300, ${s.target}°)<br>产品相对工具 (${s.x}, ${s.y}, ${s.r}°)<br>工具目标 <strong>(${fmt(tool.x)}, ${fmt(tool.y)}, ${fmt(tool.r)}°)</strong>`};
}
throw new Error('Unknown demonstration');
}
function mount(target,id,options){
 if(id==='depth-cloud'){if(target&&root.VisionDepthCloud)root.VisionDepthCloud.mount(target);return}
 if(id==='light-compare'){if(target&&root.VisionLightCompare)root.VisionLightCompare.mount(target);return}
 if(id==='lighting-guide'||id==='3d-compare'){if(target&&root.VisionScenarioGuides)root.VisionScenarioGuides.mount(target,id);return}
 if(id==='lens-height'||id==='handeye-poses'){if(target&&root.VisionSpatialGuides)root.VisionSpatialGuides.mount(target,id);return}
 const d=defs[id];if(!d||!target)return;const uid=++serial;const preset={backlight:'back','coaxial-dome':'coax','ring-bar':'ring'};const initial={...d.initial};if(id==='lighting'&&options&&preset[options.articleId])initial.mode=preset[options.articleId];let state={...initial};
 target.innerHTML=`<section class="experience" aria-labelledby="experience-title-${uid}"><div class="experience-head"><div><span class="experience-kicker">动手体验 · 互动示意</span><h2 id="experience-title-${uid}">${d.title}</h2><p>${d.summary}</p></div><button class="experience-reset" type="button">重置</button></div><div class="experience-layout"><div><div class="experience-figure" tabindex="0" role="region" aria-label="互动图示，小屏幕可左右滚动查看"></div><p class="experience-note">${d.note}</p></div><div class="experience-panel">${d.ranges.map(x=>`<label class="experience-range" for="exp-${uid}-${x.key}"><span>${x.label}<output data-output="${x.key}">${state[x.key]} ${x.unit}</output></span><input id="exp-${uid}-${x.key}" type="range" min="${x.min}" max="${x.max}" step="1" value="${state[x.key]}" data-range="${x.key}"></label>`).join('')}${d.choices?`<div class="experience-label">${d.choices.label}</div><div class="experience-buttons">${d.choices.items.map(i=>`<button type="button" data-choice="${d.choices.key}" data-value="${i[0]}" aria-pressed="${String(state[d.choices.key]===i[0])}">${i[1]}</button>`).join('')}</div>`:''}${d.toggles?`<div class="experience-buttons">${d.toggles.map(x=>`<button type="button" data-toggle="${x[0]}" aria-pressed="false">${x[1]}</button>`).join('')}</div>`:''}<div class="experience-result" aria-live="polite"></div></div></div></section>`;
 function update(){for(const r of d.ranges){const o=target.querySelector(`[data-output="${r.key}"]`);o.textContent=state[r.key]+(r.unit?' '+r.unit:'');const input=target.querySelector(`[data-range="${r.key}"]`);input.value=state[r.key]}target.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(String(state[b.dataset.choice])===b.dataset.value)));target.querySelectorAll('[data-toggle]').forEach(b=>b.setAttribute('aria-pressed',String(!!state[b.dataset.toggle])));let result=show(id,state,uid);target.querySelector('.experience-figure').innerHTML=result.svg;target.querySelector('.experience-result').innerHTML=result.out}
 target.querySelectorAll('[data-range]').forEach(input=>input.addEventListener('input',()=>{state[input.dataset.range]=Number(input.value);update()}));target.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{let raw=b.dataset.value;state[b.dataset.choice]=typeof d.initial[b.dataset.choice]==='number'?Number(raw):raw;update()}));target.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{state[b.dataset.toggle]=!state[b.dataset.toggle];update()}));target.querySelector('.experience-reset').addEventListener('click',()=>{state={...initial};update()});update();
}
root.VISION_EXPERIENCES={catalogue,byArticle,mount};
})(window);
