---
layout: post
title: Kotlin Native从初识到放弃
author: boybeak
categories: Kotlin Native
tags: Kotlin
---

此贴用于记录对Kotlin Native从初识到放弃的过程，因为还不清楚这一平台的开发能力上限多高，不排除用的好，会一直用下去。
以下Kotlin Native会用KN来代替。

## 开始
首先，下载IDEA，我这里用的是社区版，社区版已经足以应对大多数情况了。
然后，新建一个KN的项目。
![kotlin-native-start.jpg](/images/kotlin-native-starter.jpg)
IDE会自动生成hello world代码，直接点运行，如果工具栏的运行按钮没有可执行的配置，那就直接在Main.kt文件上右键运行。相比直接用Clion写**C/C++**代码的运行速度，KN项目运行要慢得多，因为要先执行gradle脚本。
即便是这样，你也很可能第一次运行不成功，在macOs上，要安装*XCode command line tools*工具，我这里直接安装了完整版的XCode。
然后继续尝试运行，你很可能会发现，依然执行不成功，报如下错误：
```log
The /usr/bin/xcrun command returned non-zero exit code: 72
```
这时候，你需要打开XCode，执行一系列同意操作后，进入**Preferences** -> **Locations**，选中一个版本。如下：
![xcode-select](/images/xcode-select.jpg)
如果你没有安装完整XCode，可以尝试`xcode select`这个命令，这里具体不做详述。
经过这个设置后，再次尝试运行，这次终于运行成功。
```log
21:41:11: Executing 'runDebugExecutableNative'...

Starting Gradle Daemon...
Gradle Daemon started in 3 s 569 ms

> Configure project :
Kotlin Multiplatform Projects are an Alpha feature. See: https://kotlinlang.org/docs/reference/evolution/components-stability.html. To hide this message, add 'kotlin.mpp.stability.nowarn=true' to the Gradle properties.

The property 'kotlin.mpp.enableGranularSourceSetsMetadata=true' has no effect in this and future Kotlin versions, as Hierarchical Structures support is now enabled by default. It is safe to remove the property.

The property 'kotlin.native.enableDependencyPropagation=false' has no effect in this and future Kotlin versions, as Kotlin/Native dependency commonization is now enabled by default. It is safe to remove the property.


> Task :wrapper

BUILD SUCCESSFUL in 21s
1 actionable task: 1 executed

> Configure project :
Kotlin Multiplatform Projects are an Alpha feature. See: https://kotlinlang.org/docs/reference/evolution/components-stability.html. To hide this message, add 'kotlin.mpp.stability.nowarn=true' to the Gradle properties.

The property 'kotlin.mpp.enableGranularSourceSetsMetadata=true' has no effect in this and future Kotlin versions, as Hierarchical Structures support is now enabled by default. It is safe to remove the property.

The property 'kotlin.native.enableDependencyPropagation=false' has no effect in this and future Kotlin versions, as Kotlin/Native dependency commonization is now enabled by default. It is safe to remove the property.


> Task :compileKotlinNative UP-TO-DATE
> Task :linkDebugExecutableNative UP-TO-DATE

> Task :runDebugExecutableNative
Hello, Kotlin/Native!

BUILD SUCCESSFUL in 3s
3 actionable tasks: 1 executed, 2 up-to-date
21:41:44: Execution finished 'runDebugExecutableNative'.
```
请在上述输出日志中寻找`Hello, Kotlin/Native`字符串，很不起眼。
