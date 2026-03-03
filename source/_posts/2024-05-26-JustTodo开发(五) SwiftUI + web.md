---
layout: post
title: JustTodo开发(五) SwiftUI + web
date: 2024-05-26 17:41:00
categories: 独立开发笔记
tags:
- macOS
- JustTodo
---

初版完成以后，发现了一个问题，就是web中的输入框不接受复制/粘贴的快捷键(cmd+c, cmd+v)，触发快捷键时，会弹“咚”一声系统音，暂时在AppKit下没能解决这个问题，搜了很多资料，比如这里-[Cut/copy/paste keyboard shortcuts not working in NSPopover](https://stackoverflow.com/questions/49637675/cut-copy-paste-keyboard-shortcuts-not-working-in-nspopover)，想要支持这两个快捷键还是很不容易的，其实包括cmd+x, cmd+a也都不支持，但是我想到之前写的同样是托盘应用[Translator](https://github.com/boybeak/TranslatorDocs)，这个就支持这些快捷键，让我突然想到，是不是可以在SwiftUI下，封装一个WKWebView，然后再加载web内容呢？

经过简单验证，封装一个WebView，然后先价值一个最简单的输入框的测试页面，发现这些快捷键是完全工作正常的，所以现在代码已经切换到SwiftUI+web了。

![demo](/assets/images/just-todo.gif)
接下来的一个功能就是增加tab上的图标显示。


**源码地址**: [JustTodo](https://github.com/boybeak/JustTodo)
**下载地址**: [JustTodo-Releases](https://github.com/boybeak/JustTodo/releases)