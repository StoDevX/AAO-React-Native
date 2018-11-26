# `last_git_tag` returns the most recent tag, chronologically.
# `newest_tag` returns the most recent tag *on this branch*.
def newest_tag
  # we chomp to remove the newline
  sh('git describe --tags --abbrev=0').chomp
end

def git_changelog
  to_ref = ENV['TRAVIS_COMMIT'] || ENV['CIRCLE_SHA1'] || 'HEAD'
  from_ref = newest_tag

  describe = sh("git describe --tags #{to_ref}")

  pr_merges = sh("git log #{from_ref}..#{to_ref} --oneline --grep 'Merge pull request'")

  "Merged Pull Requests as of #{describe}:\n\n#{pr_merges}"
    .gsub(/pull request |StoDevX\//,'')
    .gsub(/Merge/, '—')
    .gsub(' from', ': ')
end

# Makes a changelog from the timespan passed
def make_changelog
  sh('git fetch --unshallow') if travis?
  log = git_changelog

  limit = 4_000
  ending = '…'

  if log.length <= limit
    log
  else
    log[0, log.rindex(/\s/, limit - ending.length)].rstrip + ending
  end
end
