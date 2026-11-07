(function(root){
const cases=[
 ['图像发白或局部过曝','成像','曝光时间、光源亮度、反光角度或增益过高。',['先查看原图和灰度分布，判断是否已饱和。','降低曝光或光强，再检查光源角度、漫射与反光。','用不同批次和位置的样件复测。'],'#article/light-reflection','反光与照明'],
 ['图像模糊或边缘不清','成像','对焦、运动、振动、景深或镜头分辨能力可能不足。',['停止运动后拍摄，对比静止和运动图像。','检查工作距离、对焦和工件高度范围。','核对曝光、光照和镜头适配。'],'#article/lens-aperture','景深与清晰度'],
 ['模板匹配不到或不稳定','定位','图像对比度、模板特征、ROI 或角度范围不适合。',['确认当前图像和模板是否一致，检查照明。','检查搜索区域、允许角度及匹配分数。','覆盖旋转、遮挡和不同批次样件测试。'],'#category/vision2d','2D 定位知识'],
 ['双 Mark 角度跳变 180°','定位','两个 Mark 的身份或点的顺序可能交换。',['核对 M1、M2 身份与基准示教一致。','检查两点连线方向和角度归一化。','两点过近或识别失败时停止输出有效姿态。'],'#demo/marks','双 Mark 互动图'],
 ['产品转得越多，抓取偏差越大','机器人','抓取点相对产品参考点的偏移可能没有随产品旋转。',['核对示教点与 Mark 中点的偏移关系。','检查旋转偏移向量时的角度正负和旋转中心。','与机器人工程师核对坐标系、TCP 和姿态约定。'],'#project/single','双 Mark 抓取案例'],
 ['测量尺寸随位置或高度变化','测量','透视、镜头畸变、工件高度或标定条件可能改变。',['在中心和边缘用标准件重复测量。','核对标定平面与实际工件高度。','根据公差评估远心镜头、夹具与照明。'],'#article/telecentric','普通与远心镜头'],
 ['图像不更新或偶发丢帧','采集','触发、采集节拍、网络带宽或缓存可能异常。',['确认相机触发模式及触发信号。','检查图像编号、时间和采集速率。','核对网络、带宽及程序处理耗时。'],'#category/camera','相机与采集'],
 ['视觉输出正常，机器人却没有动作','通信','数据格式、握手、超时或控制器状态可能不一致。',['先核对双方连接和发送接收日志。','逐项核对字段顺序、单位、结束符和状态码。','与设备工程师检查握手、互锁和超时处理。'],'#category/application','应用与排查']
];
function mount(el){
 el.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">TROUBLESHOOTING</div><h1>常见问题与排查</h1><p>从现场现象出发，逐步检查成像、定位、测量和通信。</p><label class="issue-search"><span>搜索现象</span><input type="search" id="issue-search" placeholder="例如：过曝、抓取偏差、角度"></label></div><p class="issues-count" role="status" aria-live="polite"></p><div id="issue-list" class="issues"></div><p class="notice">排查建议是检查起点，实际原因可能不止一个。涉及设备运动与联锁时，请按现场安全流程操作。</p></div>`;
 const list=el.querySelector('#issue-list');
 const count=el.querySelector('.issues-count');
 const search=el.querySelector('#issue-search');
 function card(c){
  return `<details class="issue"><summary><span class="issue-tag">${c[1]}</span><b>${c[0]}</b><span class="issue-toggle" aria-hidden="true"></span></summary><div class="issue-body"><p><strong>可能原因：</strong>${c[2]}</p><strong>建议检查</strong><ol>${c[3].map(x=>`<li>${x}</li>`).join('')}</ol><a href="${c[4]}">${c[5]} →</a></div></details>`;
 }
 function render(){
  const q=search.value.trim().toLowerCase();
  const matches=cases.filter(c=>c.flat().join(' ').toLowerCase().includes(q));
  count.textContent=matches.length?`共 ${matches.length} 个问题 · 点击卡片展开检查步骤`:'没有找到对应现象，试试其他关键词。';
  list.classList.toggle('issues--single',matches.length<=1);
  if(!matches.length){list.innerHTML='';return}
  // 两列分别排布：展开一列时不会拉伸另一列的卡片。
  const midpoint=Math.ceil(matches.length/2);
  list.innerHTML=[matches.slice(0,midpoint),matches.slice(midpoint)]
   .filter(group=>group.length)
   .map(group=>`<div class="issue-column">${group.map(card).join('')}</div>`).join('');
 }
 search.addEventListener('input',render);
 render();
}
root.VisionIssues={mount};
})(window);
