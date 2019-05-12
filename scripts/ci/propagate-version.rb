#!/usr/bin/env ruby

require 'fileutils'
require 'shellwords'
require 'json'

def propagate_version()
	return unless ENV.key? 'CI'

	version = get_package_key('./package.json', :version)
	build = ENV['Build.BuildNumber']

	puts "Propagating version \"#{version}\" into the Info.plist and build.gradle files"
	puts "Setting build number to #{build}"

	# store the current number to encode into JS; we avoid storing the jacked-up Android one
	ci_build_num = build

	if ENV['is_nightly'] == 'true'
		version = "#{version.split('-')[0]}-pre"
		puts "Actually putting #{version} into the binaries (because we're doing a nightly)"
	end

	# encode build number into js-land --- we've already fetched it, so we'll
	# never set the "+" into the binaries
	unless version.include? '+'
		# we always want the CI build number in js-land
		set_package_data('./package.json', { version: "#{version}+#{ci_build_num}" })
	end

	case ENV['PLATFORM']
	when 'android'
		rewrite_gradle_file(ENV['GRADLE_FILE'], 'versionName ', version)
		rewrite_gradle_file(ENV['GRADLE_FILE'], 'versionCode ', build)
	when 'ios'
		# we're splitting here because iTC can't handle versions with dashes in them
		xcodeproj_dir = File.join(ENV['GYM_PROJECT'], '..')
		set_xcode_version_number(xcodeproj_dir, version.split('-')[0])
		set_xcode_build_number(xcodeproj_dir, build)
	end
end

def rewrite_gradle_file(filepath, needle, replacement)
	old_value = nil
	temp_file = Tempfile.new

	File.foreach(filepath) do |line|
		if line.include? needle
			old_value = line.strip.split(' ')[1]
			line = line.sub(old_value, "\"#{replacement}\"")
		end
		temp_file.puts line
	end

	temp_file.rewind
	temp_file.close
	FileUtils.mv(temp_file.path, filepath)
	temp_file.unlink

	if old_value == nil
		puts "Could not find the version code in #{filepath}"
	else
		puts "#{old_value} changed to #{replacement}"
	end
end

def set_xcode_version_number(folder, next_version_number)
	`cd #{File.expand_path(folder).shellescape} && agvtool new-marketing-version #{next_version_number.to_s.strip}`
end

def set_xcode_build_number(folder, next_build_number)
	`cd #{File.expand_path(folder).shellescape} && agvtool new-version -all #{next_build_number.to_s.strip}`
end

def set_package_data(package_path, data_to_write)
	data_hash = JSON.parse(File.read(package_path), symbolize_names: true)
	data_hash.update(data_to_write)

	File.write(package_path, JSON.pretty_generate(data_hash) + "\n")
	puts "#{package_path} has been updated with #{data_to_write}"
end

def get_package_key(package_path, key)
	JSON.parse(File.read(package_path), symbolize_names: true)[key]
end

propagate_version()
