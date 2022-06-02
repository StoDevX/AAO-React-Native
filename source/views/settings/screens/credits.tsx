import * as React from 'react'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {data as credits} from '../../../../docs/credits.json'
import glamorous from 'glamorous-native'
import {Platform, StyleSheet} from 'react-native'
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
})

const Title = glamorous.text({
	textAlign: 'center',
	marginTop: 10,
	marginBottom: 5,
	...Platform.select({
		ios: iOSUIKit.largeTitleEmphasizedObject,
		android: material.headlineObject,
	}),
})

const Heading = glamorous(Title)({
	...Platform.select({
		ios: iOSUIKit.subheadEmphasizedObject,
		android: material.titleObject,
	}),
})

const About = glamorous.text({
	...Platform.select({
		ios: iOSUIKit.bodyObject,
		android: material.body1Object,
	}),
	paddingHorizontal: 25,
	paddingTop: 10,
})

const Timeline = glamorous.text({
	...Platform.select({
		ios: iOSUIKit.bodyObject,
		android: material.body1Object,
	}),
	marginHorizontal: 25,
})

const Contributors = glamorous(About)({
	...Platform.select({
		ios: iOSUIKit.footnoteEmphasizedObject,
		android: material.body1Object,
	}),
	textAlign: 'center',
})

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

		<Timeline>
			<Markdown source={credits.timeline} />
		</Timeline>

		<Heading>Contributors</Heading>
		<Contributors>{formatPeopleList(credits.contributors)}</Contributors>

		<Heading>Acknowledgements</Heading>
		<Contributors>{formatPeopleList(credits.acknowledgements)}</Contributors>
	</glamorous.ScrollView>
)
