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

  reverse = {
    "'shahid'"  : 'dihahs',
    "'alex'"   : 'xela',
    "'daniel'" : 'leinad' ,
    "'racecar'" : 'racecar',
    "''"        : '',
    "'a'"       : 'a'
  }

  sumlist = {
    "'1 2 3 4 5'"   : '15',
    "'1 3 5 7 100'" : '116',
    "'1'"           : '1',
    "''"            : '0'
  }

  anagrams = {
    "'arc car'"                     : "'2'",
    "'arc car bob'"                 : "'2 1'",
    "'slit get tag list'"           : "'2 1 1'",
    "'bat tab tub lol but'"         : "'2 2 1'",
    "'pace epac four tink knit row'" : "'2 2 1 1'"
  }

  string_match = {
    "'xxcaazz xxbaaz'" : '3',
    "'abc abc'"        : '2',
    "'abc axc'"        : '0',
  }

  median = {
    "'1 2 3 4 5'"   : '3',
    "'4 1 7 -1 2'"  : '2',
    "'0'"           : '0',
  }

  thirty_times = {
    "'b'"   : 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    "'NaN'" : 'NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN',
    "' '"   : '                              ',
  }

  question_dict = {
    'double'      : double,
    'square'      : square,
    'prime'       : prime,
    'reverse'     : reverse,
    'sumlist'     : sumlist,
    'anagrams'    : anagrams,
    'string_match': string_match,
    'median'      : median,
    'thirty_times': thirty_times
  }
  return question_dict[question]

@app.route('/run_tests', methods = ['GET'])
def run_tests():
  # print 'first'
  callback = str(request.args['callback'])
  player = str(request.args['player'])
  code = str(request.args['code'])
  questions = json.loads(str(request.args['questions']))

  lang = SYNTAX_TO_CODEPAD[request.args['lang']]
  results = get_results(code, lang, questions)

  return callback + '(' + str(results) + ');'

def get_results(code, lang, questions):
  full_code = parse_code(code, lang, questions)
  # print full_code
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
  print output
  actual_outputs = [output.replace('\n','') for output in output.split('!@#')][:-1]
  expected_outputs = [(question, output) for question in questions for output in get_test_cases(question).values()]
  print actual_outputs
  print expected_outputs
  # results = {}
  print "LENGTHS", len(actual_outputs), len(expected_outputs)
  if len(actual_outputs) != len(expected_outputs):
    if len(actual_outputs) > 0 and 'line' in actual_outputs[-1].lower():
      results = ''
    else:
      results = "'ERROR'"
      return results
  results = {}
  i=0
  last_question = ''
  for expected in expected_outputs:
    results[str(expected[0])] = {}
  for actual, expected in zip(actual_outputs, expected_outputs):

    question = str(expected[0])
    if question != last_question:
      i = 0
    last_question = question
    if actual == expected[1]:
      results[question][i] = 'PASS'
    elif 'error' or 'line' or 'traceback' in actual.lower():
      results[question][i] = 'ERROR'
    else:
      results[question][i] = 'FAIL'
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
  print function_call
  print_statement = '\n'
  if lang == 'C' or lang == 'C++':
    print_statement += " \
        int main() { \
          printf('%s\n\n'," + function_call + "); \
        }"
  elif lang == 'Python':
    print_statement += "print " + 'str('+function_call+')' + "+'!@#'\n"
  elif lang == 'Ruby':
    print_statement += "print " + function_call+'.to_s' + "+'!@#'\n"
  elif lang == 'PHP':
    print_statement += "printf('%s!@#\n'," + function_call + ");"
  return print_statement

if __name__ == '__main__':
  app.run(debug=True)
