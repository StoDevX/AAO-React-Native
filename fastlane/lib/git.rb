# coding: utf-8

# `last_git_tag` returns the most recent tag, chronologically.
# `newest_tag` returns the most recent tag *on this branch*.
def newest_tag
  # we chomp to remove the newline
  sh('git describe --tags --abbrev=0').chomp
end

def git_changelog
  to_ref = ENV['TRAVIS_COMMIT'] || ENV['CIRCLE_SHA1'] || 'HEAD'
  from_ref = newest_tag

  graph = sh("git log #{from_ref}..#{to_ref} --oneline --graph")

  # make sure to trim off whitespace from the graph lines
  # to keep the character count down
  graph
    .lines
    .map { |line| line.chomp }
    .join "\n"
end

# Makes a changelog from the timespan passed
def make_changelog
  sh('git fetch --unshallow')
  log = git_changelog

  limit = 4_000
  ending = '…'

  if log.length <= limit
    log
  else
    log[0, log.rindex(/\s/, limit - ending.length)].rstrip + ending
  end
end
