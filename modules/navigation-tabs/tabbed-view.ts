import {Platform} from 'react-native'
import {createBottomTabNavigator as createCupertinoBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs'

export const createBottomTabNavigator = 
	Platform.OS === 'android'
		? createMaterialBottomTabNavigator
		: createCupertinoBottomTabNavigator
