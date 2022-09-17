---
layout: post
title: LiveEventBus源码分析
category: 源码分析
tags: Android
---


> 不再分析了，理解了LiveData后，不难理解这个框架。

阅读本文前，请先阅读[《Jetpack之LiveData源码分析》]({{site.base_url}}/源码分析系列/LiveEventBus源码分析.md)。因为**LiveEventBus**是基于**LiveData**构建的。

源码地址：[LiveEventBus](https://github.com/JeremyLiao/LiveEventBus)

典型用法如下：

```java
// 监听消息
LiveEventBus
	.get("some_key", String.class)
	.observe(this, new Observer<String>() {
	    @Override
	    public void onChanged(@Nullable String s) {
	    }
	});
```

```java
// 发送消息
LiveEventBus
	.get("some_key")
	.post(some_value);
```

其实，这三个方法就是最核心的，get、observe和post。通过get获取一个Observable对象，通过observe进行监听，通过post发送消息。我们就从这三个方法入手去分析其源码。



## get方法分析

跟踪get方法，不难发现，是由*LiveEventBusCore*单例提供的with()方法返回的*Observable*，*LiveEventBusCore*中有一个名为bus的Map<String, LiveEvent<Object>>的成员变量，就是在这个变量中，以key - value的形式，保存了*Obserable*对象。observe方法与post方法都是由*Obserable*提供的。*Observable*是一个接口，它有一个唯一的实现类：**LiveEvent**。也就是说，observe方法与post方法的具体实现，都是由*LiveEvent*类提供。

主要代码如下：

##LiveEvent 

```java
private class LiveEvent<T> implements Observable<T> {
  @NonNull
  private final String key;
  private final LifecycleLiveData<T> liveData;	// 继承自MutableLiveData，实现生命周期感知
  private final Map<Observer, ObserverWrapper<T>> observerMap = new HashMap<>(); // 存储ObserverWrapper对象
  private final Handler mainHandler = new Handler(Looper.getMainLooper()); // 便于切换到主线程
  
  /**
  * 进程内发送消息
  *
  * @param value 发送的消息
  */
  @Override
  public void post(T value) {
    if (ThreadUtils.isMainThread()) {
      postInternal(value);
    } else {
      mainHandler.post(new PostValueTask(value));
    }
  }
  
  /**
  * 注册一个Observer，生命周期感知，自动取消订阅
  *
  * @param owner    LifecycleOwner
  * @param observer 观察者
  */
  @Override
  public void observe(@NonNull final LifecycleOwner owner, @NonNull final Observer<T> observer) {
    if (ThreadUtils.isMainThread()) {
      observeInternal(owner, observer);
    } else {
      mainHandler.post(new Runnable() {
        @Override
        public void run() {
          observeInternal(owner, observer);
        }
      });
    }
  }
  
}
```

*LiveEvent*中通过一个成员变量`Map<Observer, ObserverWrapper<T>> observerMap`来存储*ObserverWrapper*。

*ObserverWrapper*是**LiveData**库中的*Observer*类的子类，