# Intent.FLAG_ACTIVITY_***解密

最好先看这一篇[Launch Mode]({{$site.base_url}}/android/LaunchMode.html)。

我们将重点针对**FLAG_ACTIVITY_NEW_TASK**、**FLAG_ACTIVITY_CLEAR_TASK**、**FLAG_ACTIVITY_CLEAR_TOP**、**FLAG_ACTIVITY_SINGLE_TOP**四个flag进行讲解。



**FLAG_ACTIVITY_NEW_TASK**：通过非Activity的Context启动一个Activity时候，要使用此flag。