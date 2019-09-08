// @flow

import React from 'react'
import type {TopLevelViewPropsType} from '../../types'
import {ScrollView, RefreshControl, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '@frogpond/notice'
import {sto} from '../../../lib/colors'
import {Timer} from '@frogpond/timer'

const ERROR_MESSAGE =
	"Make sure you are connected to the St. Olaf Network via eduroam or the VPN. If you are, please report this so we can make sure it doesn't happen again."

type Props = TopLevelViewPropsType & {
	refresh: () => any,
	statusMessage: string,
}

export class StoPrintErrorView extends React.PureComponent<Props> {
	render() {
		let iconName = Platform.select({
			ios: 'ios-bug',
			android: 'md-bug',
		})

		return (
			<Timer
				interval={5000}
				invoke={this.props.refresh}
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
							onPress={() => this.props.navigation.navigate('HelpView')}
							style={styles.notice}
							text={`${this.props.statusMessage} ${ERROR_MESSAGE}`}
						/>
					</ScrollView>
				)}
			/>
		)
	}
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
