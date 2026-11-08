/* 一条线的灰度采样和相邻样本差分；所有坐标均为工作图像像素。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionProfileModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function sample(gray,w,h,line,options={}){
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>1200000||!gray||gray.length!==w*h||!line)return null;
  const coords=[line.x1,line.y1,line.x2,line.y2],threshold=Number(options.threshold),direction=options.direction;
  if(!coords.every(Number.isInteger)||line.x1<0||line.x1>=w||line.x2<0||line.x2>=w||line.y1<0||line.y1>=h||line.y2<0||line.y2>=h||!Number.isInteger(threshold)||threshold<1||threshold>255||!['both','rising','falling'].includes(direction))return null;
  const dx=line.x2-line.x1,dy=line.y2-line.y1,steps=Math.max(Math.abs(dx),Math.abs(dy)),length=Math.hypot(dx,dy);
  if(!steps)return null;
  const values=[];
  for(let i=0;i<=steps;i++){const x=Math.round(line.x1+dx*i/steps),y=Math.round(line.y1+dy*i/steps);values.push(gray[y*w+x])}
  const edges=[];let peak=null;
  function flush(){if(!peak)return;const t=(peak.index-.5)/steps;edges.push({distance:length*t,x:line.x1+dx*t,y:line.y1+dy*t,delta:peak.delta});peak=null}
  for(let i=1;i<values.length;i++){
   const delta=values[i]-values[i-1],hit=Math.abs(delta)>=threshold&&(direction==='both'||(direction==='rising'?delta>0:delta<0));
   if(!hit){flush();continue}if(peak&&Math.sign(peak.delta)!==Math.sign(delta))flush();if(!peak||Math.abs(delta)>Math.abs(peak.delta))peak={index:i,delta};
  }
  flush();return{values,edges,length,steps,line:{...line},threshold,direction};
 }
 function measure(profile,first,second,scale){
  if(!profile||!Array.isArray(profile.edges)||!Number.isInteger(first)||!Number.isInteger(second)||first===second||first<0||second<0||first>=profile.edges.length||second>=profile.edges.length)return null;
  const pixels=Math.abs(profile.edges[first].distance-profile.edges[second].distance);
  const computed=Number.isFinite(scale)&&scale>0?pixels*scale:NaN;
  const mm=Number.isFinite(computed)?computed:null;
  return{pixels,mm};
 }
 return{sample,measure};
});
