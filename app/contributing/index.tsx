import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Text} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, font, foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'
import {trackedOpenUrl} from '@frogpond/open-url'
import {Stack, useRouter} from 'expo-router'

import {DisclosureRow, NavigationRow} from '../../source/components/rows'
import {useCampusSection, useLegacyCampus} from '../../source/features/campus/store'
import {dataSourcesFor} from '../../source/features/contributing/data-sources'
import {openEmail} from '../../source/features/support/open-email'
import {GH_BASE_URL} from '../../source/lib/constants'

const OSM_URL = 'https://www.openstreetmap.org/'
const CCC_SERVER_URL = 'https://github.com/frog-pond/ccc-server'

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
	let campus = useLegacyCampus()
	let {appName} = useCampusSection('branding')

	return (
		<>
			<Stack.Title>Contributing</Stack.Title>

			<Host modifiers={[accessibilityIdentifier('screen-contributing')]} style={styles.host}>
				<Form>
					<SheetSection title="Send feedback">
						<NavigationRow
							onPress={() => router.navigate('/report-problem')}
							title="Report a Problem"
						/>
					</SheetSection>

					<SheetSection title="Other questions?">
						<DisclosureRow destination="action" onPress={openEmail} title="Email us" />
					</SheetSection>

					<SheetSection title="We have source code">
						<Blurb>
							{`${appName} and the server behind it are open source on GitHub. Read the code, report a bug, or send a change.`}
						</Blurb>
						<DisclosureRow
							destination="external"
							detail="This app"
							onPress={() => trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})}
							title={appName}
						/>
						<DisclosureRow
							destination="external"
							detail="The server that gathers the app’s data"
							onPress={() => trackedOpenUrl({url: CCC_SERVER_URL})}
							title="ccc-server"
						/>
					</SheetSection>

					<SheetSection title="OpenStreetMap">
						<Blurb>
							The campus map is drawn from OpenStreetMap, a map anyone can edit. If something on
							campus is missing or wrong, you can fix it there.
						</Blurb>
						<DisclosureRow
							destination="external"
							onPress={() => trackedOpenUrl({url: OSM_URL})}
							title="OpenStreetMap"
						/>
					</SheetSection>

					<SheetSection title="Data sources">
						{dataSourcesFor(campus).map((source) => (
							<DisclosureRow
								destination="external"
								detail={source.provides}
								key={source.name}
								onPress={() => trackedOpenUrl({url: source.url})}
								title={source.name}
							/>
						))}
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
