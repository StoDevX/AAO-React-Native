// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Text, ScrollView} from 'glamorous-native'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import {Row, Column} from '../../components/layout'
import type {HomescreenNotice} from './types'
import type {NavType, TopLevelViewPropsType} from '../../types'

export function NoticeDetailView({navigation}: TopLevelViewPropsType) {
	return (
		<ScrollView>
			<Text>{JSON.stringify(navigation.state.params.notice)}</Text>
		</ScrollView>
	)
}

const styles = StyleSheet.create({})
