module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      textColor: {
        link: 'var(--link-default-color)',
        default: 'var(--text-default-color)',
        subtitle: 'var(--text-subtitle-color)',
        'sidebar-hover': 'var(--sidebar-hover-text-color)',
        icon: 'var(--icon-default-color)',
        play: 'var(--player-icon-color)',
        'play-hover': 'var(--player-icon-hover-color)',
        prevnext: 'var(--player-left-icon-color)'
      },
      backgroundColor: {
        theme: 'var(--theme-background-color)',
        sidebar: 'var(--sidebar-background-color)',
        content: 'var(--content-background-color)',
        'sidebar-hover': 'var(--sidebar-hover-background-color)',
        'search-input': 'var(--search-input-background-color)',
        'footer-main': 'var(--footer-main-background-color)',
        'draggable-bar': 'var(--footer-player-bar-background-color)',
        'draggable-bar-current': 'var(--footer-player-bar-cur-background-color)',
        'draggable-bar-button': 'var(--footer-player-bar-cur-button-color)'
      },
      borderColor: {
        default: 'var(--line-default-color)'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
};
