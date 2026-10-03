import * as React from 'react'
import {Redirect} from 'expo-router'
import {isChaos} from '@frogpond/launch-arguments'

/** Throws on render, for the chaos canary to find. Sends anyone else home. */
export default function ChaosCrash(): React.ReactNode {
	if (!isChaos) {
		return <Redirect href="/" />
	}
	throw new Error('chaos canary')
}
