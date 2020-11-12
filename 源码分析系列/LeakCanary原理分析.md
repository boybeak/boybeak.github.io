---
sort: 4
---

# LeakCanary原理分析

```groovy
dependencies {
  // debugImplementation because LeakCanary should only run in debug builds.
  debugImplementation 'com.squareup.leakcanary:leakcanary-android:2.5'
}
```

只需要这样简单配置，就能接入LeakCanary内存泄漏分析，到底是怎样做到的？

我们将这个问题分成两个问题：

1. 如何**自动**进行初始化的；
2. 如何检测到内存泄漏的。



## 如何自动进行初始化的

这部分，我们可以分成两部分去理解——**自动**和**初始化**。

### 自动

这一切还要从`ActivityThread`说起。`ActivityThread`中，执行了一些应用启动的初始化工作，在`ActivityThread`源码中，我们可以看到其内部类`class H extends Handler`的`handleMessage`方法中，有很多与应用相关的一些基本操作，比如**BIND_APPLICATION**, **EXIT_APPLICATION**, **CREATE_SERVICE**, **BIND_SERVICE**等，其中需要我们关注的是**BIND_APPLICATION**。

```java
public void handleMessage(Message msg) {
            ....
            switch (msg.what) {
                case BIND_APPLICATION:
                    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "bindApplication");
                    AppBindData data = (AppBindData)msg.obj;
                    handleBindApplication(data);
                    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
                    break;
                ....
            }
  ....
}
```

我们可以看到，其中调用了`handleBindApplication`方法。进入这个方法查看。

```java
@UnsupportedAppUsage
private void handleBindApplication(AppBindData data) {
  ....
  Application app;
  final StrictMode.ThreadPolicy savedPolicy = StrictMode.allowThreadDiskWrites();
  final StrictMode.ThreadPolicy writesAllowedPolicy = StrictMode.getThreadPolicy();
  try {
    // If the app is being launched for full backup or restore, bring it up in
    // a restricted environment with the base application class.
    app = data.info.makeApplication(data.restrictedBackupMode, null);
    // Propagate autofill compat state
    app.setAutofillOptions(data.autofillOptions);
    // Propagate Content Capture options
    app.setContentCaptureOptions(data.contentCaptureOptions);
    mInitialApplication = app;
    // don't bring up providers in restricted mode; they may depend on the
    // app's custom Application class
    if (!data.restrictedBackupMode) {
      if (!ArrayUtils.isEmpty(data.providers)) {
        installContentProviders(app, data.providers);
      }
    }
    // Do this after providers, since instrumentation tests generally start their
    // test thread at this point, and we don't want that racing.
    try {
      mInstrumentation.onCreate(data.instrumentationArgs);
    }
    catch (Exception e) {
      throw new RuntimeException(
        "Exception thrown in onCreate() of "
        + data.instrumentationName + ": " + e.toString(), e);
    }
    try {
      mInstrumentation.callApplicationOnCreate(app);
    } catch (Exception e) {
      if (!mInstrumentation.onException(app, e)) {
        throw new RuntimeException(
          "Unable to create application " + app.getClass().getName()
          + ": " + e.toString(), e);
      }
    }
  } finally {
    // If the app targets < O-MR1, or doesn't change the thread policy
    // during startup, clobber the policy to maintain behavior of b/36951662
    if (data.appInfo.targetSdkVersion < Build.VERSION_CODES.O_MR1
        || StrictMode.getThreadPolicy().equals(writesAllowedPolicy)) {
      StrictMode.setThreadPolicy(savedPolicy);
    }
  }
  ....
}
```

从这个方法中，我们可以找到这样一段代码，需要重点关注的是，`ContentProvider`的初始化是先于`Application.onCreate`的，且是被`ActivityThread`**自动**执行的。

接下来再看LeakCanary源码。找到[**AppWatcherInstaller.kt**](https://github.com/square/leakcanary/blob/main/leakcanary-object-watcher-android/src/main/java/leakcanary/internal/AppWatcherInstaller.kt)这个类。

```kotlin
/**
 * Content providers are loaded before the application class is created. [AppWatcherInstaller] is
 * used to install [leakcanary.AppWatcher] on application start.
 */
internal sealed class AppWatcherInstaller : ContentProvider() {

  /**
   * [MainProcess] automatically sets up the LeakCanary code that runs in the main app process.
   */
  internal class MainProcess : AppWatcherInstaller()

  /**
   * When using the `leakcanary-android-process` artifact instead of `leakcanary-android`,
   * [LeakCanaryProcess] automatically sets up the LeakCanary code
   */
  internal class LeakCanaryProcess : AppWatcherInstaller()

  override fun onCreate(): Boolean {
    val application = context!!.applicationContext as Application
    AppWatcher.manualInstall(application)
    return true
  }

  override fun query(
    uri: Uri,
    strings: Array<String>?,
    s: String?,
    strings1: Array<String>?,
    s1: String?
  ): Cursor? {
    return null
  }

  override fun getType(uri: Uri): String? {
    return null
  }

  override fun insert(
    uri: Uri,
    contentValues: ContentValues?
  ): Uri? {
    return null
  }

  override fun delete(
    uri: Uri,
    s: String?,
    strings: Array<String>?
  ): Int {
    return 0
  }

  override fun update(
    uri: Uri,
    contentValues: ContentValues?,
    s: String?,
    strings: Array<String>?
  ): Int {
    return 0
  }
}
```

我们可以看到，这个类是一个`ContentProvider`的子类，其query, insert等方法根本没有实际作用，有实际作用的只有`onCreate`方法，在这个方法中，执行了`AppWatcher`的install工作。

这里我们就可以看出来，LeakCanary就是利用`ContentProvider`的`onCreate`方法自动执行的特性，来自动“安装”这个类库的。

### 初始化

通过追踪`AppWatcher.manualInstall(application)`这句代码，我们可以追踪到[**InternalLeakCanary.kt**](https://github.com/square/leakcanary/blob/main/leakcanary-android-core/src/main/java/leakcanary/internal/InternalLeakCanary.kt)的`install`方法，如下：

```kotlin
fun install(application: Application) {
  checkMainThread()
  if (this::application.isInitialized) {
    return
  }
  InternalAppWatcher.application = application
  if (isDebuggableBuild) {
    SharkLog.logger = DefaultCanaryLog()
  }

  val configProvider = { AppWatcher.config }
  ActivityDestroyWatcher.install(application, objectWatcher, configProvider)
  FragmentDestroyWatcher.install(application, objectWatcher, configProvider)
  onAppWatcherInstalled(application)
}
```

我们可以看到，先后执行了`ActivityDestroyWatcher.install`,`FragmentDestroyWatcher.install`和`onAppWatcherInstalled(application)`方法。

其中在`onAppWatcherInstalled`创建了LeakCanary图标的快捷方式，用于方便查看内存泄漏的路径信息。最终实现的具体过程可以查看[**InternalLeakCanary.kt**](https://github.com/square/leakcanary/blob/main/leakcanary-android-core/src/main/java/leakcanary/internal/InternalLeakCanary.kt)的`addDynamicShortcut`方法。

其他的两段代码——`ActivityDestroyWatcher.install`和`FragmentDestroyWatcher.install`，分别对应着两个类——`ActivityDestroyWatcher`和`FragmentDestroyWatcher`。这两个类相对来说比较简单，主要工作就是执行了`application.registerActivityLifecycleCallbacks`这段代码，目的是为了监听每个Activity的onDestroy事件。这也是判断该Activity是否泄漏的开端。

以`ActivityDestroyWatcher`为例，其ActivityLifecycleCallback中代码如下：

```kotlin
private val lifecycleCallbacks =
    object : Application.ActivityLifecycleCallbacks by noOpDelegate() {
      override fun onActivityDestroyed(activity: Activity) {
        if (configProvider().watchActivities) {
          objectWatcher.watch(
              activity, "${activity::class.java.name} received Activity#onDestroy() callback"
          )
        }
      }
    }
```

我们可以看到，这其中，最终是`objectWatcher`来进行内存泄漏监控的。



## 如何检测到内存泄漏的

这里涉及到两个关键的类：**[`ObjectWatcher`](https://github.com/square/leakcanary/blob/main/leakcanary-object-watcher/src/main/java/leakcanary/ObjectWatcher.kt)**和**[`KeyedWeakReference`](https://github.com/square/leakcanary/blob/main/leakcanary-object-watcher/src/main/java/leakcanary/KeyedWeakReference.kt)**。

`KeyedWeakReference`是`WeakReference`的子类，添加了额外的属性，代码十分简单，如下：

```kotlin
class KeyedWeakReference(
  referent: Any,
  val key: String,
  val description: String,
  val watchUptimeMillis: Long,
  referenceQueue: ReferenceQueue<Any>
) : WeakReference<Any>(
    referent, referenceQueue
) {
  /**
   * Time at which the associated object ([referent]) was considered retained, or -1 if it hasn't
   * been yet.
   */
  @Volatile
  var retainedUptimeMillis = -1L

  companion object {
    @Volatile
    @JvmStatic var heapDumpUptimeMillis = 0L
  }
}
```

接下来我们看`ObjectWatcher`中的`watchObject`方法。

```kotlin
  /**
   * Watches the provided [watchedObject].
   *
   * @param description Describes why the object is watched.
   */
  @Synchronized fun watch(
    watchedObject: Any,
    description: String
  ) {
    if (!isEnabled()) {
      return
    }
    removeWeaklyReachableObjects()
    val key = UUID.randomUUID()
        .toString()
    val watchUptimeMillis = clock.uptimeMillis()
    val reference =
      KeyedWeakReference(watchedObject, key, description, watchUptimeMillis, queue)
    SharkLog.d {
      "Watching " +
          (if (watchedObject is Class<*>) watchedObject.toString() else "instance of ${watchedObject.javaClass.name}") +
          (if (description.isNotEmpty()) " ($description)" else "") +
          " with key $key"
    }

    watchedObjects[key] = reference
    checkRetainedExecutor.execute {
      moveToRetained(key)
    }
  }
```

这里分为三步：

1. 执行`removeWeaklyReachableObjects()`方法，这个方法之后讲到；
2. 生成一个`KeyedWeakReference`对象，并将这个对象添加到`watchedObjects`去；
3. 定时执行`moveToRetained`方法。

- 我们先看第二步，生成`KeyedWeakReference`对象时候，传入了一个一个`ReferenceQueue`对象，这是检测对象是否被回收的关键。假如一个对象O，被弱引用WR持有的时候，同时这个弱引用WR在构造时候传入了一个`ReferenceQueue`对象Q，则这个对象O被回收时候，WR将会被添加到Q中去，这样，通过检测Q中有没有值，便可以知道O有没有被回收掉。这也就是第一步做的事。

- 接下来我们查看`removeWeaklyReachableObjects`方法中做了什么。

```kotlin
private fun removeWeaklyReachableObjects() {
  // WeakReferences are enqueued as soon as the object to which they point to becomes weakly
  // reachable. This is before finalization or garbage collection has actually happened.
  var ref: KeyedWeakReference?
  do {
    ref = queue.poll() as KeyedWeakReference?
    if (ref != null) {
      watchedObjects.remove(ref.key)
    }
  } while (ref != null)
}
```

在这个方法中，从queue中取值，取出来ref，则说明被ref修饰的对象已经被回收了，则将这个弱引用ref从`watchedObjects`清除掉。

- 接下来到了第三步，这一步实际上是一个定时5秒(LeakCanary默认)去将watchedObjects中残留的引用，移入到`retainedObjects`中去。我们来看其中代码：

```kotlin
@Synchronized private fun moveToRetained(key: String) {
  removeWeaklyReachableObjects()
  val retainedRef = watchedObjects[key]
  if (retainedRef != null) {
    retainedRef.retainedUptimeMillis = clock.uptimeMillis()
    onObjectRetainedListeners.forEach { it.onObjectRetained() }
  }
}
```

执行这个任务的Executor实际实现在[**InternalAppWatcher.kt**](https://github.com/square/leakcanary/blob/main/leakcanary-object-watcher-android/src/main/java/leakcanary/internal/InternalAppWatcher.kt)中，代码如下：

```kotlin
private val checkRetainedExecutor = Executor {
  mainHandler.postDelayed(it, AppWatcher.config.watchDurationMillis)
}
```

我们发现，在`moveToRetained`中，还是先执行了`removeWeaklyReachableObjects`这一方法。目的是再次清除已经被回收的对象。如果经过这一步，仍然有引用留在watchedObjects中，则可以认为，这些对象泄漏了。

```kotlin
/**
   * Returns the objects that are currently considered retained. Useful for logging purposes.
   * Be careful with those objects and release them ASAP as you may creating longer lived leaks
   * then the one that are already there.
   */
val retainedObjects: List<Any>
@Synchronized get() {
  removeWeaklyReachableObjects()
  val instances = mutableListOf<Any>()
  for (weakReference in watchedObjects.values) {
    if (weakReference.retainedUptimeMillis != -1L) {
      val instance = weakReference.get()
      if (instance != null) {
        instances.add(instance)
      }
    }
  }
  return instances
}
```



## 总结

不要在发行版本中使用LeakCanary，因为一系列初始化动作，可能会导致应用启动较慢。如果要用，请使用LeakCanary-Object-Watcher，或者直接使用Buggly这样的成熟框架。