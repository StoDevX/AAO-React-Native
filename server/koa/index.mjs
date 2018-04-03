'use strict'

import conditional from 'koa-conditional-get'
import etag from 'koa-etag'
import compress from 'koa-compress'
import logger from 'koa-logger'
import responseTime from 'koa-response-time'
import health from 'koa-ping'
import Router from 'koa-better-router'
import Koa from 'koa'

import {v1} from './v1'

const app = new Koa();

//
// set up the routes
//
const router = Router({prefix: '/api'}).loadMethods()

router.extend(v1)

router.get('/', async (ctx) => {
  ctx.body = `Hello world! Prefix: ${ctx.route.prefix}`
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
app.use(router.middleware())

//
// start the app
//
const PORT = process.env.NODE_PORT || '3000';
app.listen(Number.parseInt(PORT, 10));
console.log(`listening on port ${PORT}`);
