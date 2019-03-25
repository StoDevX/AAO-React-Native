// @flow

import * as React from 'react'
import {sectionBgColor} from '@frogpond/colors'

import {
	TableView,
	Section as ActualSection,
	Cell,
} from 'react-native-tableview-simple'

export * from './cells'

let Section = (props: $PropertyType<ActualSection, 'props'>) => (
	<ActualSection sectionTintColor={sectionBgColor} {...props} />
)

export {TableView, Section, Cell}
