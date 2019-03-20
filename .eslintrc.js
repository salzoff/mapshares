module.exports = {
    root: true,
    env: {
    node: true
    },
    'extends': [
    'plugin:vue/essential',
    '@vue/standard'
    ],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'indent': ['error', 4, { SwitchCase: 1 }],
        'no-extra-semi': 'off',
        'semi': [2, 'always'],
        'space-before-function-paren': 'off'
    },
    parserOptions: {
    parser: 'babel-eslint'
    }
}
