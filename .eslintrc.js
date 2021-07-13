module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'plugin:vue/vue3-recommended'
    // 'plugin:vue/vue3-essential', // This option doesn't impose formatting rules
    // 'plugin:vue/vue3-strongly-recommended', // This option imposes formatting rules on your code to improve readability
  ],
  rules: {
    'no-unused-vars': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/html-self-closing': 'off',
    'vue/singleline-html-element-content-newline': 'off'
  }
};
