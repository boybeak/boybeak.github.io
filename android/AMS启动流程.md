---
layout: default
title: AMS启动流程
parent: 杂技
---

# AMS启动流程

## 系统启动流程

<details>
  <summary>Mermaid代码</summary>
  <pre>
  <blockcode>
    graph TD;
    style A fill:#fff
    style F fill:#5befb9
    A(Boot Loader) --> B(Kernel);
    B --> C("init(pid=1)");
    C --> D(Zygote/Android Runtime);
    D --> E(System Server);
    E --> F(Apps);
  </blockcode>
  </pre>
</details>


![sys_boot]({{site.baseurl}}/assets/images/sys_boot.svg)

## Zygote集成启动

<details>
  <summary>Mermaid代码</summary>
  <pre>
  <blockcode>
    graph TD;
    A["init.cpp - main()"] --> B[解析init.zygote.rc];
    B --> C["启动main类型服务 do_class_start()"];
    C --> D["启动zygote服务 start()"];
    D --> E["创建Zygote进程 fork()"];
    E --> |execv|F["app_main.cpp - main()"];
  </blockcode>
  </pre>
</details>

![zygote_start]({{site.baseurl}}/assets/images/zygote_start.svg)

## System Server进程启动

```mermaid
graph TD;
    A["init.cpp - main()"] --> B[解析init.zygote.rc];
    B --> C["启动main类型服务 do_class_start()"];
    C --> D["启动zygote服务 start()"];
    D --> E["创建Zygote进程 fork()"];
    E --> |execv|F["app_main.cpp - main()"];
```

