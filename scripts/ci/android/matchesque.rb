#!/usr/bin/env ruby

# Clone the match repo (for Android)
def clone_match
	git_url = 'https://github.com/hawkrives/aao-keys'
	dir = Dir.mktmpdir
	command = "git clone --depth 1 '#{git_url}' '#{dir}'"

	# this block pulled from https://github.com/fastlane/fastlane/blob/master/match/lib/match/git_helper.rb
	puts 'Cloning remote git repo...'
	begin
		# GIT_TERMINAL_PROMPT will fail the `git clone` command if user credentials are missing
		`GIT_TERMINAL_PROMPT=0 #{command}`
	rescue StandardError
		puts 'Error cloning the certificates repo. Please make sure you have read access to the repository you want to use'
		puts "Run the following command manually to make sure you're properly authenticated:"
		puts "$ #{command}"
	end

	dir
end

# remove the match cloned folder
def remove_match_clone(options)
	puts "removing #{options[:dir]}"
	FileUtils.remove_entry_secure options[:dir]
end

match_dir = clone_match

# we'll be copying files out of the tempdir from the git-clone operation
src = "#{match_dir}/android"
dest = File.expand_path('.')

# we export this variable so that Gradle knows where to find the .properties file
signing_props_dest = File.expand_path(ENV['KEYSTORE_FILE'])

pairs = [
	{:from => "#{src}/upload-keystore.properties", :to => signing_props_dest},
	{:from => "#{src}/upload-keystore.keystore", :to => "#{dest}/android/app/upload-keystore.keystore"},
	{:from => "#{src}/play-private-key.json", :to => "#{dest}/fastlane/play-private-key.json"},
]

pairs.each do |pair|
	puts "cp #{pair[:from]} #{pair[:to]}"
	FileUtils.cp(pair[:from], pair[:to])
end

remove_match_clone(dir: match_dir)
