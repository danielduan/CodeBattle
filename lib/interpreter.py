import requests
from bs4 import BeautifulSoup

def get_output(code, lang) {
	r = requests.post('http://codepad.org', {
		'code': code
		'lang': lang,
		'private': 'True',
		'run': 'True'
	})
	soup = BeautifulSoup(r.text)
	return soup('pre')[-1].get_text().strip()

