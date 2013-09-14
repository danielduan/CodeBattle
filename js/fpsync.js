var gameNum = getParam('game');
if (!gameNum) {
    document.location.href = "index.html";
}
var f = new Firebase('https://codebattle.firebaseio.com/games/'+gameNum);
var player1, codeMirror1, codeMirror2, firepad1, firepad2, language, question;
var obsever = false;
var consoleFormat = {
    theme: 'console',
    readOnly: 'nocursor'
}    
console1 = CodeMirror(document.getElementById('console1'), consoleFormat);
console2 = CodeMirror(document.getElementById('console2'), consoleFormat);
firepadConsole1 = Firepad.fromCodeMirror(f.child('player1').child('console'), console1);
firepadConsole2 = Firepad.fromCodeMirror(f.child('player2').child('console'), console2);
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
    question = data.child('question').val();
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
    } else if (playerCount == 1) {
        player1 = false;
        f.child('playerCount').set(playerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), otherPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), currPlayerFormat);
        document.getElementById('submit0').className += ' disabled';
        document.getElementById('submit0').onclick = "";
    } else {
        obsever = true;
        f.child('observerCount').set(observerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), otherPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), otherPlayerFormat);
        document.getElementById('submit1').className += ' disabled';
        document.getElementById('submit0').className += ' disabled';
        document.getElementById('submit1').onclick = "";
        document.getElementById('submit0').onclick = "";

    }
    firepad1 = Firepad.fromCodeMirror(f.child('player1').child('code'), codeMirror1);
    firepad2 = Firepad.fromCodeMirror(f.child('player2').child('code'), codeMirror2);
    firepad1.on('ready', function() {
        if (firepad1.isHistoryEmpty()) {
            firepad1.setText('Player 1');
        }
    });
    firepad2.on('ready', function() {
        if (firepad2.isHistoryEmpty()) {
            firepad2.setText('Player 2');
        }
    });
});
function submitCode() {
    var player = "2";
    var code = codeMirror2.getDoc().getValue();
    if (player1) {
        player = "1";
        code = codeMirror1.getDoc().getValue();
    }
    $.get(
        "http://codebattle.aws.af.cm/run_tests",
        { game: gameNum, player: player, code: code, question: question, lang: language },
        function(data){
            console.log(data);
            if (player1) {
                console1.getDoc().setValue(console1.getDoc().getValue() + JSON.stringify(data));
            } else {
                console2.getDoc().setValue(console2.getDoc().getValue() + JSON.stringify(data));
            }
        },
        "jsonp"
    );
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