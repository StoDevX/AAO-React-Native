import * as React from 'react'
import {RefreshControl, ScrollView, StyleSheet} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {openEmail} from '../../support/open-email'

const ERROR_MESSAGE =
	"Make sure you are connected to the St. Olaf Network via eduroam or the VPN. If you are, please report this so we can make sure it doesn't happen again."

type Props = {
	onRefresh: () => void
	refreshing: boolean
	statusMessage: string
}

export function StoPrintErrorView(props: Props): React.ReactNode {
	return (
		<ScrollView
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={<RefreshControl onRefresh={props.onRefresh} refreshing={props.refreshing} />}
			showsVerticalScrollIndicator={false}
			style={styles.container}
		>
			<NoticeView
				action={{label: 'Report', onPress: openEmail}}
				description={`${props.statusMessage} ${ERROR_MESSAGE}`}
				systemImage="exclamationmark.triangle"
				title="Connection Issue"
			/>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemGroupedBackground,
	},
	content: {
		flex: 1,
	},
})
