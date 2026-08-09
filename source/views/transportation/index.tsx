import * as React from 'react'

import {OtherModesView} from './other-modes'
import {BusView} from './bus'

export {OtherModesView}

export const ExpressLineBusView = (): React.ReactNode => (
	<BusView line="Express Bus" />
)
export const RedLineBusView = (): React.ReactNode => <BusView line="Red Line" />
export const BlueLineBusView = (): React.ReactNode => (
	<BusView line="Blue Line" />
)
export const OlesGoView = (): React.ReactNode => <BusView line="Oles Go" />
