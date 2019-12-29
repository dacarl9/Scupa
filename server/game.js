let MESSAGE_TYPE = {
SERVER_MESSAGE: 0,
CLIENT_CARD: 1,
CLIENT_CHAT: 2,
CLIENT_STATE: 3,
WIN_MESSAGE: 4,
OVERVIEW_MESSAGE: 5,
CLEAN_MESSAGE: 6,
CLIENT_RESTART: 7,
CLIENT_LOGOUT: 8
};

let Message = require('./message').Message;
let ScopaLogic = require('./scopaLogic').ScopaLogic;
let scopaLogic = null;

class Player {
constructor(aSocket) {
    this.socket = aSocket;
    this.id = this.id = "1" + Math.floor(Math.random() * 1000000000);
    this.playerName = 'unnamed';
    this.playerId = 'not set';
}
}

// Raum in dem sich die Spieler befinsden.
class Room {
    constructor() {
        this.players = [];
    }
    // Start des Spiels
    inizializeGame() {
            //  Pro Spiel gibt es eine Scopa-Logik (diese Verwaltet jeweils ein Duell)
            if (this.players.length === 2) {
                scopaLogic = new ScopaLogic(this);
                scopaLogic.startGame();
            }
        }

    // Person ins Spiel einloggen
    addPlayer(aPlayer) {
        let _this = this;
        this.players.push(aPlayer);

        _this.sendWelcomeMessageData(aPlayer, _this);
        _this.handleOnPlayerMessage(aPlayer);

        // handle player closing
        aPlayer.socket.onclose = function () {
            _this.removeAllPlayer();

            let _data = {
                messageType: MESSAGE_TYPE.CLIENT_LOGOUT,
                content: aPlayer.name
            };
            _this.sendToPlayer(_data);
        }
    }

    // Gibt die Anzahl Spieler im Raum zurück.
    getPlayerCount() {
        return this.players.length;
    }

    // Text Nachricht senden.
    sendWelcomeMessageData(aPlayer, room) {
        let message = "Wilkommen zu Scopa. Aktuell eingeloggte Spieler: " + this.players.length;
        let _data = {
            messageType: MESSAGE_TYPE.CLIENT_CHAT,
            content: message
        };
        this.sendAll(JSON.stringify(_data));
    }

    // Auf Client Nachrichten reagieren
    handleOnPlayerMessage(player) {
        let _this = this;

        // handle on message
        player.socket.on("message", function (message) {
            let _data = JSON.parse(message);

            if (_data.messageType === MESSAGE_TYPE.CLIENT_CHAT) {
                let _playerDisplayName = player.id;
                if (player.playerName) {
                    _playerDisplayName = player.playerName;
                }
                let _message = new Message(MESSAGE_TYPE.CLIENT_CHAT);
                _message.content = _playerDisplayName + " : " + _data.content;
                _this.sendAll(JSON.stringify(_message));
            } else if (_data.messageType === MESSAGE_TYPE.CLIENT_CARD) {
                // Karte in der Logik verarbeiten.
                scopaLogic.processPlayerMessage(_data, _this);
            } else if (_data.messageType === MESSAGE_TYPE.CLIENT_STATE) {
                // Name und ID des Spielers setzen
                player.playerName = _data.playerName;
                player.playerId = _data.playerId;
                console.log("Spielername: " + _data.playerName + " Spieler ID" + _data.playerId);
            }else if (_data.messageType === MESSAGE_TYPE.CLIENT_RESTART) {
               scopaLogic.startGame();
            }
        });
    }

    // Löscht einen Spieler aus dem Spiel
    removePlayer(player) {
        // loop to find the player
        for (let i = this.players.length; i >= 0; i--) {
            if (this.players[i] === player) {
                this.players.splice(i, 1);
            }
        }

        if (this.players.length === 0) {
            scopaLogic = new ScopaLogic(this);
        }
    }

    // Löscht einen Spieler aus dem Spiel
    removeAllPlayer() {
        if (this.players.length === 1) {
            return;
        }
        // loop to find the player
        for (let i = this.players.length; i >= 0; i--) {
            this.players.splice(i, 1);
        }

        // TODO Ev raum löschen
    }

    // Nachricht an alle Spieler senden
    sendAll(message) {
        for (let i = 0, len = this.players.length; i < len; i++) {
            this.players[i].socket.send(message);
        }
    }

    // Nachricht an spezigischen Spieler senden
    sendToPlayer(aMessage) {

        for (let i = 0, len = this.players.length; i < len; i++) {
            if (this.players[i].playerId === aMessage.playerId) {
                this.players[i].socket.send(JSON.stringify(aMessage));
            }
        }
    }
}

module.exports.Room = Room;
module.exports.Player = Player;