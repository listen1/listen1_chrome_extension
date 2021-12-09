module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        link: 'var(--link-default-color)',
        default: 'var(--text-default-color)',
        'sidebar-hover': 'var(--sidebar-hover-text-color)'
      }
    },
    backgroundColor: {
      theme: 'var(--theme-background-color)',
      sidebar: 'var(--sidebar-background-color)',
      content: 'var(--content-background-color)',
      'sidebar-hover': 'var(--sidebar-hover-background-color)'
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
};
