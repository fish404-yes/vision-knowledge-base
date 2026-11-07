/* 二维项目的纯计算：所有位姿相对于统一的基坐标，列向量约定。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionProjectsModel=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const rad=d=>d*Math.PI/180;
const wrap=d=>((d+180)%360+360)%360-180;
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
function rotate(p,degrees){const t=rad(degrees),c=Math.cos(t),s=Math.sin(t);return {x:c*p.x-s*p.y,y:s*p.x+c*p.y}}
function pair(a,b){const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);return{center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},angle:dist<1e-8?null:Math.atan2(dy,dx)*180/Math.PI,distance:dist}}
function product(dx,dy,angle){const center={x:320+dx,y:230+dy},v=rotate({x:150,y:0},angle);return{center,p1:sub(center,v),p2:add(center,v),r:angle}}
const cams=[{x:170,y:230,sign:1},{x:470,y:230,sign:1}];
function camera(index,mirrored){let c=cams[index];if(!c)return null;return{x:c.x,y:c.y,sign:index===1&&mirrored?-1:1}}
function observe(p,c){const u=320+c.sign*2*(p.x-c.x),v=240-2*(p.y-c.y);return{u,v,valid:u>=0&&u<640&&v>=0&&v<480}}
function map(img,c){return{x:c.x+c.sign*(img.u-320)/2,y:c.y-(img.v-240)/2}}
function twoMark(dx,dy,angle,mirrored){
 const baseline=product(0,0,0),actual=product(dx,dy,angle),c1=camera(0,mirrored),c2=camera(1,mirrored),i1=observe(actual.p1,c1),i2=observe(actual.p2,c2),p1=map(i1,c1),p2=map(i2,c2),bp=pair(baseline.p1,baseline.p2),ap=pair(p1,p2);const valid=i1.valid&&i2.valid&&ap.angle!==null;
 return{baseline,actual,c1,c2,i1,i2,p1,p2,bp,ap,valid,delta:valid?wrap(ap.angle-bp.angle):null};
}
function robotGoal(baselineCenter,actualCenter,delta,taught){const vector=rotate(sub(taught,baselineCenter),delta);return{x:actualCenter.x+vector.x,y:actualCenter.y+vector.y,r:wrap(taught.r+delta),vector}}
function placement(s){
 const incoming={x:155+s.inX,y:120,r:s.inR};
 const held={x:s.holdX,y:s.holdY,r:s.holdR};
 const shot={x:330,y:155,r:0};
 const heldPoint=add(shot,rotate(held,shot.r));const heldBase={...heldPoint,r:wrap(shot.r+held.r)};
 const tray={x:530+s.trayX,y:205+s.trayY,r:s.trayR};
 const toolR=wrap(tray.r-held.r),offset=rotate(held,toolR),tool={x:tray.x-offset.x,y:tray.y-offset.y,r:toolR};
 return{incoming,held,shot,heldBase,tray,tool,offset};
}
function measure(left,right,umPerPixel){if(![left,right,umPerPixel].every(Number.isFinite)||right<=left||umPerPixel<=0)return null;let px=right-left,scale=umPerPixel/1000,width=px*scale;return{left,right,px,scale,width,reference:30,tolerance:1,within:Math.abs(width-30)<=1+1e-10}}
return{rotate,pair,product,camera,observe,map,twoMark,robotGoal,placement,measure,wrap};
});
