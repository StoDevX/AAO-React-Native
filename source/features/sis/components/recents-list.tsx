import * as React from 'react'
import {StyleSheet, Text, View, Platform, Pressable} from 'react-native'
import {ListSeparator, ListRow} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {noop} from 'lodash'

type Props = {
	actionLabel?: string
	emptyHeader: string
	emptyText: string
	onAction?: () => void
	onItemPress: (item: string) => void
	items: string[]
	title: string
}

function RecentItemsList(props: Props): React.ReactNode {
	let {items, actionLabel, onAction, title, emptyHeader, emptyText} = props

	let foreground = {color: c.link}

	return (
		<>
			<View style={styles.rowFlex}>
				{Boolean(title) && <Text style={styles.subHeader}>{title}</Text>}
				{onAction && (
					<Text onPress={onAction} style={[foreground, styles.sideButton]}>
						{actionLabel}
					</Text>
				)}
			</View>

			{items.length === 0 ? (
				<View style={styles.notice}>
					<Text style={styles.noticeHeader}>{emptyHeader}</Text>
					<Text style={styles.noticeText}>{emptyText}</Text>
				</View>
			) : (
				items.map((item, i) => (
					// The key belongs on what `map` returns -- on the Pressable
					// inside, React never saw it, and every recent search warned.
					<React.Fragment key={item}>
						<Pressable
							// adding long press allows for copy text when selectable is true
							onLongPress={noop}
							onPress={() => props.onItemPress(item)}
						>
							<ListRow arrowPosition="none">
								<Text numberOfLines={1} selectable={true} style={[foreground, styles.listItem]}>
									{item}
								</Text>
							</ListRow>
						</Pressable>

						{i < items.length - 1 ? <ListSeparator spacing={{left: 17, right: 17}} /> : null}
					</React.Fragment>
				))
			)}
		</>
	)
}

export {RecentItemsList}

const styles = StyleSheet.create({
	listItem: {
		paddingVertical: Platform.OS === 'ios' ? 5 : 0,
		paddingLeft: 2,
		fontSize: 16,
	},
	notice: {
		alignItems: 'center',
		paddingTop: 30,
		paddingBottom: 35,
		paddingHorizontal: 30,
	},
	noticeHeader: {
		marginTop: 8,
		marginBottom: 4,
		fontSize: 20,
		fontWeight: '600',
		color: c.label,
		textAlign: 'center',
	},
	noticeText: {
		color: c.secondaryLabel,
		textAlign: 'center',
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
		color: c.label,
		fontSize: 20,
		fontWeight: 'bold',
		padding: 10,
		paddingLeft: 17,
	},
})
