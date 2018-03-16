// @flow
import * as React from 'react'
import {FlatList, StyleSheet, Text} from 'react-native'
import {ListSeparator, ListRow} from '../../../components/list'
import {NoticeView} from '../../../components/notice'
import * as c from '../../../components/colors'

type Props = {
	onQueryPress: (query: string) => any,
	queries: string[],
}

export class RecentSearchList extends React.PureComponent<Props> {
	renderSeparator = () => <ListSeparator spacing={{left: 17, right: 17}} />

	renderItem = ({item}: {item: string}) => (
		<ListRow arrowPosition="none" onPress={() => this.onPressRow(item)}>
			<Text style={styles.listItem}>{item}</Text>
		</ListRow>
	)

	onPressRow = (query: string) => {
		this.props.onQueryPress(query)
	}

	keyExtractor = (item: string) => item

	render() {
		const {queries} = this.props
		return (
			<FlatList
				ItemSeparatorComponent={this.renderSeparator}
				ListEmptyComponent={
					<NoticeView
						header="No recent searches"
						style={styles.notice}
						text="Your recent searches will appear here."
					/>
				}
				data={queries}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
				scrollEnabled={false}
			/>
		)
	}
}

const styles = StyleSheet.create({
	listItem: {
		paddingVertical: 5,
		paddingLeft: 2,
		fontSize: 18,
		color: c.olevilleGold,
	},
	notice: {
		paddingBottom: 35,
	},
})
