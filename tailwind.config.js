module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      textColor: {
        link: 'var(--link-default-color)',
        default: 'var(--text-default-color)',
        'sidebar-hover': 'var(--sidebar-hover-text-color)',
        icon: 'var(--icon-default-color)'
      },
      backgroundColor: {
        theme: 'var(--theme-background-color)',
        sidebar: 'var(--sidebar-background-color)',
        content: 'var(--content-background-color)',
        'sidebar-hover': 'var(--sidebar-hover-background-color)',
        'search-input': 'var(--search-input-background-color)'
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
