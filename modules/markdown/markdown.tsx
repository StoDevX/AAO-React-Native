import * as React from 'react'
import {
	Image,
	ImageProps,
	ImageStyle,
	StyleProp,
	StyleSheet,
	Text,
	TextProps,
	TextStyle,
	View,
	ViewProps,
	ViewStyle,
} from 'react-native'
import ReactMarkdown from 'react-markdown'

import propTypes from 'prop-types'
import {BlockQuote, Emph, Paragraph, Strong} from './formatting'
import {Code, CodeBlock} from './code'
import {Heading} from './heading'
import {Link} from './link'
import {List, ListItem} from './list'

;(ReactMarkdown as any).propTypes.containerTagName = propTypes.func

const styles = StyleSheet.create({
	hr: {
		width: '100%',
		height: 1,
		backgroundColor: 'black',
	},
})

const Softbreak = (props: TextProps) => <Text {...props}> </Text>
const Hardbreak = (props: TextProps) => <Text {...props}>{'\n'}</Text>
const HorizontalRule = (props: ViewProps) => (
	<View {...props} style={[styles.hr, props.style]} />
)

export type MarkdownProps = {
	styles?: {
		BlockQuote?: StyleProp<TextStyle>
		Code?: StyleProp<TextStyle>
		CodeBlock?: StyleProp<TextStyle>
		Emph?: StyleProp<TextStyle>
		Heading?: StyleProp<TextStyle>
		Image?: StyleProp<ImageStyle>
		ListItem?: StyleProp<TextStyle>
		Link?: StyleProp<TextStyle>
		List?: StyleProp<ViewStyle>
		Paragraph?: StyleProp<TextStyle>
		Strong?: StyleProp<TextStyle>
		ThematicBreak?: StyleProp<TextStyle>
	}
	source: string
}

export class Markdown extends React.PureComponent<MarkdownProps> {
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
					Image: (props: ImageProps) => (
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
