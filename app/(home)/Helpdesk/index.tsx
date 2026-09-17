import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import {DisclosureRow} from '../../../source/components/rows'

const styles = StyleSheet.create({
	host: {flex: 1},
})

/** The Helpdesk landing page -- links into Search, Service Catalog, Services A-Z, and the Knowledge Base. */
function HelpdeskHomeView(): React.ReactNode {
	let router = useRouter()

	return (
		<Host matchContents={false} style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section title="Helpdesk">
					<DisclosureRow onPress={() => router.push('/Helpdesk/Search')} title="Search" />
					<DisclosureRow
						onPress={() => router.push('/Helpdesk/ServiceCatalog')}
						title="Service Catalog"
					/>
					<DisclosureRow
						onPress={() => router.push('/Helpdesk/ServicesAtoZ')}
						title="Services A-Z"
					/>
					<DisclosureRow onPress={() => router.push('/Helpdesk/KB')} title="Knowledge Base" />
				</Section>
			</List>
		</Host>
	)
}

export default function HelpdeskHome(): React.ReactNode {
	return (
		<>
			<Stack.Title>Helpdesk</Stack.Title>
			<HelpdeskHomeView />
		</>
	)
}
