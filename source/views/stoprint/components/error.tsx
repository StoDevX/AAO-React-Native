import * as React from 'react'
import {Platform, RefreshControl, ScrollView, StyleSheet} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '@frogpond/notice'
import {sto} from '../../../lib/colors'
import {Timer} from '@frogpond/timer'
import {openEmail} from '../../settings/screens/overview/support'

const ERROR_MESSAGE =
	"Make sure you are connected to the St. Olaf Network via eduroam or the VPN. If you are, please report this so we can make sure it doesn't happen again."

type Props = {
	refresh: () => void
	statusMessage: string
}

export function StoPrintErrorView(props: Props): JSX.Element {
	let iconName: string =
		Platform.select({
			ios: 'ios-bug',
			android: 'md-bug',
		}) ?? 'ios-bug'

	return (
		<Timer
			interval={5000}
			invoke={props.refresh}
			moment={false}
			render={({refresh, loading}) => (
				<ScrollView
					contentContainerStyle={styles.content}
					refreshControl={
						<RefreshControl onRefresh={refresh} refreshing={loading} />
					}
					showsVerticalScrollIndicator={false}
					style={styles.container}
				>
					<Icon color={sto.black} name={iconName} size={100} />
					<NoticeView
						buttonText="Report"
						header="Connection Issue"
						onPress={openEmail}
						style={styles.notice}
						text={`${props.statusMessage} ${ERROR_MESSAGE}`}
					/>
				</ScrollView>
			)}
		/>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: sto.white,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	notice: {
		flex: 0,
	},
})
