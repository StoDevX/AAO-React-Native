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
