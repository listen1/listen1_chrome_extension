Listen 1 (Chrome Extension) V2.17.2
==========
（Last Update December 12nd, 2020)

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

One for all free music in China
----
When I found many songs are unavailable because copyright issue, I realized there's something I should do.
Mom never need to worry about I can't listen my favorite songs. 

Supported music platform:

* Netease
* QQ
* Kugou
* Kuwo
* Bilibili
* Migu

Search songs, listen songs from multiple platforms, that's `Listen 1`.

V2.9.0 New Feature: Auto choose source

when music play source url is not available, auto choose source from other sources.

Making your own playlist is also supported.

How to change language ?
--------------------------
1. Click Settings icon in right top of application
2. Click `English` under `Language` or `语言`

Install (Chrome)
----
1. download zip file from github and uncompress to local.

2. open Extensions from chrome.

3. Choose `Load unpacked`(Open Develop Mode first)，Click folder you just uncompressed, finish!

Install (Firefox)
-----------
1. Visit Listen1 Firefox Page https://addons.mozilla.org/zh-CN/firefox/addon/listen-1/
2. Click Add to Firefox button

Changelog
-------
`2020-12-20`
* fix play interrupted by copyright notice bug, infinite notice popup bug
* change style for now playing page when using album cover as background
* fix minor bug for qq search and optimaze api handler（thanks @RecluseWind）

`2020-12-12`
* support search songlist for qq music (thanks @RecluseWind）
* fix bug: netease songlist shared by mobile open error (thanks @RecluseWind）
* fix bug: migu search song error

`2020-10-28`
* add local music (desktop version only)

`2020-10-27`
* support search playlist (only for netease by now) 
* optimaze lyric display
* fix bilibili artist api, fix lyric time tag format parse error (thanks @RecluseWind)
* optimaze UI, add translate button in now playing page

`2020-10-26`
* add lyric translation support for qq music, xiami music (thanks @RecluseWind)
* update xiami api including get playlist, search, play music (thanks @RecluseWind)
* fix bug some playlist not response in qq music website after installed extension

`2020-10-18`
* add lyric translation, now for netease music only (thanks @reserveword)
* fix bilibili play fail bug
* fix xiami now playing page music cover missing bug
* fix kuwo music can't open bug

`2020-09-12`
* fix netease songlist contains more than 1k tracks import error (thanks @YueShangGuan）
* support album cover as nowplaying background (thanks @YueShangGuan）


`2020-08-24`
* fix xiami songlist only shows part of songs bug (thanks @RecluseWind)
* fix songlist cover and title display bug (thanks @RecluseWind)
* support open url using system default browser for desktop version

`2020-08-04`
* add animation for now playing and current playlist window
* fix xiami cover image not loaded bug (thanks @RecluseWind)
* optimaze open songlist url, support netease toplist, artist, album (thanks @whtiehack)
* optimaze cover image display, avoid resize (thanks @RecluseWind)

`2020-07-10`
* fix migu play fail bug
* support press enter key to search in search bar thanks @kangbb）
* support playlist song count show, support play/pause shortcut, desktop only（thanks @x2009again）
* support restore scrollbar offset when go back（thanks @x2009again for discuss solution）
* optimaze firefox scorlling bar, modify source image url for qq music, fix firefox jquery lib md5 error（thanks @RecluseWind）

`2020-06-29`
* support auto choose source when play fail

`2020-06-28`
* fix netease music only show 10 tracks bug

`2020-04-30`
* fix migu poor music quality bug

`2020-04-27`
* support adding playlist to favorite, special thanks to @zhenyiLiang
* fix migu music
* some minor optimaze

`2019-11-27`
* add frech language, special thanks to @Leoche

`2019-09-07`
* fix migu

`2019-08-09`
* add dark theme

`2019-07-03`
* fix migu play error

`2019-06-24`
* add migu music
* fix kugou play bug
* fix netease play bug

`2019-06-23`
* fix connect to github.com error

`2019-05-26`
* fix kugou music can't play bug

`2019-04-26`
* fix xiami music can't play bug
* fix footer player out of page bug

`2019-03-03`
* fix delete single playlist destroy all playlists bug

`2019-02-26`
* fix qq music songlist not shown bug

`2018-12-30`
* fix songs missing in kuwo playlist
* auto detect language

`2018-12-29`
* fix fail on xiami search
* fix some qq songs fail to play
* fix qq music web visit problem after extension installed

`2018-12-24`
* i18n support, support English language.
* new song will now add to top of playlist
* copyright notification will not mess up the screen

`2018-12-22`
* Version 2.0 released. New UI(Special Thanks to @iparanoid)
* Upgrade jquery, Angular

`2018-12-21`
* Fix xiami playlist bug
* Fix netease playlist only shows one song bug
* Fix bilibili first load duplicate playlists
* Fix can't play some kugou songs
* Fix github gist backup recover bug
* Upgrade soundmanager2


License
--------
MIT
