import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {
	ListSeparator,
	ListSectionHeader,
	largeListProps,
	Title,
	ListRow,
	emptyList,
} from '@frogpond/lists'

import {useFetch} from 'react-async'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {SearchData, LinkGroup, LinkResults, LinkValue} from './types'

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	titleText: {
		color: c.infoBlue,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function createGrouping(results: LinkResults[]) {
	if (!results) {
		return []
	}

	return results.map(({letter, values}) => ({
		title: letter,
		data: values,
	}))
}

let groupResults = (data: LinkGroup[]) => {
	if (!data) {
		return emptyList
	}

	return data
}

const useMoreLinks = () => {
	const url = 'https://wp.stolaf.edu/wp-json/site-data/sidebar/a-z'
	return useFetch<SearchData>(url, {
		headers: {accept: 'application/json'},
	})
}

function MoreView(): JSX.Element {
	let {
		data: {az_nav: menu_items = []} = {},
		error,
		reload,
		isPending,
		isInitial,
		isLoading,
	} = useMoreLinks()

	let groupedOriginal = React.useMemo(() => {
		return createGrouping(menu_items.menu_items)
	}, [menu_items.menu_items])

	let grouped = React.useMemo(
		() => groupResults(groupedOriginal, menu_items.menu_items),
		[groupedOriginal],
	)

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading."
			/>
		)
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No results found." />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: LinkValue, index) => `${item.label}-${index}`}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			onRefresh={reload}
			refreshing={isPending && !isInitial}
			renderItem={({item}) => {
				return (
					<ListRow arrowPosition="none" onPress={() => openUrl(item.url)}>
						<Title lines={2} style={styles.titleText}>
							{item.label}
						</Title>
					</ListRow>
				)
			}}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={grouped}
			style={styles.wrapper}
			{...largeListProps}
		/>
	)
}

export {MoreView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'More',
}
