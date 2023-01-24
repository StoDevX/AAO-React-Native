import * as c from '@frogpond/colors'

export const CSS_CODE_STYLES = `
    <style>
        body {
            font-size: 4.0vmin;
        }
        pre {
            padding: 0 1em;
            margin: 15px;
            white-space: pre-wrap;
        }
        .string {
                color:  ${c.coffee};
            }
        .number {
                color: ${c.burntOrange};
            }
        .boolean {
                color: ${c.brickRed};
            }
        .null {
                color: ${c.purple};
            }
        .key {
                color: ${c.blue};
            }
    </style>
`
