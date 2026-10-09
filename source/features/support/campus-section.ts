/** One emergency button on Support. */
export type EmergencyContact = {
	/** What the button says. */
	label: string
	/** The title of the contact, in the campus's contacts, whose number it dials. */
	contact: string
}

/** The college's own IT helpdesk, offered beside the app's support. */
export type Helpdesk = {
	/** The office's short name, as in "ITS Helpdesk". */
	name: string
	/** What the helpdesk helps with, under its Open a Ticket row. */
	covers: string
	/** Where a ticket is opened. */
	serviceCatalog: string
	/** The helpdesk's number, digits only. */
	phoneNumber: string
}

/** Where to get help on a campus. */
export type SupportSection = {
	/** The emergency buttons, ahead of 911, which every campus has. */
	emergency: ReadonlyArray<EmergencyContact>
	helpdesk?: Helpdesk
}
