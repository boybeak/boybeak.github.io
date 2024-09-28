const fs = require('fs');
const path = require('path');

// 注册名为 read_svg 的 helper
hexo.extend.helper.register('read_svg', function (svgPath, theme = false) {
  try {
    // 判断是否使用主题目录
    const baseDir = theme 
      ? path.join(hexo.theme_dir, 'source') // 如果 theme 为 true，使用主题的 source 目录
      : hexo.source_dir;                    // 否则使用站点的 source 目录

    // 拼接路径
    const fullPath = path.join(baseDir, svgPath);

    // 读取 SVG 文件内容
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    console.error(`Error reading SVG file: ${svgPath}`, err);
    return ''; // 读取失败返回空
  }
});
