const { Game } = require('../classes/Game')

var express = require('express');
var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'snakegame' });
// });

module.exports = router;

function start() {
  const game = new Game
  
  setupSockets(game)
  game.start()
}

function setupSockets(game) {
  const http = require('http').Server(express);
  // const io = require('socket.io')(http);

  const server = http.listen(3000, function(){
    console.log('listening on *:3000');
  });
  const io = require('socket.io').listen(server);

  io.on('connection', (socket) => {
    console.log(socket.id)
    // io.to(socket.id).emit('initialLoadData', game.currentState)
    game.when('gameUpdate', payload => {
      socket.emit('gameUpdate', {state: payload, socketId: socket.id})
      console.log("Sending game update to" + socket.id)
    })

    console.log('a user connected');
    game.createNewSnake(socket.id)
    socket.emit('initialLoadData', {state: game.currentState, socketId: socket.id})


    socket.on('changeFacing', function(newFacing){
      game.changeFacing(socket.id, newFacing)
    });
    socket.on('pause', function(){
      game.pause()
    });
    socket.on('resume', function(){
      game.start()
    });

    socket.on('disconnect', function(){
      game.destroySnake(socket.id)
      console.log('user disconnected');
    });
  });
}

start()