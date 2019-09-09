// @flow
import * as React from 'react'
import {FlatList, StyleSheet, Text, View, Platform} from 'react-native'
import {ListSeparator, ListRow} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {type AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@frogpond/app-theme'

type Props = {
	actionLabel?: string,
	emptyHeader: string,
	emptyText: string,
	onAction?: () => any,
	onItemPress: (item: string) => any,
	items: string[],
	title: string,
	theme: AppTheme,
}

class RecentItemsList extends React.PureComponent<Props> {
	renderSeparator = () => <ListSeparator spacing={{left: 17, right: 17}} />

	renderItem = ({item}: {item: string}) => {
		let foreground = {color: this.props.theme.iosPushButtonCellForeground}

		return (
			<ListRow arrowPosition="none" onPress={() => this.onPressRow(item)}>
				<Text numberOfLines={1} style={[foreground, styles.listItem]}>
					{item}
				</Text>
			</ListRow>
		)
	}

	onPressRow = (item: string) => {
		this.props.onItemPress(item)
	}

	keyExtractor = (item: string) => item

	render() {
		let {
			items,
			actionLabel,
			onAction,
			title,
			emptyHeader,
			emptyText,
			theme,
		} = this.props

		let foreground = {color: theme.iosPushButtonCellForeground}

		return (
			<View>
				<View style={styles.rowFlex}>
					{title && <Text style={styles.subHeader}>{title}</Text>}
					{onAction && (
						<Text onPress={onAction} style={[foreground, styles.sideButton]}>
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
					// TODO(react-native@0.58): enable this once React Native no longer dies when opening Settings
					//scrollEnabled={false}
				/>
			</View>
		)
	}
}

export const RawRecentItemsList = RecentItemsList

const ThemedRecentItemsList = withTheme(RecentItemsList)

export {ThemedRecentItemsList as RecentItemsList}

const styles = StyleSheet.create({
	listItem: {
		paddingVertical: Platform.OS === 'ios' ? 5 : 0,
		paddingLeft: 2,
		fontSize: 16,
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
		padding: 14,
	},
	subHeader: {
		fontSize: 20,
		fontWeight: 'bold',
		padding: 10,
		paddingLeft: 17,
	},
})
