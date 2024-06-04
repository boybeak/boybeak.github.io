---
title: 发布Swift Package库
date: 2024-06-04 22:19:00
categories: 独立开发笔记
tags:
- macOS
---

最近开发[JustTodo](https://github.com/boybeak/JustTodo)时，发觉把处理托盘应用的代码封装起来是很有必要的，这样的话，在以后开发其他应用时，便不需要一而再的写重复代码。以前发布过很多Android平台的类库，但是对于macOS平台的swift库，我还是第一次。
> 再次吐槽一下苹果生态下的包管理，挺混乱的，最终我选择使用最新的Swift Package Manager

该文章中涉及到的所有代码都在[boybeak/Tray](https://github.com/boybeak/Tray)

## 一、创建Github仓库
我们需要先创建一个Github仓库，我的仓库名称为Tray，将其clone到本地。

## 二、在仓库目录下，初始化一个Swift Package。
在Tray仓库目录下，执行以下脚本。
```shell
Tray % swift package init --type library
```
该命令，会自动按照目录名称，初始化一个Swift Package，其目录如下：
```css
Tray
  - Package.swift
  - .gitignore
  - Sources/
    - Tray/Tray.swift
  - Tests/
    - TrayTests/TrayTests.swift
```
其中，Package.swift为库的索引入口，当Xcode在按照Github链接查找库时，会以查到此文件为准则。其内容如下：
```swift
// swift-tools-version: 5.10
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Tray",
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "Tray",
            targets: ["Tray"]),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "Tray"),
        .testTarget(
            name: "TrayTests",
            dependencies: ["Tray"]),
    ]
)
```

## 三、发布库
补充相关逻辑代码，提交/推送到GitHub，便可以在其他库中使用。不需要特别的发布操作。
在正式发布前，也可以本地使用，创建一个新项目，在Xcode中，File -> Add Package Denpendencies...，在弹出的管理窗口中，点击**Add Local**按钮，然后选择Tray文件夹，便可以本地使用，同时，你也可以在项目中，直接编辑该库的代码。

## 四、使用库
在Xcode中，File -> Add Package Denpendencies...，在弹出的管理窗口中，复制`https://github.com/boybeak/Tray.git`到搜索库，然后就可以添加库了。
