hexo.extend.filter.register('after_render:html', function(str) {
  // 替换 {% mermaid %} 块为 <div class="mermaid">
  return str.replace(/\{% mermaid %\}([\s\S]*?)\{% endmermaid %\}/g, function(match, content) {
    return '<div class="mermaid">' + content + '</div>';
  });
});
