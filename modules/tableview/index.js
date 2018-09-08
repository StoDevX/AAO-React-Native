// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import {androidLightBackground} from '@frogpond/colors'

import {TableView, Section  as IosSection, Cell} from 'react-native-tableview-simple'

export * from './cells'

let AndroidSection = (props) => <IosSection sectionTintColor={androidLightBackground} {...props} />
let Section

if (Platform.OS === 'android') {
	Section = AndroidSection
} else {
	Section = IosSection
}

export {TableView, Section, Cell}
