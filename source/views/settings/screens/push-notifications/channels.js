// @flow

import {type NotificationChannelName} from '../../../../redux/parts/notifications'

export type {NotificationChannelName}

export type NotificationChannel = {
	key: NotificationChannelName,
	label: string,
	group: string,
	forced?: true,
}

export const notificationTypes: Array<NotificationChannel> = [
	{
		key: 'channel:campus/emergency',
		label: 'Emergency Notices',
		group: 'Campus',
		forced: true,
	},
	{
		key: 'channel:cage/late-night-specials',
		label: 'Late Night Specials',
		group: 'The Cage',
	},
	{
		key: 'channel:pause/monthly-special',
		label: 'Monthly Specials',
		group: "Lion's Pause",
	},
	{
		key: 'channel:multimedia/weekly-movie',
		label: 'Weekly Movie',
		group: 'Multimedia',
	},
	{
		key: 'channel:post-office/packages',
		label: 'Packages',
		group: 'Post Office',
	},
	{
		key: 'channel:sga/announcements',
		label: 'Announcements',
		group: 'Student Government Association',
	},
]
