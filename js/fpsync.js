var gameNum = getParam('game');
document.getElementById('gameID').innerHTML = " " + gameNum;
if (!gameNum) {
    document.location.href = "index.html";
}
var f = new Firebase('https://codebattle.firebaseio.com/games/'+gameNum);
var player1, codeMirror1, codeMirror2, firepad1, firepad2, language, playerCount, observerCount;
var questions = [];
var observer = false;
var consoleFormat = {
    theme: 'console',
    readOnly: 'nocursor'
}
console1 = CodeMirror(document.getElementById('console1'), consoleFormat);
console2 = CodeMirror(document.getElementById('console2'), consoleFormat);
firepadConsole1 = Firepad.fromCodeMirror(f.child('player1').child('console'), console1);
firepadConsole2 = Firepad.fromCodeMirror(f.child('player2').child('console'), console2);
f.child('player1').child('console').on('value', function() {
    console1.getDoc().setCursor(0, 0);
});
f.child('player2').child('console').on('value', function() {
    console2.getDoc().setCursor(0, 0);
});
f.child('winner').on('value', function(data) {
    if (data.val()) {
        if (player1 && data.val() == 'player1' || !player1 && data.val() != 'player2') {
            displayModal('You have won :D');
        } else {
            displayModal('You have lost :(');
        }
    }
});
f.child('powerups').on('child_added', function(data) {
    var powerup = "party";
    var question = data.name();
    var difficulty = problems[question]['difficulty'];
    var powerup = "shield";
    if (data.val() == "player1") {
        addPowerup(question, powerup, 0);
    } else {
        addPowerup(question, powerup, 1);
    }
});
f.child('powerups').on('child_removed', function(data) {
    var question = data.name();
    powerupHandler(question, $("#"+question).attr('user'), $("#"+question).attr('type'));
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
        theme: 'default',
        autofocus: true
    };
    var otherPlayerFormat = {
        lineNumbers: true,
        mode: "text/plain",
        indentUnit: 4,
        tabMode: "shift",
        theme: 'blurry',
        readOnly: 'nocursor'
    };
    var observerFormat = {
        lineNumbers: true,
        mode: languageName,
        indentUnit: 4,
        tabMode: "shift",
        theme: 'default',
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
        observer = true;
        f.child('observerCount').set(observerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), observerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), observerFormat);
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
            setOriginalText(problems, firepad1);
            codeMirror1.getDoc().setCursor(0, 0);
        }
    });
    firepad2.on('ready', function() {
        if (firepad2.isHistoryEmpty()) {
            setOriginalText(problems, firepad2);
            codeMirror1.getDoc().setCursor(0, 0);
        }
    });
    f.child('playerCount').on('value', function(data) {
        playerCount = data.val();
        if (observer) return;
        console.log(observerCount, playerCount);
        if (observerCount == 0 && playerCount == 1) {
            f.onDisconnect().cancel();
            f.onDisconnect().set(null);
        } else {
            f.child('playerCount').onDisconnect().cancel();
            f.child('playerCount').onDisconnect().set(playerCount - 1);
        }
    });
    f.child('observerCount').on('value', function(data) {
        observerCount = data.val();
        if (!observer) return;
        console.log(observerCount, playerCount);
        if (observerCount == 1 && playerCount == 0) {
            f.onDisconnect().cancel();
            f.onDisconnect().set(null);
        } else {
            f.child('observerCount').onDisconnect().cancel();
            f.child('observerCount').onDisconnect().set(observerCount - 1);
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
    if (observer) return;
    var player = "2";
    clearPlayer(player);
    var code = codeMirror2.getDoc().getValue();
    if (player1) {
        player = "1";
        code = codeMirror1.getDoc().getValue();
    }
    $.get(
        "http://codebattle.ngrok.com/run_tests",
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
                    f.child('questionsDone').child(question).once('value', function(data) {
                        if (!data.val()) {
                            var playerName = "player2";
                            if (player1) {
                                playerName = "player1";
                            }
                            f.child('powerups').child(data.name()).set(playerName);
                            f.child('questionsDone').child(data.name()).set(playerName);
                        }
                    });
                } else {
                    allQuestionsPassed = false;
                }
            }
            if (allQuestionsPassed) {
                if (player1) {
                    f.child('winner').set('player1');
                } else {
                    f.child('winner').set('player2');
                }
            }
        },
        "jsonp"
    );
}
function clearPlayer(string) {
    if (player1) {
      console1.getDoc().setValue('');
    } else {
      console2.getDoc().setValue('');
    }
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

function addPowerup(question, powerup, divID) {
    var div = 'powerups' + divID;
    var ul = document.getElementById(div);
    var li = document.createElement("li");
    var newListItem = "<img class='powerupitem' type='" + powerup + "' user='" + divID + "' src='" + "img/" + powerup + ".png' id='" + question + "'>";
    li.innerHTML=newListItem;
    ul.insertBefore(li, ul.getElementsByTagName('li')[0]);
    $("#"+question).click(function() {
        f.child('powerups').child(this.getAttribute('id')).remove();
    });
}


function getCodeMirror(player) {
    if (player=="1") {
        return codeMirror1;
    } else {
        return codeMirror2;
    }
}

function getCodeDiv(player) {
    if (player === "1" ) {
        return "PlayerDiv";
    } else {
        return "OpponentDiv";
    }
}
function removeLine(divID) {
    var text;

    if (divID == 0) {
        text = firepad1.getText();
        var oldTheme = codeMirror1.getOption('theme');
        codeMirror1.setOption('theme', 'changed');
        setTimeout(function() {
            codeMirror1.setOption('theme', oldTheme);
        }, 1000);
    } else {
        text = firepad2.getText();
        var oldTheme = codeMirror2.getOption('theme');
        codeMirror2.setOption('theme', 'changed');
        setTimeout(function() {
            codeMirror2.setOption('theme', oldTheme);
        }, 1000);
    }

    var textArray = text.split('\n');

    var index = Math.floor((Math.random()*textArray.length));

    if (index > -1) {
        textArray.splice(index, 1);
    }

    text = textArray.join("\n");

    if (divID == 0) {
        firepad1.setText(text);
    } else {
        firepad2.setText(text);
    }
}

function unblur(player) {
    var thisCodeMirror = getCodeMirror(player);
    var previousTheme = thisCodeMirror.getOption('theme');
    thisCodeMirror.setOption('theme', 'default pad');
    setTimeout(function() {
        thisCodeMirror.setOption('theme', previousTheme);
    }, 5000)
}

function party_mode(player) {
    var codeDiv = getCodeDiv(player);
    var thisCodeMirror = getCodeMirror(player);
    var theme = thisCodeMirror.getOption('theme');
    $("#" + codeDiv + " .CodeMirror-code").blink();
    var sound = new Audio('assets/music.mp3');
    sound.play();
    setTimeout(function() {
        $("#" + codeDiv + " .CodeMirror-code").unblink();
        sound.pause();
    }, 15000)
}
function powerupHandler(question, user, powerup) {
    $("#"+question).remove();
    
    if ((user == 0 && player1) || (user == 1 && !player1)) {
        if (powerup == 'party') {
            party_mode(user);
        } else if (powerup == 'party') {
            removeLine(user);
        }
    }
    console.log(question, powerup, user);
}
