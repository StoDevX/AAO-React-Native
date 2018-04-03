import Router from 'koa-router'
import {menu, cafe} from './menu'

const api = new Router({prefix: '/v1'})

// food
api.get('/food/menu/:cafeId', menu)
api.get('/food/cafe/:cafeId', cafe)

export {api as v1}
