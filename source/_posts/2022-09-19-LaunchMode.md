---
layout: post
title: LaunchMode
author: boybeak
category: Android技巧
tags: Android
date: 2022-09-19 07:00:00
---

此文是阅读[《Android 面试黑洞——当我按下 Home 键再切回来，会发生什么？》](https://zhuanlan.zhihu.com/p/265946165)一文后的总结，视频地址[Bilibili](https://link.zhihu.com/?target=https%3A//www.bilibili.com/video/BV1CA41177Se/)、[Youtube](https://link.zhihu.com/?target=https%3A//youtu.be/r4T9zkhpmII)。

演示代码：

在正式讲解launchMode前，先要理解三个概念：**ActivityStack**, **TaskRecord**, **ActivityRecord**。

{% mermaid %}
graph LR;
style TaskRecord-A fill:#aaddff;
style TaskRecord-B fill:#aaddff;
subgraph ActivityStack
subgraph TaskRecord-A
A[ActivityRecord-1]
B[ActivityRecord-2]
end
subgraph TaskRecord-B
C[ActivityRecord-3]
D[ActivityRecord-4]
end
end
{% endmermaid %}

他们的一般结构是这样的。

通过adb命令可以查看当前的ActivityStack、TaskRecord和ActivityRecord的结构。

```powershell
adb shell dumpsys activity
```

结果如下(搜索`ACTIVITY MANAGER STARTER (dumpsys activity containers)`)：

```powershell
...

ACTIVITY MANAGER STARTER (dumpsys activity containers)
com.android.server.am.ActivityStackSupervisor@299f1c5 type=undefined mode=fullscreen
  #0 ActivityDisplay={0 numStacks=2} type=undefined mode=fullscreen
   #1 ActivityStack{694271a stackId=0 type=home mode=fullscreen visible=true translucent=false, 1 tasks} type=home mode=fullscreen
    #0 TaskRecord{e42980e #2 I=com.android.launcher3/.Launcher U=0 StackId=0 sz=1} type=home mode=fullscreen
     #0 ActivityRecord{5efeaf4 u0 com.android.launcher3/.Launcher t2} type=home mode=fullscreen
   #0 ActivityStack{91ac24b stackId=1 type=standard mode=fullscreen visible=false translucent=true, 1 tasks} type=standard mode=fullscreen
    #0 TaskRecord{583322f #72 A=com.github.boybeak.hellolaunchmode U=0 StackId=1 sz=1} type=standard mode=fullscreen
     #0 ActivityRecord{a126ec8 u0 com.github.boybeak.hellolaunchmode/.MainActivity t72} type=standard mode=fullscreen


...
```

我们可以看到，此时有两个ActivityStack，索引为0的ActivityStack中，有一个TaskRecord，这个TaskRecord里有一个ActivityRecord，就是我们实验App的MainActivity；索引为1的ActivityStack为我们的Home界面。



## 四种launchMode的一般行为

LaunchMode共有4个值可以选择：**Standard**、**SingleTop**、**SingleTask**、**SingleInstance**。接下来将分开讲这4个值的作用，实际上，由于Activity的跳转会涉及到两个Activity，比如ActivityA -> ActivityB，ActivityB的跳转行为模式，不止受到自己launchMode的影响，还会受到ActivityA的launchMode的影响。除此以外，还会有其他属性的影响，比如`taskAffinity`、`allowTaskReparenting`、[`documentLaunchMode`](https://developer.android.com/guide/topics/manifest/activity-element#dlmode)等。

**Standard**

这是launchMode的值。它的默认行为是：在当前TaskRecord下创建新Activity。

**SingleTop**

SingleTop的行为是：如果有一个同类型的Activity在当前TaskRecord的栈顶，那么就直接使用这个栈顶的Activity并调用其`onNewIntent()`方法；如果栈顶没有同类型的Activity，则在栈顶创建一个对应的Activity。

**SingleTask**

SingleTask的行为是：在对应`taskAffinity`的TaskRecord中，如果已经有了对应类型的Activity，则直接使用该Activity，并调用`onNewIntent()`方法，如果有其他Activity压在该Activity上，则这些Activity都将出栈，该Activity重回栈顶；如果对应`taskAffinity`的TaskRecord中没有对应类型的Activity，则创建对应类型的Activity并压入栈顶。

> 这里需要注意的是`taskAffinity`对该属性的影响，如果没有为`android:launchMode="singleTask"`的Activity指定`taskAffinity`，则默认值为Application的`taskAffinity`，而Application的默认`taskAffinity`为包名。

**SingleInstance**

SingleInstance的行为是：1，只允许有一个栈中有此Activity，并且这个栈只允许有这一个Activity；2，如果已经有一个栈中有对应的Activity，则直接使用该Activity，并调用`onNewIntent()`方法。



## SingleInstance对其他三种launchMode的影响

由于SingleInstance是如此的霸道，导致从一个SingleInstance的Activity启动其他类型Activity的话，会改变其他三种模式的一般行为。

**SingleInstanceA -> StandardB**

StandardActivityB将无法在当前栈中创建，会回到默认栈中创建。

**SingleInstanceA -> SingleTopB**

这个行为就很复杂了，可以按照SingleTopB有无`taskAffinity`属性分为两种情况：

- 无`taskAffinity`：则直接在默认的栈中，创建新的SingleTopB或者使用已经存在的SingleTopB。
- 有`taskAffinity`：则在指定`taskAffinity`的栈中创建创建新的SingleTopB或者使用已经存在的SingleTopB。

> 这里实际上存在一个更为复杂的行为模式：**StandardA -> SingleTopB -> SingleInstanceC -> SingleTopB**。
>
> 如果SingleTop有`taskAffinity`属性的话，情况就可以分为两个部分：
>
> **StandardA -> SingleTopB**：在StandardA相同TaskRecord中创建SingleTopB的实例singleTopB1。
>
> **SingleInstanceC -> SingleTopB**：在指定`taskAffinity`的TaskRecord中，创建SingleTopB的实例singleTopB2。
>
> 也就是说，此时有两个SingleTopB对象——singleTopB1和singleTopB2，分别在两个TaskRecord中。

**SingleInstanceA -> SingleTaskB**

比照**SingleInstanceA -> SingleTopB**的例子，同样可以可以按照SingleTaskB有无`taskAffinity`属性分为两种情况：

- 无`taskAffinity`：则直接在默认的栈中，创建新的SingleTaskB或者使用已经存在的SingleTaskB。
- 有`taskAffinity`：则在指定`taskAffinity`的栈中创建创建新的SingleTaskB或者使用已经存在的SingleTaskB。



## 总结

大体了解了不同launchMode的行为逻辑，他们的用途可以简单粗暴的归结如下规律：

- standard和singleTop：多用于App内部；
- singleInstance：多用于开放给外部App来共享使用；
- singleTask：内部交互和外部调用都会用得上。

当然，不能一概而论，还是要看具体需求。

看起来似乎很复杂，其实只要掌握了`adb shell dumpsys activity`这个命令工具，就能清晰的看到当前Activity的分布情况，就能分析出，你的Activity应该用什么`launchMode`，要不要设置`taskAffinity`。

## 参考文献

[ActivityRecord、TaskRecord、ActivityStack以及Activity启动模式详解](https://www.jianshu.com/p/94816e52cd77)

