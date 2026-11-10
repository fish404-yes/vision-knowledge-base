(function(root){
 'use strict';
 function markArt(){
  return `<svg viewBox="0 0 620 360" role="img" aria-label="双 Mark 定位与旋转角示意图"><defs><pattern id="workbench-mark-grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#d7e7e6"/></pattern></defs><rect width="620" height="360" rx="16" fill="#ecf5f2"/><rect width="620" height="360" rx="16" fill="url(#workbench-mark-grid)"/><rect x="105" y="143" width="370" height="76" rx="8" fill="none" stroke="#9eb5ba" stroke-width="2" stroke-dasharray="6 5"/><g transform="rotate(-17 290 180)"><rect x="105" y="143" width="370" height="76" rx="8" fill="#79bfb2" fill-opacity=".18" stroke="#288e79" stroke-width="2"/><path d="M137 181H440" stroke="#268d79" stroke-width="2"/><circle cx="137" cy="181" r="7" fill="#edaa77"/><circle cx="440" cy="181" r="7" fill="#4e8bb9"/><circle cx="290" cy="181" r="8" fill="white" stroke="#268d79" stroke-width="3"/><text x="114" y="165" fill="#985b3e" font-size="13" font-family="sans-serif">M1</text><text x="438" y="165" fill="#426887" font-size="13" font-family="sans-serif">M2</text></g><path d="M73 305h48 M73 305v-48" stroke="#778e98" stroke-width="2"/><text x="125" y="309" fill="#728c94" font-size="13" font-family="sans-serif">X</text><text x="68" y="250" fill="#728c94" font-size="13" font-family="sans-serif">Y</text><path d="M290 180h65 A65 65 0 0 0 350 161" stroke="#d99969" stroke-width="2" fill="none"/><text x="359" y="169" fill="#b8774d" font-size="15" font-family="sans-serif">Δθ</text><text x="390" y="325" fill="#728c85" font-size="12" letter-spacing="1.5" font-family="sans-serif">2D POSITION / 示意</text></svg>`;
 }
 function mount(target,ctx){
  const {data,demos,projects,esc,icon,count,goSearch}=ctx;
  const categories=data.categories.map(c=>`<a class="home-category" href="#category/${esc(c.id)}"><span class="icon tone-${esc(c.tone)}">${icon(c.icon)}</span><span class="home-category-copy"><strong>${esc(c.name)}</strong><small>${esc(c.subtitle)}</small></span><span class="home-category-count">${count(c.id)} <span aria-hidden="true">↗</span></span></a>`).join('');
  const project=projects.projects.find(p=>p.id==='single');
  target.innerHTML=`<div class="wrap home-workspace">
   <section class="home-heading"><div><div class="home-kicker">机器视觉知识库</div><h1>从问题出发，查找视觉知识</h1><p>相机、镜头、光源、2D / 3D 和机器人应用，都可以在这里查找。</p></div></section>
   <form class="home-search" role="search" aria-label="首页全站搜索"><label for="home-query" aria-label="搜索知识点"><span aria-hidden="true">⌕</span></label><input id="home-query" type="search" placeholder="搜索相机、镜头、光源、标定…"><button type="submit">查找</button></form>
   <div class="home-quick"><span>常用查找</span><a href="#article/camera-selection">相机选型 ↗</a><a href="#article/lens-fov">镜头焦距 ↗</a><a href="#article/light-selection">光源选型 ↗</a><a href="#article/2d-mark">双 Mark ↗</a><a href="#tools">2D / 3D 如何选 ↗</a></div>
   <div class="home-dashboard">
    <a class="home-tool-card home-selection-feature" href="#tools"><span class="home-tool-top"><span>方案与选型工具</span>${icon('target')}</span><strong>选择方案与工具</strong><span>从 2D / 3D 方案判断到相机、镜头与光源初选，也可使用图像实验和项目记录。</span><b>打开选型与工具　↗</b></a>
    <div class="home-primary">
    <section class="home-panel home-categories"><div class="home-panel-head"><div><h2>按主题查找知识</h2></div><a href="#browse">知识目录 ↗</a></div><div class="home-category-grid">${categories}</div><div class="home-panel-footer">${data.categories.length} 个知识主题 · ${data.articles.length} 篇知识点</div></section>
    <section class="home-panel home-project"><div class="home-panel-head"><div><h2>示例：双 Mark 定位</h2></div><a href="#cases/position">更多定位案例 ↗</a></div><a class="home-project-feature" href="#project/single"><span class="home-project-art">${markArt()}</span><span class="home-project-copy"><small>分步互动 · 模拟示例</small><strong>${esc(project.title)}</strong><span>从拍照位姿、图像点到基座坐标，按步骤查看定位过程。</span><b>进入案例　→</b></span></a></section>
   </div><aside class="home-rail" aria-label="常用工具与问题">
    <section class="home-panel"><div class="home-panel-head"><div><h2>你想做什么？</h2></div></div><div class="home-workflows"><a href="#interactive"><strong>动手理解原理</strong><small>2D、3D、成像与标定图解</small><b>↗</b></a><a href="#cases"><strong>查看应用案例</strong><small>定位抓取、测量和选型示例</small><b>↗</b></a><a href="#issues"><strong>排查现场问题</strong><small>从模糊、偏差和通信现象开始</small><b>↗</b></a></div></section>
   </aside></div>
  </div>`;
  target.querySelector('.home-search').addEventListener('submit',event=>{event.preventDefault();goSearch(target.querySelector('#home-query').value)});
 }
 root.VisionWorkspaceHome={mount};
})(window);
