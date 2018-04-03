import got from 'got'
import mem from 'mem'

const ONE_DAY = 24 * 60 * 60 * 1000
const GET = mem(got.get, {maxAge: ONE_DAY})

const menuBase = 'http://legacy.cafebonappetit.com/api/2/menus'
const cafeBase = 'http://legacy.cafebonappetit.com/api/2/cafes'

const getCafeMenu = (cafeId) => GET(menuBase, {json: true, query: {cafe: cafeId}})
const getCafeInfo = (cafeId) => GET(menuBase, {json: true, query: {cafe: cafeId}})

export async function menu(ctx) {
	let {cafeId} = ctx.params
	let resp = await getCafeMenu(cafeId)
	ctx.body = resp.body
}

export async function cafe(ctx) {
	let {cafeId} = ctx.params
	let resp = await getCafeInfo(cafeId)
	ctx.body = resp.body
}
