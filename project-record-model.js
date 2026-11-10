/* 项目记录中的结论由填写人决定；不根据选型估算推断验证通过。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionProjectRecordModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const statusOptions=['未判断','待补充','需调整','满足本次验证条件'];
 const sampleTypes=['待确认','正常样件','缺陷样件','标准件','其他'];
 const sampleResults=['未判断','通过','不通过','待复核'];
 const keys=['project','owner','date','goal','part','area','accuracy','cycle','environment','selectionSource','selectionSummary','setup','coordinates','pending','testConditions','acceptance','conclusion','nextAction'];
 const sampleKeys=['id','type','condition','observation','result','note'];
 const blankSample=()=>({id:'',type:'待确认',condition:'',observation:'',result:'未判断',note:''});
 function blank(){return {demo:false,fields:Object.fromEntries([...keys.map(k=>[k,'']),['status','未判断']]),samples:[blankSample()]}}
 function example(){const r=blank();r.demo=true;Object.assign(r.fields,{project:'演示：输送台阶高度检测',goal:'比较台阶相对基准面的高度。',part:'示例：哑光工件，实际表面待确认。',area:'示例范围 100 × 50 mm；工作距离 300～350 mm。',accuracy:'示例允许误差 0.1 mm；具体定义需与工艺确认。',cycle:'线扫示例 200 mm/s；完整节拍待确认。',selectionSource:'演示：线激光轮廓扫描',selectionSummary:'示例速度 200 mm/s，轮廓间距 0.2 mm，理论线频 1000 条/秒。设备型号与规格待确认。',pending:'基准面、真实样件、设备规格和测量误差定义待确认。',testConditions:'演示记录：尚未进行实际拍样。',acceptance:'按现场工艺、标准件和样件结果确认。',conclusion:'演示数据，等待实际拍样。',nextAction:'准备标准件与不同位置、表面的样件。'});r.samples=[{id:'示例-01',type:'标准件',condition:'示例：视野中心',observation:'尚未实测',result:'未判断',note:'此行仅为演示'}];return r}
 const isObject=v=>v&&typeof v==='object'&&!Array.isArray(v);
 function clean(data){
  if(!isObject(data)||typeof data.demo!=='boolean'||!isObject(data.fields)||!Array.isArray(data.samples)||data.samples.length>50)return null;
  const result=blank();result.demo=data.demo;
  for(const k of keys){if(data.fields[k]!==undefined&&typeof data.fields[k]!=='string')return null;result.fields[k]=data.fields[k]||''}
  if(result.fields.date){const s=result.fields.date,d=new Date(s+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s.startsWith('0000')||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)return null}
  if(!statusOptions.includes(data.fields.status))return null;result.fields.status=data.fields.status;
  result.samples=[];
  for(const row of data.samples){if(!isObject(row))return null;const item=blankSample();for(const k of sampleKeys){if(row[k]!==undefined&&typeof row[k]!=='string')return null;item[k]=row[k]||item[k]}if(!sampleTypes.includes(item.type)||!sampleResults.includes(item.result))return null;result.samples.push(item)}
  return result;
 }
 const text=v=>v===null||v===undefined||String(v).trim()===''?'待填写':String(v).trim();
 const unit=(v,u)=>text(v)==='待填写'?'待填写':text(v)+' '+u;
 const translate=(table,v)=>table[v]||'待确认';
 function from2d(snapshot){
  if(!isObject(snapshot)||!isObject(snapshot.values)||!isObject(snapshot.context))return null;
  const v=snapshot.values,c=snapshot.context;
  const materials={matte:'哑光表面','flat-metal':'平整反光面','curved-metal':'曲面反光件',transparent:'透明件'};
  const goals={outline:'外轮廓／孔位',scratch:'划痕／表面纹理',text:'字符／图案',presence:'有无／位置'};
  const colors={unknown:'待确认',yes:'需要区分',no:'不依赖颜色'},back={unknown:'待确认',yes:'有安装空间',no:'没有安装空间'},lens={fixed:'普通定焦',telecentric:'物方远心'};
  const lines=['2D 成像选型 · 当前工具输入','目标范围：'+unit(v.width,'mm')+' × '+unit(v.height,'mm')+'；余量 '+unit(v.margin,'%'),'工作距离：'+unit(v.distance,'mm'),'最小特征：'+unit(v.feature,'mm')+'；期望 '+unit(v.featurePixels,'px'),'传感器有效尺寸：'+unit(v.sensorWidth,'mm')+' × '+unit(v.sensorHeight,'mm'),'镜头方向：'+translate(lens,c.lens)+'；材质：'+translate(materials,c.material),'特征：'+translate(goals,c.goal)+'；颜色：'+translate(colors,c.color)+'；背部布光：'+translate(back,c.backlight),'相对速度：'+unit(c.speed,'mm/s')+'；曝光：'+unit(c.exposure,'ms')];
  if(snapshot.origin&&snapshot.origin.note)lines.push('原始案例或示例说明（可能与当前输入不同）：'+text(snapshot.origin.note));
  lines.push('以上为工具输入，示例或估算条件需按实际设备和样件核对。');return {source:'2D 成像选型',summary:lines.join('\n')};
 }
 function from3d(snapshot){
  if(!isObject(snapshot)||!isObject(snapshot.context)||!isObject(snapshot.req)||!isObject(snapshot.spec))return null;
  const c=snapshot.context,v=snapshot.req;
  const tasks={unknown:'待确认',appearance:'外观',xy:'平面位置与角度',depth:'高度／台阶／截面',pose:'空间位置与姿态',both:'外观与高度'};
  const shapes={unknown:'待确认',point:'固定单点',profile:'一条截面',surface:'区域或整面'},moves={unknown:'待确认',static:'停稳',moving:'持续运动',robot:'传感器随机器人移动'},materials={unknown:'待确认',matte:'哑光或漫反射',reflective:'高反光或金属',transparent:'透明或半透明',mixed:'混合材质'},types={unknown:'待确认',point:'单点位移',line:'线激光轮廓',area:'面扫描／深度相机'};
  const lines=['3D 方案初选 · 当前工具输入','任务：'+translate(tasks,c.task)+'；范围：'+translate(shapes,c.coverage),'运动：'+translate(moves,c.motion)+'；表面：'+translate(materials,c.material),'所需范围：'+unit(v.width,'mm')+' × '+unit(v.height,'mm'),'工作距离：'+unit(v.near,'mm')+' ～ '+unit(v.far,'mm'),'最小横向特征：'+unit(v.feature,'mm')+'；期望 '+unit(v.samples,'点')+'；允许误差：'+unit(v.tolerance,'mm'),'线扫速度：'+unit(v.speed,'mm/s')+'；轮廓间距：'+unit(v.spacing,'mm')+'；行程：'+unit(v.length,'mm')];
  for(const id of ['A','B']){const s=isObject(snapshot.spec[id])?snapshot.spec[id]:{};lines.push('候选 '+id+'：'+translate(types,s.type)+'；名称 '+text(s.name)+'；来源 '+text(s.source));if(s.type&&s.type!=='unknown')lines.push('  有效宽/高：'+unit(s.width,'mm')+' / '+unit(s.height,'mm')+'；工作距离 '+unit(s.near,'mm')+' ～ '+unit(s.far,'mm')+'；X 点间距 '+unit(s.pitch,'mm')+'；线频 '+unit(s.frequency,'条/s')+'；Z 重复性 '+unit(s.repeatability,'mm'))}
  if(snapshot.origin&&snapshot.origin.desc)lines.push('原始案例或示例说明（可能与当前输入不同）：'+text(snapshot.origin.desc));
  lines.push('以上为工具输入；示例规格、重复性和采样间距不代表现场验证结果。');return {source:'3D 方案初选',summary:lines.join('\n')};
 }
 function toText(data){
  const r=clean(data);if(!r)return null;const f=r.fields;
  const lines=['机器视觉项目需求与样件验证记录',r.demo?'【演示数据：并非实际拍样记录】':'【填写人记录：结论由填写人提供】','', '一、项目需求','项目名称：'+text(f.project),'填写人：'+text(f.owner),'日期：'+text(f.date),'应用目标：'+text(f.goal),'工件材质与特征：'+text(f.part),'范围与安装空间：'+text(f.area),'误差或判定要求：'+text(f.accuracy),'节拍要求：'+text(f.cycle),'现场环境：'+text(f.environment),'','二、选型与待确认','选型摘要来源：'+text(f.selectionSource),'选型条件摘要：\n'+text(f.selectionSummary),'相机、镜头、光源或传感器布置：'+text(f.setup),'标定、坐标及机器人接口：'+text(f.coordinates),'待确认事项：'+text(f.pending),'','三、样件验证','拍样条件：'+text(f.testConditions),'验收标准：'+text(f.acceptance)];
  const rows=r.samples.filter(s=>s.id.trim()||s.condition.trim()||s.observation.trim()||s.note.trim()||s.type!=='待确认'||s.result!=='未判断');
  if(!rows.length)lines.push('样件记录：待填写');
  rows.forEach((s,i)=>lines.push('',`样件 ${i+1}：${text(s.id)}（${s.type}）`,'条件：'+text(s.condition),'观察／测得值：'+text(s.observation),'填写人判定：'+s.result,'备注：'+text(s.note)));
  lines.push('','四、现场结论','填写人选择的状态：'+f.status,'结论与依据：'+text(f.conclusion),'下一步：'+text(f.nextAction),'','注：本记录汇总填写内容，不自动判定设备或产线合格。');return lines.join('\r\n');
 }
 function encode(data){const record=clean(data);return record?JSON.stringify({format:'vision-project-record',version:1,record},null,2):null}
 function decode(raw){try{const obj=JSON.parse(raw);return isObject(obj)&&obj.format==='vision-project-record'&&obj.version===1?clean(obj.record):null}catch(e){return null}}
 return{blank,blankSample,example,clean,toText,encode,decode,from2d,from3d,keys,sampleKeys,statusOptions,sampleTypes,sampleResults};
});
