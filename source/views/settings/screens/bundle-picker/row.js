// @flow
import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import {OutlineBadge as Badge} from '@frogpond/badge'
import * as c from '@frogpond/colors'
import moment from 'moment-timezone'

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
	request: any,
}

export class PullRequestRow extends React.PureComponent<Props> {
	render() {
		const {item} = this.props.request
		const date = moment(item.created_at)
			.startOf('day')
			.fromNow()

		return (
			<ListRow arrowPosition="center" onPress={this.props.onPress}>
				<Row style={styles.title}>
					<Title lines={1} style={styles.titleText}>
						<Text>{item.title}</Text>
					</Title>

					<Badge
						accentColor={c.moneyGreen}
						style={styles.accessoryBadge}
						text={`#${item.number}`}
						textColor={c.hollyGreen}
					/>
				</Row>

				<View style={styles.detailWrapper}>
					<Detail style={styles.detailRow}>{`opened ${date} by ${
						item.user.login
					}`}</Detail>
				</View>
			</ListRow>
		)
	}
}
