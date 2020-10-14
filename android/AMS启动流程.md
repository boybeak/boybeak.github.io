---
layout: default
title: AMS启动流程
parent: 杂技

---

# AMS启动流程

## 系统启动流程

```mermaid
graph TD;
    style A fill:#fff
    style F fill:#5befb9
    A(Boot Loader) --> B(Kernel);
    B --> C("init(pid=1)");
    C --> D(Zygote/Android Runtime);
    D --> E(System Server);
    E --> F(Apps);
```



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
    A["init.cpp - main()"] --> B[解析init.zygote.rc];
    B --> C["启动main类型服务 do_class_start()"];
    C --> D["启动zygote服务 start()"];
    D --> E["创建Zygote进程 fork()"];
    E --> |execv|F["app_main.cpp - main()"];
```

