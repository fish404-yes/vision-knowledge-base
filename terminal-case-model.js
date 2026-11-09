/* 合成端子检测；ROI、二值和连通域计算复用图像实验区模型。 */
(function(root,factory){
 const lab=typeof module==='object'&&module.exports?require('./image-lab-model.js'):root.VisionImageLabModel;
 const api=factory(lab);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionTerminalCase=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(L){
 'use strict';
 const W=220,H=120,BG=40,COUNT=5,PITCH=36,ANGLE_LIMIT=5,PITCH_TOLERANCE=2;
 // 槽位比端子宽，以容纳示例中的少量倾斜和偏移。
 const slots=Object.freeze(Array.from({length:COUNT},(_,i)=>Object.freeze({id:i+1,x:20+i*PITCH,y:28,w:30,h:60})));
 const defaults=Object.freeze({missing:3,noise:true,brightness:180,threshold:120,roiRight:205,morphology:'none',kernelSize:3,minArea:1,tilt:0,shift:0,bridge:false});
 const valid=s=>s&&Number.isInteger(s.missing)&&s.missing>=0&&s.missing<=COUNT&&typeof s.noise==='boolean'&&Number.isInteger(s.brightness)&&s.brightness>=50&&s.brightness<=220&&Number.isInteger(s.threshold)&&s.threshold>=0&&s.threshold<=255&&Number.isInteger(s.roiRight)&&s.roiRight>=60&&s.roiRight<=205&&['none','dilate','erode','open','close'].includes(s.morphology)&&[3,5].includes(s.kernelSize)&&Number.isInteger(s.minArea)&&s.minArea>=1&&s.minArea<=900&&Number.isInteger(s.tilt)&&s.tilt>=-20&&s.tilt<=20&&Number.isInteger(s.shift)&&s.shift>=-6&&s.shift<=6&&typeof s.bridge==='boolean';
 function rect(gray,x,y,w,h,value){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)gray[yy*W+xx]=value}
 function generate(s){
  if(!valid(s))return null;
  const gray=new Uint8Array(W*H).fill(20);
  rect(gray,8,22,200,72,BG);
  for(const p of slots){
   if(p.id===s.missing)continue;
   const shift=p.id===3?s.shift:0,angle=(p.id===3?s.tilt:0)*Math.PI/180;
   const cx=p.x+14.5+shift,cy=p.y+29.5,cos=Math.cos(angle),sin=Math.sin(angle);
   // 在原图上对旋转矩形采样，不从设置值直接推导检测结果。
   for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x-6;x<p.x+p.w+6;x++){
    const dx=x-cx,dy=y-cy,u=cos*dx-sin*dy,v=sin*dx+cos*dy;
    if(Math.abs(u)<6&&Math.abs(v)<25)gray[y*W+x]=s.brightness;
   }
  }
  // 只有两端子均存在时才绘制模拟桥接；实际连通并不等于真实粘连。
  if(s.bridge&&s.missing!==2&&s.missing!==3){
   const x1=slots[1].x+15,x2=slots[2].x+15+s.shift;
   rect(gray,x1,55,x2-x1+1,5,s.brightness);
  }
  if(s.noise)rect(gray,14,91,2,2,220);
  return gray;
 }
 function orientation(mask,c){
  let n=0,xx=0,yy=0,xy=0;
  for(let y=c.y;y<c.y+c.h;y++)for(let x=c.x;x<c.x+c.w;x++)if(mask[y*W+x]){
   const dx=x-c.cx,dy=y-c.cy;n++;xx+=dx*dx;yy+=dy*dy;xy+=dx*dy;
  }
  // 外接框内混入另一前景连通域，或形状不足以确定方向时，拒绝给出角度。
  if(n!==c.area||n<3)return null;
  xx/=n;yy/=n;xy/=n;
  const disc=Math.hypot(xx-yy,2*xy),major=(xx+yy+disc)/2,minor=(xx+yy-disc)/2;
  if(major<=0||major<3*minor)return null;
  return .5*Math.atan2(2*xy,yy-xx)*180/Math.PI;
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
  const truncated=result.acceptedCount>result.components.length;
  for(const p of assignments){
   p.state=!p.covered?'uncovered':!quality?'unverified':ambiguous.some(c=>intersects(c,p))?'ambiguous':p.components.length===0?'missing':p.components.length===1?'found':'ambiguous';
   p.angle=coverage&&quality&&!truncated&&p.state==='found'?orientation(result.mask,p.components[0]):null;
  }
  const pairs=assignments.slice(0,-1).map((p,i)=>{
   const q=assignments[i+1],distance=coverage&&quality&&!truncated&&p.state==='found'&&q.state==='found'?q.components[0].cx-p.components[0].cx:null;
   return{from:p.id,to:q.id,distance,ok:distance===null?null:Math.abs(distance-PITCH)<=PITCH_TOLERANCE};
  });
  const missing=assignments.filter(p=>p.state==='missing').map(p=>p.id),found=assignments.filter(p=>p.state==='found').length;
  const multi=assignments.some(p=>p.state==='ambiguous'),badAngle=assignments.filter(p=>p.angle!==null&&Math.abs(p.angle)>ANGLE_LIMIT),badPitch=pairs.filter(p=>p.ok===false);
  let status='ok',reason='五个槽位各有一个候选，示例倾角和间距均在范围内。';
  if(!coverage){status='review';reason='ROI 未完整覆盖所有槽位，不能作有效 OK/NG 判断。'}
  else if(!quality){status='review';reason='本例已知目标与最高背景灰度条件不满足，不能作有效 OK/NG 判断。'}
  else if(truncated||ambiguous.length||multi){status='review';reason='候选过多、跨越槽位或相邻端子连通；需要复核，不能直接认定真实粘连。'}
  else if(missing.length){status='ng';reason='槽位 '+missing.join('、')+' 未找到合格候选；可能是缺失或参数不合适。'}
  else if(extras.length){status='review';reason='五个槽位均有候选，但还存在槽外候选，需要复核。'}
  else if(assignments.some(p=>p.angle===null)){status='review';reason='候选形状不足以稳定确定方向，需要复核。'}
  else if(badAngle.length){status='ng';reason=badAngle.map(p=>p.id+' 号').join('、')+'的图像倾角超出本例范围。'}
  else if(badPitch.length){status='ng';reason=badPitch.map(p=>p.from+'–'+p.to+' 号').join('、')+'的中心间距超出本例范围。'}
  return {gray,roi,result,slots:assignments,pairs,extras,ambiguous,quality,coverage,found,missing,badAngle,badPitch,status,reason};
 }
 return {W,H,BG,COUNT,PITCH,ANGLE_LIMIT,PITCH_TOLERANCE,slots,defaults,generate,analyze};
});
