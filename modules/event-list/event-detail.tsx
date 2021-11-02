import React from 'react'

import * as EventDetailIos from './event-detail-ios'
import * as EventDetailAndroid from './event-detail-android'
import { Platform } from 'react-native';
import { RootStackParamList } from '../../source/navigation/types';
import { RouteProp } from '@react-navigation/native';
import { NavigationKey } from './event-detail-base';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { ShareButton } from '@frogpond/navigation-buttons';
import { shareEvent } from './calendar-util';

let View: () => JSX.Element;
if (Platform.OS === 'ios') {
	View = EventDetailIos.EventDetail;
} else {
	View = EventDetailAndroid.EventDetail;
}

export {View}

// this is the same between platforms
export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {event} = props.route.params;
	return {
		title: event.title, 
		headerRight: (p) => <ShareButton {...p} onPress={() => shareEvent(event)} />,
	}
}

export type NavigationParams = undefined
