// Renders the Android adaptive icon layers in assets/android/ from the iOS .icon
// documents, with the windmill and forest placed where the iOS icon puts them.
// Usage: node scripts/android/render-icons.mjs "$PWD"
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'

// Playwright is not a dependency of the app; this uses whichever copy the
// machine has, found the way `require` finds a global package (NODE_PATH).
const {default: playwright} = await import(createRequire(import.meta.url).resolve('playwright'))
const {chromium} = playwright
const root = process.argv[2]
const svg = (n) =>
	'data:image/svg+xml;base64,' +
	readFileSync(`${root}/assets/${n}.icon/Assets/windmill.svg`).toString('base64')
const png = (p) => 'data:image/png;base64,' + readFileSync(`${root}/${p}`).toString('base64')
const S = 432
// Adaptive icons show the middle 2/3 of the canvas, so positions are set in canvas terms
// to land where the iOS icon puts them: blade tip ~21%, forest line ~57%, tower to the bottom.
const forest = (n, color) =>
	`<div style="position:absolute;top:${S * 0.56}px;left:-5%;width:110%;height:${S * 0.46}px;background:${color};-webkit-mask-image:url(${png(`assets/${n}.icon/Assets/forest.png`)});-webkit-mask-size:cover;-webkit-mask-position:top;-webkit-mask-repeat:no-repeat"></div>`
const mill = (n, color) =>
	`<img src="${svg(n)}" style="position:absolute;top:${S * 0.215}px;left:50%;transform:translateX(-50%);height:${S * 0.66}px;filter:brightness(0)${color === 'white' ? ' invert(1)' : ''}">`
const bg = (n, grad) =>
	`<div style="width:${S}px;height:${S}px;background:${grad};position:relative;overflow:hidden">${forest(n, '#0b2118')}</div>`
const fg = (n, color) =>
	`<div style="width:${S}px;height:${S}px;position:relative;overflow:hidden">${mill(n, color)}</div>`
const jobs = [
	{
		out: 'windmill-background',
		html: bg('windmill', 'linear-gradient(180deg,#ff383c 15%,#ff8d28 60%)'),
	},
	{
		out: 'windmill-sky-background',
		html: bg('windmill-sky', 'linear-gradient(180deg,#2f7fd8 15%,#9fd2ff 60%)'),
	},
	{out: 'windmill-foreground', html: fg('windmill', 'white')},
	{out: 'windmill-sky-foreground', html: fg('windmill-sky', 'white')},
	{out: 'windmill-monochrome', html: fg('windmill', 'black')},
]
/** Renders each layer in its own page, so the layers draw in parallel. */
async function main() {
	const browser = await chromium.launch()
	await Promise.all(
		jobs.map(async (job) => {
			const page = await browser.newPage({viewport: {width: S, height: S}})
			await page.setContent(
				`<html><body style="margin:0;background:transparent">${job.html}</body></html>`,
			)
			await page.waitForTimeout(200)
			await page.screenshot({path: `${root}/assets/android/${job.out}.png`, omitBackground: true})
		}),
	)
	await browser.close()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
