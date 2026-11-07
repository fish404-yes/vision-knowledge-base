/* 理想平面示意模型，不能直接替代相机标定或机器人控制器计算。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VisionSpatialModels=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rotate=(p,degrees)=>{const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:c*p.x-s*p.y,y:s*p.x+c*p.y}};
 const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
 const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
 function heightEffect(height,baseDistance=500,objectWidth=40,referenceScale=2){
  if(![height,baseDistance,objectWidth,referenceScale].every(Number.isFinite)||baseDistance<=0||objectWidth<=0||referenceScale<=0||baseDistance-height<=0)return null;
  const distance=baseDistance-height,referencePx=objectWidth*referenceScale;
  const ordinaryPx=referencePx*baseDistance/distance;
  return {height,distance,objectWidth,referencePx,ordinaryPx,telecentricPx:referencePx,apparentWidth:ordinaryPx/referenceScale,error:ordinaryPx/referenceScale-objectWidth};
 }
 const target={x:420,y:250},offset={x:60,y:20},pose1={x:300,y:210,r:0};
 function capture(pose,point=target){
  if(!pose||!point||![pose.x,pose.y,pose.r,point.x,point.y].every(Number.isFinite))return null;
  const camera=add(pose,rotate(offset,pose.r));
  const relative=rotate(sub(point,camera),-pose.r);
  const u=320+relative.x*2,v=240-relative.y*2;
  const visible=u>=0&&u<640&&v>=0&&v<480;
  return {pose:{...pose},camera,relative,u,v,visible,base:visible?add(camera,rotate(relative,pose.r)):null};
 }
 function paired(pose2){
  const first=capture(pose1),second=capture(pose2);if(!second)return null;
  const wrong=second.visible?add(first.camera,rotate(second.relative,first.pose.r)):null;
  return {target:{...target},offset:{...offset},first,second,wrong,error:wrong?Math.hypot(wrong.x-target.x,wrong.y-target.y):null};
 }
 return {heightEffect,capture,paired,rotate};
});
