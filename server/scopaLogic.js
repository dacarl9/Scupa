scopaCards = [
    "1_1", "2_1", "3_1", "4_1", "5_1", "6_1", "7_1", "8_1", "9_1", "10_1",
    "1_2", "2_2", "3_2", "4_2", "5_2", "6_2", "7_2", "8_2", "9_2", "10_2",
    "1_3", "2_3", "3_3", "4_3", "5_3", "6_3", "7_3", "8_3", "9_3", "10_3",
    "1_4", "2_4", "3_4", "4_4", "5_4", "6_4", "7_4", "8_4", "9_4", "10_4"
];

const Message = require('./message').Message;
const Combinatorics = require('./combinatorics');

class ScopaLogic {
    constructor(aRoom) {
        // Virtueller Tisch an dem die Spieler sitzen.
        this.room = aRoom;
        // Gemischte Karten der Runde
        this.shuffeldCards = [];
        // Karten auf dem Tisch
        this.tableCards = [];
        // Kartenverteiler
        this.player1 = {
            id: '',
            actualHandCards: [],
            is_cardShuffler: true,
            takenCards: [],
            scopaCount: 0,
            totalPoints: 0
        };
        this.player2 = {
            id: '',
            actualHandCards: [],
            is_cardShuffler: false,
            takenCards: [],
            scopaCount: 0,
            totalPoints: 0
        };
        this.gameRoundNumber = 0;
        // Satzrunde (wird für das erkennen des Ende einer Gamerunde verwendet)
        this.setRoundNumber = 1;
        // Zuletzt gespielte Karte
        this.lastPlayedCard = '';
        // Spieler der zuletzt Karten genommen hat
        this.lastPlayedPlayer = null;
        this.winnerId = null;
        this.overViewInfo = [];
    }

    // Startet das Spiel. (Teilt jeweils 3 Karten den Spielern aus und 4 auf den Tisch.
    startGame(aDistributorId) {
        this.gameRoundNumber++;
        this.setRoundNumber = 1;
        // Karte mischen
        this.shuffleCards();
        this.tableCards = this.getNextCards(4);
        this.player1.id = this.room.players[0].playerId;
        this.player1.actualHandCards = this.getNextCards(3);
        this.player2.id = this.room.players[1].playerId;
        this.player2.actualHandCards = this.getNextCards(3);

        // Player 1 "teilt" Karten am Anfang aus.
        if(aDistributorId){
            this.lastPlayedPlayer = aDistributorId;
        }else {
            this.lastPlayedPlayer = this.room.players[0].playerId;
        }

        let _message = new Message(0);
        _message.playerId = this.room.players[0].playerId;
        _message.tableCards = this.tableCards;
        _message.playerCards = this.player1.actualHandCards;
        _message.lastPlayedPlayer = this.lastPlayedPlayer;
        _message.newGameRound = true;
        _message.gameRoundNumber = this.gameRoundNumber;
        _message.setRoundNumber = this.setRoundNumber;
        console.log("startGame tablecards:"+_message.tableCards+"handCards"+_message.playerCards);
        this.room.sendToPlayer(_message);

        _message = new Message(0);
        _message.playerId = this.room.players[1].playerId;
        _message.tableCards = this.tableCards;
        _message.playerCards = this.player2.actualHandCards;
        _message.lastPlayedPlayer = this.lastPlayedPlayer;
        _message.newGameRound = true;
        _message.gameRoundNumber = this.gameRoundNumber;
        _message.setRoundNumber = this.setRoundNumber;
        console.log("startGame tablecards:"+_message.tableCards+"handCards"+_message.playerCards);
        this.room.sendToPlayer(_message);
    }

    // Karten austeilen
    playOutCards() {
        this.player1.id = this.room.players[0].playerId;
        this.player1.actualHandCards = this.getNextCards(3);
        this.player2.id = this.room.players[1].playerId;
        this.player2.actualHandCards = this.getNextCards(3);

        let _message = new Message(0);
        _message.playerId = this.player1.id;
        _message.tableCards = this.tableCards;
        _message.playerCards = this.player1.actualHandCards;
        _message.lastPlayedCard = this.lastPlayedCard;
        _message.lastPlayedPlayer = this.lastPlayedPlayer;
        _message.newRound = true;
        _message.gameRoundNumber = this.gameRoundNumber;
        _message.setRoundNumber = this.setRoundNumber;
        console.log("playoutCards tablecards:"+_message.tableCards+"handCards"+_message.tableCards);
        this.room.sendToPlayer(_message);

        _message = new Message(0);
        _message.playerId = this.player2.id;
        _message.tableCards = this.tableCards;
        _message.playerCards = this.player2.actualHandCards;
        _message.lastPlayedCard = this.lastPlayedCard;
        _message.lastPlayedPlayer = this.lastPlayedPlayer;
        _message.newRound = true;
        _message.gameRoundNumber = this.gameRoundNumber;
        _message.setRoundNumber = this.setRoundNumber;
        console.log("playoutCards tablecards:"+_message.tableCards+"handCards"+_message.tableCards);
        this.room.sendToPlayer(_message);
    }

    // Spieler Nachricht verarbeiten. (Aktuell wird nur eine Karte vom Spieler gesendet)
    processPlayerMessage(message, aRoom) {
        console.log('nachricht von spieler' + message.playerName + ' in logik empfangen: ' + message.content);
        let _card = message.content ? message.content : this.lastPlayedCard;
        let _player = message.playerId == this.player1.id ? this.player1 : this.player2;
        this.lastPlayedPlayer = message.playerId == this.player1.id ? this.room.players[0].playerId : this.room.players[1].playerId;

        this.removeFromArray(_player.actualHandCards, _card);

        this.lastPlayedCard = _card;
        // 1. Fall: Gleiche Karte
        let sameCards = this.checkCardNumberIsOnTable(_card);
        // 2. Fall: Kombinationen zur Karte
        let _cardCombinations = this.getPossibleCardCombinationWithCard(_card);

        if (sameCards.length > 0) {
            // Gepsielte Karte aufs Konto.
            this.addCardToAccount(message.playerId, _card);
            // Karte mit gleicher anzahl Augen aufs Konto.
            this.addCardToAccount(message.playerId, sameCards[0]);

            // Spieler kann Karte nehmen.
            this.removeFromArray(this.tableCards, sameCards[0]);
        } else if (_cardCombinations.length > 0) {
            // Gepsielte Karte aufs Konto.
            this.addCardToAccount(message.playerId, _card);
            // Spieler kann Karte nehmen.

            if(message.combination){
                let _cardsToRemove = message.combination;
                for (let element in _cardsToRemove) {
                    this.addCardToAccount(message.playerId, _cardsToRemove[element]);
                    this.removeFromArray(this.tableCards, _cardsToRemove[element]);
                }
            }else if(_cardCombinations.length === 1){
                let _cardsToRemove = _cardCombinations[0];
                for (let element in _cardsToRemove) {
                    this.addCardToAccount(message.playerId, _cardsToRemove[element]);
                    this.removeFromArray(this.tableCards, _cardsToRemove[element]);
                }
            }else{
                // Hier sind mehrere Kombinationen möglich und es muss eine vom Spieler ausgewählt werden.
                var _message = {
                    messageType: 9,
                    playerId: message.playerId,
                    combinations: _cardCombinations
                };
                aRoom.sendToPlayer(_message);
                return;
            }
        } else {
            // Karte kann nicht genommen werden.
            this.tableCards.push(_card);
        }

        var _gameData = {
            messageType: 0,
            tableCards: this.tableCards,
            handCards: [],
            lastPlayedCard: this.lastPlayedCard,
            lastPlayedPlayer: this.lastPlayedPlayer
        };

        // Scopa
        if (this.tableCards.length == 0) {
            this.addScopaPoint();
        }

        console.log("processPlayerMessage tablecards:"+_gameData.tableCards+"handCards"+_gameData.tableCards);
        aRoom.sendAll(JSON.stringify(_gameData));

        if (this.player1.actualHandCards.length == 0 && this.player2.actualHandCards.length == 0) {
            this.setRoundNumber += 1;
            if (this.setRoundNumber !== 7) {
                this.playOutCards();
            } else {

                // Teilt die Tischkarten dem Spieler zu welcher zuletzt genommen hat.
                this.distributeLastTableCards();

                // Zählt die Punkte für die Aktuelle Runde
                this.countPlayerRoundPoints();

                // Ermittelt einen Sieger und speichert diesen
                this.checkWinner();

                if (this.winnerId) {
                    let _winMessage = {
                        messageType: 4,
                        winnerId: this.winnerId
                    };
                    console.log("gewinn nachricht senden")
                    this.room.sendAll(JSON.stringify(_winMessage));
                    //TODO was wenn fertig?
                    this.sendOverViewMessage();
                } else {
                    let _finalLastPlayerId = this.lastPlayedPlayer;
                    this.sendOverViewMessage();
                    this.sendCleanCommand();

                    // Wechsel des Kartenverteilers
                    let _distributorId = _finalLastPlayerId === this.room.players[0].playerId ? this.room.players[1].playerId : this.room.players[0].playerId;
                    this.startGame(_distributorId);

                    // Löscht Daten vor  neuer Runde
                    this.cleanRoundData();
                    this.gameRoundNumber++;
                }

            }
        }
    }

    // Gibt gemischte Karten
    getNextCards(aCardCount) {
        let _cards = [];

        for (let i = 0; i < aCardCount; i++) {
            _cards.push(this.shuffeldCards.shift());
        }
        return _cards;
    }

    // Karten mischen
    shuffleCards() {
        this.shuffeldCards = [];
        this.shuffeldCards = scopaCards.slice();
        this.shuffeldCards = this.shuffle(this.shuffeldCards);
    }

    // Misch Algorithmus
    shuffle(array) {
        let currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    // Gibt die unterschiede von 2 Array zurück
    getArrayDiffrence(a1, a2) {
        let a = [], diff = [];

        for (let i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }

        for (let j = 0; j < a2.length; j++) {
            if (a[a2[j]]) {
                delete a[a2[j]];
            } else {
                a[a2[j]] = true;
            }
        }

        for (let k in a) {
            diff.push(k);
        }

        return diff;
    }

    // Gibt zurück ob sich die gleiche Karte einer anderen Farbe auf dem Tisch liegt
    checkCardNumberIsOnTable(aCard) {
        let cardNumber = aCard.length === 3 ? aCard.charAt(0) : aCard.charAt(0) + aCard.charAt(1);
        let choosableCards = []

        for (let tableCard in this.tableCards) {
            var _card = this.tableCards[tableCard];
            var _tableCardNumber = _card.length === 3 ? _card.charAt(0) : _card.charAt(0) + _card.charAt(1);
            if (_tableCardNumber == cardNumber) {
                // Zu möglichen gleichen Karten hinzufügen
                choosableCards.push(this.tableCards[tableCard]);
            }
        }
        return choosableCards;
    }

    getPossibleCardCombinationWithCard(aCard) {
        let _result = [];
        let _cardValue = parseInt(aCard.charAt(0) + aCard.charAt(1));
        let _allCombinations = this.getAllCardCombinations();

        for (let combination in _allCombinations) {
            let _combination = _allCombinations[combination];

            if (_combination.length <= 1) {
                continue;
            }

            let sum = 0;
            let cardComboIds = []
            for (let entry in _combination) {
                sum += parseInt(_combination[entry].cardValue);
                cardComboIds.push(_combination[entry].cardId);
            }

            if (sum === _cardValue) {
                _result.push(cardComboIds);
            }
        }
        return _result;
    }

    // Gibt mögliche Karten-Kombinationen, welche in der Summe den Wert der Karte ergeben.
    getAllCardCombinations() {
        let _tableCardWithValues = this.getActualTableCardIdsWithValue();
        let cmb = Combinatorics.power(_tableCardWithValues);
        return cmb.toArray();
    }

    // Löscht ein Element aus Array (TableCard, HandCard)
    removeFromArray(aArray, aElemnt) {
        for (let i = 0; i < aArray.length; i++) {
            if (aArray[i] === aElemnt) {
                aArray.splice(i, 1);
            }
        }
    }

    // Gibt die aktuellen Tischkarten mit deren Wert zurück.
    getActualTableCardIdsWithValue() {
        let tableCardsWithValue = [];

        for (let tableCard in this.tableCards) {
            if (!this.tableCards.hasOwnProperty(tableCard)) {
                continue;
            }

            let _cardId = this.tableCards[tableCard];
            tableCardsWithValue.push({
                cardId: _cardId,
                cardValue: _cardId.length === 3 ? _cardId.charAt(0) : _cardId.charAt(0) + _cardId.charAt(1)
            });
        }

        return tableCardsWithValue;
    }

    // Fügt Karte zum Account hinzu.
    addCardToAccount(aPlayerId, aCard) {
        let _player = aPlayerId == this.player1.id ? this.player1 : this.player2;
        _player.takenCards.push(aCard);

        console.log("");
        console.log("Spielzustand:");
        console.log("Spieler 1 : genommene Karten : " + this.player1.takenCards + " Karten in der Hand:" + this.player1.actualHandCards);
        console.log("Spieler 2 : genommene Karten : " + this.player2.takenCards + " Karten in der Hand:" + this.player2.actualHandCards);
        console.log("Tisch Karten: " + this.tableCards);
        console.log("");
    }

    // Verteilt die Punkte für eine Runde
    countPlayerRoundPoints() {
        // Karten-Punkt
        this.calculateCardPoint();

        // Denari Punkt
        this.calculateDenariPoint();

        // Settebello Punkt
        this.calculateSetteBelloPoint();

        // Settanta Punkt
        this.calculalteSettantaPoint();

        console.log("Actual Points P1:" + this.player1.totalPoints);
        console.log("Actual Points P2:" + this.player2.totalPoints);
    }

    // Karten Punkt berechnen
    calculateCardPoint() {
        if (this.player1.takenCards.length == 20) {
            // Punkt Entfällt
            this.overViewInfo.push({
                cardPoint: ''
            });
        }
        if (this.player1.takenCards.length > 20) {
            this.player1.totalPoints += 1;
            this.overViewInfo.push({
                cardPoint: this.player1.id
            });
        } else {
            this.player2.totalPoints += 1;
            this.overViewInfo.push({
                cardPoint: this.player2.id
            });
        }
    }

    // Denari Punkt beerechnen
    calculateDenariPoint() {
        let _denariCount = 0;
        for (let i = 0; i < this.player1.takenCards.length; i++) {

            let _card = this.player1.takenCards[i];
            let _color = _card.length === 3 ? _card.charAt(2) : _card.charAt(3);

            if (_color === "1") {
                _denariCount++;
            }
        }

        if (_denariCount === 5) {
            // Punkt entfällt
            this.overViewInfo.push({
                denariPoint: ''
            });
        } else if (_denariCount > 5) {
            console.log("Denari P1")
            this.player1.totalPoints++;
            this.overViewInfo.push({
                denariPoint: this.player1.id
            });
        } else {
            console.log("Denari P2")
            this.player2.totalPoints++;
            this.overViewInfo.push({
                denariPoint: this.player2.id
            });
        }
    }

    // Settebello Punkt berechnen
    calculateSetteBelloPoint() {
        let _setteBelloFound = false;
        for (let i = 0; i < this.player1.takenCards.length; i++) {
            let _card = this.player1.takenCards[i];
            if (_card == '7_1') {
                _setteBelloFound = true;
                break;
            }
        }

        if (_setteBelloFound) {
            console.log("Settebello P1")
            this.player1.totalPoints++;
            this.overViewInfo.push({
                settebelloPoint: this.player1.id
            });
        } else {
            console.log("Settebello P2")
            this.player2.totalPoints++;
            this.overViewInfo.push({
                settebelloPoint: this.player2.id
            });
        }
    }

    // Settanta Punkt berechnen
    calculalteSettantaPoint() {

        let _player1Cards = this.player1.takenCards;
        let _pointsDenaro = this.getPointsFromColor(_player1Cards, "1");
        let _pointsCope = this.getPointsFromColor(_player1Cards, "2");
        let _pointsBastoni = this.getPointsFromColor(_player1Cards, "3");
        let _pointsSpade = this.getPointsFromColor(_player1Cards, "4");
        let _pointSumPlayer1 = _pointsDenaro + _pointsCope + _pointsBastoni + _pointsSpade;

        let _player2Cards = this.player2.takenCards;
        _pointsDenaro = this.getPointsFromColor(_player2Cards, "1");
        _pointsCope = this.getPointsFromColor(_player2Cards, "2");
        _pointsBastoni = this.getPointsFromColor(_player2Cards, "3");
        _pointsSpade = this.getPointsFromColor(_player2Cards, "4");
        let _pointSumPlayer2 = _pointsDenaro + _pointsCope + _pointsBastoni + _pointsSpade;

        console.log("setttanta punkte: p1: " + _pointSumPlayer1 + " p2 " + _pointSumPlayer2);

        if (_pointSumPlayer1 === _pointSumPlayer2) {
            // Punkt entfällt
            this.overViewInfo.push({
                settantaPoint: ''
            });
        } else if (_pointSumPlayer1 > _pointSumPlayer2) {
            console.log("Settanta P1")
            this.player1.totalPoints++;
            this.overViewInfo.push({
                settantaPoint: this.player1.id
            });
        } else {
            console.log("Settanta P2")
            this.player2.totalPoints++;
            this.overViewInfo.push({
                settantaPoint: this.player2.id
            });
        }
    }

    // Punkte einer Karten-Farbe. (Wird für Settanta benötigt)
    getPointsFromColor(aArray, aColor) {
        let _cardNumbers = [];

        for (let i = 0; i < aArray.length; i++) {
            let _card = aArray[i];
            let _color = _card.length === 3 ? _card.charAt(2) : _card.charAt(3);

            if (_color === aColor) {
                let _cardNumber = _card.length === 3 ? _card.charAt(0) : _card.charAt(0) + _card.charAt(1);
                _cardNumbers.push(_cardNumber);
            }
        }

        if (_cardNumbers.includes("7")) {
            return 21;
        } else if (_cardNumbers.includes("6")) {
            return 18
        } else if (_cardNumbers.includes("1")) {
            return 16;
        } else if (_cardNumbers.includes("5")) {
            return 15;
        } else if (_cardNumbers.includes("4")) {
            return 14;
        } else if (_cardNumbers.includes("3")) {
            return 13;
        } else if (_cardNumbers.includes("2")) {
            return 12;
        } else if (_cardNumbers.includes("8") || _cardNumbers.includes("9") || _cardNumbers.includes("10")) {
            return 10;
        } else {
            return 0;
        }
    }

    // Übrige Karten vom Tisch dem zuletzt genommenen Spieler verteilen
    distributeLastTableCards() {
        let _playerId = '';

        if (this.lastPlayedPlayer == this.player1.id) {
            _playerId = this.player1.id;
        } else {
            _playerId = this.player2.id;
        }

        for (let i = 0; i < this.tableCards.length; i++) {
            this.addCardToAccount(_playerId, this.tableCards[i]);

        }

        let _message = {
            messageType: 0,
            tableCards: []
        };
        console.log("sendCleanCommand tablecards:"+_message.tableCards);
        this.tableCards = [];
        this.room.sendAll(JSON.stringify(_message));
    }

    // Überprüfen ob es einen eindeutigen Gewinner gibt
    checkWinner() {
        // Beide Spieler haben noch nicht 11
        if (this.player1.totalPoints < 11 && this.player2.totalPoints < 11) {
            return;
        }

        // Beide Spieler haben gleich viele Punkte
        if (this.player1.totalPoints === this.player2.totalPoints) {
            return;
        }

        if (this.player1.totalPoints > this.player2.totalPoints && this.player1.totalPoints >= 11) {
            // Player 1 gewonnen sachen machen
            this.winnerId = this.player1.id;
            console.log("this.winner ID: " + this.winnerId)
        }

        if (this.player2.totalPoints > this.player1.totalPoints && this.player2.totalPoints >= 11) {
            this.winnerId = this.player2.id;
            console.log("this.winner ID: " + this.winnerId)
        }
    }

    // Werte zurücksetzen für eine neue GameRunde
    cleanRoundData() {
        this.player1.takenCards = [];
        this.player2.takenCards = [];
        this.player1.scopaCount = 0;
        this.player2.scopaCount = 0;
    }

    // Spielübersicht-Anzeige
    sendOverViewMessage() {

        // Scopa Punkt hinzufügen
        this.overViewInfo.push({
            scopaPoints: [{
                id: this.player1.id,
                scopaCount: this.player1.scopaCount
            }, {
                id: this.player2.id,
                scopaCount: this.player2.scopaCount
            }]
        });

        // Total Punkt hinzufügen
        this.overViewInfo.push({
            totalPoints: [{
                id: this.player1.id,
                totalCount: this.player1.totalPoints,
            }, {
                id: this.player2.id,
                totalCount: this.player2.totalPoints,
            }]
        });

        let _message = {
            messageType: 5,
            overViewInfo: this.overViewInfo
        };
        console.log("sendOverViewMessage tablecards:"+_message.tableCards+"handCards"+_message.tableCards);
        this.room.sendAll(JSON.stringify(_message));
        this.overViewInfo = [];
    }

    // Scopa Punkt hinzufügen
    addScopaPoint() {
        console.log("scupa")
        if (this.lastPlayedPlayer == this.player1.id) {
            this.player1.scopaCount++;
            this.player1.totalPoints++;
        } else {
            this.player2.scopaCount++;
            this.player2.totalPoints++;
        }
    }

    // Wenn eine Runde zu Ende ist müssen die Daten der Spieler gellert werden.
    sendCleanCommand(){
        let _message = new Message(6);
        _message.tableCards = [];
        console.log("sendCleanCommand tablecards:"+_message.tableCards);
        this.room.sendAll(JSON.stringify(_message));
    }
}

module.exports.ScopaLogic = ScopaLogic;