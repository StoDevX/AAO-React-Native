#!/usr/bin/env ruby

require 'netrc'

token = ENV['GITHUB_KEYS_REPOSITORY_TOKEN']

# Ensure an entry for github.com exists in ~/.netrc
netrc = Netrc.read
unless netrc["github.com"]
	puts "An entry for github.com was not found in ~/.netrc; setting..."
	netrc["github.com"] = token
	netrc.save
end
