import {PrintJobsResponse} from '../../types'

export const mockJobs: PrintJobsResponse = {
	jobs: [
		{
			id: '001',
			copies: 1,
			documentName: 'IMG_2259-COLLAGE.jpg',
			grayscaleFormatted: 'Yes',
			paperSizeFormatted: 'LETTER',
			printerName: 'stoPrint-LPR',
			serverName: 'printers',
			status: 'HELD_IN_HOLD_RELEASE',
			statusDetail: 'MOCK_STATUS_DETAIL', // guess: making this up
			statusFormatted: 'Pending Release',
			totalPages: 1,
			usageCostFormatted: '$0.06',
			usageTimeFormatted: '6:16:57 PM',
		},
		{
			id: '002',
			copies: 1,
			documentName: 'T̶͍̞̫o in̴̥̺̦̻̤͍v̻̝̜̰o̗ke  ҉̘̝̫͍̭t̟͙̬̦̲̱ h̺̼̫͓ḙ̰͙͇ ̙ ̶̘̤͖̬̩͉h̬̮͍̭̻i͏̲͔v͉̗e̥͉̤͉̝͉͇-̷͙͎̲̱̻m̘̦̹i̟̦͈̺͖̤̫n̦̮̮̟̟̞d͙͇',
			grayscaleFormatted: 'Yes',
			paperSizeFormatted: 'LETTER',
			printerName: 'stoPrint-LPR',
			serverName: 'printers',
			status: 'HELD_IN_HOLD_RELEASE',
			statusDetail: 'MOCK_STATUS_DETAIL', // guess: making this up
			statusFormatted: 'Pending Release',
			totalPages: 2,
			usageCostFormatted: '$0.12',
			usageTimeFormatted: '12:16:57 AM',
		},
		{
			id: '003',
			copies: 1,
			documentName: 'test.pdf',
			grayscaleFormatted: 'Yes',
			paperSizeFormatted: 'LETTER',
			printerName: 'stoPrint-LPR',
			serverName: 'printers',
			status: 'SENT_TO_RELEASE', // guess: making this up
			statusDetail: 'MOCK_STATUS_DETAIL', // guess: making this up
			statusFormatted: 'Sent to Printer',
			totalPages: 1,
			usageCostFormatted: '$0.06',
			usageTimeFormatted: '6:16:57 PM',
		},
		{
			id: '004',
			copies: 1,
			documentName: '🖨.pdf',
			grayscaleFormatted: 'Yes',
			paperSizeFormatted: 'LETTER',
			printerName: 'stoPrint-LPR',
			serverName: 'printers',
			status: 'CANCELED', // guess: making this up
			statusDetail: 'MOCK_STATUS_DETAIL', // guess: making this up
			statusFormatted: 'Canceled',
			totalPages: 1,
			usageCostFormatted: '$0.06',
			usageTimeFormatted: '6:16:57 PM',
		},
	],
}
