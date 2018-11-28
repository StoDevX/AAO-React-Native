require 'json'

PLATFORM = (ENV['task'] || 'unknown').freeze

def sh(cmd)
  puts "$ #{cmd}"
  output = `#{cmd}`.chomp
  puts output
  output
end

def git_branch
  sh('git rev-parse --abbrev-ref HEAD')
end

# diff two hashes at a path and return the changed items
def hash_diff(old_hash, new_hash, path)
  (new_hash.dig(*path).to_a - old_hash.dig(*path).to_a).to_h
end

NPM_DEP_NAME_REGEXP = /react|jsc/.freeze
def npm_native_package_changed?(source, target)
  old_package = JSON.parse(sh("git show '#{source}:package.json'"))
  new_package = JSON.parse(sh("git show '#{target}:package.json'"))

  deps_diff = hash_diff(old_package, new_package, ['dependencies']).keys
  devdeps_diff = hash_diff(old_package, new_package, ['devDependencies']).keys

  (deps_diff + devdeps_diff).any? { |dep| dep =~ NPM_DEP_NAME_REGEXP }
end

BASE_GLOBS = [
  '.circleci/**',
  'e2e/**',
  'fastlane/**',
  'scripts/**',
  'Gemfile.lock',
].freeze

ANDROID_GLOBS = [
  'android/**',
  '{modules,source}/**/*.{java,gradle}',
].freeze

IOS_GLOBS = [
  'ios/**',
  '{modules,source}/**/*.{h,m,mm}',
].freeze

def native_build_globs
  case PLATFORM
  when 'ANDROID'
    BASE_GLOBS + ANDROID_GLOBS
  when 'IOS'
    BASE_GLOBS + IOS_GLOBS
  else
    BASE_GLOBS
  end
end

def native_file_changed?(changed_files)
  native_build_globs.any? do |glob|
    changed_files.any? do |path|
      File.fnmatch?(glob, path)
    end
  end
end

DEFAULT_BRANCH = 'master'.freeze

def git_log_between(source, target)
  sh("git log --name-only --format='' '#{source}'..'#{target}'")
end

# checks if the native build needs to be run
def should_build?
  # Essentially, we want to avoid native builds if the only thing that changed
  # was JS code.

	oldest_shared_revision = sh("git merge-base '#{DEFAULT_BRANCH}' 'HEAD^1'")

	# Get all files that changed between the fork point and HEAD
  changed_files = git_log_between(oldest_shared_revision, 'HEAD').lines.sort.uniq

  # 2. check for "packages we care about"
  if changed_files.include?('package.json') &&
     npm_native_package_changed?(oldest_shared_revision, 'HEAD')
    puts "some dependency matching #{NPM_DEP_NAME_REGEXP.inspect} changed"
    return true
  end

  # 3. compare list of files to our sets of "files we care about"
  if native_file_changed?(changed_files)
    puts 'some native file changed'
    return true
  end

  # 4) if none matched, return false
  puts 'skip build'
  false
end

if should_build?
  file_path = File.join(File.dirname(__FILE__), '..', 'logs', 'build-status')
  File.open(file_path, 'w') { |file| file.write('0') }
  exit 0
else
  exit 1
end
