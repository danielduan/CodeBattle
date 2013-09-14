import json
import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
application = app = Flask('wsgi')

SYNTAX_TO_CODEPAD = {
  'python'  : 'Python',
  'ruby'    : 'Ruby',
  'php'     : 'PHP',
}

def get_test_cases(question):
  double = {
    '1': '2',
    '2': '4'
  }

  square = {
    '5' : '25',
    '-4': '16'
  }

  prime = {
    '2' : 'True',
    '3' : 'True',
    '4' : 'False',
    '17': 'True'
  }

  question_dict = {
    'double'  : double,
    'square'  : square,
    'prime'   : prime
  }
  return question_dict[question]

@app.route('/run_tests', methods = ['POST'])
def run_tests():
  callback = str(request.args['callback'])
  player = str(request.args['player'])
  code = str(request.args['code'])
  questions = json.loads(str(request.args['questions']))
  print 'printing'
  print len(questions)
  lang = SYNTAX_TO_CODEPAD[request.args['lang']]

  results = get_results(code, lang, questions)
  
  return callback + '(' + str(results) + ');'

def get_results(code, lang, questions):
  full_code = parse_code(code, lang, questions)
  print full_code
  codepad_url = 'http://codepad.org'
  query_params = {
    'code'    : full_code,
    'lang'    : lang,
    'private' : True,
    'run'     : True
  }
  r = requests.post(codepad_url, query_params)
  soup = BeautifulSoup(r.text)
  output = soup('pre')[-1].get_text().strip()
  return analyze_results(output, questions)

def analyze_results(output, questions):
  actual_outputs = [output for output in output.split('\n') if output!='']
  expected_outputs = [output for question in questions for output in get_test_cases(question).values()]
  print actual_outputs
  print expected_outputs
  results = {}
  i=0
  for actual, expected in zip(actual_outputs, expected_outputs):
    if (actual == expected):
      results[i] = 'PASS'
    else:
      results[i] = 'FAIL'
    i = i + 1
  return results

def parse_code(code, lang, questions):
  for question in questions:
    test_cases = get_test_cases(question)
    for test_case in test_cases:
      code += get_print_statement(code, lang, question, test_case)
  if (lang == 'PHP'):
    return '<?php ' + code + ' ?>'
  else:
    return code

def get_print_statement(code, lang, question, test_case):
  function_call = question + '(' + test_case + ')'
  print_statement = '\n'
  if lang == 'C' or lang == 'C++':
    print_statement += " \
        int main() { \
          printf('%s\n'," + function_call + "); \
        }"
  elif lang == 'Python' or lang == 'Ruby':
    print_statement += "print " + function_call
  elif lang == 'PHP':
    print_statement += "printf('%s\n'," + function_call + ");"
  return print_statement

if __name__ == '__main__':
  app.run(debug=True)
