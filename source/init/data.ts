import {API} from '@frogpond/api'
import {insertForUrl} from '@frogpond/fetch'

const dataSets = [
	{
		url: API('/a-to-z'),
		data: require('../../docs/a-to-z.json'),
	},
	{
		url: API('/spaces/hours'),
		data: require('../../docs/building-hours.json'),
	},
	{
		url: API('/contacts'),
		data: require('../../docs/contact-info.json'),
	},
	{
		url: API('/transit/bus'),
		data: require('../../docs/bus-times.json'),
	},
	{
		url: API('/dictionary'),
		data: require('../../docs/dictionary.json'),
	},
	{
		url: API('/faqs'),
		data: require('../../docs/faqs.json'),
	},
	{
		url: API('/food/named/menu/the-pause'),
		data: require('../../docs/pause-menu.json'),
	},
	{
		url: API('/transit/modes'),
		data: require('../../docs/transportation.json'),
	},
	{
		url: API('/webcams'),
		data: require('../../docs/webcams.json'),
	},
]

for (const {url, data} of dataSets) {
	insertForUrl(url, data)
}
