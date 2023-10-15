import * as React from 'react'
import {ScrollView} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import {white} from '@frogpond/colors'
import * as storage from '../../../lib/storage'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {
	SettingsStackParamList,
	ChangeTextEvent,
} from '../../../navigation/types'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {CellToggle} from '@frogpond/tableview/cells'
import {ListEmpty, ListSeparator} from '@frogpond/lists'
import {FlatList} from 'react-native-gesture-handler'
import {
	AppConfig,
	FeatureFlagDataType,
	FeatureFlagSectionType,
} from '@frogpond/app-config'

export const FeatureFlagsView = (): JSX.Element => {
	let [sections, setSections] = React.useState<FeatureFlagSectionType[]>([])

	let navigation = useNavigation()

	React.useEffect(() => {
		async function fetchData() {
			let config = await AppConfig()
			setSections(config)
		}
		fetchData()
	}, [sections])

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="No feature flags found." />}
			contentInsetAdjustmentBehavior="automatic"
			data={sections}
			renderItem={({item}) => (
				<Cell
					accessory="DisclosureIndicator"
					onPress={() =>
						navigation.navigate('FeatureFlagsDetail', {flags: item})
					}
					title={item.title}
				/>
			)}
		/>
	)
}

export {FeatureFlagsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Feature Flags',
}

export const FeatureFlagDetailView = (): JSX.Element => {
	let route =
		useRoute<RouteProp<SettingsStackParamList, 'FeatureFlagsDetail'>>()
	const {flags} = route.params

	let navigation = useNavigation()

	let [sections, setSections] = React.useState<FeatureFlagDataType[]>([])
	let [search, setSearch] = React.useState('')

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: white,
				onChangeText: (event: ChangeTextEvent) =>
					setSearch(event.nativeEvent.text),
			},
		})
	}, [navigation])

	React.useEffect(() => {
		let sections: FeatureFlagDataType[] = flags.data

		let filteredSections = sections
			.map(({title: sectionTitle, data}) => {
				let filteredRow = data.filter(({title}) => {
					let rowTitleMatches = title
						.toLocaleLowerCase()
						.includes(search.toLocaleLowerCase())

					let sectionTitleMatches = sectionTitle
						.toLocaleLowerCase()
						.includes(search.toLocaleLowerCase())

					return rowTitleMatches || sectionTitleMatches
				})
				return {title: sectionTitle, data: filteredRow}
			})
			.filter((section) => Boolean(section.data.length))

		setSections(filteredSections)
	}, [flags, search])

	if (!flags || !sections) {
		return <ListEmpty mode="bug" />
	}

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<TableView>
				{sections.map(({data, title: sectionTitle}, key) => (
					<Section key={`${sectionTitle}-${key}`} header={sectionTitle}>
						{data.map(({title, configKey, active}) => (
							<CellToggle
								key={`${title}-${key}`}
								label={title}
								onChange={(value) => {
									storage.setFeatureFlag(configKey, value)
								}}
								value={Boolean(active)}
							/>
						))}
					</Section>
				))}
			</TableView>
		</ScrollView>
	)
}

export {FeatureFlagDetailView as Detail}

export const DetailNavigationOptions = (props: {
	route: RouteProp<SettingsStackParamList, 'FeatureFlagsDetail'>
}): NativeStackNavigationOptions => {
	let {title} = props.route.params.flags
	return {
		title: title,
	}
}
