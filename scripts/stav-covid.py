import requests
from bs4 import BeautifulSoup

# Fetch the output to a string, `output`.
url = "https://wp.stolaf.edu/reslife/dining-hours/"
output = requests.get(url).text

# Now, parse it.
output = BeautifulSoup(output)

# NOTE(rye): There is no filtering to prevent loading tables that aren't valid,
# so please double-check the output of this script.
tables = output.find_all("table")

# Start with an empty schedule set
schedules = {}

# For each of the HTML tables we found,
for table in tables:
	print("Processing a table...")
