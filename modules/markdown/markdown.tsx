import * as React from 'react'
import {StyleProp, TextStyle, View, ViewStyle} from 'react-native'
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

const Softbreak = () => ' '
const Hardbreak = () => '\n'
const HorizontalRule = glamorous.view({
	width: '100%',
	height: 1,
	backgroundColor: 'black',
})

type Props = {
	styles?: {
		BlockQuote: StyleProp<TextStyle>
		Code: StyleProp<TextStyle>
		CodeBlock: StyleProp<TextStyle>
		Emph: StyleProp<TextStyle>
		Heading: StyleProp<TextStyle>
		Image: StyleProp<ViewStyle>
		ListItem: StyleProp<TextStyle>
		Link: StyleProp<TextStyle>
		List: StyleProp<ViewStyle>
		Paragraph: StyleProp<TextStyle>
		Strong: StyleProp<TextStyle>
		ThematicBreak: StyleProp<TextStyle>
	}
	source: string
}

type MarkdownBlockEnum = keyof Props['styles']

export class Markdown extends React.PureComponent<Props> {
	render(): JSX.Element {
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
