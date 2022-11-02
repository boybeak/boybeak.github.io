---
layout: post
title: Android的clipToXXX
author: boybeak
categories: Android技巧
tags: Android
---

最近处理工作bug的过程中，有一个需求是这样的，两层view，父view包含着子view，然后子view能显示出的区域，要以父view的背景来过滤。没看懂是不是？参考下图：
![playground]({{base_url}}/assets/images/playground.jpg)
简单说，就是子view的背景显示区域，不能超过父view的背景区域。

## clipToOutline
经过一番搜索尝试，终于查到，可以通过`clipToOutline` + `outlineProvider`来实现，说来惭愧，做了将近20年android开发，竟然到现在才知道这样的特性。
具体代码如下：
```xml
<FrameLayout
    android:id="@+id/togetherParent"
    android:layout_width="100dp"
    android:layout_height="100dp"
    android:layout_margin="8dp"
    android:background="@drawable/bg_parent"
    android:clipToOutline="true"
    android:outlineProvider="background"
    >
    <View
        android:id="@+id/togetherChild"
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:background="@drawable/bg_child"/>
</FrameLayout>
```
但是以上代码只可以在API Level 31及以上使用，要增大适用版本范围，可以用以下代码，在kotlin中实现：
```kotlin
parent.clipToOutline = true
parent.outlineProvider = ViewOutlineProvider.BACKGROUND
```
kotlin中代码，就可以实现，低至API Level 21及以上使用。

除了`clipToOutline`，我还发现了其他`clipToXXX`有关的API。

## clipChildren