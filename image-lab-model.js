/* 浏览器本地图像计算：灰度、阈值、ROI、二值形态学与连通域。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionImageLabModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_PIXELS=1200000;
 function validSize(w,h){return Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&w*h<=MAX_PIXELS}
 function grayFromRGBA(rgba,w,h){
  if(!validSize(w,h)||!rgba||rgba.length!==w*h*4)return null;
  const gray=new Uint8Array(w*h);
  for(let i=0;i<gray.length;i++){const k=i*4,a=rgba[k+3]/255;gray[i]=Math.round((.299*rgba[k]+.587*rgba[k+1]+.114*rgba[k+2])*a+255*(1-a))}
  return gray;
 }
 function normalizeRoi(w,h,roi){
  if(!validSize(w,h))return null;if(!roi)return{x:0,y:0,w,h};
  if(![roi.x,roi.y,roi.w,roi.h].every(Number.isFinite)||roi.w<=0||roi.h<=0)return null;
  const x=Math.max(0,Math.min(w,Math.floor(roi.x))),y=Math.max(0,Math.min(h,Math.floor(roi.y)));
  const right=Math.max(0,Math.min(w,Math.ceil(roi.x+roi.w))),bottom=Math.max(0,Math.min(h,Math.ceil(roi.y+roi.h)));
  return right>x&&bottom>y?{x,y,w:right-x,h:bottom-y}:null;
 }
 function morphology(mask,w,h,roi,operation,kernelSize){
  const r=normalizeRoi(w,h,roi),size=Number(kernelSize);
  if(!r||!mask||mask.length!==w*h||!['none','dilate','erode','open','close'].includes(operation)||!Number.isInteger(size)||size<1||size>51||size%2!==1)return null;
  function pass(input,dilate){
   const stride=r.w+1,integral=new Uint32Array((r.w+1)*(r.h+1)),output=new Uint8Array(w*h),radius=(size-1)/2;
   for(let y=0;y<r.h;y++){
    let row=0;for(let x=0;x<r.w;x++){row+=input[(r.y+y)*w+r.x+x]?1:0;integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row}
   }
   for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){
    const x0=Math.max(0,x-radius),x1=Math.min(r.w,x+radius+1),y0=Math.max(0,y-radius),y1=Math.min(r.h,y+radius+1);
    const count=integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0];
    output[(r.y+y)*w+r.x+x]=dilate?Number(count>0):Number(count===size*size);
   }
   return output;
  }
  if(operation==='none'){const output=new Uint8Array(w*h);for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)output[y*w+x]=mask[y*w+x]?1:0;return output}
  if(operation==='dilate')return pass(mask,true);
  if(operation==='erode')return pass(mask,false);
  if(operation==='open')return pass(pass(mask,false),true);
  return pass(pass(mask,true),false);
 }
 function analyze(gray,w,h,options={}){
  const roi=normalizeRoi(w,h,options.roi),threshold=Number(options.threshold),minArea=Number(options.minArea),connectivity=Number(options.connectivity||8);
  const operation=options.morphology===undefined?'none':options.morphology,kernelSize=options.kernelSize===undefined?3:Number(options.kernelSize);
  if(!roi||!gray||gray.length!==w*h||!Number.isInteger(threshold)||threshold<0||threshold>255||!Number.isInteger(minArea)||minArea<1||![4,8].includes(connectivity)||!['dark','bright'].includes(options.polarity)||!['none','dilate','erode','open','close'].includes(operation)||!Number.isInteger(kernelSize)||kernelSize<1||kernelSize>51||kernelSize%2!==1)return null;
  const hist=new Uint32Array(256),thresholdMask=new Uint8Array(w*h),visited=new Uint8Array(w*h),queue=new Uint32Array(roi.w*roi.h);let thresholdForeground=0;
  const x1=roi.x+roi.w,y1=roi.y+roi.h;
  for(let y=roi.y;y<y1;y++)for(let x=roi.x;x<x1;x++){
   const i=y*w+x,g=gray[i];hist[g]++;if(options.polarity==='dark'?g<=threshold:g>=threshold){thresholdMask[i]=1;thresholdForeground++}
  }
  const mask=operation==='none'?thresholdMask:morphology(thresholdMask,w,h,roi,operation,kernelSize);
  let foreground=thresholdForeground;
  if(operation!=='none'){foreground=0;for(let y=roi.y;y<y1;y++)for(let x=roi.x;x<x1;x++)foreground+=mask[y*w+x]}
  let allCount=0,acceptedCount=0;const top=[];
  for(let y=roi.y;y<y1;y++)for(let x=roi.x;x<x1;x++){
   const start=y*w+x;if(!mask[start]||visited[start])continue;allCount++;let head=0,tail=0,area=0,sumX=0,sumY=0,minX=x,maxX=x,minY=y,maxY=y;
   queue[tail++]=start;visited[start]=1;
   while(head<tail){
    const i=queue[head++],py=Math.floor(i/w),px=i-py*w;area++;sumX+=px;sumY+=py;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     if((dx===0&&dy===0)||(connectivity===4&&Math.abs(dx)+Math.abs(dy)!==1))continue;
     const nx=px+dx,ny=py+dy;if(nx<roi.x||nx>=x1||ny<roi.y||ny>=y1)continue;const ni=ny*w+nx;
     if(mask[ni]&&!visited[ni]){visited[ni]=1;queue[tail++]=ni}
    }
   }
   if(area<minArea)continue;acceptedCount++;const component={id:allCount,area,x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,cx:sumX/area,cy:sumY/area};
   if(top.length<20)top.push(component);else{let smallest=0;for(let k=1;k<top.length;k++)if(top[k].area<top[smallest].area)smallest=k;if(area>top[smallest].area)top[smallest]=component}
  }
  top.sort((a,b)=>b.area-a.area||a.id-b.id);
  return{roi,hist,mask,thresholdMask,foreground,thresholdForeground,allCount,acceptedCount,components:top,pixels:roi.w*roi.h,connectivity,morphology:operation,kernelSize};
 }
 function sample(){
  const w=480,h=320,gray=new Uint8Array(w*h);gray.fill(220);
  function disc(cx,cy,r,value){for(let y=Math.max(0,cy-r);y<=Math.min(h-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(w-1,cx+r);x++)if((x-cx)**2+(y-cy)**2<=r*r)gray[y*w+x]=value}
  function rect(x,y,rw,rh,value){for(let j=y;j<y+rh;j++)for(let i=x;i<x+rw;i++)gray[j*w+i]=value}
  disc(100,100,35,55);rect(205,65,72,60,85);disc(365,105,33,70);disc(365,105,11,220);rect(145,205,95,50,95);disc(330,235,4,40);
  return{w,h,gray};
 }
 return{MAX_PIXELS,validSize,grayFromRGBA,normalizeRoi,morphology,analyze,sample};
});
