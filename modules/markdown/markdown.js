// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import HTMLView from 'react-native-htmlview'
import marked from 'marked'

import propTypes from 'prop-types'

type MarkdownBlockEnum =
	| 'BlockQuote'
	| 'Code'
	| 'CodeBlock'
	| 'Emph'
	| 'Heading'
	| 'Image'
	| 'ListItem'
	| 'Link'
	| 'List'
	| 'Paragraph'
	| 'Strong'
	| 'ThematicBreak'

type StyleSheetRule = number | Object | Array<StyleSheetRule>

type Props = {
	styles?: {[key: MarkdownBlockEnum]: ?StyleSheetRule},
	source: string,
}

export class Markdown extends React.PureComponent<Props> {
	render() {
		let {styles = {}, source} = this.props
		let html = marked(source, {gfm: true})

		return <HTMLView value={html} stylesheet={styles} />
	}
}
