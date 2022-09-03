/* eslint-disable no-unused-vars: "error" */
class UiAnimation {

  useMordernTheme = () => {
    const rotatemark = document.getElementById('rotatemark');
    const circlmark = document.getElementById('circlmark');
    return circlmark !== null && rotatemark !== null;
  }

  skipAnimation(){
        if (this.useMordernTheme) {
          const rotatemark = document.getElementById('rotatemark');
          const circlmark = document.getElementById('circlmark');
          circlmark.classList.add('circlmark');
          rotatemark.classList.add('rotatemark');
          circlmark.addEventListener('animationend', () => {
            circlmark.classList.remove('circlmark');
          });
          rotatemark.addEventListener('animationend', () => {
            rotatemark.classList.remove('rotatemark');
          });
        }
  }

   /**
     * Skip to the next or previous track animation.
     * @param  {Number} rdx Index of the song in the playlist.
     * @param  {Number} l Length of playlist.
     */
  changeImg(rdx,l) {

    function x(musicId) {
      if (musicId < 0) {
        return l + musicId;
      }
      if (musicId > l - 1) {
        return musicId - l;
      }
      return musicId;
    }

      if(this.useMordernTheme){
      // const l = this.playlist.length;
      const li = document.querySelectorAll('.footer .cover li');

      
      if (l === 1) {
        li[0].className = 'b';
      } else if (l === 2) {
        li[x(rdx)].className = 'b';
        li[x(rdx + 1)].className = 'c';
      } else if (l === 3) {
        li[x(rdx - 1)].className = 'a';
        li[x(rdx)].className = 'b';
        li[x(rdx + 1)].className = 'c';
      } else if (l === 4) {
        li[x(rdx - 1)].className = 'a';
        li[x(rdx)].className = 'b';
        li[x(rdx + 1)].className = 'c';
        li[x(rdx + 2)].className = 'def';
      } else {
        for (let i = 0; i < l; i += 1) {
          li[i].className = 'hid';
        }
        li[x(rdx - 2)].className = 'def';
        li[x(rdx - 1)].className = 'a';
        li[x(rdx)].className = 'b';
        li[x(rdx + 1)].className = 'c';
        li[x(rdx + 2)].className = 'def';
      }
      li[x(rdx)].classList.add('rotatecircl');
    }        
  }
}

