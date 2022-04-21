import * as React from 'react'
import {OtherModesRow} from './row'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import * as defaultData from '../../../../docs/transportation.json'
import * as c from '@frogpond/colors'
import {SectionList, StyleSheet} from 'react-native'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import type {TopLevelViewPropsType} from '../../types'
import type {OtherModeType} from '../types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

const transportationUrl = API('/transit/modes')

const groupModes = (modes: OtherModeType[]) => {
	let grouped = groupBy(modes, (m) => m.category)
	return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

type Props = TopLevelViewPropsType

type State = {
	modes: Array<OtherModeType>
	loading: boolean
	refreshing: boolean
}

export class OtherModesView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Other Modes',
		tabBarIcon: TabBarIcon('boat'),
	}

	state = {
		modes: defaultData.data,
		loading: true,
		refreshing: false,
	}

	componentDidMount(): void {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	refresh = async (): Promise<void> => {
		this.setState(() => ({refreshing: true}))
		await this.fetchData(true)
		this.setState(() => ({refreshing: false}))
	}

	fetchData = async (reload?: boolean): Promise<void> => {
		let {data: modes}: {data: Array<OtherModeType>} = await fetch(
			transportationUrl,
			{
				delay: reload ? 500 : 0,
			},
		).json()
		this.setState(() => ({modes}))
	}

	render(): JSX.Element {
		let navigate = this.props.navigation.navigate
		let groupedData = groupModes(this.state.modes)
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				contentContainerStyle={styles.contentContainer}
				keyExtractor={(item) => item.name}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
				renderItem={({item}) => (
					<OtherModesRow
						mode={item}
						onPress={(mode) => navigate('OtherModesDetailView', {mode})}
					/>
				)}
				renderSectionHeader={({section: {title}}) => (
					<ListSectionHeader title={title} />
				)}
				sections={groupedData}
				style={styles.listContainer}
			/>
		)
	}
}
