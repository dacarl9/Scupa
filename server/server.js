// Settings
let port = 3000;

// Server code
let WebSocketServer = require('ws').Server;
let server = new WebSocketServer({ port: port });

let Room = require('./game').Room;
let Player = require('./game').Player;
let room = new Room();
let _rooms = [];

// wss welcher Tische mit Spielern befüllt sobald 2 Spieler eingeloggt sind, kann ein Spiel gestartet werden
server.on('connection', function(socket) {

    // Es gibt noch keine Räume
    if (_rooms.length == 0 || _rooms[_rooms.length - 1].getPlayerCount() == 2) {
        let _newRoom = new Room();
        let player = new Player(socket);
        _newRoom.addPlayer(player)
        _rooms.push(_newRoom);
        console.log("Ein neuer Raum wurde erstellt und der Spieler wurde darin gespeichert");
    } else {
        let player = new Player(socket);
        let _existingRoom =  _rooms[_rooms.length - 1];
        _existingRoom.addPlayer(player);
        console.log("Spieler wurde in bereits existierenden Raum gestellt.");
        _existingRoom.inizializeGame();
    }
});

console.log("WebSocket wss is running.");
console.log("Listening to port " + port + ".");
