/* 使用人工整理的主题关联和关键词匹配；不声称语义理解。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionSiteSearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const groups=[['articles','知识点'],['projects','2D 项目'],['cases','现场案例'],['demos','互动图解'],['tools','工具'],['issues','问题排查']];
 const topics=[
  {id:'selection',label:'成像系统选型',terms:['相机选型','镜头选型','硬件选型','系统选型'],members:['article:camera-selection','article:camera-sampling','article:camera-formats','article:lens-fov','article:light-selection','article:app-selection','demo:view','tool:selection','tool:compare']},
  {id:'fov',label:'视野与采样',terms:['视野','视场','fov','像素密度','采样间距'],members:['article:camera-selection','article:camera-sampling','article:lens-fov','article:telecentric','demo:view','demo:lens-height','tool:selection']},
  {id:'lighting',label:'光源与试光',terms:['光源选型','照明','布光','试光','反光','过曝'],members:['article:light-selection','article:light-reflection','article:ring-bar','article:backlight','article:coaxial-dome','article:lighting-color','article:light-flash','demo:lighting','demo:lighting-guide','demo:light-compare','case:scratch','tool:selection','issue:overexposure']},
  {id:'blur',label:'模糊与曝光',terms:['图像模糊','运动模糊','拖影','失焦','曝光时间'],members:['article:lens-aperture','article:sensor-shutter','article:light-flash','article:trigger-throughput','demo:shutter','tool:selection','issue:blur']},
  {id:'threshold',label:'阈值与连通域',terms:['阈值','二值化','blob','连通域','形态学','膨胀','腐蚀','开运算','闭运算','缺陷初筛'],members:['article:2d-threshold','article:2d-features','project:defect-threshold','project:blob-regions','project:terminal-missing','demo:threshold','case:scratch','tool:image-lab']},
  {id:'terminal',label:'连接器端子检测',terms:['连接器','端子','插针','引脚缺失','端子缺失','漏装','端子歪斜','端子倾斜','端子间距','端子粘连','端子连通','误检','漏检','误报','多样本','阈值验证','最小面积','面积筛选','小特征过滤'],members:['project:terminal-missing','article:2d-threshold','project:blob-regions','tool:image-lab']},
  {id:'roi',label:'ROI 与坐标',terms:['roi','感兴趣区域','裁剪','区域坐标'],members:['article:2d-roi','article:2d-pixels','project:measure','project:blob-regions','demo:roi-coordinates','demo:pixel-plane-chain','tool:image-lab']},
  {id:'edge',label:'测量线与找边',terms:['找边','边缘','灰度曲线','卡尺','测量线'],members:['article:2d-measure','article:2d-features','demo:edge-scan','project:measure','project:circle-calipers','tool:image-lab']},
  {id:'matching',label:'模板与特征匹配',terms:['模板匹配','特征匹配','匹配不到','匹配失败'],members:['article:2d-match','article:2d-features','article:2d-roi','project:template-localize','issue:matching']},
  {id:'mark',label:'双 Mark 定位',terms:['双mark','双标记','两点定位','角度跳变','180度'],members:['article:2d-mark','article:app-two-shot','project:single','project:dual','demo:marks','case:two-mark','issue:mark-angle','issue:rotation-grasp']},
  {id:'planar',label:'平面标定与验证',terms:['九点标定','9点标定','平面标定','标定验证'],members:['article:calib-planar','article:calib-validation','article:calib-frames','article:lens-distortion','project:calibration-nine','project:template-localize','project:circle-calipers','demo:frames','demo:pixel-plane-chain','case:hole-pitch','issue:measure-drift']},
  {id:'handeye',label:'眼在手上与坐标',terms:['眼在手上','eye in hand','手眼标定','末端相机'],members:['article:calib-handeye','article:calib-frames','article:calib-center-tcp','article:3d-handeye','article:app-two-shot','demo:handeye-poses','project:single','case:two-mark','issue:rotation-grasp']},
  {id:'alignment',label:'上下相机贴合',terms:['上下相机','对位贴合','贴合偏移','取后偏移'],members:['article:app-alignment','article:app-interface','article:2d-mark','project:placement','demo:placement','issue:robot-comms']},
  {id:'measure',label:'尺寸测量与远心',terms:['尺寸测量','测量精度','远心镜头','标准件'],members:['article:2d-measure','article:2d-precision','article:telecentric','article:lens-aperture','article:lens-distortion','project:measure','project:circle-calipers','demo:lens-height','demo:edge-scan','case:hole-pitch','issue:measure-drift']},
  {id:'depth',label:'3D 视觉与深度',terms:['3d视觉','三维视觉','点云','深度相机'],members:['article:3d-overview','article:3d-stereo','article:3d-structured','article:3d-laser','article:3d-tof','article:3d-pointcloud','article:3d-confidence','article:3d-error','article:3d-handeye','demo:3d-compare','demo:stereo','demo:profile','demo:depth-cloud']},
  {id:'trigger',label:'触发与采集',terms:['触发','丢帧','掉帧','帧率','采集'],members:['article:trigger-throughput','article:camera-interface','article:light-flash','article:sensor-shutter','demo:shutter','issue:frame-loss']},
  {id:'comms',label:'接口与握手',terms:['通信','通讯','握手','机器人不动','超时'],members:['article:app-interface','article:app-debug','article:trigger-throughput','issue:robot-comms','issue:frame-loss']},
  {id:'code',label:'读码与校验',terms:['读码','扫码','条码','二维码','数据校验'],members:['article:2d-code-check','article:2d-match','project:code-verify']},
  {id:'tcp',label:'TCP 与抓取偏移',terms:['tcp','法兰','旋转中心','夹爪偏移'],members:['article:calib-center-tcp','article:calib-frames','article:calib-handeye','article:app-interface','demo:handeye-poses','project:single','case:two-mark','issue:rotation-grasp']}
 ];
 function normalize(value){
  return String(value||'').normalize('NFKC').toLowerCase()
   .replace(/\beye[\s_-]*in[\s_-]*hand\b/g,'眼在手上').replace(/\bfov\b/g,'视野').replace(/视场/g,'视野')
   .replace(/9\s*点|九点/g,'九点').replace(/感兴趣区域|感兴趣区|\broi\b/g,'roi')
   .replace(/双\s*mark|双标记点|双标记/g,'双mark').replace(/连通区域|连通域|blob/g,'blob')
   .replace(/图像实验室|图片实验室|图片实验区/g,'图像实验区').replace(/[°º]/g,'度');
 }
 function build(data,projects,demos,issues,cases){
  const out=[],categories=data.categories||[],cat=id=>categories.find(c=>c.id===id);
  for(const a of data.articles||[]){const category=cat(a.cat),body=(a.sections||[]).flatMap(s=>[s.title,s.text,...(s.points||[])]);out.push({key:'article:'+a.id,group:'articles',title:a.title,desc:a.desc,href:'#article/'+encodeURIComponent(a.id),tags:a.tags||[],keywords:[category?category.name:'',...(a.tags||[]),...body],links:[]})}
  for(const p of projects||[])out.push({key:'project:'+p.id,group:'projects',title:p.title,desc:p.desc,href:'#project/'+encodeURIComponent(p.id),tags:[],keywords:[p.label,...(p.steps||[])],links:p.links||[]});
  for(const c of cases||[])out.push({key:'case:'+c.id,group:'cases',title:c.title,desc:c.desc,href:'#case/'+encodeURIComponent(c.id),tags:c.tags||[],keywords:[c.label,c.scenario,c.focus,...(c.stages||[]).flatMap(s=>[s.title,s.prepare,s.algorithm,s.output,s.clue])],links:c.links||[]});
  for(const d of demos||[])out.push({key:'demo:'+d.id,group:'demos',title:d.title,desc:d.desc,href:'#demo/'+encodeURIComponent(d.id),tags:[],keywords:[d.category],links:d.article?['article:'+d.article]:[]});
  out.push({key:'tool:image-lab',group:'tools',title:'图像实验区：ROI、阈值、Blob 与找边',desc:'使用示例或本地图片，查看阈值、形态学、连通域与测量线灰度曲线。',href:'#image-lab',tags:[],keywords:['图片','图像处理','阈值','直方图','连通域','质心','面积','ROI','像素','找边','测量线','灰度曲线','形态学','膨胀','腐蚀','开运算','闭运算'],links:['demo:roi-coordinates','demo:edge-scan']});
  out.push({key:'tool:selection',group:'tools',title:'相机、镜头与光源联合选型',desc:'共享工件条件，联动估算视野、相机像素、镜头和光源试选。',href:'#tools',tags:[],keywords:['选型','镜头','远心','相机','光源','照明','背光','试光','焦距','视野','工作距离','传感器','曝光','运动模糊'],links:[]});
  out.push({key:'tool:compare',group:'tools',title:'相机镜头光源 A/B 方案对比',desc:'同一工况下比较两套成像方案的视野、采样与曝光位移。',href:'#compare',tags:['方案对比'],keywords:['选型','相机','镜头','光源','焦距','像素','远心','视野','曝光','方案对比','AB对比'],links:['tool:selection']});
  for(const c of issues||[])out.push({key:'issue:'+(c.id||c.title),group:'issues',title:c.title,desc:c.desc,href:'#issues?q='+encodeURIComponent(c.title),tags:c.aliases||[],keywords:[c.category,...(c.aliases||[]),...(c.steps||[])],links:[]});
  for(const e of out){e.topics=topics.filter(t=>t.members.includes(e.key)).map(t=>t.id);e.topicTerms=topics.filter(t=>e.topics.includes(t.id)).flatMap(t=>[t.label,...t.terms])}
  return out;
 }
 function search(entries,query){
  const terms=normalize(query).trim().split(/\s+/).filter(Boolean),found=[];
  for(const e of entries||[]){
   const title=normalize(e.title),desc=normalize(e.desc),tags=normalize((e.tags||[]).join(' ')),topic=normalize((e.topicTerms||[]).join(' ')),body=normalize((e.keywords||[]).join(' '));
   let score=0,reason='';
   for(const term of terms){
    if(title===term){score+=120;if(!reason)reason='标题匹配'}
    else if(title.includes(term)){score+=70;if(!reason)reason='标题匹配'}
    else if(tags.includes(term)){score+=45;if(!reason)reason='标签或常用说法'}
    else if(desc.includes(term)){score+=30;if(!reason)reason='简介匹配'}
    else if(topic.includes(term)){score+=15;if(!reason)reason='关联主题'}
    else if(body.includes(term)){score+=5;if(!reason)reason='内容匹配'}
    else{score=-1;break}
   }
   if(score>=0)found.push({...e,score,matchReason:terms.length?reason:''});
  }
  return groups.map(([id,label])=>({id,label,items:found.filter(e=>e.group===id).sort((a,b)=>b.score-a.score)})).filter(g=>g.items.length);
 }
 function related(entries,key,limit){
  const base=(entries||[]).find(e=>e.key===key);if(!base)return[];
  const candidates=(entries||[]).filter(e=>e.key!==key).map(e=>{
   const shared=(e.topics||[]).filter(t=>(base.topics||[]).includes(t));
   const direct=(e.links||[]).includes(key)||(base.links||[]).includes(e.key);
   return {entry:e,score:shared.length+(direct?4:0),reason:direct?'直接关联':shared.map(id=>topics.find(t=>t.id===id)?.label).filter(Boolean).slice(0,2).join(' · ')};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const n=Number.isInteger(limit)&&limit>0?limit:6,selected=[],seen=new Set();
  for(const item of candidates){if(!seen.has(item.entry.group)){selected.push(item);seen.add(item.entry.group);if(selected.length===n)return selected}}
  for(const item of candidates){if(!selected.includes(item)){selected.push(item);if(selected.length===n)break}}
  return selected;
 }
 return{groups,topics,normalize,build,search,related};
});
