---
layout: post
title: 发布Android库到MavenCentral教程
author: boybeak
categories: Android技巧
tags: Android
date: 2022-09-19 08:00:00
---


JCenter已经宣布，即将在2020年5月1日，停止新的库的提交，在2022年2月21号以前，连库的解析服务也停止，所以，把以前的库或者未来的新库替换到MavenCentral是当务之急了。

我参考的教程来自以下两篇文章：

[Publishing your first Android library to MavenCentral](https://proandroiddev.com/publishing-your-first-android-library-to-mavencentral-be2c51330b88)

[Android库发布到Maven Central全攻略](https://xiaozhuanlan.com/topic/6174835029)

Demo项目地址：

[EasyPack](https://github.com/boybeak/EasyPack)

建议英文能力强的直接第一篇，我是在第二篇遇到问题时候，找到了第一篇文章解决了问题，因为第二篇里用的windows环境，我用的mac环境。



## 一、 [Sonatype Jira](https://issues.sonatype.org/)相关设置

首先，先去[Sonatype Jira](https://issues.sonatype.org/)这个地址注册一个SonatypeJira的账号；

其次，账号创建后，登录，然后在这个页面https://issues.sonatype.org/projects 点击Create创建一个issue，如下图：

![create](/images/mc_create.jpg)

> 这里group id最好使用你的github地址，这样比较容易验证，如果你想用自己单独的域名，需要做更多的操作。很繁琐，不建议这样做。

创建以后，会有管理员处理你的这个issue，等待管理员回复你的issue，他会告诉你，要在你的github创建一个repo，repo的名字是这个issue的id，比如我的是**OSSRH-66052**。管理员回复我的如下图：

![](/images/mc_replay.jpg)

你创建好repo后，回复管理员就好了，等待这个issue的状态变成**RESOLVED**状态。

![](/images/mc_resolved.jpg)

这样，你就创建好了一个issue，用来承接对应group id下所有的库。



## 二、Gradle的准备

在你项目根目录下的build.gradle文件添加classpath。

```groovy
buildscript {
    ext {
        kotlin_version = "1.4.31"
        appcompat = "1.2.0"
        dokka_version = '1.4.10.2'
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:4.1.3'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"

        classpath "org.jetbrains.dokka:dokka-gradle-plugin:$dokka_version" //新添加的这一classpath
    }
}
```

在你要提交的module下的build.gradle文件中，尾部追加如下代码：

```groovy
ext {
    PUBLISH_ARTIFACT_ID = "你的artifact_id，一般是module的名字"
}

apply from: '../publish.gradle'
```

在根目录下创建publish.gradle，如下：

```groovy
apply plugin: 'maven-publish'
apply plugin: 'signing'

task androidSourcesJar(type: Jar) {
    classifier = 'sources'
    from android.sourceSets.main.java.source

    exclude "**/R.class"
    exclude "**/BuildConfig.class"
}

ext {
    PUBLISH_GROUP_ID = '你的group_id'
    PUBLISH_VERSION = '你的版本号'
}

ext["signing.keyId"] = ''
ext["signing.password"] = ''
ext["signing.secretKeyRingFile"] = ''
ext["ossrhUsername"] = ''
ext["ossrhPassword"] = ''

File secretPropsFile = project.rootProject.file('local.properties')
if (secretPropsFile.exists()) {
    println "Found secret props file, loading props"
    Properties p = new Properties()
    p.load(new FileInputStream(secretPropsFile))
    p.each { name, value ->
        ext[name] = value
    }
} else {
    println "No props file, loading env vars"
}
publishing {
    publications {
        release(MavenPublication) {
            // The coordinates of the library, being set from variables that
            // we'll set up in a moment
            groupId PUBLISH_GROUP_ID
            artifactId PUBLISH_ARTIFACT_ID
            version PUBLISH_VERSION

            // Two artifacts, the `aar` and the sources
            artifact("$buildDir/outputs/aar/${project.getName()}-release.aar")
            artifact androidSourcesJar

            // Self-explanatory metadata for the most part
            pom {
                name = PUBLISH_ARTIFACT_ID
                description = '你的项目描述'
                // If your project has a dedicated site, use its URL here
                url = 'https://github.com/boybeak/EasyPack'
                licenses {
                    license {
                        //协议类型，一般默认Apache License2.0的话不用改：
                        name = 'The Apache License, Version 2.0'
                        url = 'http://www.apache.org/licenses/LICENSE-2.0.txt'
                    }
                }
                developers {
                    developer {
                        id = '你的sonatype用户名'
                        name = '你的sonatype用户名'
                        email = '你的sonatype注册邮箱'
                    }
                }
                // Version control info, if you're using GitHub, follow the format as seen here
                scm {
                    //修改成你的Git地址：
                    connection = 'scm:git:github.com/你的github账号/你的项目名称.git'
                    developerConnection = 'scm:git:ssh://github.com/你的github账号/你的项目名称.git'
                    //分支地址：
                    url = 'https://github.com/你的github账号/你的项目名称/tree/master'
                }
                // A slightly hacky fix so that your POM will include any transitive dependencies
                // that your library builds upon
                withXml {
                    def dependenciesNode = asNode().appendNode('dependencies')

                    project.configurations.implementation.allDependencies.each {
                        def dependencyNode = dependenciesNode.appendNode('dependency')
                        dependencyNode.appendNode('groupId', it.group)
                        dependencyNode.appendNode('artifactId', it.name)
                        dependencyNode.appendNode('version', it.version)
                    }
                }
            }
        }
    }
    repositories {
        // The repository to publish to, Sonatype/MavenCentral
        maven {
            // This is an arbitrary name, you may also use "mavencentral" or
            // any other name that's descriptive for you
            name = "mavencentral"

            def releasesRepoUrl = "https://oss.sonatype.org/service/local/staging/deploy/maven2/"
            def snapshotsRepoUrl = "https://oss.sonatype.org/content/repositories/snapshots/"
            // You only need this if you want to publish snapshots, otherwise just set the URL
            // to the release repo directly
            url = version.endsWith('SNAPSHOT') ? snapshotsRepoUrl : releasesRepoUrl

            // The username and password we've fetched earlier
            credentials {
                username ossrhUsername
                password ossrhPassword
            }
        }
    }
}
signing {
    sign publishing.publications
}
```



## 三、创建GPG秘钥

1. https://www.gnupg.org/download/，从这里下载并安装GPG客户端。

2. 在命令行中执行命令`gpg --full-gen-key`，注意，一定要在命令行中执行命令，不能在客户端界面做。

3. 加密方式选择**RSA and RSA**，长度输入**4096**，过期时间直接回车不用管，然后输入一个user ID并且提供一个邮箱，我直接用的我sonatype的用户名和邮箱。最后一步输入'O'，表示OK。

4. 之后会弹出一个对话框，让输入密码。

   ![密码](/images/mc_pwd.png)

   ```shell
   gpg: revocation certificate stored as '~/.gnupg/openpgp-revocs.d/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXE478F7CC.rev'
   public and secret key created and signed.
   
   pub   rsa4096 2021-03-22 [SC]
         XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEE478F7CC
   uid                      boybeak <boybeak@gmail.com>
   sub   rsa4096 2021-03-22 [E]
   ```

   

   这会为你在`~/.gnupg/openpgp-revocs.d/`目录下创建一个.rev文件，记住pub的末尾8位。

5. 接下来创建secring.gpg文件，命令行执行`gpg --export-secret-keys -o secring.gpg`，这会要求你输入在步骤4中设置的密码，在你用户根目录下会出现secring.gpg文件。

6. 回到gpg客户端，选择我们刚生成的秘钥条目，右键，选择`Send Public Key to Key Server`。

   ![](/images/mc_cer_push.png)



## 四、设置local.properties

```groovy
signing.keyId=刚才获取的秘钥后8位
signing.password=步骤4中设置的密码
signing.secretKeyRingFile=刚才生成的secring.gpg文件目录
ossrhUsername=sonatype用户名
ossrhPassword=sonatype密码
```



## 五、执行打包和上传

设置完这些后，在AndroidStudio右侧的gradle tasks中找到你想提交的module，先后执行以下两个任务。

![](/images/mc_build_push.jpg)

上传成功后，打开[Nexus Repository Manager](https://oss.sonatype.org/)，登录你的sonatype账号，在左侧`Staging Repositories`页面找到你的group id，选中，点击上边的close，等待几分钟十几分钟后刷新状态，等其状态变为closed后，再点击Release，则所有人都用使用你的库了。

![](/images/mc_publish.jpg)。