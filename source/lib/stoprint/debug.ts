import {DEMO_USER} from '../../init/constants'
import {useUsername} from '../login'

export function useDemoAccount(): boolean {
	let {data} = useUsername()
	let username = data ? data.username : ''
	return username === DEMO_USER.username
}
