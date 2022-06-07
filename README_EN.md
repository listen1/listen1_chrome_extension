# Listen 1 (Chrome Extension) V2.23.0

（Last Update June 7th, 2022)

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

## One for all free music in China

When I found many songs are unavailable because copyright issue, I realized there's something I should do.
Mom never need to worry about I can't listen my favorite songs.

Supported music platform:

- Netease
- QQ
- Kugou
- Kuwo
- Bilibili
- Migu
- Qianqian (taihe)

Search songs, listen songs from multiple platforms, that's `Listen 1`.

V2.9.0 New Feature: Auto choose source

when music play source url is not available, auto choose source from other sources.

Making your own playlist is also supported.

## How to change language ?

1. Click Settings icon in right top of application
2. Click `English` under `Language` or `语言`

## Install (Chrome)

1. download zip file from github and uncompress to local.

2. open Extensions from chrome.

3. Choose `Load unpacked`(Open Develop Mode first)，Click folder you just uncompressed, finish!

## Install (Firefox)

1. Visit Listen1 Firefox Page https://addons.mozilla.org/zh-CN/firefox/addon/listen-1/
2. Click Add to Firefox button

## Changelog

`2022-06`

Features:

- Double click to play in playlist and search result page（thanks @piz-ewing）
- Support wav format local file in desktop version (thanks @mikelxk)

Fix bugs:

- fix shuffle mode play duplicate music bug (thanks @piz-ewing)
- fix music continue to play when clear now playing playlist (thanks @leca）
- fix kugou music play fail

`2022-02 ~ 2022-03`

Features：

- Add Korean language support（thanks @kkange）

Fix bugs：

- fix kugou api play song error
- fix qianqian music api error（thanks @mikelxk）

`2021-08 ~ 2022-01`

Fix bugs：

- fix music category line height （thanks @yinzhenyu-su）
- fix bilibili play issue in firefox (thanks @ktmzcpl)
- fix UI crash in electron environment

Optimaze：

- More fluent effect for current playing switching (thanks @mikelxk)

`2021-07`

Fix Bugs：

- disable image drag
- add shortcuts description for zoom in/out
- move window control panel to top right for windows users (thanks @mikelxk)
- upgrade howler lib (thanks @mikelxk)
- fix QQ search problem
- fix media center progress bar control for chrome users
- add local lrc file support when import local music (thanks @mikelxk)

  `2021-04`

Features:

- QQ Login
- Drag and drop to reorder songs in playlist, reorder playlist and quick add song to playlist
- Search in playlist
- Proxy setting (desktop version only)
- Configure auto detect playable source list
- Display latest version in setting page
- Highest bitrate for netease music

Refactor：

- Change music platform resource API to class #553
- remove angular dependency for github module #532 (thanks @Dumeng)
- emove angular dependency for lastfm module #532 (thanks @Dumeng)
- UX optimaze #537

Fix Bugs：

- Fix migu resource api to use without login, add bitrate info #536 (thanks @RecluseWind)
- Fix display error in firefox for migu hot rank #536 (thanks @RecluseWind)
- Fix sometimes song keep waiting for 15 seconds before playing bug
- Fix qq short link parse error
- Fix toggle mute error
- Fix GitHub logout error
- Fix some kugou music without album play error
- Fix two songs play in same time

`2021-03`

Features:

- Add qianqian music platform (thanks @Dumeng)
- Support playlist filters and top list in migu (thanks @RecluseWind)
- Zoom in/out function for desktop version (thanks @mikelxk)
- Support netease login, show my playlist and recommend playlist
- Support migu login
- Show bitrate and music platform in now playing page
- deprecated xiami

Refactor:

- Replace angular module dependencies: translate，i18n, hotkeys，replace with js library (thanks @Dumeng)
- Optimaze feather load performance (thanks @Dumeng)
- Optimaze bitrate for qq and kugou platform, default high bitrate
- Split app.js into files by controller
- Optimaze copyright notice show
- Change http to https for several links

Fix bugs:

- Fix media control invalid because new es6 optional chain (thanks @mikelxk)
- Fix volume control not working (thanks @mikelxk)
- Fix scorll bar style in firefox (thanks @RecluseWind)
- Fix kugou music cover url
- Fix kugou music play url
- Fix notification not shown bug
- Fix delete songs in current playlist mess up playing bug

`2021-02`

Features:

- Support playlist filters and top playlist （special thanks [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) ）
- Add Traditional Chinese language (thanks @yujiangqaq)
- Add chrome media panel functino: prev/next track, back/forward (thanks @mikelxk）
- New lyric floating window, support config font size, color and background transparency

Refactor：

- Build MediaService module，remove dependency on angularjs（special thanks @Dumeng）
- Add prettier config file, add pre-commit style check（thanks @mikelxk）
- Fix history code style problems（thanks @mikelxk）

Fix bugs：

- Fix Github API （thanks @NoDocCat 和 @Dumeng）
- Fix svg animation performance issue （thanks @Dumeng）
- Fix xiami API（thanks @RecluseWind）
- Fix import local music error for mac desktop version（thanks @virgil1996）
- Fix kuwo search error

`2021-01`

Features：

- support play music background (thanks @Dumeng)
- optimaze kugo related code (thanks @RecluseWind)
- optimaze migu related code (thanks @RecluseWind)
- support flac for local music (thanks @mikelxk)
- add feedback link (thanks @mikelxk)
- optimaze xiami music, add playlist search (thanks @RecluseWind)
- optimaze cache for playlist

Refactor：

- replace encrypt lib to forge (thanks @Dumeng)
- remove jquery (thanks @Dumeng)
- replace ngsoundmanager2 to howler.js (thanks @Dumeng)
- replace angular http to axios (thanks @Dumeng)
- support eslint check in github action (thanks @Dumeng)

Fix bugs：

- fix MediaSession error when not supported (thanks @Jyuaan)
- fix migu playlist 404 link
- fix current playling music list modal (thanks @Demeng)

`2020-12-28`

- fix bug for desktop: max,min,close button not available

`2020-12-27`

- fix bug: can't play favorite playlist
- feature: search all music (beta)
- fix bug: migu playlist shows first 20 tracks
- fix bug: netease/kugou search error not handle
- fix bug: xiami lyric parse error
- change manitest permession config to pass chrome web store review

`2020-12-22`

- fix bug: kuwo music can't be played
- fix bug: after upgrade v2.17.2, my playlist can't be played

`2020-12-20`

- fix play interrupted by copyright notice bug, infinite notice popup bug
- change style for now playing page when using album cover as background
- fix minor bug for qq search and optimaze api handler（thanks @RecluseWind）

`2020-12-12`

- support search songlist for qq music (thanks @RecluseWind）
- fix bug: netease songlist shared by mobile open error (thanks @RecluseWind）
- fix bug: migu search song error

`2020-10-28`

- add local music (desktop version only)

`2020-10-27`

- support search playlist (only for netease by now)
- optimaze lyric display
- fix bilibili artist api, fix lyric time tag format parse error (thanks @RecluseWind)
- optimaze UI, add translate button in now playing page

`2020-10-26`

- add lyric translation support for qq music, xiami music (thanks @RecluseWind)
- update xiami api including get playlist, search, play music (thanks @RecluseWind)
- fix bug some playlist not response in qq music website after installed extension

`2020-10-18`

- add lyric translation, now for netease music only (thanks @reserveword)
- fix bilibili play fail bug
- fix xiami now playing page music cover missing bug
- fix kuwo music can't open bug

`2020-09-12`

- fix netease songlist contains more than 1k tracks import error (thanks @YueShangGuan）
- support album cover as nowplaying background (thanks @YueShangGuan）

`2020-08-24`

- fix xiami songlist only shows part of songs bug (thanks @RecluseWind)
- fix songlist cover and title display bug (thanks @RecluseWind)
- support open url using system default browser for desktop version

`2020-08-04`

- add animation for now playing and current playlist window
- fix xiami cover image not loaded bug (thanks @RecluseWind)
- optimaze open songlist url, support netease toplist, artist, album (thanks @whtiehack)
- optimaze cover image display, avoid resize (thanks @RecluseWind)

`2020-07-10`

- fix migu play fail bug
- support press enter key to search in search bar thanks @kangbb）
- support playlist song count show, support play/pause shortcut, desktop only（thanks @x2009again）
- support restore scrollbar offset when go back（thanks @x2009again for discuss solution）
- optimaze firefox scorlling bar, modify source image url for qq music, fix firefox jquery lib md5 error（thanks @RecluseWind）

`2020-06-29`

- support auto choose source when play fail

`2020-06-28`

- fix netease music only show 10 tracks bug

`2020-04-30`

- fix migu poor music quality bug

`2020-04-27`

- support adding playlist to favorite, special thanks to @zhenyiLiang
- fix migu music
- some minor optimaze

`2019-11-27`

- add frech language, special thanks to @Leoche

`2019-09-07`

- fix migu

`2019-08-09`

- add dark theme

`2019-07-03`

- fix migu play error

`2019-06-24`

- add migu music
- fix kugou play bug
- fix netease play bug

`2019-06-23`

- fix connect to github.com error

`2019-05-26`

- fix kugou music can't play bug

`2019-04-26`

- fix xiami music can't play bug
- fix footer player out of page bug

`2019-03-03`

- fix delete single playlist destroy all playlists bug

`2019-02-26`

- fix qq music songlist not shown bug

`2018-12-30`

- fix songs missing in kuwo playlist
- auto detect language

`2018-12-29`

- fix fail on xiami search
- fix some qq songs fail to play
- fix qq music web visit problem after extension installed

`2018-12-24`

- i18n support, support English language.
- new song will now add to top of playlist
- copyright notification will not mess up the screen

`2018-12-22`

- Version 2.0 released. New UI(Special Thanks to @iparanoid)
- Upgrade jquery, Angular

`2018-12-21`

- Fix xiami playlist bug
- Fix netease playlist only shows one song bug
- Fix bilibili first load duplicate playlists
- Fix can't play some kugou songs
- Fix github gist backup recover bug
- Upgrade soundmanager2

## License

MIT
