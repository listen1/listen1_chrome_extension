
// var arrLang = {
//   'en': {
//     'songList' : 'Song List',
//     'myList' : 'My Song List',
//     'search' : 'Search',
//     'about' : 'About'
//   },
 //   'cn': {
//     'songList' : '精选歌单',
//     'myList' : '我的歌单',
//     'search' : '快速搜索',
//     'about' : '关于'
//   }
// }
var arrLang = new Array()
arrLang['en'] = new Array();
arrLang['cn'] = new Array();

arrLang['en']['songList'] = 'Song List';
arrLang['en']['myList'] = 'My Song List';
arrLang['en']['search'] = 'Search';
arrLang['en']['about'] = 'About';;
arrLang['cn']['songList'] = '精选歌单';
arrLang['cn']['myList'] = '我的歌单';
arrLang['cn']['search'] = '快速搜索';
arrLang['cn']['about'] = '关于';


$(document).ready(function(){
    $('.translate').click(function(){
        var lang = $(this).attr('id');
        $('.lang').each(function(i){
            $(this).text(arrLang[lang][$(this).attr('key')]);
        });
    });
});