---
sort: 6
---

# Flutter

Flutter的学习笔记

[Flutter中国镜像网站](https://flutter.cn/)

在国内环境下，使用flutter，先设置镜像：

```shell
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

具体可以参考：[在中国网络环境下使用 Flutter](https://flutter.cn/community/china)。

[将Flutter集成到现有应用](https://flutter.cn/docs/development/add-to-app)



pub.dev镜像设置.

以 bash 为例，临时使用 TUNA 的镜像来安装依赖：

```shell
export PUB_HOSTED_URL="https://mirrors.tuna.tsinghua.edu.cn/dart-pub" # pub: pub get 
export PUB_HOSTED_URL="https://mirrors.tuna.tsinghua.edu.cn/dart-pub" # flutter: flutter packages get 
```

若希望长期使用 TUNA 镜像：

```shell
echo 'export PUB_HOSTED_URL="https://mirrors.tuna.tsinghua.edu.cn/dart-pub"' >> ~/.bashrc
```

