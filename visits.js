/* GitHub Pages 本身不保存全站计数；图片由第三方服务返回。 */
(() => {
  const status = document.getElementById('visit-status');
  const badge = document.getElementById('visit-badge');
  if (!status || !badge) return;

  // 离线副本、临时预览和其他网站不计入已发布网站的访问次数。
  const isPublishedSite = location.protocol === 'https:' &&
    location.hostname.toLowerCase() === 'fish404-yes.github.io' &&
    (location.pathname === '/vision-knowledge-base/' ||
     location.pathname === '/vision-knowledge-base/index.html');
  if (!isPublishedSite) {
    status.textContent = '仅在线站点启用';
    return;
  }

  const timer = window.setTimeout(() => {
    status.textContent = '统计暂不可用';
  }, 10000);

  badge.addEventListener('load', () => {
    window.clearTimeout(timer);
    status.hidden = true;
    badge.hidden = false;
  });
  badge.addEventListener('error', () => {
    window.clearTimeout(timer);
    badge.hidden = true;
    status.hidden = false;
    status.textContent = '统计暂不可用';
  });

  // 不把随机参数加入统计标识；服务返回 no-store，刷新时会重新请求。
  badge.src = 'https://hits.sh/fish404-yes.github.io/vision-knowledge-base.svg?view=total&label=views&color=268a77';
})();
