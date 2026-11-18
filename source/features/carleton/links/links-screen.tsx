import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {DisclosureRow} from '../../../components/rows'
import {LINKS} from './links'

export function LinksScreen(): React.ReactNode {
	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section>
					{LINKS.map((link) => (
						<DisclosureRow
							key={link.url}
							destination="external"
							detail={link.description}
							image={{systemName: link.icon}}
							onPress={() => openUrl(link.url)}
							title={link.title}
						/>
					))}
				</Section>
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
