case ENV['TASK']
when 'rubocop'
    require './danger/task-rubocop.rb'

when 'android', 'ios'
    require './danger/task-native-build.rb'

end
