#!/usr/local/bin python3

find = r'''com.apple.BackgroundModes = {
								enabled = 1;
							};
							com.apple.Push = {
								enabled = 1;
							};'''

replace = find.replace('1', '0')

with open('ios/AllAboutOlaf.xcodeproj/project.pbxproj', 'r', encoding='utf-8') as file:
	input = file.read()

output = input.replace(find, replace)

with open('ios/AllAboutOlaf.xcodeproj/project.pbxproj', 'w', encoding='utf-8') as file:
	file.write(output)
