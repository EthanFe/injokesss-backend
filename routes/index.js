const { Game } = require('../classes/Game')

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'snakegame' });
});

module.exports = router;

function start() {
  // // SavedGame.remove({}, () => {})
  // const game = await findOrCreateSaveGame()
  // game.ready()
  const game = new Game
  
  const socket = setupSockets(game)
  game.start()
}

function setupSockets(game) {
  game.when('gameUpdate', payload => io.emit('gameUpdate', payload))

  const http = require('http').Server(express);
  // const io = require('socket.io')(http);

  const server = http.listen(3000, function(){
    console.log('listening on *:3000');
  });
  const io = require('socket.io').listen(server);

  io.on('connection', (socket) => {
    io.to(socket.id).emit('initialLoadData', game.currentState)

    console.log('a user connected');

    socket.on('changeFacing', function(newFacing){
      game.changeFacing(newFacing)
    });
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
  });
}

start()