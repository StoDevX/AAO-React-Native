// @flow

import * as React from 'react'
import glamorous from 'glamorous-native'

export const Code = glamorous.text({})

export const CodeBlock = glamorous.text({})

type Props = {nodeKey: any, language?: string, literal: string}

export class HighlightedCodeBlock extends React.PureComponent<Props> {
  render() {
    const {nodeKey, language, literal} = this.props
    return (
      <CodeBlock key={nodeKey} language={language}>
        <Code>{literal}</Code>
      </CodeBlock>
    )
  }
}
