import * as React from 'react'
import * as c from '@frogpond/colors'
import {Markdown, MarkdownProps} from '@frogpond/markdown'
import {data as credits} from '../../../../docs/credits.json'
import glamorous from 'glamorous-native'
import {Platform, StyleSheet, Text, TextProps} from 'react-native'
import {iOSUIKit, material} from 'react-native-typography'
import {AppLogo} from '../components/logo'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
	contentContainer: {
		paddingHorizontal: 5,
		paddingVertical: 10,
	},
	title: {
		textAlign: 'center',
		marginTop: 10,
		marginBottom: 5,
		...Platform.select({
			ios: iOSUIKit.largeTitleEmphasizedObject,
			android: material.headlineObject,
		}),
	},
	heading: {
		...Platform.select({
			ios: iOSUIKit.subheadEmphasizedObject,
			android: material.titleObject,
		}),
	},
	about: {
		...Platform.select({
			ios: iOSUIKit.bodyObject,
			android: material.body1Object,
		}),
		paddingHorizontal: 25,
		paddingTop: 10,
	},
	contributors: {
		...Platform.select({
			ios: iOSUIKit.footnoteEmphasizedObject,
			android: material.body1Object,
		}),
		textAlign: 'center',
	},
})

const markdownStyles: MarkdownProps['styles'] = {
	Heading: {
		paddingHorizontal: 25,
	},
	Paragraph: {
		paddingHorizontal: 25,
		paddingVertical: 10,
	},
}

const Title = (props: TextProps) => (
	<Text {...props} style={[styles.title, props.style]} />
)

const Heading = (props: TextProps) => (
	<Title {...props} style={[styles.heading, props.style]} />
)

const About = (props: TextProps) => (
	<Text {...props} style={[styles.about, props.style]} />
)

const Contributors = (props: TextProps) => (
	<About {...props} style={[styles.contributors, props.style]} />
)

const formatPeopleList = (arr: Array<string>) =>
	arr.map((w) => w.replace(' ', ' ')).join(' • ')

export let CreditsView = (): JSX.Element => (
	<glamorous.ScrollView
		contentContainerStyle={styles.contentContainer}
		contentInsetAdjustmentBehavior="automatic"
		style={styles.container}
	>
		<AppLogo />

		<Title>{credits.name}</Title>
		<About>{credits.content}</About>

		<Markdown source={credits.timeline} styles={markdownStyles} />

		<Heading>Contributors</Heading>
		<Contributors>{formatPeopleList(credits.contributors)}</Contributors>

		<Heading>Acknowledgements</Heading>
		<Contributors>{formatPeopleList(credits.acknowledgements)}</Contributors>
	</glamorous.ScrollView>
)
