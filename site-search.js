/* 统一搜索目录：在每个条目中匹配全部关键词，按内容类型分组。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionSiteSearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const groups=[['articles','知识点'],['projects','2D 项目'],['demos','互动图解'],['tools','工具'],['issues','问题排查']];
 function normalize(value){return String(value||'').toLowerCase().replace(/9\s*点|九点/g,'九点').replace(/感兴趣区域|感兴趣区|\broi\b/g,'roi').replace(/双\s*mark|双标记点|双标记/g,'双mark').replace(/连通区域|连通域|blob/g,'blob').replace(/图像实验室|图片实验室|图片实验区/g,'图像实验区')}
 function build(data,projects,demos,issues){
  const out=[],categories=data.categories||[],cat=id=>categories.find(c=>c.id===id);
  for(const a of data.articles||[]){const category=cat(a.cat);out.push({group:'articles',title:a.title,desc:a.desc,href:'#article/'+encodeURIComponent(a.id),keywords:[category?category.name:'',...(a.tags||[]),...(a.sections||[]).flatMap(s=>[s.title,s.text,...(s.points||[])])]})}
  for(const p of projects||[])out.push({group:'projects',title:p.title,desc:p.desc,href:'#project/'+encodeURIComponent(p.id),keywords:[p.label,...(p.steps||[])]});
  for(const d of demos||[])out.push({group:'demos',title:d.title,desc:d.desc,href:'#demo/'+encodeURIComponent(d.id),keywords:[d.category]});
  out.push({group:'tools',title:'图像实验区：ROI、阈值与 Blob',desc:'使用内置示例或本地图片，查看灰度直方图、阈值结果和连通域。',href:'#image-lab',keywords:['图片','图像处理','阈值','直方图','连通域','质心','面积','ROI','像素']});
  out.push({group:'tools',title:'相机与镜头选型估算',desc:'根据视野、工作距离和采样需求初步估算焦距与相机像素。',href:'#tools',keywords:['选型','镜头','相机','焦距','视野','工作距离','传感器','曝光','运动模糊']});
  for(const c of issues||[])out.push({group:'issues',title:c.title,desc:c.desc,href:'#issues?q='+encodeURIComponent(c.title),keywords:[c.category,...(c.steps||[])]});
  return out;
 }
 function search(entries,query){
  const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
  const found=(entries||[]).filter(e=>{const haystack=normalize([e.title,e.desc,...(e.keywords||[])].join(' '));return terms.every(t=>haystack.includes(t))});
  return groups.map(([id,label])=>({id,label,items:found.filter(e=>e.group===id)})).filter(g=>g.items.length);
 }
 return{groups,normalize,build,search};
});
