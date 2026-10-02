import * as React from 'react'
import {RadioControllerView} from '../../source/features/streaming/radio'
import {STATIONS} from '../../source/features/streaming/radio/stations'

export default function KstoPage(): React.ReactNode {
	return <RadioControllerView station={STATIONS.ksto} />
}
