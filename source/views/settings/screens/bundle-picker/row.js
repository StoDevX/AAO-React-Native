// @flow
import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import {OutlineBadge as Badge} from '@frogpond/badge'
import * as c from '@frogpond/colors'
import moment from 'moment-timezone'
import type {GithubResponse} from './types'

const styles = StyleSheet.create({
	title: {
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	titleText: {
		flex: 1,
	},
	detailWrapper: {
		paddingTop: 3,
	},
	detailRow: {
		paddingTop: 0,
	},
	accessoryBadge: {
		marginLeft: 4,
	},
})

type Props = {
	onPress: () => any,
	request: GithubResponse,
}

export class PullRequestRow extends React.PureComponent<Props> {
	render() {
		const {request} = this.props
		const date = moment(request.created_at)
			.startOf('day')
			.fromNow()

		return (
			<ListRow arrowPosition="center" onPress={this.props.onPress}>
				<Row style={styles.title}>
					<Title lines={1} style={styles.titleText}>
						<Text>{request.title}</Text>
					</Title>

					<Badge
						accentColor={c.moneyGreen}
						style={styles.accessoryBadge}
						text={`#${request.number}`}
						textColor={c.hollyGreen}
					/>
				</Row>

				<View style={styles.detailWrapper}>
					<Detail style={styles.detailRow}>{`opened ${date} by ${
						request.user.login
					}`}</Detail>
				</View>
			</ListRow>
		)
	}
}
