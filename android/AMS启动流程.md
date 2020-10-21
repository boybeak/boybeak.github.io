---
layout: default
title: AMS启动流程
parent: 杂技
---

# AMS启动流程

AMS是ActivityManagerService的简称，看名字，似乎是Activity的manager，实际上，它管理的可不只是Activity。

## 系统启动流程

```mermaid
graph TD;
    style A fill:#fff
    style F fill:#5befb9
    Z{{Boot ROM}} --> A([Boot Loader]);
    A --> B(Kernel);
    B --> C("init(pid=1)/C++ Framework Native");
    C --> D(Zygote/Android Runtime);
    D --> E(System Server/Java Framework);
    E --> F([Apps]);
```

> 面试题：一个应用启动，为什么不从init进程或者SystemServer进程fork，而是从Zygote进程fork。
>
> *因为一个应用运行需要Android运行环境，就需要做一些虚拟机初始化等耗时工作，所以在init进程中进行不合适；而SystemServer又做了太多工作，比如相关的一些系统服务AMS, PMS等，不需要每个应用都运行一套系统服务，所以从SystemServer进程fork也不合适。*

## Zygote集成启动

```mermaid
graph TD;
    A["init.cpp - main()"] --> B[解析init.zygote.rc];
    B --> C["启动main类型服务 do_class_start()"];
    C --> D["启动zygote服务 start()"];
    D --> E["创建Zygote进程 fork()"];
    E --> |execv|F["app_main.cpp - main()"];
```



## System Server进程启动

```mermaid
graph TD;
    A["app_main.cpp - main()"] --> B["AndroidRuntime.start()"];
    B --> C["startVM()"];
    C --> D["startReg()"];
    D --> E["ZygoteInit.main()"];
    E --> F["registerZygoteSocket()"];
    F --> G["preload"];
    G --> H["startSystemServer"];
    H --> I["runSelectLoop"];
```

[SystemServer.java](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/master/services/java/com/android/server/SystemServer.java)



## AMS启动流程

[ActivityManagerService.java](https://android.googlesource.com/platform/frameworks/base/+/master/services/core/java/com/android/server/am/ActivityManagerService.java)

在SystemServer的`startBootstrapServices`方法中，开始了AMS的启动。

### AMS启动过程中做了哪些事？

与`adb shell dumpsys`相关的一些process服务，比如`meminfo`、`gfxinfo`、`dbinfo`等，具体请参考`setSystemProcess`方法。

## Activity启动流程

```mermaid
flowchart LR;
A[ActivityStactSupervisor] --> B[mHomeStack];
A --> C[mFocusedStack];
subgraph ActivityStack["ActivityStack"]
  subgraph TaskRecord
    AR1[ActivityRecord]
    AR2[ActivityRecord]
    AR3[ActivityRecord]
  end
  subgraph TaskRecord2
    AR4[ActivityRecord]
    AR5[ActivityRecord]
    AR6[ActivityRecord]
  end
end
B --> ActivityStack;
C --> ActivityStack;
```

