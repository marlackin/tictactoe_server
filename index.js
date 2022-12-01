var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = [];
var rooms = [];
var currRoom = null;
var currPlayer = null;

function create_room(player) {
    currPlayer = player;
    let room_id = Math.floor(1000+Math.random()*9000);
    let room = {
        id: room_id,
        player1: player,
        player2: null,
        board: {
            history: [{
                squares: Array(9).fill(null)
            }],
            stepNumber: 0,
            next: null
        },
        status: 'waiting'
    }
    rooms[room_id] = room;
    return room_id;
}

function join_room(player, room_id) {
    currPlayer = player;
    console.log(currPlayer + ' join room ' + room_id);
    let curr = rooms[room_id];
    if (curr != undefined) {
        curr.player2 = currPlayer;
        curr.status = 'ready';
        curr.board.next = curr.player1;
        return curr;
    } else {
        return null;
    }
}

function start() {
    io.emit('onStart', currRoom);
}

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('create_room', function(data){
        let room_id = create_room(data);
        console.log('player: ' + data + ' create a new room #' + room_id);
        socket.emit('onCreate', rooms[room_id]);
    });

  socket.on('state_change', function(newState){
     console.log("moved ", newState);
     currRoom = newState;
     io.emit('onChange', currRoom);
  })

  socket.on('join_room', function(data){
    let room = join_room(data[0], data[1]);
    if (room != null) {
        currRoom = room;
        io.emit('onJoin',currRoom);
        start();
    } else {
        socket.emit('onJoin',{code: 404, message:'room not found!'});
    }
  });
});

http.listen(5000, function(){
  console.log('listening on *:5000');
});
    