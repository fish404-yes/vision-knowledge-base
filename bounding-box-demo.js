/* 图形展示的是理想矩形，而非图像检测或拟合结果。 */
(function(root){
 'use strict';
 const M=root.VisionBoundingBoxModel;
 function mount(target){
  if(!target||!M)return;
  let state={...M.defaults};
  target.innerHTML=`
   <section class="box-lab" aria-labelledby="box-title">
    <div class="box-header"><div><span>2D VISION / 互动图解</span><h2 id="box-title">工件旋转后，外接框会怎样变化？</h2><p>同一个细长工件，用两种框描述。点选角度或拖动滑块，观察数字和筛选结果。</p></div><button type="button" data-box-reset>重置</button></div>
    <div class="box-steps"><span><b>01</b> 看 0° 时的框</span><span><b>02</b> 点击 45°</span><span><b>03</b> 对比两种结果</span></div>
    <div class="box-grid">
     <div class="box-stage">
      <div class="box-legend"><span><i class="key-object"></i>工件</span><span><i class="key-axis"></i>普通框（轴对齐）</span><span><i class="key-rotated"></i>旋转框</span></div>
      <div data-box-figure></div>
      <p>绿色框正好贴住理想矩形边缘；橙色框始终平行于图像横、竖轴。0° 和 90° 时两种框重合。</p>
     </div>
     <div class="box-controls">
      <div class="box-preset-label">先试试三个角度</div>
      <div class="box-presets" role="group" aria-label="角度示例"><button type="button" data-box-angle="0">0°</button><button type="button" data-box-angle="45">45°</button><button type="button" data-box-angle="90">90°</button></div>
      <label><span>工件旋转 <output data-box-output="angle"></output></span><input type="range" min="-90" max="90" step="1" data-box-param="angle"><small>图示坐标 X 向右、Y 向上，逆时针为正。</small></label>
      <label><span>工件长边 <output data-box-output="length"></output></span><input type="range" min="80" max="180" step="1" data-box-param="length"></label>
      <label><span>工件短边 <output data-box-output="width"></output></span><input type="range" min="20" max="80" step="1" data-box-param="width"></label>
      <label><span>长边 ÷ 短边筛选门槛 <output data-box-output="threshold"></output></span><input type="range" min="1" max="5" step="0.1" data-box-param="threshold"><small>两种框各自的长边 ÷ 短边达到此值才通过。</small></label>
     </div>
    </div>
    <div class="box-compare" aria-live="polite" data-box-result></div>
    <div class="box-explain"><strong>这个实验想说明什么？</strong><p data-box-conclusion></p><p>端子多样本案例使用的是 <b>高 ÷ 宽</b>；本图筛选使用 <b>长边 ÷ 短边</b>。它们不是同一个指标，不能直接照搬阈值。</p><a href="#project/terminal-missing">返回端子多样本案例 →</a></div>
    <p class="box-foot">理想连续几何示意，尺寸为示意 px；没有执行图像二值化、像素栅格化或真实轮廓拟合。真实工件的噪声、遮挡和形状会影响结果；旋转框的宽高、角度定义因算法而异，近正方形或对称轮廓的方向可能不稳定或不唯一。此处角度是人为设定的图像示意角，并非机器人 R。<br>参考：<a href="https://docs.opencv.org/4.11.0/dd/d49/tutorial_py_contour_features.html" target="_blank" rel="noopener noreferrer">OpenCV：普通框与旋转框 ↗</a></p>
   </section>`;
  const q=s=>target.querySelector(s),fmt=n=>n.toFixed(1),pct=n=>n.toFixed(2);
  function update(){
   const r=M.compute(state),cx=320,cy=180,scale=1.35;
   const points=r.corners.map(p=>(cx+p.x*scale).toFixed(2)+','+(cy-p.y*scale).toFixed(2)).join(' ');
   const ax=r.axisWidth*scale,ay=r.axisHeight*scale;
   q('[data-box-figure]').innerHTML=`<svg class="box-svg" viewBox="0 0 640 360" role="img" aria-label="旋转 ${state.angle} 度的理想工件及两种外接框，普通框宽 ${fmt(r.axisWidth)}、高 ${fmt(r.axisHeight)} 像素">
    <defs><pattern id="box-grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#d7e8e0" stroke-width="1"/></pattern></defs>
    <rect width="640" height="360" rx="12" fill="#edf6f0"/><rect width="640" height="360" rx="12" fill="url(#box-grid-pattern)"/>
    <path d="M44 320h48m-48 0v-48" fill="none" stroke="#78958a" stroke-width="2"/><text x="97" y="325" fill="#496c60" font-size="15">X</text><text x="39" y="266" fill="#496c60" font-size="15">Y</text>
    <rect x="${(cx-ax/2).toFixed(2)}" y="${(cy-ay/2).toFixed(2)}" width="${ax.toFixed(2)}" height="${ay.toFixed(2)}" fill="none" stroke="#d77a32" stroke-width="7" stroke-dasharray="10 7"/>
    <polygon points="${points}" fill="#729fe5" fill-opacity=".32" stroke="#16866e" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#174f46"/>
   </svg>`;
   q('[data-box-result]').innerHTML=`
    <article><div><span class="box-label axis">普通外接框</span><strong>${r.axisPass?'通过':'未通过'}</strong></div><p>水平宽 <b>${fmt(r.axisWidth)} px</b>　竖直高 <b>${fmt(r.axisHeight)} px</b></p><p>高 ÷ 宽 = ${pct(r.axisHeightWidth)}　·　长边 ÷ 短边 = <b>${pct(r.axisRatio)}</b></p></article>
    <article><div><span class="box-label rotated">旋转外接框</span><strong>${r.rotatedPass?'通过':'未通过'}</strong></div><p>沿工件长边 <b>${fmt(state.length)} px</b>　短边 <b>${fmt(state.width)} px</b></p><p>长边 ÷ 短边 = <b>${pct(r.rotatedRatio)}</b>　·　${r.orientation===null?'正方形长轴方向不唯一':'设定方向 '+state.angle+'°（长轴仅确定至 180°）'}</p></article>`;
   const message=r.rotatedPass&&!r.axisPass?'旋转后普通框看起来没那么细长，因此按当前门槛会把这个工件过滤；旋转框仍能反映工件自身的长短边。':!r.rotatedPass?'工件本身的长短边比也没有达到当前门槛；调小门槛或调整工件尺寸再比较。':'两种框都达到当前门槛。试试点击 45°，再看普通框的数值是否变化。';
   q('[data-box-conclusion]').textContent=message;
   target.querySelectorAll('[data-box-param]').forEach(el=>{const k=el.dataset.boxParam;el.value=state[k];q('[data-box-output="'+k+'"]').textContent=k==='angle'?state[k]+'°':k==='threshold'?state[k].toFixed(1):state[k]+' px'});
   target.querySelectorAll('[data-box-angle]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.boxAngle)===state.angle)));
  }
  target.querySelectorAll('[data-box-param]').forEach(el=>el.addEventListener('input',()=>{state[el.dataset.boxParam]=Number(el.value);update()}));
  target.querySelectorAll('[data-box-angle]').forEach(el=>el.addEventListener('click',()=>{state.angle=Number(el.dataset.boxAngle);update()}));
  q('[data-box-reset]').addEventListener('click',()=>{state={...M.defaults};update()});
  update();
 }
 root.VisionBoundingBoxDemo={mount};
})(window);
