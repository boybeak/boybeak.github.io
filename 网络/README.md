---
sort: 9
---



# 网络相关知识

[总结自bilibili教程](https://www.bilibili.com/video/BV1mv41117oY?p=8&spm_id_from=pageDriver)

[tcpdump使用教程](https://www.jianshu.com/p/a57a5b0e58f0)

其他参考文章：

[TCP/IP（一）之开启计算机网络之路](https://cloud.tencent.com/developer/article/1023730)

[TCP/IP（二）物理层详解](https://cloud.tencent.com/developer/article/1023718)

[TCP/IP（三）数据链路层~1](https://cloud.tencent.com/developer/article/1023714)

[TCP/IP（三）数据链路层~2](https://cloud.tencent.com/developer/article/1023712)

[TCP/IP（四）网络层](https://cloud.tencent.com/developer/article/1023707)

[TCP/IP（五）传输层之细说TCP的三次握手和四次挥手](https://cloud.tencent.com/developer/article/1023702)

[TCP/IP（六）应用层（DNS和HTTP协议）](https://cloud.tencent.com/developer/article/1023700)

[TCP/IP（七）之玩转HTTP协议](https://cloud.tencent.com/developer/article/1023773?from=article.detail.1023700)

[TCP/IP（八）之总结TCP/IP四层模型](https://cloud.tencent.com/developer/article/1023759)

![net model]({{base_url}}/assets/images/net_model.png)

| 4层网络结构 | 协议     |
| ----------- | -------- |
| 应用层      | HTTP/FTP |
| 传输层      | TCP/UDP  |
| 网络层      | IP       |
| 链路层      | ARP/RARP |



## 应用层 - NC命令行

`nc`命令用于建立一个连接。

```shell
# 连接baidu
~$ nc www.baidu.com 80
GET / HTTP/1.0
```

返回值如下：

```shell
HTTP/1.0 200 OK
Accept-Ranges: bytes
Cache-Control: no-cache
Content-Length: 14615
Content-Type: text/html
Date: Wed, 10 Mar 2021 09:52:26 GMT
P3p: CP=" OTI DSP COR IVA OUR IND COM "
P3p: CP=" OTI DSP COR IVA OUR IND COM "
Pragma: no-cache
Server: BWS/1.1
......
# 还有很多，主要是百度网页的内容，不展示更多了
```

但是如果这样使用命令

```shell
~$ nc www.baidu.com 80
ni hao
HTTP/1.1 400 Bad Request
```

我们传入了ni hao，百度返回了`400 Bad Request`错误，因为http协议是建立在tcp协议之上的，当建立连接后，我们需要按照协议规范传递数据，否则产生错误。

但是，如果我们自己写服务器，完全可以在tcp的基础上，建立自己的协议。



## 传输层 - TCP

TCP —— 面向**连接**的**可靠**的传输**控制**协议。



### 三次握手

Q1: 为什么要三次握手？

> 因为通信是双向的，即client端要确定自己能发也能收，server端也能确定自己能发也能收。第1次握手，client向server发送了syn，第2次握手server向client发送了syn+ack，这样，client端就可以确定自己收发都OK了；但是此时server端只知道自己发出去了，不知道client是否收到，这就需要第3次握手，client向server发送ack，这样服务器端就能知道自己收发都OK了。

Q2: 在三次握手之后，client和server端都做了什么？

> 三次握手成功以后，双方操作系统会在内核中开辟一块缓冲区，用于收发数据，这也就是所谓的“面向**连接**”，收发数据双方都有确认成功，这也就是可靠性的来源，需要注意的是，三次握手的过程，是发生在传输层，对于应用层的程序来说是不可感知的。



### 四次分手

以client向server端断开连接为例。

> client — `fin` —> server， client主动提出断开连接；
>
> client <— `fin+ack` — server，server告知client已知晓，但是需要等待；
>
> client <— `fin` — server，server没有继续要发送的数据了，提出断开连接；
>
> client — `ack` —> server，client告知server已经知晓。
>
> 双方断开连接，销毁缓冲区。



通过实验见证三次握手四次分手的过程。

创建两个ternamal窗口，A窗口用来监听抓包，B窗口用来请求。

**A窗口**

```shell
# 此命令用于获取所有适配器
~$ tcpdump -D
1.en0 [Up, Running]
2.p2p0 [Up, Running]
3.awdl0 [Up, Running]
4.llw0 [Up, Running]
5.utun0 [Up, Running]
6.utun1 [Up, Running]
7.utun2 [Up, Running]
8.utun3 [Up, Running]
9.lo0 [Up, Running, Loopback]
10.bridge0 [Up, Running]
11.en1 [Up, Running]
12.en2 [Up, Running]
13.gif0 [none]
14.stf0 [none]

~$ sudo tcpdump -nn -i en0 port 80
```

回车进入监听状态。



**B窗口**

```shell
~$ curl www.baidu.com:80
```

执行完结果，我们返回A窗口，control+c结束监听状态。查看监听结果如下：

```shell
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on en0, link-type EN10MB (Ethernet), capture size 262144 bytes
# ---------------> 握手开始 <------------------
# 注意下边的Flags [S]表示syn，而Flags [.]表示对上一次活动的ack应答。第二次握手返回的ack=第一次握手seq+1.
14:09:29.699056 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [S], seq 2319217726, win 65535, options [mss 1460,nop,wscale 6,nop,nop,TS val 546056110 ecr 0,sackOK,eol], length 0
14:09:29.710625 IP 14.215.177.39.80 > 192.168.15.195.54381: Flags [S.], seq 3392735298, ack 2319217727, win 8192, options [mss 1452,nop,wscale 5,nop,nop,nop,nop,nop,nop,nop,nop,nop,nop,nop,nop,sackOK,eol], length 0
14:09:29.710729 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [.], ack 1, win 4096, length 0
# ---------------> 握手结束 <------------------

# ---------------> 数据传输开始 <------------------
14:09:29.710796 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [P.], seq 1:78, ack 1, win 4096, length 77: HTTP: GET / HTTP/1.1
14:09:29.718443 IP 14.215.177.39.80 > 192.168.15.195.54381: Flags [.], ack 78, win 908, length 0
# **第一次传输数据是client向server发送请求连接，数据长度77，server做出应答**

14:09:29.718894 IP 14.215.177.39.80 > 192.168.15.195.54381: Flags [P.], seq 1:1441, ack 78, win 908, length 1440: HTTP: HTTP/1.1 200 OK
14:09:29.718984 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [.], ack 1441, win 4073, length 0
# **第二次传输数据是server向client发送请求连接，数据长度1440，client做出应答**

14:09:29.719457 IP 14.215.177.39.80 > 192.168.15.195.54381: Flags [P.], seq 1441:2782, ack 78, win 908, length 1341: HTTP
14:09:29.719656 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [.], ack 2782, win 4075, length 0
# **第三次传输数据是server向client发送请求连接，数据长度1341，client做出应答**
# ---------------> 数据传输结束 <------------------
# 总共产生了3次数据传输数据包，client -> server 一次，server -> client 两次。

# ---------------> 分手开始 <------------------
14:09:29.719973 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [F.], seq 78, ack 2782, win 4096, length 0
14:09:29.727222 IP 14.215.177.39.80 > 192.168.15.195.54381: Flags [.], ack 79, win 908, length 0
14:09:29.727231 IP 14.215.177.39.80 > 192.168.15.195.54381: Flags [F.], seq 2782, ack 79, win 908, length 0
14:09:29.727389 IP 192.168.15.195.54381 > 14.215.177.39.80: Flags [.], ack 2783, win 4096, length 0
# ---------------> 分手结束 <------------------
^C
13 packets captured
444 packets received by filter
0 packets dropped by kernel
```

Q3: 为什么server返回的数据要分两次传输呢？

> 这是收到MTU参数的影响，在命令行下执行`ifconfig`命令，我们查看en0这块网卡的MTU值。
>
> ```shell
> en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
> 	options=400<CHANNEL_IO>
> 	ether a4:5e:60:ba:e4:59
> 	inet6 fe80::1c45:959a:5caf:a584%en0 prefixlen 64 secured scopeid 0x4
> 	inet 192.168.15.195 netmask 0xfffff800 broadcast 192.168.15.255
> 	inet6 fd24:255f:9948:0:14c6:dabb:5cd9:afad prefixlen 64 autoconf secured
> 	inet6 fd24:255f:9948:0:ad1c:94a6:9d53:f837 prefixlen 64 autoconf temporary
> 	nd6 options=201<PERFORMNUD,DAD>
> 	media: autoselect
> 	status: active
> ```
>
> 我们可以看到mtu为1500，也就是说一次转发的最大数据量就是1500个字节，而返回的总数据大小为2781个字节，所以，必须进行拆分，分两次转发。



## 网络层 - IP协议

查看路由表`route -n`结果如下：

```shell
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.115.1   0.0.0.0         UG    100    0        0 ens33
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 ens33
192.168.115.0   0.0.0.0         255.255.255.0   U     100    0        0 ens33
```

当我们向一个ip发起请求的时候，系统会从这个路由表中挨个匹配，用目的ip与子网掩码Genmask做按位与运算，运算出的结果如果与Destination列相匹配上，则将数据包转发到对应的Gateway下路由器或者主机，路由器或者主机收到数据包如果发现目的ip与自己ip相同，则进行处理，如果不同，则重复刚才的动作，与自己的路由表中Genmask进行按位与运算，再次进行转发，这就是所谓的”**下一跳**“。



## 链路层 - ARP协议

网络通信中，最终都要找到目标网卡的硬件mac地址才能完成通信过程，通过ARP协议，可以建立一个ip - mac表。

执行`arp -a`查看结果

```shell
_gateway (192.168.115.1) at a6:5e:60:ab:17:64 [ether] on ens33
```

执行arp抓包可以使用如下命令，过程与tcp抓包类似。

**A窗口**

```shell
~$ sudo tcpdump -nn -i en0 port 80 or arp
```

在B窗口执行`arp -d 192.168.115.1 && curl www.baidu.com:80`，回到A窗口查看结果。

```shell
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on ens33, link-type EN10MB (Ethernet), capture size 262144 bytes
# -------------> 开始查找mac地址 <---------------
02:58:45.634340 ARP, Request who-has 192.168.115.1 tell 192.168.115.2, length 28
02:58:45.634647 ARP, Reply 192.168.115.1 is-at a6:5e:60:ab:17:64, length 46
# -------------> 收到别人回复的mac地址 <---------------

# -------------> 接下来是熟悉的握手过程 <---------------
02:58:45.688502 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [S], seq 4034907629, win 64240, options [mss 1460,sackOK,TS val 171174518 ecr 0,nop,wscale 7], length 0
02:58:45.705080 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [S.], seq 924436396, ack 4034907630, win 8192, options [mss 1412,sackOK,nop,nop,nop,nop,nop,nop,nop,nop,nop,nop,nop,wscale 5], length 0
02:58:45.705126 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [.], ack 1, win 502, length 0
02:58:45.705383 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [P.], seq 1:78, ack 1, win 502, length 77: HTTP: GET / HTTP/1.1
02:58:45.716317 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [.], ack 78, win 908, length 0
02:58:45.718472 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [.], seq 1:1413, ack 78, win 908, length 1412: HTTP: HTTP/1.1 200 OK
02:58:45.718498 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [.], ack 1413, win 501, length 0
02:58:45.719736 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [P.], seq 1413:1441, ack 78, win 908, length 28: HTTP
02:58:45.719769 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [.], ack 1441, win 501, length 0
02:58:45.722458 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [P.], seq 1441:2782, ack 78, win 908, length 1341: HTTP
02:58:45.722511 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [.], ack 2782, win 501, length 0
02:58:45.723029 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [F.], seq 78, ack 2782, win 501, length 0
02:58:45.730027 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [P.], seq 1441:2782, ack 78, win 908, length 1341: HTTP
02:58:45.730309 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [.], ack 2782, win 501, options [nop,nop,sack 1 {1441:2782}], length 0
02:58:45.733570 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [.], ack 79, win 908, length 0
02:58:45.733602 IP 14.215.177.39.80 > 192.168.115.2.48330: Flags [F.], seq 2782, ack 79, win 908, length 0
02:58:45.733652 IP 192.168.115.2.48330 > 14.215.177.39.80: Flags [.], ack 2783, win 501, length 0
^C
19 packets captured
19 packets received by filter
0 packets dropped by kernel

```



## 总结

发起一个网络请求，需要多层联动，从tcp需要三次握手，需要在网络层ip协议不断的**下一跳**到达对方，而下一跳需要通过链路层的arp协议来查询到每一跳的网卡mac地址。



在Mac上做实验确实比较难，很多命令与Linux不一样，半路又搭建了ubuntu的虚拟机来实验的，中途还换过网络，所以部分细节不要深究。具体还是看开头的课程吧，没办法尽善尽美的实验。