// Pin the timezone for the whole run.
//
// Several features bucket by calendar day in the device's own zone -- the
// athletics tabs, the calendar's day strip -- so a test asserting which day a
// fixture lands on depends on where the runner is. CI runs in UTC and
// developers do not, which is how a green suite locally went red there.
//
// America/Chicago is St. Olaf's zone, so the fixtures read as the times a
// reader on campus would see.
//
// Set here rather than in `setupFiles`: this runs once before the workers are
// forked, and they inherit it. Node caches the zone at first use, so a later
// assignment can arrive after some other file has already read the old one.
module.exports = () => {
	process.env.TZ = 'America/Chicago'
}
