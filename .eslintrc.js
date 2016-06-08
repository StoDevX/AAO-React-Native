module.exports = {
    parser: 'babel-eslint',
    env: {
        es6: true,
        node: true,
    },
    extends: 'eslint:recommended',
    installedESLint: true,
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            jsx: true,
        }
    },
    plugins: [
        'react',
    ],
    globals: {
        'fetch': true
    },
    rules: {
        'indent': ['error', 2],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'never'],
        'comma-dangle': ['error', 'only-multiline'],
        'react/jsx-uses-vars': ['error'],
        'react/jsx-uses-react': ['error'],
        'no-console': 0,
    },
}
