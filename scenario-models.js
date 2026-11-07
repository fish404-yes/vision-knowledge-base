/* 场景试选使用的规则和合成数据；不是实际设备或真实图像。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VisionScenarioModels=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const materials=['matte','flat-metal','curved-metal','transparent'];
 const tasks=['outline','scratch','text','presence'];
 function lighting(material,task){
  if(!materials.includes(material)||!tasks.includes(task))return null;
  const transparent=material==='transparent',curved=material==='curved-metal',flat=material==='flat-metal';
  if(task==='outline')return {
   first:'back',second:transparent?'bar':'ring',
   why:transparent?'先试背光观察透光边缘，再与侧光比较，检查轮廓是否有足够对比。':'背后照明可让不透光工件的外轮廓形成反差，孔位和边缘也便于观察。',
   check:transparent?'透明件可能因透光、折射而边缘对比不足；应比较侧光并用实物验证。':'确认工件背面有安装空间，并检查背光覆盖、边缘和位置变化。'
  };
  if(task==='scratch')return {
   first:'dark',second:curved?'dome':'bar',
   why:'低角度或侧向照明可尝试增强表面凸起、刻痕的散射差异。',
   check:transparent?'透明表面和内部缺陷响应不同，需比较角度、波长与背景。':'缺陷方向和表面纹理影响效果；穹顶漫射可能抑制高光，也可能让细微纹理变弱。'
  };
  if(task==='text')return {
   first:flat?'coax':curved?'dome':'ring',second:transparent?'bar':flat?'dome':'bar',
   why:flat?'对平整反光表面，可先尝试同轴照明。':curved?'曲面反光可先尝试漫射照明，比较字符与背景。':'从均匀正面光或侧光开始，观察字符与背景的对比。',
   check:'字符材质、颜色、印刷方式和光源波长都会改变对比度；应对样件实际试光。'
  };
  return {
   first:transparent?'dome':'ring',second:transparent?'bar':'back',
   why:transparent?'透明件可先比较漫射与侧光，寻找稳定的边缘或反射特征。':'正面环形光可作为有无或位置确认的一个试光起点。',
   check:transparent?'反光、透光和背景共同影响结果，有时背光更适合特定轮廓。':'如果只需确认轮廓且背面可布光，也可比较背光。'
  };
 }
 function defect(gray,threshold,minPixels){
  if(!Number.isInteger(gray)||gray<0||gray>255||!Number.isInteger(threshold)||threshold<0||threshold>255||!Number.isInteger(minPixels)||minPixels<1||minPixels>30)return null;
  const patch=gray<=threshold?4:0,background=200<=threshold?26:0,total=patch+background;
  return {patch,background,total,result:total>=minPixels?'NG':'OK'};
 }
 function code(read,actualDigit,expectedDigit){
  if((read!==0&&read!==1)||!Number.isInteger(actualDigit)||actualDigit<0||actualDigit>9||!Number.isInteger(expectedDigit)||expectedDigit<0||expectedDigit>9)return null;
  if(!read)return {text:null,result:'未判定'};
  return {text:`PART-100${actualDigit}`,result:actualDigit===expectedDigit?'OK':'NG'};
 }
 return {lighting,defect,code};
});
