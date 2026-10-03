import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, LabeledContent, RNHostView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	font,
	foregroundStyle,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers'
import * as Application from 'expo-application'
import * as c from '@frogpond/colors'
import {Stack, useRouter} from 'expo-router'

import {NavigationRow} from '../../source/components/rows'
import {CardCarousel, type Card} from '../../source/features/about/card-carousel'
import {acknowledgements, contributors, formatPeopleList} from '../../source/features/about/credits'
import {AppLogo} from '../../source/features/about/logo'
import {INTRO, timeline} from '../../source/features/about/timeline'
import {formatVersion} from '../../source/features/about/version'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

const BARE_ROW = [
	listRowBackground('clear'),
	listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
	listRowSeparator('hidden'),
]

const timelineCards: Array<Card> = timeline.map((era) => ({
	id: era.period,
	heading: era.period,
	body: era.story,
}))

const creditCards: Array<Card> = [
	{id: 'contributors', heading: 'Contributors', body: formatPeopleList(contributors)},
	{id: 'acknowledgements', heading: 'Acknowledgements', body: formatPeopleList(acknowledgements)},
]

const version = formatVersion(Application.nativeApplicationVersion, Application.nativeBuildVersion)

/// Who we are: what the app is and where it came from, who made it, and the policies that govern it.
export default function AboutPage(): React.ReactNode {
	let router = useRouter()

	return (
		<>
			<Stack.Title>About</Stack.Title>

			<Host modifiers={[accessibilityIdentifier('screen-about')]} style={styles.host}>
				<Form>
					<VStack modifiers={BARE_ROW} spacing={8}>
						<RNHostView matchContents={true}>
							<AppLogo />
						</RNHostView>
						<Text
							modifiers={[font({textStyle: 'title2', weight: 'bold'}), foregroundStyle(c.label)]}
						>
							All About Olaf
						</Text>
						<Text
							modifiers={[
								font({textStyle: 'subheadline'}),
								foregroundStyle(c.secondaryLabel),
								multilineTextAlignment('center'),
							]}
						>
							{INTRO}
						</Text>
					</VStack>

					<Section>
						<LabeledContent label="Version">
							<Text>{version}</Text>
						</LabeledContent>
					</Section>

					<Section title="Our story">
						<CardCarousel cards={timelineCards} />
					</Section>

					<Section title="Credits">
						<CardCarousel cards={creditCards} />
					</Section>

					<Section>
						<NavigationRow onPress={() => router.navigate('/about/privacy')} title="Privacy" />
						<NavigationRow onPress={() => router.navigate('/about/legal')} title="Legal" />
					</Section>
				</Form>
			</Host>
		</>
	)
}
