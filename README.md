# Listen 1 (Chrome Extension) V3.0.0

（最后更新于 2021 年 12 月 23 日）

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

[English Version](https://github.com/listen1/listen1_chrome_extension/blob/master/README_EN.md)

## 缘起

当我发现找个想听的歌因为版权听不了，需要打开好几个网站开始搜索，来回切换让我抓狂的时候，我知道是时候该做点什么了。

妈妈再也不用担心我找不到我想听的歌了。

支持音乐平台

- 网易云音乐
- QQ 音乐
- 酷狗音乐
- 酷我音乐
- bilibili
- 咪咕音乐
- 千千音乐

搜歌，听歌，就用 `Listen1`。

[![imgur](https://i.imgur.com/dIVFtor.gif)]()

V2.9.0 新特性：自动切换播放源(Beta)

当一首歌的播放源不可用时，会自动搜索其他平台，获得可用的播放源。避免了用户手动搜索的麻烦。

还有精选歌单哦。

## 官方商店安装（推荐）

按你的浏览器类型点击下面的链接安装

- [Chrome Web Store 安装](https://chrome.google.com/webstore/detail/listen-1/indecfegkejajpaipjipfkkbedgaodbp)
- [FireFox 安装](https://addons.mozilla.org/zh-CN/firefox/addon/listen1/)
- [Microsoft Edge 安装](https://microsoftedge.microsoft.com/addons/detail/hneiglcmpeedblkmbndhfbeahcpjojjg)

感谢 [@TNT-c](https://github.com/TNT-c) 维护 Firefox 的发布渠道

感谢 [@dhxh](https://github.com/dhxh) 维护 Microsoft Edge 的发布渠道

## Chrome 下载安装

1. 下载项目的 zip 文件，在右上方有个 `Download ZIP`, 解压到本地

2. chrome 右上角的设置按钮下找到更多工具，打开`扩展程序`

3. 选择 `加载已解压的扩展程序`(如果没有显示先选中`开发者模式`)，选中解压后的文件夹，完成！

## Firefox 打包安装

1. 将根目录下 manifest_firefox.json 替换 manifest.json

2. `cd listen1_chrome_extension`

3. `zip -r ../listen1.xpi *`, 完成打包 xpi 文件

4. 打开 Firefox，加载 xpi 文件，完成安装

## QQ 音乐举报 Listen1 导致代码库临时关闭事件 （2017 年 11 月）

Listen1 的用户，有个坏消息希望和大家分享。Listen1 最近收到
了[QQ 音乐的 DMCA Takedown Notice](https://github.com/github/dmca/blob/master/2017/2017-11-17-Listen1.md), 主要代码库已经因为此原因而临时关闭。悲观一点看
，Listen1 项目可能会在今年内彻底消失。

Listen1 诞生的初衷从不是和大公司的争夺版权利益，而是为了给予热爱音乐的人更好的收听体验，所以，Listen1 是开源，免费的，并且不接受任何形式的捐助。正是因为有热爱音
乐的 Listen1 的你们，Listen1 才发展到今天这一步。不管结果如何，Listen1 团队感谢所有支持过这个项目的人们。

在这个关系项目生死存亡的时刻，我寻求项目因为 DMCA 被 github 关闭的援助。如果有对这个比较了解如何解决的人，或者你想对这个事情发表看法和建议，可以
在[issue](https://github.com/listen1/listen1_chrome_extension/issues/113)留言，或者发送邮件到 githublisten1@gmail.com。我们会尽最大努力，来守护 Listen1，即使可
能它即将成为历史。

## 更新历史

[更新历史](https://github.com/listen1/listen1_chrome_extension/blob/next/CHANGELOG.md)

## License

MIT
