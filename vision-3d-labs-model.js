/* 教学用合成数据：轮廓采样/位置重建，以及点到已知平面的距离。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Vision3DLabsModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const scanDefaults=Object.freeze({mode:'time',speed:40,position:50});
 const planeDefaults=Object.freeze({angle:10,offset:50,x:0,height:12,valid:true});
 const SCAN_LENGTH=100,LINE_RATE=20,NOMINAL_SPEED=40,ENCODER_STEP=2;
 function scan(input){
  const {mode,speed,position}=input||{};
  if(!['time','encoder'].includes(mode)||![speed,position].every(Number.isFinite)||speed<20||speed>80||position<0||position>100)
   throw new RangeError('无效的扫描参数');
  const actualStep=mode==='time'?speed/LINE_RATE:ENCODER_STEP;
  const outputStep=mode==='time'?NOMINAL_SPEED/LINE_RATE:ENCODER_STEP;
  const count=Math.floor(SCAN_LENGTH/actualStep+1e-10)+1;
  const rows=Array.from({length:count},(_,i)=>({
   index:i,actual:i*actualStep,output:i*outputStep,
   raised:i*actualStep>=30-1e-9&&i*actualStep<=70+1e-9
  }));
  const selected=rows[Math.min(count-1,Math.max(0,Math.round(position/actualStep)))];
  const featureRows=rows.filter(row=>row.raised);
  const feature=featureRows.length?{
   actualFrom:featureRows[0].actual,actualTo:featureRows[featureRows.length-1].actual,
   outputFrom:featureRows[0].output,outputTo:featureRows[featureRows.length-1].output
  }:null;
  return {actualStep,outputStep,count,rows,selected,feature,
   requiredRate:mode==='encoder'?speed/ENCODER_STEP:LINE_RATE,
   actualEnd:rows[count-1].actual,outputEnd:rows[count-1].output};
 }
 function plane(input){
  const {angle,offset,x,height,valid}=input||{};
  if(![angle,offset,x,height].every(Number.isFinite)||Math.abs(angle)>15||offset<30||offset>70||Math.abs(x)>40||height<2||height>20||typeof valid!=='boolean')
   throw new RangeError('无效的基准面参数');
  const rad=angle*Math.PI/180,a=Math.tan(rad);
  const foot={x,z:a*x+offset};
  const idealPoint={x:x-height*Math.sin(rad),z:foot.z+height*Math.cos(rad)};
  const planeAtPoint=a*idealPoint.x+offset;
  const vertical=idealPoint.z-planeAtPoint;
  const signed=vertical/Math.sqrt(1+a*a);
  return {a,offset,foot,idealPoint,planeAtPoint,vertical:valid?vertical:null,height:valid?signed:null,point:valid?idealPoint:null};
 }
 return {scanDefaults,planeDefaults,SCAN_LENGTH,LINE_RATE,NOMINAL_SPEED,ENCODER_STEP,scan,plane};
});
