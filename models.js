(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionModels=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const rad=d=>d*Math.PI/180;
const wrap=d=>((d+180)%360+360)%360-180;
function rotate(p,a){const t=rad(a),c=Math.cos(t),s=Math.sin(t);return{x:p.x*c-p.y*s,y:p.x*s+p.y*c}}
function pair(p1,p2){const dx=p2.x-p1.x,dy=p2.y-p1.y,d=Math.hypot(dx,dy);return{x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2,distance:d,angle:d<1e-9?null:Math.atan2(dy,dx)*180/Math.PI}}
function mark(dx,dy,angle,swapped,coincident){const center={x:150+dx,y:100+dy},v=rotate({x:50,y:0},angle);let p1={x:center.x-v.x,y:center.y-v.y},p2={x:center.x+v.x,y:center.y+v.y};if(coincident)p2={...p1};if(swapped)[p1,p2]=[p2,p1];const p=pair(p1,p2);return{p1,p2,center:p,offset:p.angle===null?null:wrap(p.angle)}}
function stereo(baseline,distance,focalPx){if(![baseline,distance,focalPx].every(Number.isFinite)||baseline<=0||distance<=0||focalPx<=0)return null;const disparity=baseline*focalPx/distance;return Number.isFinite(disparity)?disparity:null}
function threshold(values,t){if(!Array.isArray(values)||!Number.isFinite(t))return null;return values.map(v=>v>t?255:0)}
function toolTarget(goal,held){const a=wrap(goal.r-held.r),p=rotate({x:held.x,y:held.y},a);return{x:goal.x-p.x,y:goal.y-p.y,r:a}}
function profile(x,height){return height*Math.exp(-(x*x)/(2*22*22))}
// A positive focal length and object distance define an ideal converging lens.
// Image distance is signed: positive for a real image, negative for a virtual image.
function thinLens(u,f){
 if(![u,f].every(Number.isFinite)||u<=0||f<=0)return null;
 if(u===f)return{kind:'focus',imageDistance:null,signedMagnification:null,magnitude:null};
 const v=f/(1-f/u),signed=-v/u;
 if(!Number.isFinite(v)||!Number.isFinite(signed))return null;
 return{kind:v>0?'real':'virtual',imageDistance:v,signedMagnification:signed,magnitude:Math.abs(signed)};
}
return{rotate,pair,mark,wrap,stereo,threshold,toolTarget,profile,thinLens};
});
