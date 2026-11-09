/* 理想矩形的连续几何：不执行轮廓拟合或像素栅格化。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VisionBoundingBoxModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const defaults={length:160,width:40,angle:0,threshold:2.5};
 function compute(input){
  const {length,width,angle,threshold}=input||{};
  if(![length,width,angle,threshold].every(Number.isFinite)||length<=0||width<=0||width>length||Math.abs(angle)>180||threshold<=0)
   throw new RangeError('需要长边 ≥ 短边 > 0、角度在 ±180° 内且门槛大于 0');
  const radians=angle*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
  const axisWidth=length*Math.abs(c)+width*Math.abs(s);
  const axisHeight=length*Math.abs(s)+width*Math.abs(c);
  const axisRatio=Math.max(axisWidth,axisHeight)/Math.min(axisWidth,axisHeight);
  const rotatedRatio=length/width;
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>({
   x:(a*length*c-b*width*s)/2,
   y:(a*length*s+b*width*c)/2
  }));
  return {axisWidth,axisHeight,axisHeightWidth:axisHeight/axisWidth,
   axisRatio,rotatedRatio,axisPass:axisRatio>=threshold,rotatedPass:rotatedRatio>=threshold,
   orientation:Math.abs(length-width)<1e-9?null:angle,corners};
 }
 return {defaults,compute};
});
