/* 合成点云的 Z 向普通最小二乘平面及平均法向高度；不模拟设备或 RANSAC。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionPlaneFitModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const defaults=Object.freeze({noise:0,reference:'all',target:'all',contamination:false});
 const truth=Object.freeze({a:.12,b:.06,c:50});
 const refModes=['all','left','line','none'],targetModes=['all','high','none'];
 const planeZ=(x,y)=>truth.a*x+truth.b*y+truth.c;
 const signal=(x,y)=>.65*Math.sin((x+41)*.11+(y+31)*.17)+.35*Math.cos((x-2*y)*.09);
 function fitPlane(points){
  if(!Array.isArray(points)||points.length<3||!points.every(p=>p&&[p.x,p.y,p.z].every(Number.isFinite)))return null;
  const n=points.length,avg=k=>points.reduce((v,p)=>v+p[k],0)/n;
  const mx=avg('x'),my=avg('y'),mz=avg('z');
  let xx=0,yy=0,xy=0,xz=0,yz=0;
  for(const p of points){const x=p.x-mx,y=p.y-my,z=p.z-mz;xx+=x*x;yy+=y*y;xy+=x*y;xz+=x*z;yz+=y*z}
  const det=xx*yy-xy*xy;
  if(xx<=0||yy<=0||det<=1e-12*xx*yy)return null;
  const a=(xz*yy-yz*xy)/det,b=(yz*xx-xz*xy)/det,c=mz-a*mx-b*my;
  const norm=Math.sqrt(1+a*a+b*b);
  const rms=Math.sqrt(points.reduce((v,p)=>v+((p.z-a*p.x-b*p.y-c)/norm)**2,0)/n);
  return {a,b,c,rms,count:n};
 }
 function evaluate(input){
  const {noise,reference,target,contamination}=input||{};
  if(!Number.isFinite(noise)||noise<0||noise>2||!refModes.includes(reference)||!targetModes.includes(target)||typeof contamination!=='boolean')
   throw new RangeError('无效的点云实验参数');
  const points=[],normal=Math.sqrt(1+truth.a**2+truth.b**2);
  for(let y=-30;y<=30;y+=10)for(let x=-40;x<=40;x+=10){
   const isTarget=x>=10&&x<=30&&y>=0&&y<=20;
   const idealHeight=isTarget?8+(x-20)/10:0;
   const idealZ=planeZ(x,y)+idealHeight*normal;
   const valid=isTarget?(target==='all'||(target==='high'&&x>=20)):(reference==='all'||(reference==='left'&&x<=0)||(reference==='line'&&x===-40));
   points.push({x,y,kind:isTarget?'target':'reference',valid,
    z:valid?idealZ+noise*signal(x,y):null,idealZ,idealHeight});
  }
  const refs=points.filter(p=>p.kind==='reference'&&p.valid),targets=points.filter(p=>p.kind==='target'&&p.valid);
  const refInput=contamination?[...refs,...targets]:refs;
  const fit=fitPlane(refInput);
  const mean=fit&&targets.length?targets.reduce((sum,p)=>sum+(p.z-fit.a*p.x-fit.b*p.y-fit.c)/Math.sqrt(1+fit.a**2+fit.b**2),0)/targets.length:null;
  const targetIdeal=points.filter(p=>p.kind==='target'),truthMean=targetIdeal.reduce((sum,p)=>sum+p.idealHeight,0)/targetIdeal.length;
  const bounds=refs.length?{minX:Math.min(...refs.map(p=>p.x)),maxX:Math.max(...refs.map(p=>p.x)),minY:Math.min(...refs.map(p=>p.y)),maxY:Math.max(...refs.map(p=>p.y))}:null;
  const extrapolates=!!(bounds&&targets.some(p=>p.x<bounds.minX||p.x>bounds.maxX||p.y<bounds.minY||p.y>bounds.maxY));
  return {points,refs,targets,fit,refInputCount:refInput.length,truthMean,mean,error:mean===null?null:mean-truthMean,extrapolates};
 }
 return {defaults,truth,fitPlane,evaluate};
});
