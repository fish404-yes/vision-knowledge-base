(function(root){
 'use strict';
 const M=root.VisionImageLabModel;
 function mount(target){
  target.innerHTML=`<div class="wrap image-lab-page"><div class="page-head"><div class="eyebrow">IMAGE LAB</div><h1>图像实验区</h1><p>选择图片、框选 ROI，对照阈值、形态学与连通域。图片只在当前浏览器处理。</p></div>
  <section class="lab-shell"><div class="lab-top"><div><span class="tag">本地图像处理</span><h2>从图像到连通域</h2><p>内置样图是合成示例；也可以选择自己的 PNG、JPG 或 WebP 图片。</p></div><div class="lab-file-actions"><label class="lab-upload">选择本地图片<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="选择本地图片"></label><button type="button" data-sample>使用示例图</button><button type="button" data-jump-profile>跳到测量线找边 ↓</button></div></div>
   <p class="lab-message" role="status" aria-live="polite"></p>
   <div class="lab-images"><section class="lab-image-card"><div class="lab-image-head"><strong>A · 原图与 ROI</strong><span>拖拽框选区域</span></div><div class="lab-canvas-wrap"><canvas class="lab-source" tabindex="0" aria-label="原图，拖动鼠标选择 ROI；也可使用下方数值输入"></canvas></div><p>坐标原点在工作图像左上角，X 向右、Y 向下；也可用下方数值设置 ROI。</p></section>
   <section class="lab-image-card"><div class="lab-image-head"><strong>B · 阈值分割</strong><span>形态学处理前</span></div><div class="lab-canvas-wrap"><canvas class="lab-before" aria-label="阈值分割后的二值图，形态学处理前"></canvas></div><p>白色是选中的前景，黑色是 ROI 内背景，灰色为 ROI 外区域。</p></section>
   <section class="lab-image-card"><div class="lab-image-head"><strong>C · 形态学与 Blob</strong><span>形态学处理后</span></div><div class="lab-canvas-wrap"><canvas class="lab-mask" aria-label="形态学处理后的二值图和连通域结果"></canvas></div><p>黄框可标注通过面积筛选的前 20 个结果；后续统计使用本图。</p></section></div>
   <div class="lab-controls"><section class="lab-control-card"><h3>① 设置检测范围</h3><div class="lab-roi-fields"><label>X <input type="number" min="0" step="1" data-roi="x"></label><label>Y <input type="number" min="0" step="1" data-roi="y"></label><label>宽 <input type="number" min="1" step="1" data-roi="w"></label><label>高 <input type="number" min="1" step="1" data-roi="h"></label></div><div class="lab-roi-actions"><button type="button" data-apply-roi>应用 ROI</button><button type="button" data-reset-roi>整张图像</button></div><p class="lab-roi-note"></p></section>
   <section class="lab-control-card"><h3>② 分割与筛选</h3><label class="lab-slider"><span>灰度阈值 <output data-threshold-output></output></span><input type="range" min="0" max="255" value="120" aria-label="灰度阈值" data-threshold></label><div class="lab-selects"><label>前景规则<select data-polarity><option value="dark">灰度 ≤ 阈值（暗）</option><option value="bright">灰度 ≥ 阈值（亮）</option></select></label><label>连接方式<select data-connectivity><option value="8">8 邻域</option><option value="4">4 邻域</option></select></label><label>最小面积（px²）<input type="number" min="1" max="1200000" step="1" value="100" data-area></label></div></section></div>
   <section class="lab-control-card lab-morph"><div class="lab-morph-head"><div><span>③ MORPHOLOGY</span><h3>形态学：改变二值前景</h3><p>每次从阈值图独立处理白色前景，切换方式不会叠加；连通域使用处理后的结果。</p></div><button type="button" data-morph-clear>取消形态学</button></div><div class="lab-morph-grid"><label>处理方式<select data-morphology><option value="none">不处理</option><option value="dilate">膨胀：扩大前景</option><option value="erode">腐蚀：缩小前景</option><option value="open">开运算：先腐蚀、后膨胀</option><option value="close">闭运算：先膨胀、后腐蚀</option></select></label><label>方形核大小<select data-kernel><option value="3">3 × 3 px</option><option value="5">5 × 5 px</option><option value="9">9 × 9 px</option><option value="15">15 × 15 px</option><option value="25">25 × 25 px</option></select></label><div class="lab-morph-effect" data-morph-effect aria-live="polite"></div></div><div class="lab-morph-examples"><button type="button" data-morph-example="open">载入样图：开运算去小点</button><button type="button" data-morph-example="close">载入样图：闭运算填小孔</button></div><p>示例按钮会载入内置样图，并重置 ROI、阈值、前景规则和筛选参数。</p><label class="lab-morph-checkbox"><input type="checkbox" data-show-components checked> 显示 Blob 标注（仅影响显示）</label><p class="lab-morph-summary" aria-live="polite"></p><p>方形核以中心像素为锚点；ROI 外按背景处理，每一步结果限定在 ROI 内，边缘附近可能受影响。核大小使用工作图像像素。</p></section>
   <div class="lab-analysis"><section class="lab-control-card"><h3>④ ROI 原图灰度直方图</h3><canvas class="lab-hist" width="512" height="160" aria-label="ROI 原图灰度直方图，横轴为 0 至 255"></canvas><p class="lab-hist-summary"></p></section><section class="lab-control-card"><h3>⑤ 处理后的 Blob 统计</h3><div class="lab-stats" aria-live="polite"></div><div class="lab-table-wrap"></div></section></div>
   <div id="profile-root"></div><div class="lab-foot">计算按工作图像的像素进行，原图过大时会缩小；面积单位为工作图像 px²，不是物理面积。透明区域按白色处理；形态学可能改变或消除目标，图像效果和检测结果需用真实样件验证。参考：<a href="https://docs.opencv.org/4.13.0/d9/d61/tutorial_py_morphological_ops.html">OpenCV 形态学</a> · <a href="https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html">连通域</a>。</div>
  </section><div class="experience-links"><a class="btn secondary" href="#projects">查看 2D 项目 →</a><a class="btn secondary" href="#project/blob-regions">查看 Blob 分步案例 →</a></div></div>`;
  const source=target.querySelector('.lab-source'),before=target.querySelector('.lab-before'),mask=target.querySelector('.lab-mask'),histogram=target.querySelector('.lab-hist');
  const sourceCtx=source.getContext('2d'),beforeCtx=before.getContext('2d'),maskCtx=mask.getContext('2d'),histCtx=histogram.getContext('2d'),buffer=document.createElement('canvas'),bufferCtx=buffer.getContext('2d',{willReadFrequently:true});
  const file=target.querySelector('input[type=file]'),message=target.querySelector('.lab-message'),threshold=target.querySelector('[data-threshold]'),area=target.querySelector('[data-area]'),polarity=target.querySelector('[data-polarity]'),connectivity=target.querySelector('[data-connectivity]');
  const morphology=target.querySelector('[data-morphology]'),kernel=target.querySelector('[data-kernel]'),showComponents=target.querySelector('[data-show-components]');
  let image=null,roi=null,drag=null,pending=false,loadId=0;const profileLab=root.VisionProfileUI.mount(target.querySelector('#profile-root'));
  function status(text,isError=false){message.textContent=text;message.classList.toggle('lab-error',isError)}
  function syncRoi(){for(const key of ['x','y','w','h'])target.querySelector('[data-roi="'+key+'"]').value=roi[key];target.querySelector('.lab-roi-note').textContent=`ROI：(${roi.x}, ${roi.y})，${roi.w} × ${roi.h} px；范围按左上角起算。`}
  function setImage(gray,w,h,origin){
   image={gray,w,h,origin};roi={x:0,y:0,w,h};source.width=before.width=mask.width=w;source.height=before.height=mask.height=h;
   for(const canvas of [source,before,mask]){canvas.style.width='100%';canvas.style.maxWidth=(420*w/h)+'px'}
   syncRoi();status(origin);profileLab.setImage(gray,w,h,buffer);schedule();
  }
  function useSample(){
   loadId++;const s=M.sample();buffer.width=s.w;buffer.height=s.h;const pixels=bufferCtx.createImageData(s.w,s.h);
   for(let i=0;i<s.gray.length;i++){const k=i*4,g=s.gray[i];pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=g;pixels.data[k+3]=255}
   bufferCtx.putImageData(pixels,0,0);file.value='';setImage(s.gray,s.w,s.h,'当前：合成示例图，工作尺寸 '+s.w+' × '+s.h+' px。');
  }
  function redrawSource(preview=roi){
   if(!image)return;sourceCtx.clearRect(0,0,image.w,image.h);sourceCtx.drawImage(buffer,0,0);
   if(preview.x!==0||preview.y!==0||preview.w!==image.w||preview.h!==image.h){sourceCtx.fillStyle='rgba(4,20,27,.45)';sourceCtx.fillRect(0,0,image.w,image.h);sourceCtx.drawImage(buffer,preview.x,preview.y,preview.w,preview.h,preview.x,preview.y,preview.w,preview.h)}
   sourceCtx.strokeStyle='#ffd276';sourceCtx.lineWidth=Math.max(2,image.w/240);sourceCtx.setLineDash([8,5]);sourceCtx.strokeRect(preview.x+1,preview.y+1,Math.max(0,preview.w-2),Math.max(0,preview.h-2));sourceCtx.setLineDash([]);
  }
  function redrawMask(ctx,pixels,result,drawComponents){
   const out=ctx.createImageData(image.w,image.h),r=result.roi;
   for(let y=0;y<image.h;y++)for(let x=0;x<image.w;x++){const i=y*image.w+x,k=i*4,inside=x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h,v=inside?(pixels[i]?255:0):48;out.data[k]=out.data[k+1]=out.data[k+2]=v;out.data[k+3]=255}
   ctx.putImageData(out,0,0);if(!drawComponents)return;
   ctx.strokeStyle='#ffc75f';ctx.fillStyle='#ffc75f';ctx.lineWidth=Math.max(1.5,image.w/300);ctx.font=Math.max(10,image.w/38)+'px sans-serif';
   for(const c of result.components){ctx.strokeRect(c.x,c.y,c.w,c.h);ctx.fillText(String(c.id),c.x,Math.max(12,c.y-3));ctx.beginPath();ctx.arc(c.cx,c.cy,Math.max(2,image.w/220),0,Math.PI*2);ctx.fill()}
  }
  function redrawHist(result){
   const w=histogram.width,h=histogram.height,max=Math.max(1,...result.hist);histCtx.clearRect(0,0,w,h);histCtx.fillStyle='#102b31';histCtx.fillRect(0,0,w,h);
   histCtx.fillStyle='#79cdb3';for(let i=0;i<256;i++){const bh=(h-24)*result.hist[i]/max;histCtx.fillRect(i*2,h-18-bh,1.5,bh)}
   histCtx.strokeStyle='#f5b777';histCtx.beginPath();histCtx.moveTo(Number(threshold.value)*2,0);histCtx.lineTo(Number(threshold.value)*2,h-18);histCtx.stroke();histCtx.fillStyle='#bad4ca';histCtx.font='11px sans-serif';histCtx.fillText('0',4,h-4);histCtx.fillText('255',w-26,h-4);
   let sum=0,min=0,maxValue=255;for(let i=0;i<256;i++)sum+=i*result.hist[i];while(min<255&&!result.hist[min])min++;while(maxValue>0&&!result.hist[maxValue])maxValue--;
   target.querySelector('.lab-hist-summary').textContent=`ROI ${result.pixels} px · 灰度范围 ${min}～${maxValue} · 平均 ${(sum/result.pixels).toFixed(1)} · 橙线为阈值`;
  }
  function render(){
   pending=false;if(!image)return;const n=Number(area.value);
   const effects={none:'保持阈值结果，用来作为处理前对照。',dilate:'膨胀：白色前景向周围扩张，相近区域可能连在一起。',erode:'腐蚀：白色前景向内缩小，细线或小目标可能消失。',open:'开运算：先腐蚀、后膨胀，可尝试移除较小的前景点。',close:'闭运算：先膨胀、后腐蚀，可尝试填补较小的背景孔洞。'};
   target.querySelector('[data-threshold-output]').textContent=threshold.value;
   target.querySelector('[data-morph-effect]').textContent=effects[morphology.value];
   kernel.disabled=morphology.value==='none';
   if(!Number.isInteger(n)||n<1||n>M.MAX_PIXELS){target.querySelector('.lab-stats').textContent='请输入大于等于 1 的整数面积。';target.querySelector('.lab-table-wrap').textContent='';target.querySelector('.lab-hist-summary').textContent='请输入有效面积后重新计算。';target.querySelector('.lab-morph-summary').textContent='请输入有效面积后查看前后统计。';beforeCtx.clearRect(0,0,image.w,image.h);maskCtx.clearRect(0,0,image.w,image.h);histCtx.clearRect(0,0,histogram.width,histogram.height);redrawSource();return}
   const result=M.analyze(image.gray,image.w,image.h,{roi,threshold:Number(threshold.value),minArea:n,connectivity:Number(connectivity.value),polarity:polarity.value,morphology:morphology.value,kernelSize:Number(kernel.value)});
   if(!result){status('无法计算：请检查图像和参数。',true);return}
   redrawSource();redrawMask(beforeCtx,result.thresholdMask,result,false);redrawMask(maskCtx,result.mask,result,showComponents.checked);redrawHist(result);
   const delta=result.foreground-result.thresholdForeground;
   target.querySelector('.lab-morph-summary').textContent='阈值前景 '+result.thresholdForeground+' px → 处理后 '+result.foreground+' px（变化 '+(delta>0?'+':'')+delta+' px）；Blob 统计使用处理后图像。';
   target.querySelector('.lab-stats').innerHTML='<div><span>处理后前景像素</span><strong>'+result.foreground+'</strong></div><div><span>连通域总数</span><strong>'+result.allCount+'</strong></div><div><span>通过面积筛选</span><strong>'+result.acceptedCount+'</strong></div>';
   target.querySelector('.lab-table-wrap').innerHTML=result.components.length?'<table><thead><tr><th>编号</th><th>面积 px²</th><th>质心 (X, Y) px</th></tr></thead><tbody>'+result.components.map(c=>'<tr><td>'+c.id+'</td><td>'+c.area+'</td><td>('+c.cx.toFixed(1)+', '+c.cy.toFixed(1)+')</td></tr>').join('')+'</tbody></table><p>按面积列出前 20 个；质心是工作图像坐标。</p>':'<p>没有通过面积筛选的连通域。可调整阈值、前景规则、形态学或最小面积。</p>';
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(render)}}
  function imagePoint(e){const r=source.getBoundingClientRect();return{x:Math.max(0,Math.min(image.w,Math.round((e.clientX-r.left)*image.w/r.width))),y:Math.max(0,Math.min(image.h,Math.round((e.clientY-r.top)*image.h/r.height)))}}
  function dragRect(a,b){return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}}
  source.addEventListener('pointerdown',e=>{if(!image||e.button!==0)return;e.preventDefault();drag={start:imagePoint(e),last:imagePoint(e)};source.setPointerCapture(e.pointerId)});
  source.addEventListener('pointermove',e=>{if(!drag)return;drag.last=imagePoint(e);const r=dragRect(drag.start,drag.last);if(r.w>0&&r.h>0)redrawSource(r)});
  source.addEventListener('pointerup',e=>{if(!drag)return;const r=dragRect(drag.start,imagePoint(e));drag=null;if(r.w<2||r.h<2){redrawSource();status('请拖动框选至少 2 × 2 像素的区域。',true);return}roi=r;syncRoi();status(image.origin);schedule()});
  source.addEventListener('pointercancel',()=>{drag=null;redrawSource()});
  target.querySelector('[data-apply-roi]').addEventListener('click',()=>{const next={};for(const key of ['x','y','w','h']){const input=target.querySelector('[data-roi="'+key+'"]');next[key]=input.value.trim()===''?NaN:Number(input.value)}if(!Object.values(next).every(Number.isInteger)||next.x<0||next.y<0||next.w<1||next.h<1||next.x+next.w>image.w||next.y+next.h>image.h){status('ROI 必须是工作图像范围内的整数，宽和高至少为 1。',true);return}roi=next;syncRoi();status(image.origin);schedule()});
  target.querySelector('[data-reset-roi]').addEventListener('click',()=>{roi={x:0,y:0,w:image.w,h:image.h};syncRoi();status(image.origin);schedule()});
  target.querySelector('[data-sample]').addEventListener('click',useSample);
  target.querySelector('[data-jump-profile]').addEventListener('click',()=>{target.querySelector('#profile-title').focus({preventScroll:true});target.querySelector('#profile-root').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});
  target.querySelector('[data-morph-clear]').addEventListener('click',()=>{morphology.value='none';schedule()});
  target.querySelectorAll('[data-morph-example]').forEach(button=>button.addEventListener('click',()=>{
   morphology.value=button.dataset.morphExample;kernel.value=morphology.value==='open'?'9':'25';threshold.value='120';polarity.value='dark';connectivity.value='8';area.value='100';useSample();
  }));
  for(const control of [threshold,area,polarity,connectivity,morphology,kernel,showComponents])control.addEventListener('input',schedule);
  const themeObserver=new MutationObserver(()=>{if(!source.isConnected){themeObserver.disconnect();return}schedule()});
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('hashchange',()=>themeObserver.disconnect(),{once:true});
  file.addEventListener('change',()=>{
   const selected=file.files&&file.files[0];if(!selected)return;
   if(!['image/png','image/jpeg','image/webp'].includes(selected.type)||selected.size>15*1024*1024){status('请选择不超过 15 MB 的 PNG、JPG 或 WebP 图片。',true);file.value='';return}
   const current=++loadId,url=URL.createObjectURL(selected),img=new Image();
   img.onload=()=>{URL.revokeObjectURL(url);file.value='';if(current!==loadId||!target.isConnected)return;const ow=img.naturalWidth,oh=img.naturalHeight,scale=Math.min(1,1600/Math.max(ow,oh),Math.sqrt(M.MAX_PIXELS/(ow*oh))),w=Math.max(1,Math.floor(ow*scale)),h=Math.max(1,Math.floor(oh*scale));if(!M.validSize(w,h)){status('图片尺寸无法处理，请换一张图片。',true);return}buffer.width=w;buffer.height=h;bufferCtx.fillStyle='#fff';bufferCtx.fillRect(0,0,w,h);bufferCtx.drawImage(img,0,0,w,h);const gray=M.grayFromRGBA(bufferCtx.getImageData(0,0,w,h).data,w,h);setImage(gray,w,h,`当前：本地图片；原图 ${ow} × ${oh} px，工作图像 ${w} × ${h} px${scale<1?'（已缩小）':''}。`)};
   img.onerror=()=>{URL.revokeObjectURL(url);file.value='';if(current===loadId)status('图片无法解码，请选择其他图片。',true)};img.src=url;
  });
  useSample();
 }
 root.VisionImageLab={mount};
})(window);
