module.exports = {
    env: {
        es6: true,
        node: true,
    },
    extends: "eslint:recommended",
    installedESLint: true,
    parserOptions: {
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            jsx: true,
        }
    },
    plugins: [
        "react"
    ],
    rules: {
        "indent": ["error", 2],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "never"],
        "comma-dangle": ["error", "only-multiline"],
    },
}
