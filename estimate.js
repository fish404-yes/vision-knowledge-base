(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionEstimate=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function sampling(fov,pixels,feature){if(![fov,pixels,feature].every(Number.isFinite)||fov<=0||!Number.isInteger(pixels)||pixels<1||feature<=0)return null;const spacing=fov/pixels,featurePx=feature/spacing;if(!Number.isFinite(spacing)||spacing<=0||!Number.isFinite(featurePx))return null;return{spacing,featurePx}}
function motion(speed,exposure){if(![speed,exposure].every(Number.isFinite)||speed<0||exposure<0)return null;const distance=speed*(exposure/1000);return Number.isFinite(distance)?distance:null}
// Pinhole approximation for an ordinary fixed-focus lens. Sensor dimensions are
// active dimensions of the assumed camera, not the nominal optical format.
const focalExamples=[2.8,3.5,4,5,6,8,12,16,25,35,50,75,100];
const pixelTiers=[1,1.3,2,3,5,8,12,16,20,25,45,65,100];
function selectImaging(o){
 if(!o||![o.width,o.height,o.margin,o.distance,o.sensorWidth,o.sensorHeight,o.feature,o.featurePixels].every(Number.isFinite))return null;
 if([o.width,o.height,o.distance,o.sensorWidth,o.sensorHeight,o.feature,o.featurePixels].some(n=>n<=0)||o.margin<0||o.margin>200)return null;
 const neededWidth=o.width*(1+o.margin/100),neededHeight=o.height*(1+o.margin/100);
 const focalLimit=Math.min(o.distance*o.sensorWidth/neededWidth,o.distance*o.sensorHeight/neededHeight);
 if(![neededWidth,neededHeight,focalLimit].every(n=>Number.isFinite(n)&&n>0))return null;
 const focal=focalExamples.filter(n=>n<=focalLimit*(1+1e-12)).at(-1)??null;
 if(focal===null)return{neededWidth,neededHeight,focalLimit,focal:null};
 const actualWidth=o.distance*o.sensorWidth/focal,actualHeight=o.distance*o.sensorHeight/focal;
 const pixelsWidth=Math.ceil(actualWidth*o.featurePixels/o.feature),pixelsHeight=Math.ceil(actualHeight*o.featurePixels/o.feature);
 if(![actualWidth,actualHeight].every(n=>Number.isFinite(n)&&n>0)||![pixelsWidth,pixelsHeight].every(Number.isSafeInteger)||pixelsWidth<1||pixelsHeight<1)return null;
 const minMegapixels=pixelsWidth*pixelsHeight/1e6;
 if(!Number.isFinite(minMegapixels))return null;
 const megapixelTier=pixelTiers.find(n=>n>=minMegapixels)??null;
 return{neededWidth,neededHeight,focalLimit,focal,actualWidth,actualHeight,pixelsWidth,pixelsHeight,minMegapixels,megapixelTier,
  horizontalAngle:2*Math.atan(o.sensorWidth/(2*focal))*180/Math.PI,verticalAngle:2*Math.atan(o.sensorHeight/(2*focal))*180/Math.PI,
  magnification:focal/o.distance};
}
return{sampling,motion,selectImaging,focalExamples,pixelTiers};
});
