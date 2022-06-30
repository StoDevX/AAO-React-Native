import * as React from 'react'
import {
	StyleProp,
	TextProps,
	TextStyle,
	View,
	ViewProps,
	ViewStyle,
	Text,
} from 'react-native'
import glamorous from 'glamorous-native'
import ReactMarkdown from 'react-markdown'

import propTypes from 'prop-types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(ReactMarkdown as any).propTypes.containerTagName = propTypes.func

import {Paragraph, Strong, Emph, BlockQuote} from './formatting'
import {Code, CodeBlock} from './code'
import {Heading} from './heading'
import {Link} from './link'
import {Image} from './image'
import {List, ListItem} from './list'

const Softbreak = (props: TextProps) => <Text {...props}> </Text>
const Hardbreak = (props: TextProps) => <Text {...props}>{'\n'}</Text>
const HorizontalRule = glamorous.view({
	width: '100%',
	height: 1,
	backgroundColor: 'black',
})

type Props = {
	styles?: {
		BlockQuote?: StyleProp<TextStyle>
		Code?: StyleProp<TextStyle>
		CodeBlock?: StyleProp<TextStyle>
		Emph?: StyleProp<TextStyle>
		Heading?: StyleProp<TextStyle>
		Image?: StyleProp<ViewStyle>
		ListItem?: StyleProp<TextStyle>
		Link?: StyleProp<TextStyle>
		List?: StyleProp<ViewStyle>
		Paragraph?: StyleProp<TextStyle>
		Strong?: StyleProp<TextStyle>
		ThematicBreak?: StyleProp<TextStyle>
	}
	source: string
}

export class Markdown extends React.PureComponent<Props> {
	render(): JSX.Element {
		const {styles = {}, source} = this.props
		return (
			<ReactMarkdown
				containerTagName={View as unknown as string}
				renderers={{
					BlockQuote: (props: TextProps) => (
						<BlockQuote {...props} style={[styles.BlockQuote, props.style]} />
					),
					Code: (props: TextProps) => (
						<Code style={[styles.Code, props.style]} />
					),
					CodeBlock: (props: TextProps) => (
						<CodeBlock style={[styles.CodeBlock, props.style]} />
					),
					Emph: (props: TextProps) => (
						<Emph style={[styles.Emph, props.style]} />
					),
					Hardbreak,
					Heading: (props: TextProps & {level: number}) => (
						<Heading {...props} style={[styles.Heading, props.style]} />
					),
					Image: (props) => (
						<Image {...props} style={[styles.Image, props.style]} />
					),
					Item: (props: TextProps) => (
						<ListItem {...props} style={[styles.ListItem, props.style]} />
					),
					Link: (props: TextProps & {href: string; title: string}) => (
						<Link {...props} style={[styles.Link, props.style]} />
					),
					List: (props: TextProps) => (
						<List {...props} style={[styles.List, props.style]} />
					),
					Paragraph: (props: TextProps) => (
						<Paragraph {...props} style={[styles.Paragraph, props.style]} />
					),
					Softbreak,
					Strong: (props: TextProps) => (
						<Strong {...props} style={[styles.Strong, props.style]} />
					),
					ThematicBreak: (props: ViewProps) => (
						<HorizontalRule
							{...props}
							style={[styles.ThematicBreak, props.style]}
						/>
					),
				}}
				skipHtml={true}
				source={source}
			/>
		)
	}
}
