/* ROI 整数坐标和合成一维灰度；找边复用图像实验区的相邻样本差分。 */
(function(root,factory){let profile=root&&root.VisionProfileModel;if(typeof module==='object'&&module.exports)profile=require('./profile-model.js');const api=factory(profile);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Vision2DBasics=api})(typeof globalThis!=='undefined'?globalThis:this,function(profile){
 'use strict';
 const image=Object.freeze({width:16,height:12});
 function roi(state){
  if(!state||![state.x,state.y,state.width,state.height,state.u,state.v].every(Number.isInteger))return null;
  const {x,y,width,height,u,v}=state;
  if(x<0||y<0||width<1||height<1||x+width>image.width||y+height>image.height||u<0||u>=image.width||v<0||v>=image.height)return null;
  const inside=u>=x&&u<x+width&&v>=y&&v<y+height;
  return {inside,local:inside?{u:u-x,v:v-y}:null,pixels:width*height,total:image.width*image.height,percent:width*height/(image.width*image.height)*100};
 }
 function resizeRoi(state,percent,mode){
  const region=roi(state);
  if(!region||!Number.isFinite(percent)||percent<50||percent>300||!['origin','half-pixel'].includes(mode))return null;
  const width=Math.max(1,Math.round(state.width*percent/100)),height=Math.max(1,Math.round(state.height*percent/100));
  const sx=width/state.width,sy=height/state.height;
  if(!region.inside)return {region,width,height,sx,sy,point:null};
  const forward=(n,s)=>mode==='origin'?n*s:(n+.5)*s-.5;
  const inverse=(n,s)=>mode==='origin'?n/s:(n+.5)/s-.5;
  const scaled={u:forward(region.local.u,sx),v:forward(region.local.v,sy)};
  const local={u:inverse(scaled.u,sx),v:inverse(scaled.v,sy)};
  const original={u:local.u+state.x,v:local.v+state.y};
  const wrong={u:scaled.u+state.x,v:scaled.v+state.y};
  return {region,width,height,sx,sy,point:{scaled,local,original,wrong}};
 }
 function calibrationChain(state,percent,mode,detected){
  if(typeof detected!=='boolean')return null;
  const resize=resizeRoi(state,percent,mode);
  if(!resize)return null;
  if(!resize.region.inside||!detected)return {status:resize.region.inside?'not-found':'outside',resize:{...resize,point:null},physical:null,wrongPhysical:null,error:null};
  const map=p=>({x:100+.5*p.u,y:200-.5*p.v});
  const physical=map(resize.point.original),wrongPhysical=map(resize.point.wrong);
  const error={x:wrongPhysical.x-physical.x,y:wrongPhysical.y-physical.y};
  return {status:'ok',resize,physical,wrongPhysical,error};
 }
 function edge(state){
  if(!state||!Number.isInteger(state.contrast)||state.contrast<0||state.contrast>200||!Number.isInteger(state.threshold)||state.threshold<1||state.threshold>255||!['both','rising','falling'].includes(state.direction)||typeof state.reverse!=='boolean'||typeof state.noise!=='boolean')return null;
  const gray=Uint8Array.from({length:32},(_,x)=>x>=9&&x<=22?40+state.contrast:x===26&&state.noise?150:40);
  const line=state.reverse?{x1:31,y1:0,x2:0,y2:0}:{x1:0,y1:0,x2:31,y2:0};
  const result=profile.sample(gray,32,1,line,{threshold:state.threshold,direction:state.direction});
  return {gray,result};
 }
 return {image,roi,resizeRoi,calibrationChain,edge};
});
