---
title: Tray - macOS菜单栏app开发库
date: 2024-06-14 15:15:00
categories: 独立开发笔记
tags:
- macOS
---

最近开发了[JustTodo](https://github.com/boybeak/JustTodo)和[DeskNote](https://github.com/boybeak/DeskNote)两个macOS应用，都是启动入口在菜单栏的，通过菜单栏上图标点击，快速执行相关操作，这让我想起我开发第一款菜单栏app [Translator]时的痛苦。因为想使用最新的SwiftUI作为UI框架，但是此框架构建菜单栏app的资料很少，大多数都是生成一个简单菜单，而不是可以自定义的复杂界面，尤其是用swiftUI构建的界面。
为了解决这一痛点，在总结了[JustTodo](https://github.com/boybeak/JustTodo)和[DeskNote](https://github.com/boybeak/DeskNote)两个macOS应用开发经验后，决心自己做了一个菜单栏应用快捷库[Tray](https://github.com/boybeak/Tray)，方便以后使用。

## 一、引入
在macOS项目中，点击**File** -> **Add Package Dependencies ...**，在包管理窗口的搜索框中，复制粘贴`https://github.com/boybeak/Tray.git`，待检索到库信息，点击**Add Package**按钮。

## 二、使用
以SwiftUI应用为例，在代码入口处，声明一个`AppDelegate`.

### 2.1 初始化
```swift
@main
struct DeskNoteApp: App {

    @NSApplicationDelegateAdaptor(AppDelegate.self) var app: AppDelegate

    var body: some Scene {
        Settings {}
    }
}
```
> 这里body中的`Settings {}`代码，是为了隐藏启动时的主窗口。

然后创建AppDelegate类。
```swift
class AppDelegate: NSObject, NSApplicationDelegate {

    private var tray: Tray!
    
    func applicationDidFinishLaunching(_ notification: Notification) {

        tray = Tray.install(named: "TrayIcon") { tray in 
            self.configTray(tray: tray)
        }
    }
}
```
引入相关的类Tray并声明我们的托盘管理对象`var tray: Tray`，并在`applicationDidFinishLaunching`中为改对象赋值，传入资源文件名称，或者使用`SF Symbols`也可以，只是参数名要改为systemSymbolName，如果有更多要求，也可以直接以icon为参数名，传入一个NSImage对象。
然后在闭包中配置tray.

### 2.2 配置托盘信息

```swift
func configTray(tray: Tray) {
    // 配置左键弹出view
    tray.setView(content: ContentView())
}
```
这里设置的是一个SwiftUI的View，你也可以设置NSView或者NSViewController，除了界面参数，还有其他三个可选参数：
1. behavior: NSPopover的behavior，默认值为.transient，即点击窗口以外区域隐藏弹出界面；
2. level: NSPopover的窗口层级，默认为.floating；
3. size: NSPopover的大小，默认为nil，即使用View自己配置的大小；

在JustTodo应用中，其效果如下图：
![](../images/just-todo.gif)

到这里，主要的配置就完成了，如果你不想弹出一个NSPopover，你也可以接管托盘图标的左键事件。
```swift
tray.setOnLeftClick {
    return true
}
```
返回true，表示事件完全处理，会阻止默认行为。默认行为就是弹出NSPopover，前提是设置了view。比如在DeskNote中，我接管了此事件，改为弹出笔记的编辑页面。
![](../images/dest-note.gif)
当然，同样你也可以为右键增加事件。
```swift
tray.setOnRightClick {
    return true
}
```
返回true，表示事件完成处理，阻止默认行为。默认行为是弹出菜单，前提是设置了菜单，正如下边代码。
```swift
let menu = NSMenu()
        
let newNoteMenuItem = NSMenuItem(title: NSLocalizedString("Menu_item_new_note", comment: ""), action: #selector(onNewNoteAction), keyEquivalent: "")
let quitMenuItem = NSMenuItem(title: NSLocalizedString("Menu_item_quit", comment: ""), action: #selector(onQuitAction), keyEquivalent: "")

menu.addItem(newNoteMenuItem)
menu.addItem(quitMenuItem)

tray.setMenu(menu: menu)
```
效果如下：
![](../images/dest-note-right.gif)

这就是一些基本的使用和配置步骤。接下来是一些相关的小建议。

## 三、建议
### 3.1 托盘图标尺寸
1x: 18*18
2x: 36*36
3x: 54*54

### 3.2 隐藏Docker栏中应用的图标
在Info.plist中，增加一个配置项: **Application is agent(UIElement)** - **YES**.