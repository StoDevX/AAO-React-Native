import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {Form, Grid, Host, LabeledContent, RNHostView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	fixedSize,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers'
import * as Application from 'expo-application'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'
import {Stack, useRouter} from 'expo-router'

import {NavigationRow} from '../../source/components/rows'
import {PagedSection, type Card} from '../../source/features/about/card-carousel'
import {acknowledgements, contributors, creditRows} from '../../source/features/about/credits'
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

/** Each credit and its names. */
const credits = [
	{id: 'contributors', heading: 'Contributors', names: contributors},
	{id: 'acknowledgements', heading: 'Acknowledgements', names: acknowledgements},
]

const version = formatVersion(Application.nativeApplicationVersion, Application.nativeBuildVersion)

/// Who we are: what the app is and where it came from, who made it, and the policies that govern it.
export default function AboutPage(): React.ReactNode {
	let router = useRouter()
	let {fontScale} = useWindowDimensions()

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

					<SheetSection>
						<LabeledContent label="App Version">
							<Text>{version}</Text>
						</LabeledContent>
					</SheetSection>

					<PagedSection cards={timelineCards} title="Our story" />

					{credits.map((credit) => (
						<SheetSection key={credit.id} title={credit.heading}>
							<Grid alignment="topLeading" horizontalSpacing={12} verticalSpacing={4}>
								{creditRows(credit.names, fontScale).map((row) => (
									<Grid.Row key={row[0]}>
										{row.map((name) => (
											<Text
												key={name}
												modifiers={[
													font({textStyle: 'body'}),
													foregroundStyle(c.secondaryLabel),
													frame({maxWidth: Infinity, alignment: 'leading'}),
													// Wrap a long name rather than cut it short.
													fixedSize({horizontal: false, vertical: true}),
												]}
											>
												{name}
											</Text>
										))}
									</Grid.Row>
								))}
							</Grid>
						</SheetSection>
					))}

					<SheetSection>
						<NavigationRow onPress={() => router.navigate('/about/privacy')} title="Privacy" />
						<NavigationRow onPress={() => router.navigate('/about/legal')} title="Legal" />
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
