import conditional from 'koa-conditional-get'
import etag from 'koa-etag'
import compress from 'koa-compress'
import logger from 'koa-logger'
import responseTime from 'koa-response-time'
import health from 'koa-ping'
import Router from 'koa-router'
import ApolloEngine from 'apollo-engine'
import Koa from 'koa'

import {v1} from './v1'

const app = new Koa();

//
// set up the routes
//
const router = new Router()
const api = new Router({prefix: '/api'})
api.use(v1.routes())
router.use(api.routes())

router.get('/', (ctx) => {
  ctx.body = 'Hello world!'
})

// router.getRoutes().forEach(route => console.log(route.path))

//
// attach middleware
//
app.use(responseTime());
app.use(logger());
app.use(compress());
// etag works together with conditional-get
app.use(conditional());
app.use(etag());
app.use(health());
// hook in the router
app.use(router.routes())
app.use(router.allowedMethods())

//
// start the app
//
const PORT = process.env.NODE_PORT || '3000'
if (process.env.APOLLO_KEY) {
	const engine = new ApolloEngine.ApolloEngine({apiKey: process.env.APOLLO_KEY})
	engine.listen({
		port: Number.parseInt(PORT, 10),
		koaApp: app,
		graphqlPaths: ['/api/v1/graphql']
	})
} else {
	app.listen(Number.parseInt(PORT, 10))
}

console.log(`listening on port ${PORT}`)
