import * as React from 'react'
import {
	StyleProp,
	TextProps,
	TextStyle,
	View,
	ViewProps,
	ViewStyle,
	Text,
	StyleSheet,
	ImageStyle,
} from 'react-native'
import ReactMarkdown from 'react-markdown'

import propTypes from 'prop-types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(ReactMarkdown as any).propTypes.containerTagName = propTypes.func

import * as c from '@frogpond/colors'
import {Paragraph, Strong, Emph, BlockQuote} from './formatting'
import {Code, CodeBlock} from './code'
import {Heading} from './heading'
import {Link} from './link'
import {Image} from './image'
import {List, ListItem} from './list'

const baseStyles = StyleSheet.create({
	horizontalRule: {
		width: '100%',
		height: 1,
		backgroundColor: c.separator,
	},
})

const Softbreak = (props: TextProps) => <Text {...props}> </Text>
const Hardbreak = (props: TextProps) => <Text {...props}>{'\n'}</Text>
const HorizontalRule = (props: ViewProps) => (
	<View {...props} style={[baseStyles.horizontalRule, props.style]} />
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
		const {
			styles = {
				Heading: {color: c.label},
				Paragraph: {color: c.label},
			},
			source,
		} = this.props
		return (
			<ReactMarkdown
				containerTagName={View as unknown as string}
				renderers={{
					BlockQuote: (props: Parameters<typeof BlockQuote>[0]) => (
						<BlockQuote {...props} style={[styles.BlockQuote, props.style]} />
					),
					Code: (props: Parameters<typeof Code>[0]) => (
						<Code style={[styles.Code, props.style]} />
					),
					CodeBlock: (props: Parameters<typeof CodeBlock>[0]) => (
						<CodeBlock style={[styles.CodeBlock, props.style]} />
					),
					Emph: (props: Parameters<typeof Emph>[0]) => (
						<Emph style={[styles.Emph, props.style]} />
					),
					Hardbreak,
					Heading: (props: Parameters<typeof Heading>[0] & {level: number}) => (
						<Heading {...props} style={[styles.Heading, props.style]} />
					),
					Image: (props: Parameters<typeof Image>[0]) => (
						<Image {...props} style={[styles.Image, props.style]} />
					),
					Item: (props: Parameters<typeof ListItem>[0]) => (
						<ListItem {...props} style={[styles.ListItem, props.style]} />
					),
					Link: (
						props: Parameters<typeof Link>[0] & {href: string; title: string},
					) => <Link {...props} style={[styles.Link, props.style]} />,
					List: (props: Parameters<typeof List>[0]) => (
						<List {...props} style={[styles.List, props.style]} />
					),
					Paragraph: (props: Parameters<typeof Paragraph>[0]) => (
						<Paragraph {...props} style={[styles.Paragraph, props.style]} />
					),
					Softbreak,
					Strong: (props: Parameters<typeof Strong>[0]) => (
						<Strong {...props} style={[styles.Strong, props.style]} />
					),
					ThematicBreak: (props: Parameters<typeof HorizontalRule>[0]) => (
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
