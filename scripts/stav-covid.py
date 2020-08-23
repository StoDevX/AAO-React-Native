# For loading HTTP data, just use requests...
import requests

# ...and BeautifulSoup for parsing and getting data out.
from bs4 import BeautifulSoup

# Fetch the output to a string, `output`.
url = "https://wp.stolaf.edu/reslife/dining-hours/"
output = requests.get(url).text

# Now, parse it.
output = BeautifulSoup(output)
