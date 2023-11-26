---
title: 相机录像新姿势-OpenGL共享上下文+MediaCodec
date: 2023-11-20 22:43:00
categories: Android技巧
tags:
- Android
- Camera
---

## 一、前言
承接上一文章[Camera无变形任意尺寸预览](https://boybeak.github.io/2023/11/12/2023-11-12-Camera%E6%97%A0%E5%8F%98%E5%BD%A2%E4%BB%BB%E6%84%8F%E5%B0%BA%E5%AF%B8%E9%A2%84%E8%A7%88/)，我们已经实现了无形变的任意尺寸的相机画面预览。接下来要完成相机的相关录像、拍照、扫码等功能，最重要也是最难的就是录像部分。

最终示例代码可以参考我的Github: [iCamera](https://github.com/boybeak/iCamera)。

## 二、技术要求
我们要实现的录像功能技术要求如下：
1. 所见即所得，预览画面什么样，最终结果就是什么样，不能经过二次裁剪与变换；
2. 允许过程中，切换摄像头而不中断录制；
3. 效率尽可能高，不许按下停止键后，有长时间的等待最终结果的过程；
4. 不要引入额外的库；

## 三、基本思路
在讲解基本思路以前，我们先看一下共享OpenGL上下文，能够达到怎样的效果。
[share_preview](https://github.com/boybeak/iCamera/assets/6696502/94bec530-4e54-4c41-9ce2-638b163fff60)
查看视频，最上方是相机的预览画面，下方左侧为通过共享OpenGL上下文获得的共享画面，也就是说，我们可以把相机画面，共享给另外一个Surface，既然有了这个思路，那么通过共享画面进行录像，也就可以了。
那么基本思路如下：
1. 实现相机的OpenGL预览，保留相关上下文实例；
2. 创建并配置MediaCodec，通过createInputSurface，创建共享画面；
3. 以预览的OpenGL上下文与MediaCodec的surface，创建另外一个共享的OpenGL环境；
4. MediaCodec开始编码录制；

## 四、具体实现
### 4.1 实现OpenGL画面预览
这里我们通过已经封装好的PreviewSurface实现。
```kotlin
fun open(id: Int, surfaceView: SurfaceView) {
    if (id == cameraId) {
        return
    }
    if (camera != null) {
        close()
    }

    previewSurface = PreviewSurface(surfaceView.holder.surface)
    previewSurfaceView = surfaceView
    previewSurface?.start { surfaceTexture ->
        previewSurfaceTexture = surfaceTexture

        val previewSize = openCameraOnly(id, surfaceTexture)
        when(display.rotation) {
            Surface.ROTATION_0, Surface.ROTATION_180 -> previewSurface?.setInputSize(previewSize.height, previewSize.width)
            Surface.ROTATION_90, Surface.ROTATION_270 -> previewSurface?.setInputSize(previewSize.width, previewSize.height)
        }
    }
}
```
`previewSurface`可以提供`SurfaceTexture`进行预览，同时也保存了OpenGL上下文。

### 4.2 MediaCodec创建Surface
我们的视频编码是通过`MediaCodec`实现的，之所以不直接用`MediaRecorder`实现，是因为`MediaRecorder`不支持录制期间翻转摄像头。

一个简单的MediaCodec实现如下：
```kotlin
videoCodec = MediaCodec.createEncoderByType(MIME_TYPE)
val codecInfo = videoCodec!!.codecInfo
val capabilities = codecInfo.getCapabilitiesForType(MIME_TYPE)
val mediaFormat = onConfig.onConfig(capabilities.videoCapabilities).toMediaFormat(
    MIME_TYPE
)
videoCodec?.configure(mediaFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)

val inputSurface = videoCodec?.createInputSurface()!!
```
这样，我们就获得了一个用于共享的surface。

### 4.3 创建共享OpenGL环境
以前两步中获得到OpenGL上下文与共享surface，创建一个新的共享OpenGL环境，这里我们已经封装成了`SharedSurface`，只要直接调用其attach方法即可直接共享预览Surface的画面。
```kotlin
private val avEncoder = AVEncoder()
private var recordSurface: SharedSurface? = null
private val timeSynchronizer = object : TimeSynchronizer {

    private var startAt = 0L

    override fun reset() {
        startAt = System.currentTimeMillis() * 1000
    }

    override fun getTimestamp(): Long {
        return System.currentTimeMillis() * 1000 - startAt
    }
}

fun startRecord(output: File) {
    if (isRecording()) {
        return
    }
    avEncoder.prepare(SimpleAudioConfigAdapter(), SimpleVideoConfigAdapter(Size(previewSurfaceView!!.width, previewSurfaceView!!.height)), timeSynchronizer) {
        avEncoder.start(output) { inputSurface ->
            recordSurface = SharedSurface(inputSurface)
            recordSurface?.attach(previewSurface!!)
        }
    }
}
```
上述代码中，`AVEncoder`为一个同时录制画面与声音的逻辑集合类，当开始录像时，会提供一个inputSurface对象，利用此对象，创建SharedSurface，就可以直接利用预览画面的共享纹理进行绘制，这些会绘制到共享surface上，MediaCodec会直接对画面进行编码。

当然，这里会有很多MediaCodec相关的问题，这里的兼容性也是非常头疼的，需要处理高通/海思/联发科处理器的编码器的大量兼容性问题，但是这不是本文的重点。

### 4.4 编码录制
这部分请直接参考代码吧

## 五、思路发散
我们从录制上，可以看出，实际上连接预览与录制的，就是一个surface，只要有了surface，那我们就可以做很多操作了。比如拍照和扫码。

当然，我们可以通过直接调用相机实例的接口进行拍照，只不过需要拍照后再做裁剪等操作，这里耗时不高。

说一下拍照的逻辑，就是利用`ImageReader`，这种方式，就与Camera2的api差异不大了，简单代码实现如下：
```kotlin
private var photoSurface: SharedSurface? = null
private val photoHandler = ...
fun takePhoto(callback: (Bitmap) -> Unit) {
    val imageReader = ImageReader.newInstance(previewSurfaceView!!.width, previewSurfaceView!!.height, PixelFormat.RGBA_8888, 1)
    photoSurface = SharedSurface(imageReader.surface)
    imageReader.setOnImageAvailableListener({
        val image = imageReader.acquireNextImage()
        // convert image to bitmap
        callback.invoke(bitmap)
    }, photoHandler)
    photoSurface?.attach(previewSurface!!)
}
```
同样的，扫码功能也类似，不过这里要借助zxing这个二维码解析库，同时做一个RGBA的转换，因为当前方案下，ImageReader只允许PixelFormat.RGBA_8888的颜色编码，好处就是，可以比较容易实现扫码预览大小的自定义，并且在预览范围内的都可以扫到，不会出现以前那种预览区域与扫码感知区域不一致的问题。

既然有Surface就可以连接预览画面，那实际上就可以做到边录像，边扫码，边拍照了，只要你的手机性能足够，更多的使用方式，你可以自由去发散。

## 总结
具体的代码可以参考我的[iCamera](https://github.com/boybeak/iCamera)，但是我的代码只是做简单的逻辑演示，并不能保证在所有机型上的兼容性，了解了基本思路后，你可以在此基础上做兼容性处理。

实际上我个人在生产环境的代码，做的兼容性处理要多得多。