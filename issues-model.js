(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VisionIssueModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const categories=['成像','定位','机器人','测量','采集','通信'];
 const cases=[
  {id:'overexposure',title:'图像发白或局部过曝',category:'成像',desc:'曝光时间、光源亮度、反光角度或增益过高。',aliases:['过曝','太亮','高光','饱和','发白'],href:'#article/light-reflection',linkText:'反光与照明',steps:[
   {title:'查看原图与灰度',action:'先查看原图和灰度分布，判断亮部是否已饱和。',clue:'若一片区域达到当前图像的灰度上限且细节消失，可优先检查曝光和照明；具体上限取决于图像位深。'},
   {title:'比较曝光与光照',action:'降低曝光或光强，再检查光源角度、漫射与反光。',clue:'调整后细节恢复，说明亮度设置可能相关；局部白斑随照明角度变化，也要考虑镜面反射。'},
   {title:'更换位置复测',action:'用不同批次和位置的样件复测。',clue:'比较视野中心、边缘及不同样件，确认需要识别的特征都能保持对比。'}]},
  {id:'blur',title:'图像模糊或边缘不清',category:'成像',desc:'对焦、运动、振动、景深或镜头分辨能力可能不足。',aliases:['模糊','失焦','不清楚','虚焦','拖影','抖动'],href:'#article/lens-aperture',linkText:'景深与清晰度',steps:[
   {title:'对比静止与运动',action:'在设备安全状态下，对比静止拍摄和运行时的图像。',clue:'静止清晰、运动时模糊，可优先检查运动、振动与曝光；静止也模糊，则继续检查对焦与成像。'},
   {title:'核对对焦与高度',action:'检查工作距离、对焦和工件高度范围。',clue:'只有某些高度清楚时，可进一步检查景深、工件高度变化和镜头工作距离。'},
   {title:'检查曝光与镜头',action:'核对曝光、光照和镜头适配。',clue:'比较调整曝光后的图像，并结合传感器、镜头分辨能力和样件边缘细节判断。'}]},
  {id:'matching',title:'模板匹配不到或不稳定',category:'定位',desc:'图像对比度、模板特征、ROI 或角度范围不适合。',aliases:['模板','匹配失败','匹配不稳定','找不到'],href:'#category/vision2d',linkText:'2D 定位知识',steps:[
   {title:'先看当前原图',action:'确认当前图像和模板中的特征是否一致，检查照明与对比。',clue:'如果特征在原图里已经不清楚或被遮挡，先检查成像条件，再调整匹配参数。'},
   {title:'核对搜索范围',action:'检查搜索区域、允许角度及匹配分数。',clue:'观察目标是否落在 ROI 和角度范围内；分数变化可作为线索，不能单独证明匹配正确。'},
   {title:'覆盖变化样件',action:'使用不同角度、遮挡情况和批次的样件测试。',clue:'记录漏检与误匹配出现的条件，判断模板和搜索范围是否能覆盖实际变化。'}]},
  {id:'mark-angle',title:'双 Mark 角度跳变 180°',category:'定位',desc:'两个 Mark 的身份或点的顺序可能交换。',aliases:['双mark','双标记','角度跳变','角度反了','180度','180°'],href:'#demo/marks',linkText:'双 Mark 互动图',steps:[
   {title:'确认两个点的身份',action:'核对 M1、M2 身份与基准示教一致。',clue:'若 M1、M2 顺序互换，同一条连线的有向角会相差约 180°；先检查两个点的对应关系。'},
   {title:'检查连线与角度',action:'检查两点连线方向和角度归一化。',clue:'基准和运行时都应使用同一个方向，例如始终从 M1 指向 M2；跨 ±180° 时还需正确处理角度差。'},
   {title:'检查无效结果',action:'两点过近或识别失败时停止输出有效姿态。',clue:'确认系统能区分识别失败、点重合和有效角度，不把异常值当成抓取结果。'}]},
  {id:'rotation-grasp',title:'产品转得越多，抓取偏差越大',category:'机器人',desc:'抓取点相对产品参考点的偏移可能没有随产品旋转。',aliases:['抓取偏差','旋转后偏移','旋转偏差','夹爪','tcp'],href:'#project/single',linkText:'双 Mark 抓取案例',steps:[
   {title:'核对示教偏移',action:'核对示教点与 Mark 中点的偏移关系。',clue:'如果基准时正常、转角越大误差越明显，可以优先检查参考点到抓取点的偏移是否随产品一起转。'},
   {title:'检查角度与旋转中心',action:'检查旋转偏移向量时的角度正负和旋转中心。',clue:'对照同一坐标系下的基准与运行结果，检查旋转方向、单位和所选参考点；这些现象不能单独确定根因。'},
   {title:'核对机器人约定',action:'与机器人工程师核对坐标系、TCP 和姿态约定。',clue:'明确视觉发送的是产品位姿还是修正量，以及机器人当前使用的 TCP、坐标系和姿态表达。'}]},
  {id:'measure-drift',title:'测量尺寸随位置或高度变化',category:'测量',desc:'透视、镜头畸变、工件高度或标定条件可能改变。',aliases:['尺寸变化','测量偏差','中心边缘','高度变化','畸变'],href:'#article/telecentric',linkText:'普通与远心镜头',steps:[
   {title:'比较中心与边缘',action:'在视野中心和边缘用标准件重复测量。',clue:'若偏差随视野位置变化，可以进一步检查镜头畸变、照明和标定覆盖范围。'},
   {title:'核对标定平面',action:'核对标定平面与实际工件高度。',clue:'若工件高度变化时结果也变化，需要评估透视影响和实际测量平面是否与标定一致。'},
   {title:'评估方案与公差',action:'根据公差评估远心镜头、夹具与照明。',clue:'在适用工作距离和景深范围内比较方案，再用标准件和真实样件验证。'}]},
  {id:'frame-loss',title:'图像不更新或偶发丢帧',category:'采集',desc:'触发、采集节拍、网络带宽或缓存可能异常。',aliases:['丢帧','掉帧','图像不更新','触发失败','卡图','相机无图'],href:'#category/camera',linkText:'相机与采集',steps:[
   {title:'确认触发与状态',action:'确认相机触发模式及触发信号，并检查设备是否准备好采集。',clue:'触发方式、信号或相机就绪状态不一致时，可能不会产生预期图像；以设备支持的状态与日志为准。'},
   {title:'核对图像编号',action:'检查图像编号、时间和采集速率；有帧号时对照采集端和显示端。',clue:'若采集端有新帧而显示不更新，可继续检查传输和显示链路；帧号规则及跳号原因以相机文档为准。'},
   {title:'检查传输与处理',action:'核对网络、带宽、缓存及程序处理耗时。',clue:'比较触发频率、采集量和处理能力，结合设备诊断信息判断瓶颈。'}]},
  {id:'robot-comms',title:'视觉输出正常，机器人却没有动作',category:'通信',desc:'数据格式、握手、超时或控制器状态可能不一致。',aliases:['机器人不动','通信','握手','超时','没有动作','数据格式'],href:'#category/application',linkText:'应用与排查',steps:[
   {title:'核对收发记录',action:'先核对双方连接和发送接收日志。',clue:'按同一次任务对照发送、接收和应答时间，区分未发送、未收到与收到后未执行。'},
   {title:'检查数据格式',action:'逐项核对字段顺序、单位、结束符和状态码。',clue:'双方显示“有数据”不代表解析一致；核对协议版本、实际报文和解析结果。'},
   {title:'检查握手与状态',action:'与设备工程师检查握手、互锁和超时处理。',clue:'超时后先确认设备是否已经执行以及当前状态，再按现场流程处理，避免盲目重复发送动作命令。'}]}
 ];
 function normalize(text){return String(text||'').toLowerCase().replace(/\s+/g,'').replace(/[°º]/g,'度')}
 function filter(query,category){
  const q=normalize(query),kind=category||'all';
  return cases.filter(c=>(kind==='all'||c.category===kind)&&(!q||normalize([c.title,c.category,c.desc,...c.aliases,...c.steps.flatMap(s=>[s.title,s.action,s.clue])].join(' ')).includes(q)));
 }
 return{cases,categories,filter,normalize};
});
