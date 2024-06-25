---
layout: post
title: Jetpack之LiveData源码分析
author: boybeak
category: 源码分析
tags: Android
---


在阅读这篇文章前，需要先对[Lifecycle](https://boybeak.github.io/2021/03/12/2022-09-17-Jetpack%E4%B9%8BLifecycle%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90/)有所了解。

Lifecycle是LiveData的根基，先有了生命周期的管理，才能进行安全不泄漏的数据观察。

先要引入LiveData：

```groovy
implementation "androidx.lifecycle:lifecycle-viewmodel-ktx:2.2.0"

def activity_version = "1.1.0"
// Kotlin，引入这个扩展，可以使用by viewModels()方法
implementation "androidx.activity:activity-ktx:$activity_version"
```

典型的用法如下：

```kotlin
class MainActivity : AppCompatActivity() {

    private val vm by viewModels<MainVM>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        vm.data.observe(this) {
            Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show()
        }

        vm.start()

    }
}
```

```kotlin
class MainVM : ViewModel() {

    val data = MutableLiveData<String>()

    fun start() {
        data.value = "start"
        Thread {
            Thread.sleep(2000)
            data.postValue("run after 2000ms")
        }.start()
    }

}
```

从这两段代码中，我们就可以看出典型的用法，主要是在三个方法上，*observe*、*setValue*和*postValue*。我们就从这三个方法入手去探究LiveData的工作机制。

## observe方法

```java
// LiveData.java

@MainThread
public void observe(@NonNull LifecycleOwner owner, @NonNull Observer<? super T> observer) {
  assertMainThread("observe");
  if (owner.getLifecycle().getCurrentState() == DESTROYED) {
    // ignore
    return;
  }
  LifecycleBoundObserver wrapper = new LifecycleBoundObserver(owner, observer);
  ObserverWrapper existing = mObservers.putIfAbsent(observer, wrapper);
  if (existing != null && !existing.isAttachedTo(owner)) {
    throw new IllegalArgumentException("Cannot add the same observer"
                                       + " with different lifecycles");
  }
  if (existing != null) {
    return;
  }
  owner.getLifecycle().addObserver(wrapper);
}
```

1. 只允许在主线程中监听数据变化，并且如果*LifecycleOwner*已经处于**DESTROYED**状态，则忽略这次监听请求。
2. 以*LifecycleOwner*和*Observer*创建一个*LifecycleBoundObserver*对象，这个对象继承了*ObserverWrapper*类，同时实现了*LifecycleEventObserver*接口，看到这个接口，我们便明白了*LiveData*能够生命周期安全的监听数据变化的原因了。
3. 这个*LifecycleBoundObserver*对象需要存储在一个*SafeIterableMap*当中去，在存储时候，会通过observer判断是否已经存在一个*ObserverWrapper*对象existing，如果已经存在则分为两种：a. 如果existing没有attach在owner上，则说明，existing已经attach在另外一个*LifecycleOwner*上了，这是不允许的，此时需要抛出异常；b. 如果没有attach在另外一个*LifecycleOwner*上，则说明此时监听的就是当前的owner上，则不需要再次添加监听，直接返回。如果existing不存在，则向owner.getLifecycle()添加监听。



## setValue和postValue方法

在子线程中更新数据，需要调用postValue方法，实际上，这个方法就是通过一个MainHandler去post一个*Runnable*的方式切换到主线程中执行setValue方法。所以，我们重点看setValue方法即可。

```java
// LiveData.java

@MainThread
protected void setValue(T value) {
  assertMainThread("setValue");
  mVersion++;
  mData = value;
  dispatchingValue(null);
}
```

这里需要注意到的是`mVersion++`这句话，*LiveData*就是通过版本号来记录新的值的。继续看dispatchingValue方法。



### dispatchingValue

```java
@SuppressWarnings("WeakerAccess") /* synthetic access */
void dispatchingValue(@Nullable ObserverWrapper initiator) {
  if (mDispatchingValue) {				// ①
    mDispatchInvalidated = true;
    return;
  }
  mDispatchingValue = true;
  do {
    mDispatchInvalidated = false;	// ②
    if (initiator != null) {
      considerNotify(initiator);
      initiator = null;
    } else {
      for (Iterator<Map.Entry<Observer<? super T>, ObserverWrapper>> iterator =
           mObservers.iteratorWithAdditions(); iterator.hasNext(); ) {
        considerNotify(iterator.next().getValue());
        if (mDispatchInvalidated) { // ③
          break;
        }
      }
    }
  } while (mDispatchInvalidated);
  mDispatchingValue = false;
}
```

在这里，涉及到两个方法，1. 第一个dispatchingValue —— 用来分发控制数据更新流程；2. considerNotify具体执行数据更新操作。

这个方法是双信号量控制分发流程，**mDispatchingValue**和**mDispatchInvalidated**，之所以这样设计，按照我的理解，是考虑到了dispatchingValue方法多线程重入的问题，但是依我看来，这样做没必要，因为这个方法的几处调用，都是在主线程上，不可能出现第一次调用没有执行完，就又被调用一次的可能，也可能是设计者考虑到未来的扩展或者在这个库涉及之初有多线程调用的情况才这样写的，先按照有重入可能来分析。

我们先要弄清这两个信号量的作用：mDispatchingValue表示是否正在执行分发数据更新的操作，mDispatchInvalidated表示是否中断正在进行的分发，开始新一轮分发。

这个方法是根据传入的参数，有两个执行流程，一个是执行具体某个ObserverWrapper的数据更新操作，另外一个就是批量更新所有observer的数据操作。我们以setValue触发的dispatchingValue(null)批量更新操作为例进行分析。

注意我在上段代码中的序号①②③注释，我们分步骤进行分析：

> 假设，此时我们有两个observer。
>
> 初始状态 **mDispatchingValue = false, mDispatchInvalidated = false**
>
> 当**第一次**调用开始后，会顺利通过①处判断，然后进入do - while循环，并且在②处先将mDispatchInvalidated信号量置为false，所以，一般情况下，这个while循环只会执行一次；
>
> 
>
> 信号量：**mDispatchingValue = true, mDispatchInvalidated = false**
>
> 由于initiator参数为null，所以会进入到else分支中的for循环中，这里需要注意的是，每一次for循环结束时候，都判断一次mDispatchInvalidated信号量，也就是注释③处；
>
> 假设我们执行了第一个observer后，dispatchingValue方法进行了**第二次**调用，由于此时mDispatchingValue信号量为true，所以会进入①处if条件判断语句，将mDispatchInvalidated信号量置为true并且直接return了；
>
> 
>
> 信号量：**mDispatchingValue = true, mDispatchInvalidated = true**
>
> 此时，第一次调用的for循环体就会因为mDispatchInvalidated变成了true，而退出for循环，while循环开始判断条件，同样因为mDispatchInvalidated为true，回再次执行while循环，执行新值更新；
>
> 最后退出dispatchingValue方法后，两个信号量都置为false。

这样做的目的，或许是为了及时抛弃旧值通知，开始新值通知。



### considerNotify

```java


@SuppressWarnings("unchecked")
private void considerNotify(ObserverWrapper observer) {
  if (!observer.mActive) {
    return;
  }
  // Check latest state b4 dispatch. Maybe it changed state but we didn't get the event yet.
  //
  // we still first check observer.active to keep it as the entrance for events. So even if
  // the observer moved to an active state, if we've not received that event, we better not
  // notify for a more predictable notification order.
  if (!observer.shouldBeActive()) {
    observer.activeStateChanged(false);
    return;
  }
  if (observer.mLastVersion >= mVersion) {
    return;
  }
  observer.mLastVersion = mVersion;
  observer.mObserver.onChanged((T) mData);
}
```

这个方法是具体执行通知观察者值变化的地方。

那么LiveData是如何判断新值和旧值的呢？

在setValue方法中，有一个`mVersion++`语句，每次设置新值都会触发这个mVersion的自增，然后在considerNotify方法中，去校验observer是否处于active状态以及新值版本号与observer中的版本号，如果observer**应当**处于非active状态而仍然处于active状态(**因为状态可能由于handler机制并没有及时变更**)，则进行状态变更并返回，并且如果`observer.mLastVersion >= mVersion`，则直接返回，因为此时observer已经更新过此值。**也就是说，只有observer处于active状态且当前mVersion > observer.mVersion的时候，才去通知observer更新值**。

接下来，着重看一下*LifecycleBoundObserver*和*ObserverWrapper*这个两个类。



## LifecycleBoundObserver和ObserverWrapper

*ObserverWrapper*是*Observer*的抽象包装类，代码很简单：

```java
private abstract class ObserverWrapper {
  final Observer<? super T> mObserver;
  boolean mActive;
  int mLastVersion = START_VERSION;

  ObserverWrapper(Observer<? super T> observer) {
    mObserver = observer;
  }

  abstract boolean shouldBeActive();

  boolean isAttachedTo(LifecycleOwner owner) {
    return false;
  }

  void detachObserver() {
  }

  void activeStateChanged(boolean newActive) {
    if (newActive == mActive) {
      return;
    }
    // immediately set active state, so we'd never dispatch anything to inactive
    // owner
    mActive = newActive;
    boolean wasInactive = LiveData.this.mActiveCount == 0;
    LiveData.this.mActiveCount += mActive ? 1 : -1;
    if (wasInactive && mActive) {
      onActive();
    }
    if (LiveData.this.mActiveCount == 0 && !mActive) {
      onInactive();
    }
    if (mActive) {
      dispatchingValue(this);
    }
  }
}
```

在activeStateChanged方法中，先判断是否是状态的改变，如果`newActive == mActive`说明激活状态未改变，则直接返回；然后判断按照激活的observer数目和mActive状态，来判断LiveData的状态，并调用其空回调函数；最后如果mActive为true，则进行针对这个*ObserverWrapper*的事件分发。

*ObserverWrapper*有两个子类，*LifecycleBoundObserver*和*AlwaysActiveObserver*，*AlwaysActiveObserver*是与生命周期无关的observer，需要谨慎使用，在适当的时候，通过removeObserver来删除，我们重点看*LifecycleBoundObserver*。

*LifecycleBoundObserver*同时实现了*LifecycleEventObserver*，这就使得这个类具备了生命周期关联性。

```java
class LifecycleBoundObserver extends ObserverWrapper implements LifecycleEventObserver {
  @NonNull
  final LifecycleOwner mOwner;

  LifecycleBoundObserver(@NonNull LifecycleOwner owner, Observer<? super T> observer) {
    super(observer);
    mOwner = owner;
  }

  @Override
  boolean shouldBeActive() {
    return mOwner.getLifecycle().getCurrentState().isAtLeast(STARTED);
  }

  @Override
  public void onStateChanged(@NonNull LifecycleOwner source,
                             @NonNull Lifecycle.Event event) {
    if (mOwner.getLifecycle().getCurrentState() == DESTROYED) {
      removeObserver(mObserver);
      return;
    }
    activeStateChanged(shouldBeActive());
  }

  @Override
  boolean isAttachedTo(LifecycleOwner owner) {
    return mOwner == owner;
  }

  @Override
  void detachObserver() {
    mOwner.getLifecycle().removeObserver(this);
  }
}
```

在onStateChanged方法中，当生命周期处于**DESTROYED**状态时候，则删除这个observer。除此以外，当mOwner的生命周期处于**STARTED**之后的状态，则认为`shouldBeActive`，当生命周期函数onStateChanged被触发时候，将设置是否active。



## 总结

通过LiveData的这些特性，我们可以实现Activity - Fragment, Fragment - Fragment的通信，另外也可以做应用的事件总线，比如**LiveEventBus**。