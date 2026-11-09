/* 合成连接器缺失检测；ROI、二值和连通域计算复用图像实验区模型。 */
(function(root,factory){
 const lab=typeof module==='object'&&module.exports?require('./image-lab-model.js'):root.VisionImageLabModel;
 const api=factory(lab);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionTerminalCase=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(L){
 'use strict';
 const W=220,H=120,BG=40,COUNT=5;
 const slots=Object.freeze(Array.from({length:COUNT},(_,i)=>Object.freeze({id:i+1,x:26+i*36,y:28,w:18,h:60})));
 const defaults=Object.freeze({missing:3,noise:true,brightness:180,threshold:120,roiRight:205,morphology:'none',kernelSize:3,minArea:1});
 const valid=s=>s&&Number.isInteger(s.missing)&&s.missing>=0&&s.missing<=COUNT&&typeof s.noise==='boolean'&&Number.isInteger(s.brightness)&&s.brightness>=50&&s.brightness<=220&&Number.isInteger(s.threshold)&&s.threshold>=0&&s.threshold<=255&&Number.isInteger(s.roiRight)&&s.roiRight>=60&&s.roiRight<=205&&['none','dilate','erode','open','close'].includes(s.morphology)&&[3,5].includes(s.kernelSize)&&Number.isInteger(s.minArea)&&s.minArea>=1&&s.minArea<=900;
 function rect(gray,x,y,w,h,value){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)gray[yy*W+xx]=value}
 function generate(s){
  if(!valid(s))return null;
  const gray=new Uint8Array(W*H).fill(20);
  rect(gray,8,22,200,72,BG);
  for(const p of slots)if(p.id!==s.missing)rect(gray,p.x+3,p.y+5,12,50,s.brightness);
  if(s.noise)rect(gray,14,91,2,2,220);
  return gray;
 }
 function analyze(s){
  const gray=generate(s);if(!gray)return null;
  const roi={x:10,y:20,w:s.roiRight-10,h:80};
  const result=L.analyze(gray,W,H,{roi,threshold:s.threshold,minArea:s.minArea,connectivity:8,polarity:'bright',morphology:s.morphology,kernelSize:s.kernelSize});
  const quality=s.brightness-BG>=20&&s.threshold>BG&&s.threshold<=s.brightness;
  const coverage=slots.every(p=>p.x>=roi.x&&p.y>=roi.y&&p.x+p.w<=roi.x+roi.w&&p.y+p.h<=roi.y+roi.h);
  const assignments=slots.map(p=>({...p,covered:p.x>=roi.x&&p.y>=roi.y&&p.x+p.w<=roi.x+roi.w&&p.y+p.h<=roi.y+roi.h,components:[]}));
  const extras=[],ambiguous=[];
  const intersects=(c,p)=>c.x<p.x+p.w&&c.x+c.w>p.x&&c.y<p.y+p.h&&c.y+c.h>p.y;
  for(const c of result.components){
   const touched=assignments.filter(p=>intersects(c,p));
   if(!touched.length)extras.push(c);
   else if(touched.length===1&&c.x>=touched[0].x&&c.y>=touched[0].y&&c.x+c.w<=touched[0].x+touched[0].w&&c.y+c.h<=touched[0].y+touched[0].h)touched[0].components.push(c);
   else ambiguous.push(c);
  }
  for(const p of assignments)p.state=!p.covered?'uncovered':!quality?'unverified':ambiguous.some(c=>intersects(c,p))?'ambiguous':p.components.length===0?'missing':p.components.length===1?'found':'ambiguous';
  const missing=assignments.filter(p=>p.state==='missing').map(p=>p.id),found=assignments.filter(p=>p.state==='found').length;
  const multi=assignments.some(p=>p.state==='ambiguous'),truncated=result.acceptedCount>result.components.length;
  let status='ok',reason='五个槽位各有一个合格候选，且无槽外候选。';
  if(!coverage){status='review';reason='ROI 未完整覆盖所有槽位，不能作有效 OK/NG 判断。'}
  else if(!quality){status='review';reason='本例已知目标与最高背景灰度条件不满足，不能作有效 OK/NG 判断。'}
  else if(truncated||ambiguous.length||multi){status='review';reason='候选过多或跨越槽位，当前结果需要复核。'}
  else if(missing.length){status='ng';reason='槽位 '+missing.join('、')+' 未找到合格候选；可能是缺失或参数不合适。'}
  else if(extras.length){status='review';reason='五个槽位均有候选，但还存在槽外候选，需要复核。'}
  return {gray,roi,result,slots:assignments,extras,ambiguous,quality,coverage,found,missing,status,reason};
 }
 return {W,H,BG,COUNT,slots,defaults,generate,analyze};
});
