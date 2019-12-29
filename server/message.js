class Message {
    constructor(type){
        this.messageType = type;
        this.playerId = '';
        this.tableCards = [];
        this.playerCards = [];
        this.lastPlayedPlayer = '';
        this.setRoundNumber = 1;
        this.lastPlayedCard = '';
        this.content ='';
    }
}

function create_UUID(){
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

module.exports.Message = Message;
