// @flow
import * as React from 'react'
import {FlatList, StyleSheet, Text, View, Platform} from 'react-native'
import {ListSeparator, ListRow} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {useTheme} from '@frogpond/theme'

type Props = {
	actionLabel?: string,
	emptyHeader: string,
	emptyText: string,
	onAction?: () => any,
	onItemPress: (item: string) => any,
	items: string[],
	title: string,
}

export function RecentItemsList(props: Props) {
	let {items, actionLabel, onAction, title, emptyHeader, emptyText} = props
	let theme = useTheme()

	let foreground = {color: theme.iosPushButtonCellForeground}

	let renderItem = ({item}: {item: string}) => (
		<ListRow arrowPosition="none" onPress={() => props.onItemPress(item)}>
			<Text numberOfLines={1} style={[foreground, styles.listItem]}>
				{item}
			</Text>
		</ListRow>
	)

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
				ItemSeparatorComponent={() => (
					<ListSeparator spacing={{left: 17, right: 17}} />
				)}
				ListEmptyComponent={
					<NoticeView
						header={emptyHeader}
						style={styles.notice}
						text={emptyText}
						textStyle={styles.noticeText}
					/>
				}
				data={items}
				keyExtractor={(item: string) => item}
				renderItem={renderItem}
				// TODO(react-native@0.58): enable this once React Native no longer dies when opening Settings
				//scrollEnabled={false}
			/>
		</View>
	)
}

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
