---
layout: post
title: Jetpack之Lifecycle源码分析
author: boybeak
category: 源码分析
tags: Android
date: 2022-09-17 04:00:00
---


这是一篇解析jetpack库中的**Lifecycle**库的分析文章。

```groovy
def lifecycle_version = "2.2.0"
// Lifecycles only (without ViewModel or LiveData)
implementation "androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version"
// Annotation processor
kapt "androidx.lifecycle:lifecycle-compiler:$lifecycle_version"
```

```kotlin
class MyObserver : LifecycleObserver {
    @OnLifecycleEvent(Lifecycle.Event.ON_CREATE)
    fun onCreate() {

    }

    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    fun onPause() {

    }
}
```

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        lifecycle.addObserver(MyObserver())
    }
}
```

这是一个很典型的Lifecycle库的使用过程，通过注解的方式，在*MyObserver*中声明对应的生命周期函数，然后将这个*MyObserver*实例添加到*MainActivity*的lifecycle中去。

看到与注解相关，熟悉框架源码的朋友可能已经知道如何去分析了，很可能用到**注解处理器**，与[**ARouter**](https://boybeak.github.io/2020/11/28/2022-09-17-ARouter%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90/)类似，Lifecycle的工作流程也分成两部分——**编译时**和**运行时**。

简要的说，在编译时，生成**LifecycleObserver**的辅助类；在运行时，*addObserver*方法被调用后，解析出对应observer的辅助类。

## 生命周期探知

在正式详解这两个过程前，我们需要先要了解Lifecycle库是如何感知生命周期的呢？

读过Glide源码(附上[Glide源码解读](https://boybeak.github.io/%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90%E7%B3%BB%E5%88%97/Glide%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90%E4%B8%8E%E8%87%AA%E6%88%91%E5%AE%9E%E7%8E%B01.html))的同学可能知道，Glide感知生命周期是通过一个无UI的fragment来实现的，其实，Lifecycle也是这么做的。

对外提供生命周期的类，需要实现LifecycleOwner接口。

```kotlin
public interface LifecycleOwner {
    /**
     * Returns the Lifecycle of the provider.
     *
     * @return The lifecycle of the provider.
     */
    @NonNull
    Lifecycle getLifecycle();
}
```

我们以*AppCompatActivity*为例去查看它是如何实现的这个接口，我们查看其父类中有一个*ComponentActivity*类(AppCompatActivity -> FragmentActivity -> ComponentActivity)。

```kotlin
public class ComponentActivity extends androidx.core.app.ComponentActivity implements
        LifecycleOwner,
        ViewModelStoreOwner,
        SavedStateRegistryOwner,
        OnBackPressedDispatcherOwner {
        @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mSavedStateRegistryController.performRestore(savedInstanceState);
        ReportFragment.injectIfNeededIn(this);
        if (mContentLayoutId != 0) {
            setContentView(mContentLayoutId);
        }
    }
}
```

注意此处，有一个*ReportFragment*执行了injectIfNeededIn方法，在这个方法中，就是检测是否已经添加了这个*ReportFragment*，如果没添加则添加一个。继续查看这个*ReportFragment*的源码，可以在其生命周期函数中，执行了分发生命周期的流程。

```kotlin
public class ReportFragment extends Fragment {
  static void dispatch(@NonNull Activity activity, @NonNull Lifecycle.Event event) {
    if (activity instanceof LifecycleRegistryOwner) {
      ((LifecycleRegistryOwner) activity).getLifecycle().handleLifecycleEvent(event);
      return;
    }

    if (activity instanceof LifecycleOwner) { // 3
      Lifecycle lifecycle = ((LifecycleOwner) activity).getLifecycle();
      if (lifecycle instanceof LifecycleRegistry) {
        ((LifecycleRegistry) lifecycle).handleLifecycleEvent(event);
      }
    }
  }

  private void dispatchCreate(ActivityInitializationListener listener) {
    if (listener != null) {
      listener.onCreate();
    }
  }

  @Override
  public void onActivityCreated(Bundle savedInstanceState) {
    super.onActivityCreated(savedInstanceState);
    dispatchCreate(mProcessListener);
    dispatch(Lifecycle.Event.ON_CREATE); // 1
  }

  private void dispatch(@NonNull Lifecycle.Event event) {
    if (Build.VERSION.SDK_INT < 29) {
      // Only dispatch events from ReportFragment on API levels prior
      // to API 29. On API 29+, this is handled by the ActivityLifecycleCallbacks
      // added in ReportFragment.injectIfNeededIn
      dispatch(getActivity(), event); // 2
    }
  }

}
```

看代码中我标注的注释顺序onActivityCreated -> dispatch(Lifecycle.Event) -> dispatch(Activity, Lifecycle.Event)，我们看到最后一个流程中，拿到*Lifecycle*对象后，判断是否为*LifecycleRegistry*类，如果是，则调用handleLifecycleEvent方法。这里，*ComponentActivity*提供的*Lifecycle*对象就是*LifecycleRegistry*类。

经过这样一个流程，我们就将感知生命周期的无UI的*ReportFragment*与执行事件的*LifecycleRegistry*进行了连接。这样我们就获得了感知生命周期的能力了。

那么具体是如何执行到*MyObserver*对应的生命周期的方法的呢？

> 或许你看到这里，会觉得很简单，在*LifecycleRegistry*维护一个observer队列，然后在执行handleLifecycleEvent方法的时候，通过反射从*MyObserver*中筛选出带有 ** @OnLifecycleEvent ** 注解的方法，如果注解中的值与事件event相等，则通过method.invoke()来调用。
>
> 可是谷歌工程师并没有这么做，因为在执行事件时候，经过这么多反射，效率会很低。那么正确的流程是怎么样的？这就需要我们关注上面提到的两个流程了——**编译时**和**运行时**。



## 编译时

参考[Lifecycle-compiler](https://android.googlesource.com/platform/frameworks/support/+/androidx-master-dev/lifecycle/lifecycle-compiler)源码。

通过注解处理器，AS为我们生成了MyObserver的辅助类——*MyObserver_LifecycleAdapter*。

```java
public class MyObserver_LifecycleAdapter implements GeneratedAdapter {
  final MyObserver mReceiver;

  MyObserver_LifecycleAdapter(MyObserver receiver) {
    this.mReceiver = receiver;
  }

  @Override
  public void callMethods(LifecycleOwner owner, Lifecycle.Event event, boolean onAny,
      MethodCallsLogger logger) {
    boolean hasLogger = logger != null;
    if (onAny) {
      return;
    }
    if (event == Lifecycle.Event.ON_CREATE) {
      if (!hasLogger || logger.approveCall("onCreate", 1)) {
        mReceiver.onCreate();
      }
      return;
    }
    if (event == Lifecycle.Event.ON_PAUSE) {
      if (!hasLogger || logger.approveCall("onPause", 1)) {
        mReceiver.onPause();
      }
      return;
    }
  }
}
```

我们可以看到，实际的生命周期事件分发是在这里完成的。那么这个辅助类是在哪里被使用到的呢？

接下来就是**运行时**发挥作用的时候了。



## 运行时

运行时的起点，是从*addObserver*开始的。

我们查看*LifecycleRegistry#addObserver*方法。

```java
private FastSafeIterableMap<LifecycleObserver, ObserverWithState> mObserverMap =
            new FastSafeIterableMap<>();
@Override
public void addObserver(@NonNull LifecycleObserver observer) {
  State initialState = mState == DESTROYED ? DESTROYED : INITIALIZED;
  ObserverWithState statefulObserver = new ObserverWithState(observer, initialState);
  ObserverWithState previous = mObserverMap.putIfAbsent(observer, statefulObserver);
  ...
}
```

我们可以看到，*LifecycleRegistry*中并不是直接维护observer对象，而是维护*ObserverWithState*对象。

```java
static class ObserverWithState {
  State mState;
  LifecycleEventObserver mLifecycleObserver;

  ObserverWithState(LifecycleObserver observer, State initialState) {
    mLifecycleObserver = Lifecycling.lifecycleEventObserver(observer);
    mState = initialState;
  }

  void dispatchEvent(LifecycleOwner owner, Event event) {
    State newState = getStateAfter(event);
    mState = min(mState, newState);
    mLifecycleObserver.onStateChanged(owner, event);
    mState = newState;
  }
}
```

在这个类的构造方法中，执行了一个`mLifecycleObserver = Lifecycling.lifecycleEventObserver(observer);`

在我们的案例中，这个方法返回了一个*SingleGeneratedAdapterObserver*类，我们查看这个类的代码。

```java
class SingleGeneratedAdapterObserver implements LifecycleEventObserver {

    private final GeneratedAdapter mGeneratedAdapter;

    SingleGeneratedAdapterObserver(GeneratedAdapter generatedAdapter) {
        mGeneratedAdapter = generatedAdapter;
    }

    @Override
    public void onStateChanged(@NonNull LifecycleOwner source, @NonNull Lifecycle.Event event) {
        mGeneratedAdapter.callMethods(source, event, false, null);
        mGeneratedAdapter.callMethods(source, event, true, null);
    }
}
```

也就是在这里，调用了*MyObserver_LifecycleAdapter*的*callMethods*方法。

那么是如何找到*MyObserver_LifecycleAdapter*方法的呢？

在*Lifecycling*类中，通过observer的类名来找的，我们看到有这样的一个方法：

```java
public static String getAdapterName(String className) {
  return className.replace(".", "_") + "_LifecycleAdapter";
}
```

这样，整个流程就串起来了。



## 总结

编译时：生成*XXX_LifecycleAdapter*类，用来分发不同的生命周期事件。

运行时：在addObserver时候，通过类名找到这个*XXX_LifecycleAdapter*类，生成对象在*LifecycleRegistry*中进行维护；在ReportFragment方法中触发生命周期时候，调用*LifecycleRegistry*的*handleLifecycleEvent*方法进行具体的生命周期事件分发。

总体来看，其整个流程并不复杂，我们可以看到ARouter、Glide的影子，读过其他源码后，理解这个并不难。