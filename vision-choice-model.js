/* 任务导向的人工规则和用户提供规格的数值核对，不关联任何设备型号。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionChoiceModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const tasks=['unknown','appearance','xy','depth','pose','both'];
 const heights=['unknown','controlled','variable'];
 const coverage=['unknown','point','profile','surface'];
 const motion=['unknown','static','moving','robot'];
 const materials=['unknown','matte','reflective','transparent','mixed'];
 const dimension=(task,height)=>{
  if(!tasks.includes(task)||!heights.includes(height))return null;
  if(task==='unknown')return{kind:'pending',title:'先确认需要输出什么',reason:'先分清要看颜色纹理、平面位置，还是需要高度、截面或三维姿态。'};
  if(task==='appearance')return{kind:'2d',title:'优先评估 2D 成像',reason:'颜色、字符和表面纹理通常先从 2D 相机与照明开始；如果还要测高度，应另外评估三维或位移测量。'+(height==='variable'?'高度变化可能影响对焦和成像比例，需在变化范围内验证。':'')};
  if(task==='xy'){
   if(height==='controlled')return{kind:'2d',title:'优先评估 2D 平面定位',reason:'目标主要输出平面 X、Y、角度，且高度和倾斜可控时，可以先验证 2D 成像、标定及抓取误差。'};
   if(height==='variable')return{kind:'both',title:'2D 与 3D 都值得评估',reason:'目标虽然只要求平面位置，高度或倾斜变化仍可能影响成像和抓取；可比较机械限位、2D 补偿与三维测量。'};
   return{kind:'pending',title:'先确认高度与倾斜是否可控',reason:'平面 X、Y、角度可能由 2D 完成；高度和姿态变化范围还不清楚，暂不能排除 3D。'};
  }
  if(task==='depth')return{kind:'3d',title:'优先评估高度或三维测量',reason:'任务需要直接得到高度、台阶或轮廓；先区分单点位移、一条轮廓还是整面点云。'};
  if(task==='pose')return{kind:'3d',title:'优先评估三维位姿方案',reason:'任务需要高度或空间姿态时，需评估可见几何、点云质量、手眼标定与抓取方式；单点位移不足以代表完整姿态。'};
  return{kind:'both',title:'评估 2D 与高度测量组合',reason:'颜色或纹理和高度是两类信息，可以比较 2D 成像加位移传感器、3D 数据加 2D 图像等组合。'};
 };
 function method(input){
  if(!input||!tasks.includes(input.task)||!coverage.includes(input.coverage)||!motion.includes(input.motion)||!materials.includes(input.material))return null;
  const {task,coverage:shape,motion:move,material}=input;
  let title,why,check=[];
  if(shape==='unknown'){title='先确定单点、轮廓还是整面';why='不同采集范围对应不同的传感器与运动方式，暂不推荐具体方法。';}
  else if(shape==='point'){title='先评估单点位移测量';why='如果只需固定位置的高度，可比较单点位移传感器；它不等于完整点云。';if(task==='pose')check.push('完整空间姿态不能仅凭单点位移确定；请重新确认采集范围。');}
  else if(shape==='profile'){title='先评估线激光轮廓';why='单条轮廓可用于截面或台阶；获取整面需要多条轮廓以及已知相对运动。';if(task==='pose')check.push('单条轮廓通常不足以确定一般工件的完整空间姿态，应核对是否需要整面数据。');}
  else if(move==='moving'){title='比较线激光扫描与面扫描';why='相对运动可配合线激光与位置反馈拼接；面扫描也可评估能否满足运动和采集时间。';}
  else if(move==='robot'){title='比较面扫描与移动扫描';why='结构光或主动双目可评估整面采集；也可比较机器人带动轮廓扫描。需核对视野、避让和手眼关系。';}
  else {title='先比较结构光、主动双目及轮廓扫描';why=move==='static'?'静止场景可先比较面扫描方法；线激光结合相对运动也能形成表面数据。':'还需确认是否允许停止、多次曝光，以及是否有稳定相对运动。';}
  if(move==='unknown')check.push('运动状态与允许采集时间尚未确定，先确认是否能停稳或需要同步触发。');
  if(material==='reflective')check.push('反光表面可能产生过曝、缺点或飞点；用实际表面、角度和最差位置拍样。');
  if(material==='transparent')check.push('透明或半透明表面可能出现缺点、背景干扰或错误深度；需按具体设备和样件验证。');
  if(material==='mixed')check.push('混合材质可能需要不同曝光或视角，检查最差区域和节拍。');
  if(material==='unknown')check.push('材质与表面反射情况未确定，不能判断有效点覆盖。');
  if(task==='both'||task==='appearance')check.push('字符、颜色和纹理可能仍需 2D 图像与照明；三维数据不自动替代它们。');
  check.push('选择结果是比较起点；核对工作范围、遮挡、点间距、误差定义、节拍和实际样件。');
  return {title,why,check};
 }
 const present=v=>v!==null&&v!==undefined&&v!=='';
 const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
 const nonnegative=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 function sampling(feature,samples){
  if(!positive(feature)||!Number.isSafeInteger(samples)||samples<=0)return null;
  const pitch=feature/samples;return positive(pitch)?pitch:null;
 }
 function line(speed,spacing,length){
  if(!nonnegative(speed)||!positive(spacing)||(present(length)&&!positive(length)))return null;
  const frequency=speed/spacing;
  if(!Number.isFinite(frequency))return null;
  if(!present(length))return{frequency,duration:null,positions:null,last:null,stationary:speed===0};
  if(speed===0)return{frequency:0,duration:null,positions:null,last:null,stationary:true};
  const intervals=Math.floor(length/spacing+1e-12);
  if(!Number.isSafeInteger(intervals)||!Number.isSafeInteger(intervals+1)||!Number.isFinite(length/speed)||!Number.isFinite(intervals*spacing))return null;
  return{frequency,duration:length/speed,positions:intervals+1,last:intervals*spacing,stationary:false};
 }
 function atLeast(required,available){
  if(!present(required)||!present(available))return'missing';
  if(!positive(required)||!positive(available))return'invalid';
  return available>=required||required-available<=Math.max(required,available)*1e-12?'pass':'below';
 }
 function atMost(required,available){
  if(!present(required)||!present(available))return'missing';
  if(!positive(required)||!positive(available))return'invalid';
  return available<=required||available-required<=Math.max(required,available)*1e-12?'pass':'below';
 }
 function rangeStatus(reqMin,reqMax,specMin,specMax){
  if(![reqMin,reqMax,specMin,specMax].every(present))return'missing';
  if(![reqMin,reqMax,specMin,specMax].every(positive)||reqMin>reqMax||specMin>specMax)return'invalid';
  return specMin<=reqMin&&specMax>=reqMax?'pass':'below';
 }
 function compare(req,candidate){
  if(!req||!candidate||!['unknown','point','line','area'].includes(candidate.type))return null;
  const type=candidate.type,needPitch=sampling(req.feature,req.samples),scan=line(req.speed,req.spacing,req.length);
  return {
   width:type==='unknown'?'missing':type==='point'?'na':atLeast(req.width,candidate.width),
   height:type==='area'?atLeast(req.height,candidate.height):type==='line'?'scan':type==='point'?'na':'missing',
   range:type==='unknown'?'missing':rangeStatus(req.near,req.far,candidate.near,candidate.far),
   pitch:type==='unknown'?'missing':type==='point'?'na':atMost(needPitch,candidate.pitch),
   frequency:type==='unknown'?'missing':type==='line'?(scan&&!scan.stationary?atLeast(scan.frequency,candidate.frequency):'missing'):'na',
   repeatability:present(candidate.repeatability)?(positive(candidate.repeatability)?'provided':'invalid'):'missing',
   needPitch,scan
  };
 }
 return {dimension,method,sampling,line,compare};
});
