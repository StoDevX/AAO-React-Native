import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Section, Text} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, font, foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {trackedOpenUrl} from '@frogpond/open-url'
import {Stack, useRouter} from 'expo-router'

import {DisclosureRow, NavigationRow} from '../../source/components/rows'
import {dataSources} from '../../source/features/contributing/data-sources'
import {openEmail} from '../../source/features/support/open-email'
import {GH_BASE_URL} from '../../source/lib/constants'

const OSM_URL = 'https://www.openstreetmap.org/'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

/// A paragraph at the top of a section, above its rows.
function Blurb({children}: {children: string}): React.ReactNode {
	return (
		<Text modifiers={[font({textStyle: 'subheadline'}), foregroundStyle(c.secondaryLabel)]}>
			{children}
		</Text>
	)
}

/// How to help build the app and its data, and where that data comes from.
export default function ContributingPage(): React.ReactNode {
	let router = useRouter()

	return (
		<>
			<Stack.Title>Contributing</Stack.Title>

			<Host modifiers={[accessibilityIdentifier('screen-contributing')]} style={styles.host}>
				<Form>
					<Section title="We have source code">
						<Blurb>
							All About Olaf is open source. Read the code, report a bug, or send a change.
						</Blurb>
						<DisclosureRow
							destination="external"
							onPress={() => trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})}
							title="GitHub"
						/>
					</Section>

					<Section title="Send feedback">
						<NavigationRow
							onPress={() => router.navigate('/report-problem')}
							title="Report a Problem"
						/>
					</Section>

					<Section title="OpenStreetMap">
						<Blurb>
							The campus map is drawn from OpenStreetMap, a map anyone can edit. If something on
							campus is missing or wrong, you can fix it there.
						</Blurb>
						<DisclosureRow
							destination="external"
							onPress={() => trackedOpenUrl({url: OSM_URL})}
							title="OpenStreetMap"
						/>
					</Section>

					<Section title="Data sources">
						{dataSources.map((source) => (
							<DisclosureRow
								destination="external"
								detail={source.provides}
								key={source.name}
								onPress={() => trackedOpenUrl({url: source.url})}
								title={source.name}
							/>
						))}
					</Section>

					<Section title="Other questions?">
						<DisclosureRow destination="action" onPress={openEmail} title="Email us" />
					</Section>
				</Form>
			</Host>
		</>
	)
}
