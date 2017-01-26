<style>
body {
  -webkit-overflow-scrolling: touch;
  font-family: -apple-system, Roboto, sans-serif;
  background-color: transparent;
}
h1 {
  font-size: 1.2em;
}
a {
  pointer-events: none;
  color: black;
  text-decoration: none;
}
p {
  line-height: 1.2em;
}
</style>

# Why does this app update so slowly?
We hear you. Magic is hard to find these days. Have you ever tried looking for it?

# Known Issues
- Menus: The Caf's menu is borked. BonApp added a new icon that we weren't expecting, and we don't handle that very gracefully. We're releasing an update shortly that both handles the new icon and shouldn't crash when this happens in the future.
- SIS: we're working on a way to have you log into the sis for more than 15 minutes at a time.
- Building Hours: It reports the 2am buildings as open too often; for instance, the Pause is open on Saturday at 2am, continuing from Friday, but the app reports it as being open on Friday at 2am, as well. This is incorrect.
- The Cage menu only shows specials: that's a limitation of the data we get from BonApp. SGA is talking with them about providing the rest of the Cage menu. One day, it'll suddenly work!
