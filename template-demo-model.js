/* 合成图像的旋转模板匹配：有限角度、有限搜索区、去均值归一化相关。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionTemplateDemo=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const W=112,H=76,S=21,C=10,R=8,OFFSET=[];
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)if(dx*dx+dy*dy<=R*R)OFFSET.push({dx,dy});
 function template(kind='A'){
  const pixels=new Uint8Array(S*S);pixels.fill(48);
  for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++){
   let v=48;
   if(kind==='B'){if((x>=-1&&x<=1&&y>=-7&&y<=7)||(y>=-1&&y<=1&&x>=-7&&x<=7))v=220;if(x>=4&&x<=6&&y>=-6&&y<=-4)v=155}
   else{if((x>=-6&&x<=-3&&y>=-6&&y<=6)||(x>=-6&&x<=5&&y>=-6&&y<=-3))v=220;if(x>=-6&&x<=3&&y>=-1&&y<=1)v=165;if(x>=4&&x<=6&&y>=4&&y<=6)v=135}
   pixels[(y+C)*S+x+C]=v;
  }
  return pixels;
 }
 const BASE={A:template('A'),B:template('B')};
 function at(pixels,x,y){
  if(x<0||y<0||x>S-1||y>S-1)return 48;
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(S-1,x0+1),y1=Math.min(S-1,y0+1),tx=x-x0,ty=y-y0;
  return pixels[y0*S+x0]*(1-tx)*(1-ty)+pixels[y0*S+x1]*tx*(1-ty)+pixels[y1*S+x0]*(1-tx)*ty+pixels[y1*S+x1]*tx*ty;
 }
 function rotated(dx,dy,degrees,kind='A'){
  const t=degrees*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
  return at(BASE[kind],C+c*dx+s*dy,C-s*dx+c*dy);
 }
 function scene(opt={}){
  const x=Number(opt.x),y=Number(opt.y),angle=Number(opt.angle),occlusion=Number(opt.occlusion);
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<R||x>=W-R||y<R||y>=H-R||!Number.isFinite(angle)||!Number.isFinite(occlusion)||occlusion<0||occlusion>100)return null;
  const gray=new Uint8Array(W*H);
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
   const dx=px-x,dy=py-y;let v=48+((px*13+py*7)%5-2);
   if(dx*dx+dy*dy<=R*R){v=rotated(dx,dy,angle);if(occlusion>0&&dx>R-2*R*occlusion/100)v=48}
   gray[py*W+px]=Math.max(0,Math.min(255,Math.round(v)));
  }
  return{w:W,h:H,gray,truth:{x,y,angle,occlusion}};
 }
 function roi(name){return name==='center'?{left:35,top:22,right:76,bottom:54}:name==='all'?{left:R,top:R,right:W-R-1,bottom:H-R-1}:null}
 function model(degrees,kind){
  const vals=OFFSET.map(o=>rotated(o.dx,o.dy,degrees,kind)),n=vals.length,mean=vals.reduce((a,b)=>a+b,0)/n;
  const centered=vals.map(v=>v-mean),variance=centered.reduce((a,v)=>a+v*v,0);
  return{degrees,centered,variance};
 }
 const MODELS={A:Array.from({length:11},(_,i)=>model((i-5)*10,'A')),B:Array.from({length:11},(_,i)=>model((i-5)*10,'B'))};
 function match(image,roiName,angleLimit,threshold,kind='A') {
  const box=roi(roiName),limit=Number(angleLimit),cut=Number(threshold);
  if(!image||image.w!==W||image.h!==H||!image.gray||image.gray.length!==W*H||!box||!MODELS[kind]||![0,20,50].includes(limit)||!Number.isFinite(cut)||cut<0||cut>1)return null;
  const n=OFFSET.length,offsets=OFFSET.map(o=>o.dy*W+o.dx);let best=null;
  for(const m of MODELS[kind]){
   if(Math.abs(m.degrees)>limit)continue;
   for(let y=box.top;y<=box.bottom;y++)for(let x=box.left;x<=box.right;x++){
    const base=y*W+x;let sum=0,sq=0,cross=0;
    for(let i=0;i<n;i++){const v=image.gray[base+offsets[i]];sum+=v;sq+=v*v;cross+=m.centered[i]*v}
    const ivar=sq-sum*sum/n;if(ivar<=1e-8||m.variance<=1e-8)continue;
    const score=Math.max(-1,Math.min(1,cross/Math.sqrt(m.variance*ivar)));
    if(!best||score>best.score)best={x,y,angle:m.degrees,score};
   }
  }
  const accepted=!!best&&best.score>=cut;
  return{best,accepted,box,threshold:cut,angleLimit:limit,truthInside:!!image.truth&&image.truth.x>=box.left&&image.truth.x<=box.right&&image.truth.y>=box.top&&image.truth.y<=box.bottom};
 }
 function physical(result){
  if(!result||!result.accepted||!result.best)return null;
  const p=result.best;
  return{x:100+.2*p.x,y:200-.2*p.y,angle:-p.angle};
 }
 return{W,H,S,R,template,scene,roi,match,physical};
});
