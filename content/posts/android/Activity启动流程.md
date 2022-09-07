---
title: "Activity启动流程"
date: 2022-09-03T21:03:05+08:00
draft: true
toc: false
images:
tags:
  - untagged
---

#Activity启动流程

原文参考：[Activity 启动流程分析(Android10)](https://zhuanlan.zhihu.com/p/150283395)

```mermaid
graph TD;
A(启动Activity) --> B[通过Binder调用AMS的startActivity方法] --> C[通过Intent获取到目标Activity] --> D{目标Activity是否启动} --> |是|E[通过Instrumentation创建Activity] --> F[回调Activity#attach] --> G[回调Activity#onCreate] --> H[准备显示Activity] --> I[Activity#onResume];
D --> |否|J[通过Zygote进程fork一个App进程]:::zygote --> K[创建Application并回调Application#onCreate]:::zygote --> L[启动ActivityThread主线程消息队列]:::zygote --> E;
F --> M[创建Window对象并设置Window.Callback接收事件]:::wms;
G --> N[Activity#setContentView] --> O[Window#setContentView]:::wms;
H --> P[Window#addView]:::wms;
classDef wms fill:#aaffff
classDef zygote fill:#ffaa99
```

途中浅蓝色部分为WMS关联部分，橙色部分为目标App未启动情况下的流程。

## Intent 解析到 Activity

调用 startActivity 之后，经过几步辗转最终会调用到 **AMS** 中，而 AMS 又会调用 ActivityStarter 来启动 Activity。
解析 Intent 的任务将由`PackageManagerService#resolveIntent`方法来处理。
Intent 匹配规则太负责了，我本意是想学习启动流程，所以就没深入进去看代码，就这样吧。