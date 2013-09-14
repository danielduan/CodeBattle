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
    "'alex'"    : 'xela',
    "'daniel'"  : 'leinad' ,
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
    "'pace epac four tink knit row" : "'2 2 1 1'"
  }

  question_dict = {
    'double'  : double,
    'square'  : square,
    'prime'   : prime,
    'reverse' : reverse,
    'sumlist' : sumlist,
    'anagrams': anagrams
  }
  return question_dict[question]

@app.route('/run_tests', methods = ['GET'])
def run_tests():
  callback = str(request.args['callback'])
  player = str(request.args['player'])
  code = str(request.args['code'])
  question = str(request.args['question'])
  lang = SYNTAX_TO_CODEPAD[request.args['lang']]

  results = get_results(code, lang, question)
  console_output = ''
  response_dict = {}
  for i, result in enumerate(results):
    if str(result[0]) == 'False' and 'error' in str(result[1]).lower():
      response_dict[i] = str(result[1])
      # response_dict[i] = 'ERROR'
    elif str(result[0]) == 'True':
      response_dict[i] = 'PASS'
    else:
      response_dict[i] = 'FAIL'
  return callback + '(' + str(response_dict) + ');'

def get_results(code, lang, question):
  results = []
  test_cases = get_test_cases(question)
  for test_case in test_cases:
    full_code = get_full_code(code, lang, question, test_case)
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
    # output = str(int(test_case) * 2)
    results.append((output == test_cases[test_case], output))

  return results

def get_full_code(code, lang, question, test_case):
    function_call = question + '(' + test_case + ')'

    print_statement = '\n'
    if lang == 'C' or lang == 'C++':
      print_statement += " \
              int main() { \
                  printf('%c\n'," + function_call + "); \
              }"
    elif lang == 'Python' or lang == 'Ruby':
      print_statement += "print " + function_call
    elif lang == 'PHP':
      print_statement += "printf('%s\n'," + function_call + ");"

    if lang == 'PHP':
      opening_index = code.find('<?php')
      if opening_index == -1:
        code = '<?php\n' + code
      close_index = code.find('?>')
      if close_index != -1:
        code = code[0:close_index]
      code += print_statement + '?>'

    else:
      code += print_statement

    return code
if __name__ == '__main__':
  app.run(debug=True)