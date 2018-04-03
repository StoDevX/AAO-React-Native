import Router from 'koa-better-router'
import {menu, cafe} from './menu'

const api = Router({ prefix: '/v1' }).loadMethods()

// food
api.get('/food/menu/:cafeId', menu)
api.get('/food/cafe/:cafeId', cafe)

export {api as v1}
