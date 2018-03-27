// @flow
import * as React from 'react'
import {FlatList, StyleSheet, Text, View, Platform} from 'react-native'
import {ListSeparator, ListRow} from '../../../components/list'
import {NoticeView} from '../../../components/notice'
import * as c from '../../../components/colors'

type Props = {
	actionLabel?: string,
	emptyHeader: string,
	emptyText: string,
	onAction?: () => any,
	onItemPress: (item: string) => any,
	items: string[],
	title: string,
}

export class RecentItemsList extends React.PureComponent<Props> {
	renderSeparator = () => <ListSeparator spacing={{left: 17, right: 17}} />

	renderItem = ({item}: {item: string}) => (
		<ListRow arrowPosition="none" onPress={() => this.onPressRow(item)}>
			<Text numberOfLines={1} style={styles.listItem}>
				{item}
			</Text>
		</ListRow>
	)

	onPressRow = (item: string) => {
		this.props.onItemPress(item)
	}

	keyExtractor = (item: string) => item

	render() {
		const {
			items,
			actionLabel,
			onAction,
			title,
			emptyHeader,
			emptyText,
		} = this.props
		return (
			<View>
				<View style={styles.rowFlex}>
					{title && <Text style={styles.subHeader}>{title}</Text>}
					{onAction && (
						<Text onPress={onAction} style={styles.sideButton}>
							{actionLabel}
						</Text>
					)}
				</View>
				<FlatList
					ItemSeparatorComponent={this.renderSeparator}
					ListEmptyComponent={
						<NoticeView
							header={emptyHeader}
							style={styles.notice}
							text={emptyText}
							textStyle={styles.noticeText}
						/>
					}
					data={items}
					keyExtractor={this.keyExtractor}
					renderItem={this.renderItem}
					scrollEnabled={false}
				/>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	listItem: {
		paddingVertical: Platform.OS === 'ios' ? 5 : 0,
		paddingLeft: 2,
		fontSize: 16,
		color: c.olevilleGold,
	},
	notice: {
		paddingTop: 30,
		paddingBottom: 35,
	},
	noticeText: {
		color: c.gray,
	},
	rowFlex: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	sideButton: {
		paddingRight: 17,
		fontSize: 16,
		color: c.olevilleGold,
		padding: 14,
	},
	subHeader: {
		fontSize: 20,
		fontWeight: 'bold',
		padding: 10,
		paddingLeft: 17,
	},
})
