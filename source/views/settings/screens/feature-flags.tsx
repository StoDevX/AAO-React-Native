import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as storage from '../../../lib/storage'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {CellToggle} from '@frogpond/tableview/cells'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {AppConfig, FeatureFlagSectionType} from '@frogpond/app-config'
import {groupBy} from 'lodash'
import {LoadingView, NoticeView} from '@frogpond/notice'

export const FeatureFlagsView = (): JSX.Element => {
	let [loading, setLoading] = React.useState(true)
	let [sections, setSections] = React.useState<FeatureFlagSectionType[]>([])

	async function fetchData() {
		let config = await AppConfig()
		setSections(config)
		setLoading(false)
	}

	React.useEffect(() => {
		fetchData()
	}, [])

	if (!sections) {
		return <ListEmpty mode="bug" />
	}

	let grouped = groupBy(sections, (s) => s.title)
	let groupedSections = Object.entries(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={loading ? <LoadingView /> : <NoticeView text="No feature flags found." />}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item, key) => `${item.title}-${key}`}
			renderItem={({item}) => {
				return item.data.map(({data}) => {
					return data.map(({title, active, configKey}) => (
						<CellToggle
							key={configKey}
							label={title}
							onChange={(newValue) => {
								storage.setFeatureFlag(configKey, newValue)
								fetchData()
							}}
							value={Boolean(active)}
						/>
					))
				})
			}}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={groupedSections}
		/>
	)
}

let styles = StyleSheet.create({
	contentContainer: {
		flexGrow: 1,
		backgroundColor: c.systemBackground,
	},
})

export {FeatureFlagsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Feature Flags',
}
