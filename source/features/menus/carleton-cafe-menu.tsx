import * as React from 'react'

import {carletonCafe, type CarletonCafe} from './carleton-cafes'
import {BonAppHostedMenu} from './menu-bonapp'

/** A Carleton dining hall's menu, wherever it is shown. */
export function CarletonCafeMenu({cafe}: {cafe: CarletonCafe['cafe']}): React.ReactNode {
	let {title, loadingMessage} = carletonCafe(cafe)
	return <BonAppHostedMenu cafe={cafe} loadingMessage={loadingMessage} name={title} />
}
