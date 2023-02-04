# hexo-theme-Anatolo

[demo](https://lhcfl.github.io/Anatolodemo)
[博客样例](https://lhcfl.github.io)

[国内镜像](https://gitee.com/Lhcfl/hexo-theme-anatolo)

## 关于主题

基于ben02的[Anatole主题](https://github.com/Ben02/hexo-theme-Anatole)进行了大量修改，增添和优化。  
搜索框代码来自主题Icarus。二主题都采用MIT License，故本主题也采用之。  
部分代码参考了Anatole-core

简约、美观、实用

如果有任何建议欢迎issue，也可以提出pr。

由于我不会css，pug和javascript，许多代码是能用就行，

## 使用方式
参见 https://github.com/Lhcfl/hexo-theme-anatolo/wiki

## 改进
- 我在学世界语所以主题改名为Anatolo（
- 增加了文章概要的选项
- 增加了多语言支持
- 增加了可选的搜索框
- 增加了可选的标签页和标签云
- 增加了可选的toc支持和深度调整
- 调整了部分选项的可选性
- 增加了nav menu的编辑支持
- 增加了文章底部的copyright栏
- 增加了文章的字数统计
- 增加了部分社交账号支持
- 增加了显示网站备案号功能和百度统计
- 增加了Gitalk评论支持

## 已知bug ~~（feature）~~
- （急需修复）站点位于子目录时，大部分链接都会错误工作
- 原主题的葡萄牙语支持无法更新
- TOC放置可能不够美观
- 当Nav栏放置过多链接时可能导致右侧按钮下移

## 使用


### 安装

Clone:

``` 
git clone https://gitee.com/Lhcfl/hexo-theme-anatolo.git themes/Anatolo

或者直接下载主题zip包解压至主题目录下，重命名为Anatolo

```

安装依赖

```
npm install hexo-renderer-pug --save
npm install hexo-renderer-stylus --save

```

### 配置
复制`_config.example.yml`为`_config.yml`  
修改hexo根目录下的 `_config.yml` ： `theme: Anatolo`


### 更新
在Anatolo的目录下
```
git pull origin master

```


