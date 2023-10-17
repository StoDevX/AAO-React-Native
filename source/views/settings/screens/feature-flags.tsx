import * as React from 'react'
import {StyleSheet, Text, SectionList} from 'react-native'
import restart from 'react-native-restart'
import * as storage from '../../../lib/storage'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {CellToggle} from '@frogpond/tableview/cells'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {AppConfig, FeatureFlagType} from '@frogpond/app-config'
import {groupBy, orderBy} from 'lodash'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {Touchable} from '@frogpond/touchable'
import {commonStyles} from '../../../../modules/navigation-buttons/styles'

export const FeatureFlagsView = (): JSX.Element => {
	let [loading, setLoading] = React.useState(true)
	let [sections, setSections] = React.useState<FeatureFlagType[]>([])

	React.useEffect(() => {
		async function fetchData() {
			let config = await AppConfig()
			setSections(config)
			setLoading(false)
		}
		fetchData()
	}, [sections])

	if (!sections) {
		return <ListEmpty mode="bug" />
	}

	let findGroup = (configKey: FeatureFlagType['configKey']) => {
		return configKey.split('_')?.[0] ?? 'Unknown'
	}

	let sorters: Array<(flag: FeatureFlagType) => string> = [
		(flag) => findGroup(flag.configKey),
		(flag) => flag.title,
	]

	let ordered: Array<'desc' | 'asc'> = ['desc', 'asc', 'desc']

	let sorted = orderBy(sections, sorters, ordered)
	let grouped = groupBy(sorted, (s) => findGroup(s.configKey))
	let groupedSections = Object.entries(grouped)
		.map(([key, value]) => ({
			title: key,
			data: value,
		}))
		.sort((a, b) => a.title.localeCompare(b.title))

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				loading ? (
					<LoadingView />
				) : (
					<NoticeView text="No feature flags found." />
				)
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item, key) => `${item.title}-${key}`}
			renderItem={({item: {title, active, configKey}}) => (
				<CellToggle
					key={configKey}
					label={title}
					onChange={(newValue) => {
						storage.setFeatureFlag(configKey, newValue)
					}}
					value={Boolean(active)}
				/>
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={toLaxTitleCase(title)} />
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
	headerRight: () => (
		<Touchable
			accessibilityLabel="Apply"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => restart.Restart()}
			style={commonStyles.button}
		>
			{/* eslint-disable-next-line react-native/no-inline-styles */}
			<Text style={[commonStyles.text, {fontWeight: '600', color: c.link}]}>
				Reload
			</Text>
		</Touchable>
	),
}
