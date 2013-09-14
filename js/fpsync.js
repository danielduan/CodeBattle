var gameNum = getParam('game');
if (!gameNum) {
    document.location.href = "index.html";
}
var f = new Firebase('https://codebattle.firebaseio.com/games/game'+gameNum);
var player1, codeMirror1, codeMirror2, firepad1, firepad2;
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
    var language = data.child('language').val();
    var currPlayerFormat = {
        lineNumbers: true,
        mode: language,
        theme: 'pad',
        autofocus: true
    };
    var otherPlayerFormat = {
        lineNumbers: true,
        mode: language,
        theme: 'pad',
        readOnly: 'nocursor'
    };
    if (!playerCount || playerCount == 0) {
        player1 = true;
        f.child('playerCount').set(playerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), currPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), otherPlayerFormat);
    } else if (playerCount == 1) {
        player1 = false;
        f.child('playerCount').set(playerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), otherPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), currPlayerFormat);
    } else {
        obsever = true;
        f.child('observerCount').set(observerCount + 1);
        codeMirror1 = CodeMirror(document.getElementById('firepad1'), otherPlayerFormat);
        codeMirror2 = CodeMirror(document.getElementById('firepad2'), otherPlayerFormat);
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
function getParam(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}