// The webview's own background comes from HtmlContent's theme-aware style
// prop, so this only needs to own text colors -- and needs a real
// prefers-color-scheme rule to track it, since none of this is reachable by
// React Native's PlatformColor system once it's inside a WebView document.
export const CSS_CODE_STYLES = `
    <style>
        body {
            font-size: 4.0vmin;
            color: #1c1c1e;
            background-color: transparent;
        }
        pre {
            padding: 0 1em;
            margin: 15px;
            white-space: pre-wrap;
        }
        .string {
                color: #036a07;
            }
        .number {
                color: #b5651d;
            }
        .boolean {
                color: #b22222;
            }
        .null {
                color: #6a3d9a;
            }
        .key {
                color: #0000cc;
            }

        @media (prefers-color-scheme: dark) {
            body {
                color: #f2f2f7;
            }
            .string {
                color: #6fcf6f;
            }
            .number {
                color: #ffb454;
            }
            .boolean {
                color: #ff6b6b;
            }
            .null {
                color: #c39bd3;
            }
            .key {
                color: #6cb6ff;
            }
        }
    </style>
`
