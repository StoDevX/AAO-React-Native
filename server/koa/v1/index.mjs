import router from 'koa-better-router'
import {menu, cafe} from './menu'

const api = router().loadMethods()

// food
api.get('/v1/food/menu/:cafeId', menu)
api.get('/v1/food/cafe/:cafeId', cafe)

export {api as v1}
