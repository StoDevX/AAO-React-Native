// @flow

import * as React from 'react'
import {View, Text} from 'react-native'
import glamorous from 'glamorous-native'
import ReactMarkdown from 'react-markdown'

import propTypes from 'prop-types'
ReactMarkdown.propTypes.containerTagName = propTypes.func

import {Paragraph, Strong, Emph, BlockQuote} from './formatting'
import {Code, HighlightedCodeBlock as CodeBlock} from './code'
import {Heading} from './heading'
import {Link} from './link'
import {Image} from './image'
import {List, ListItem} from './list'

// eslint-disable-next-line react/self-closing-comp
const Softbreak = () => <Text>{'\n'}</Text>
const Hardbreak = () => <Text>&lt;br&gt;</Text>
const HorizontalRule = glamorous.view({
	width: '100%',
	height: 1,
	backgroundColor: 'black',
})

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
		const {styles = {}, source} = this.props
		return (
			<ReactMarkdown
				containerTagName={View}
				renderers={{
					BlockQuote: glamorous(BlockQuote)(styles.BlockQuote),
					Code: glamorous(Code)(styles.Code),
					CodeBlock: glamorous(CodeBlock)(styles.CodeBlock),
					Emph: glamorous(Emph)(styles.Emph),
					Hardbreak,
					Heading: glamorous(Heading)(styles.Heading),
					Image: glamorous(Image)(styles.Image),
					Item: glamorous(ListItem)(styles.ListItem),
					Link: glamorous(Link)(styles.Link),
					List: glamorous(List)(styles.List),
					Paragraph: glamorous(Paragraph)(styles.Paragraph),
					Softbreak,
					Strong: glamorous(Strong)(styles.Strong),
					ThematicBreak: glamorous(HorizontalRule)(styles.ThematicBreak),
				}}
				skipHtml={true}
				source={source}
			/>
		)
	}
}
