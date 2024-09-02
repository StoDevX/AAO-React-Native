import * as React from 'react'
import * as c from '@frogpond/colors'
import {Platform, ScrollView, StyleSheet, TextProps, Text} from 'react-native'
import {iOSUIKit, material} from 'react-native-typography'
import {AppLogo} from '../components/logo'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		paddingHorizontal: 25,
		paddingVertical: 10,
	},
	title: {
		textAlign: 'center',
		marginTop: 15,
		marginBottom: 20,
		...Platform.select({
			ios: iOSUIKit.largeTitleEmphasizedObject,
			android: material.headlineObject,
		}),
		color: c.label,
	},
	heading: {
		marginTop: 20,
		marginBottom: 4,
		...Platform.select({
			ios: iOSUIKit.subheadEmphasizedObject,
			android: material.titleObject,
		}),
		color: c.label,
	},
	about: {
		...Platform.select({
			ios: iOSUIKit.bodyObject,
			android: material.body1Object,
		}),
		paddingHorizontal: 25,
		paddingTop: 10,
		color: c.label,
	},
	contributors: {
		...Platform.select({
			ios: iOSUIKit.footnoteEmphasizedObject,
			android: material.body1Object,
		}),
		textAlign: 'center',
		color: c.secondaryLabel,
	},
})

const Title = (props: TextProps) => (
	<Text {...props} style={[styles.title, props.style]} />
)

const Heading = (props: Parameters<typeof Title>[0]) => (
	<Title {...props} style={[styles.heading, props.style]} />
)

const About = (props: TextProps) => (
	<Text {...props} style={[styles.about, props.style]} />
)

const Contributors = (props: TextProps) => (
	<Text {...props} style={[styles.contributors, props.style]} />
)

const formatPeopleList = (arr: Array<string>) =>
	arr.map((w) => w.replace(' ', ' ')).join(' • ')

const contributors = [
	'Anna Linden',
	'Drew Turnblad',
	'Drew Volz',
	'Elijah Verdoorn',
	'Erich Kauffman',
	'Hannes Carlsen',
	'Hawken Rives',
	'Kris Rye',
	'Margaret Zimmermann',
	'Matt Kilens',
]

const acknowledgements = [
	'Brandon Cash',
	'Catherine Paro',
	'Dan Beach',
	'Derek Hanson',
	'Emma Lind',
	'Kris Vatter',
	'Laura Mascotti',
	'Myron Engle',
	'Nick Nooney',
	'Sarah Bresnahan',
	'William Seabrook',
]

export let CreditsView = (): JSX.Element => (
	<ScrollView
		contentContainerStyle={styles.contentContainer}
		contentInsetAdjustmentBehavior="automatic"
		style={styles.container}
	>
		<AppLogo />

		<Title>All About Olaf</Title>
		<About>
			All About Olaf is a collaborative application created by alumni of St. 
			Olaf College in Northfield, MN under the name StoDevX.
		</About>

		<Heading>🏡 October 2017 — Today</Heading>
		<About>
			Alumni of St. Olaf — Hawken Rives, Kris Rye, and Drew Volz — develop and
			support the app in its current form. Rewritten from top to bottom in
			Typescript, this is the version you see today in the iOS and Android app
			stores. It remains self-published, open-source, cross-platform, and free
			of trackers and data collection.
		</About>

		<Heading>🧱 July 2016 — September 2017</Heading>
		<About>
			This version was written in the summer of 2016, led by Elijah Verdoorn and
			assisted by Hawken Rives and Drew Volz. The app was supported and
			published by the Student Government Association (SGA) web team, called the
			Oleville Development Team.
		</About>

		<Heading>🏗 2014</Heading>
		<About>
			The first version of All About Olaf was an iOS app created by Drew Volz as
			an independent project, self-published and written in Objective-C.
		</About>

		<Heading>Contributors</Heading>
		<Contributors>{formatPeopleList(contributors)}</Contributors>

		<Heading>Acknowledgements</Heading>
		<Contributors>{formatPeopleList(acknowledgements)}</Contributors>
	</ScrollView>
)
