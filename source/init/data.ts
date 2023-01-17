const dataSets = [
	{
		url: API('/transit/bus'),
		data: require('../../docs/bus-times.json'),
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
