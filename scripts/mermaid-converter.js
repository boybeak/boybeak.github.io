hexo.extend.filter.register('before_post_render', function(data) {
  // 将 {% mermaid %} 块转换为标准的Markdown代码块
  data.content = data.content.replace(/\{% mermaid %\}([\s\S]*?)\{% endmermaid %\}/g, function(match, content) {
    return '```mermaid\n' + content + '\n```';
  });
  return data;
});
