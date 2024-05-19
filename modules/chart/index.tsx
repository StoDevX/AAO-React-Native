import * as React from 'react'
import {StyleSheet, Text} from 'react-native'

import * as c from '@frogpond/colors'
import {StavReportType} from '../../source/views/reports/types'
import {BarChart, ruleTypes} from 'react-native-gifted-charts'

export const BusynessChart: React.FC<StavReportType[]> = (
	data,
): JSX.Element => {
	const buildLabel = (label: string, index: number) => {
		if (!label || label.length === 0) {
			return ''
		}

		const parts = label.split(':')
		const hour = parseInt(parts[0], 10)

		// 15 minute intervals starting at 7:45am
		const pastNoon = index > 12

		return `${hour}${pastNoon ? 'p' : 'a'}`
	}

	/**
	 * filtering out 1/4 of the labels to declutter the x-axis
	 */
	const buildNewLables = () => {
		const oldLabels = data[0].times
		const delta = Math.floor(oldLabels.length / 4)
		const newLabels = oldLabels.filter((_value, index) => index % delta === 0)
		return newLabels
	}

	const newLabels = buildNewLables()

	const busynessData = data[0].data.map((value, index) => {
		const time = data[0].times?.[index] ?? ''
		let label = ''

		if (newLabels.includes(time)) {
			label = buildLabel(time, index)
		}

		return {value: value, label: label}
	})

	return (
		<BarChart
			backgroundColor={c.systemBackground}
			barBorderTopLeftRadius={5}
			barBorderTopRightRadius={5}
			barWidth={25}
			data={busynessData}
			frontColor={c.systemBlue}
			hideYAxisText={true}
			noOfSections={3}
			renderTooltip={(item: {value: string}) => <Text>{item.value}</Text>}
			rulesColor={c.systemGray6}
			rulesType={ruleTypes.SOLID}
			spacing={2}
			xAxisColor={c.systemGray6}
			xAxisThickness={1}
			yAxisThickness={0}
		/>
	)
}

const styles = StyleSheet.create({})
