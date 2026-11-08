/* 简单合成场景：针孔射线求最近表面，光轴深度反投影为相机坐标点。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionDepthCloudModel=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const camera=Object.freeze({width:128,height:96,fx:125,fy:125,cx:63.5,cy:47.5});
 const floor=Object.freeze({minX:-125,maxX:125,minY:-85,maxY:85});
 const object=Object.freeze({min:[-42,-30,0],max:[42,30,55]});
 const shield=Object.freeze({min:[-65,-60,0],max:[65,-50,115]});
 function basis(distance,angle){
  if(!Number.isFinite(distance)||distance<250||distance>900||!Number.isFinite(angle)||angle<0||angle>40)return null;
  const t=angle*Math.PI/180,s=Math.sin(t),c=Math.cos(t);
  return {origin:[0,-distance*s,distance*c],right:[1,0,0],down:[0,-c,-s],forward:[0,s,-c]};
 }
 function backProject(u,v,z,k=camera){
  if(!k||![u,v,z,k.fx,k.fy,k.cx,k.cy].every(Number.isFinite)||z<=0||k.fx<=0||k.fy<=0)return null;
  return {x:(u-k.cx)*z/k.fx,y:(v-k.cy)*z/k.fy,z};
 }
 function rayBox(origin,direction,box){
  let near=0,far=Infinity;
  for(let i=0;i<3;i++){
   if(Math.abs(direction[i])<1e-12){if(origin[i]<box.min[i]||origin[i]>box.max[i])return null;continue;}
   let a=(box.min[i]-origin[i])/direction[i],b=(box.max[i]-origin[i])/direction[i];if(a>b)[a,b]=[b,a];
   near=Math.max(near,a);far=Math.min(far,b);if(near>far)return null;
  }
  return near>0?near:(far>0?far:null);
 }
 function floorHit(origin,direction){
  if(direction[2]>=-1e-12)return null;
  const t=-origin[2]/direction[2],x=origin[0]+t*direction[0],y=origin[1]+t*direction[1];
  return t>0&&x>=floor.minX&&x<=floor.maxX&&y>=floor.minY&&y<=floor.maxY?t:null;
 }
 function scene(input){
  if(!input||!Number.isFinite(input.missing)||input.missing<0||input.missing>100||typeof input.occluder!=='boolean')return null;
  const pose=basis(input.distance,input.angle);if(!pose)return null;
  const {width,height,fx,fy,cx,cy}=camera,n=width*height,depth=new Float64Array(n),kind=new Uint8Array(n),points=[];
  depth.fill(NaN);
  const stats={productWithoutShield:0,productVisible:0,productOccluded:0,productMissing:0,valid:0,background:0,shieldPixels:0};
  for(let v=0;v<height;v++)for(let u=0;u<width;u++){
   const ax=(u-cx)/fx,ay=(v-cy)/fy;
   const direction=pose.forward.map((f,i)=>f+ax*pose.right[i]+ay*pose.down[i]);
   const o=pose.origin,tFloor=floorHit(o,direction),tObject=rayBox(o,direction,object),tShield=input.occluder?rayBox(o,direction,shield):null;
   let prior=Infinity,priorKind=0;
   if(tFloor!==null&&tFloor<prior){prior=tFloor;priorKind=1;}
   if(tObject!==null&&tObject<prior){prior=tObject;priorKind=2;}
   if(priorKind===2)stats.productWithoutShield++;
   let z=prior,id=priorKind;
   if(tShield!==null&&tShield<z){if(priorKind===2)stats.productOccluded++;z=tShield;id=3;}
   const index=v*width+u;
   if(id===0){stats.background++;continue;}
   if(id===2){
    stats.productVisible++;
    const hash=(Math.imul(u+1,73856093)^Math.imul(v+1,19349663))>>>0;
    if(hash%100<input.missing){kind[index]=4;stats.productMissing++;continue;}
   }
   if(id===3)stats.shieldPixels++;
   kind[index]=id;depth[index]=z;stats.valid++;const p=backProject(u,v,z);points.push({...p,u,v,kind:id});
  }
  return {camera,pose,depth,kind,points,stats};
 }
 return {camera,floor,object,shield,basis,backProject,rayBox,scene};
});
