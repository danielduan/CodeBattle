var gameNum = getParam('game');
document.getElementById('gameID').innerHTML = " " + gameNum;
if (!gameNum) {
    document.location.href = "index.html";
}
var f = new Firebase('https://codebattle.firebaseio.com/games/'+gameNum);
var player1, codeMirror1, codeMirror2, firepad1, firepad2, language;
var questions = []
var obsever = false;
var consoleFormat = {
    theme: 'console',
    readOnly: 'nocursor'
}    
console1 = CodeMirror(document.getElementById('console1'), consoleFormat);
console2 = CodeMirror(document.getElementById('console2'), consoleFormat);
firepadConsole1 = Firepad.fromCodeMirror(f.child('player1').child('console'), console1);
firepadConsole2 = Firepad.fromCodeMirror(f.child('player2').child('console'), console2);
f.child('player1').child('console').on('value', function() {
    console1.getDoc().setCursor(9007199254740992, 0);
});
f.child('player2').child('console').on('value', function() {
    console2.getDoc().setCursor(9007199254740992, 0);
});
firepadConsole1.on('ready', function() {
    if (firepadConsole1.isHistoryEmpty()) {
        firepadConsole1.setText('');
    }
});
firepadConsole2.on('ready', function() {
    if (firepadConsole2.isHistoryEmpty()) {
        firepadConsole2.setText('');
    }
});
f.once('value', function(data) {
    var playerCount = data.child('playerCount').val();
    var observerCount = data.child('observerCount').val();
    language = data.child('language').val();
    var languageName = "text/x-" + language;
    if (languageName == "python") {
        languageName = {name: "python"};
    }
    data.child('questions').forEach(function(child) {
        questions.push(child.val());
    });
    var currPlayerFormat = {
        lineNumbers: true,
        mode: languageName,
        indentUnit: 4,
        tabMode: "shift",
        theme: 'default pad',
        autofocus: true
    };
    var otherPlayerFormat = {
        lineNumbers: true,
        mode: languageName,
        indentUnit: 4,
        tabMode: "shift",
        theme: 'default pad',
        readOnly: 'nocursor'
    };
    if (!playerCount || playerCount == 0) {
        player1 = true;
        f.child('playerCount').set(playerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), currPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), otherPlayerFormat);
        document.getElementById('submit1').className += ' disabled';
        document.getElementById('submit1').onclick = "";
        document.getElementById('status').innerHTML = "Player 1";
    } else if (playerCount == 1) {
        player1 = false;
        f.child('playerCount').set(playerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), otherPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), currPlayerFormat);
        document.getElementById('submit0').className += ' disabled';
        document.getElementById('submit0').onclick = "";
        document.getElementById('status').innerHTML = "Player 2";
    } else {
        obsever = true;
        f.child('observerCount').set(observerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), otherPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), otherPlayerFormat);
        document.getElementById('submit1').className += ' disabled';
        document.getElementById('submit0').className += ' disabled';
        document.getElementById('submit1').onclick = "";
        document.getElementById('submit0').onclick = "";
        document.getElementById('status').innerHTML = "Observer";

    }
    firepad1 = Firepad.fromCodeMirror(f.child('player1').child('code'), codeMirror1);
    firepad2 = Firepad.fromCodeMirror(f.child('player2').child('code'), codeMirror2);
    firepad1.on('ready', function() {
        if (firepad1.isHistoryEmpty()) {
            $.get(
                "../questions.json",
                function(data) {
                    setOriginalText(data, firepad1);
                },
                "json"
            );
        }
    });
    firepad2.on('ready', function() {
        if (firepad2.isHistoryEmpty()) {
            $.get(
                "../questions.json",
                function(data) {
                    setOriginalText(data, firepad2);
                },
                "json"
            );
        }
    });
});
function setOriginalText(data, firepad) {
    var initial = "";
    for (var i = 0; i < questions.length; i++) {
        if (language == "python") {
            initial += "\"\"\"\n";
        } else if (language == "ruby") {
            initial += "=begin\n";
        } else if (language == "php") {
            initial += "/*\n";
        }
        initial += data[questions[i]]["comments"] + "\n";
        if (language == "python") {
            initial += "\"\"\"\n";
        } else if (language == "ruby") {
            initial += "=end\n";
        } else if (language == "php") {
            initial += "*/\n";
        }
        initial += data[questions[i]][language] + "\n";
        if (i < questions.length - 1) {
            initial += "\n";
        }
    }
    firepad.setText(initial);
};
function submitCode() {
    var player = "2";
    var code = codeMirror2.getDoc().getValue();
    if (player1) {
        player = "1";
        code = codeMirror1.getDoc().getValue();
    }
    $.get(
        "http://codebattle.aws.af.cm/run_tests",
        { game: gameNum, player: player, code: code, questions: JSON.stringify(questions), lang: language },
        function(data){
            var allQuestionsPassed = true;
            for (var i = 0; i < questions.length; i++) {
                var question = questions[i];
                append("Question: " + question);
                var allTestsPassed = true;
                for (var key in data[question]) {
                    var val = data[question][key];
                    append("Test Case " + key + ": " + val);
                    if (val != "PASS") {
                        allTestsPassed = false;
                    }
                }
                if (allTestsPassed) {
                    // Give power up
                } else {
                    allQuestionsPassed = false;
                }
            }
            if (allQuestionsPassed) {
                // Winner!
            }
        },
        "jsonp"
    );
}
function append(string) {
    if (player1) {
        console1.getDoc().setValue(console1.getDoc().getValue() + string + "\n");
    } else {
        console2.getDoc().setValue(console2.getDoc().getValue() + string + "\n");
    }
}
function getParam(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}   

function addPowerup(powerup, divID) {
    var div = 'powerups' + divID;
    var ul = document.getElementById(div);
    var li = document.createElement("li");
    var newListItem = "<img class='powerupitem' onclick='powerupHandler()' src='" + "img/" + powerup + ".png' type='" + powerup + "'>";
    li.innerHTML=newListItem;
    ul.insertBefore(li, ul.getElementsByTagName('li')[0]);
}

function powerupHandler() {

}