```yaml
severity: info
conditions:
  - and:
      - platform: ios
      - versionRange: <=2.6.0
      - startDate: 2017-01-29
      - endDate: 2017-02-01
title: A Title
icon: american-football
backgroundColor: '#fff'
foregroundColor: '#444'
snippet: My message content is…
message: |
  My message content is only applicable for people running All About Olaf versions below v2.6.0.
```

```yaml
severity: alert
dismissable: false
title: KSTO vs. KRLX
snippet: KRLX is having intellectual conversations about life and KSTO is… not.
```

```yaml
severity: notice
dismissable: true
repeatIfDismissed: {repeat: true, interval: 1 day}
repeatIfDismissed: '0 0 1 * *'
message: This app is unmaintained
```

```yaml
severity: notice
title: On Unions 😇
message: Was pretty nice, they do make an effort to take care of you (I get parking vouchers for the rest of the week 😆)
```

- [x] A title, optional (if ommitted, the snippet is shown on two lines.)
- [x] An icon; defaults to `(!)`
- [x] A background color???
- [x] A foreground color???
- [x] A snippet to show on the home screen (optional; defaults to truncated `message`)
- [x] A longer, markdown-formatted message to be shown on the detail view
- [ ] Severity levels, to do ??? something
	- I think my original idea was to pick default colors / icons for severity levels
- [ ] Conditions, similar to the versionRange property in the help widgets, but more comprehensive
	- [ ] platform
	- [ ] semver-compatible version ranges
	- [ ] dates, inclusive (from date through date)
	- [ ] boolean operators (`and`, `or`, `not`)
- [ ] A Dissmissable property (defaults to true); prevents the user from dismissing the notice, if false
- [ ] The ability to automatically repeat a message at each `$interval` (TODO: choose how to define the interval; cron / ISO8601 / ics?) [okay cron is much simpler than ISO/ICS rrules.]
