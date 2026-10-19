import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {FeatureRequestsBoard} from '@frogpond/feature-requests'
import {useNavigation} from 'expo-router'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

/// Anonymous feature requests, voted on and discussed on KickstartSignal's board.
/// The board draws its own navigation bar, so the router's header is hidden.
export default function FeatureRequestsPage(): React.ReactNode {
	let navigation = useNavigation()

	return (
		<Host
			matchContents={false}
			modifiers={[accessibilityIdentifier('screen-feature-requests')]}
			style={styles.host}
		>
			<FeatureRequestsBoard onBack={() => navigation.goBack()} />
		</Host>
	)
}
