'use strict'

const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const compress = require('koa-compress');
const logger = require('koa-logger');
const responseTime = require('koa-response-time');
const health = require('koa-ping');
const mem = require('mem');
const Koa = require('koa');
const Router = require('koa-better-router');

const got = require('got')

const memGot = mem(got, {maxAge: 24 * 60 * 60 * 1000})

const app = new Koa();

// set up the routes
const api = Router({ prefix: '/api' }).loadMethods()

api.get('/', async (ctx) => {
  ctx.body = `Hello world! Prefix: ${ctx.route.prefix}`
})

api.get('/menu/:cafeId', async (ctx) => {
  const bonappmenubaseurl = 'http://legacy.cafebonappetit.com/api/2/menus'
  const bonappcafebaseurl = 'http://legacy.cafebonappetit.com/api/2/cafes'

  let resp = await memGot(bonappmenubaseurl, {json: true, query: {cafe: ctx.route.params.cafeId}})
  ctx.body = resp.body
})

// attach middleware
app.use(responseTime());
app.use(logger());
app.use(compress());
// etag works together with conditional-get
app.use(conditional());
app.use(etag());
app.use(health());
// hook in the router
app.use(api.middleware())

// start the app
const PORT = process.env.NODE_PORT || '3000';
app.listen(Number.parseInt(PORT, 10));

console.log(`listening on port ${PORT}`);
