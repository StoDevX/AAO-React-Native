'use strict'

import conditional from 'koa-conditional-get'
import etag from 'koa-etag'
import compress from 'koa-compress'
import logger from 'koa-logger'
import responseTime from 'koa-response-time'
import health from 'koa-ping'
import mem from 'mem'
import Koa from 'koa'
import Router from 'koa-better-router'

import {v1} from './v1'

const app = new Koa();

//
// set up the routes
//
const api = Router({ prefix: '/api' }).loadMethods()

api.extend(v1)

api.get('/', async (ctx) => {
  ctx.body = `Hello world! Prefix: ${ctx.route.prefix}`
})

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
app.use(api.middleware())

//
// start the app
//
const PORT = process.env.NODE_PORT || '3000';
app.listen(Number.parseInt(PORT, 10));
console.log(`listening on port ${PORT}`);
