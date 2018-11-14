const { defaultState, injokes, maxWordLength, colors } = require('../data')
const { EventEmitter } = require('./EventEmitter')

class Game {
    constructor() {
      this.state = defaultState
      this.events = new EventEmitter
    }

    start() {
      this.pause()
      this.interval = setInterval(this.runGameLoop.bind(this), 100)
    }

    pause() {
      clearInterval(this.interval)
    }

    get currentState() {
      return this.state.players
    }

    get when() {
      return this.events.on.bind(this.events)
    }

    get trigger() {
      return this.events.emit.bind(this.events)
    }

    createNewPlayer(socketId) {
        const newPlayer = {
            snake: null,
            currentWord: null,
            lettersCollected: [],
            wordsCompleted: [],
            socketId: socketId,
            color: this.getNextColor(this.state.players.length)
        }
        this.state.players.push(newPlayer)
    }

    createSnake(socketId) {
        this.pause()

        const player = this.state.players.find(player => player.socketId === socketId)
        player.snake = {
            facing: {x: 0, y: 1},
            history: [
                {x: 5, y: 17},
            ]
        }
        this.glitterMyBoard(player)
    }

    destroySnake(socketId) {
        this.state.players.splice(this.state.players.indexOf(this.state.players.find(player => player.socketId === socketId)), 1)
    }

    getNextColor(playerCount) {
      return colors[playerCount % colors.length]
    }

    setState(newState) {
      for (const key in newState) {
        this.state[key] = newState[key]
      }
    }

    setStateForPlayer(player, newState) {
      for (const key in newState) {
        player[key] = newState[key]
      }
    }

    changeFacing(socketId, newFacing) {
        const player = this.state.players.find(player => player.socketId === socketId)
        if (player.snake !== null)
            player.snake.facing = newFacing
    }

    runGameLoop() {
        const startTime = new Date().getTime()
        for (const player of this.state.players) {
            this.updateSnakePosition(player)
            // if (player.currentWord === null) {
            //     this.glitterMyBoard(player)
            // }

            const letterNomd = this.letterSnakeCollidedWith(player)
            if (letterNomd !== undefined) {
                this.nomLetter(player, letterNomd)
                if (this.currentWordIsComplete(player)) {
                    this.finishWord(player)
                }
            }
        }
        this.trigger('gameUpdate', this.currentState)
        console.log(`Time taken for tick: ${new Date().getTime() - startTime}ms`)
    }

    currentWordIsComplete(player) {
        return player.lettersCollected.length === player.currentWord.word.length
    }

    finishWord(player) {
        const newWord = this.pickRandomWord()
        const newCurrentWord = this.makeCurrentWordObject(newWord)
        this.setStateForPlayer(player, {
            wordsCompleted: [...player.wordsCompleted, player.lettersCollected.join("")],
            currentWord: newCurrentWord,
            lettersCollected: []
        })
    }

    glitterMyBoard(player) {
        const word = this.pickRandomWord()
        this.setStateForPlayer(player, {
            currentWord: this.makeCurrentWordObject(word)
        })
    }

    makeCurrentWordObject(word) {
        const currentWord = {word: word, letters: []}
        const takenPositions = this.getCurrentlyOccupiedSpaces()
        for (const letter of word.split("")) {
            const position = this.getRandomLetterPosition(takenPositions)
            takenPositions[JSON.stringify(position)] = true
            currentWord.letters.push({
                letter: letter,
                position: position,
                eaten: false
            })
        }
        return currentWord
    }

    getCurrentlyOccupiedSpaces() {
        const occupiedSpaces = {}
        for (const player of this.state.players) {
            if (player.currentWord !== null) {
                for (const letter of player.currentWord.letters) {
                    occupiedSpaces[JSON.stringify(letter.position)] = true
                }
            }
        }
        return occupiedSpaces
    }

    pickRandomWord() {
        let validWords = injokes.filter(word => !this.state.pickedWords.includes(word))
        
        if (validWords.length <= 0) {
            // fuck it just cycle them all through again
            this.setState({pickedWords: []})
            validWords = injokes
        }

        const word = validWords[Math.floor(Math.random() * validWords.length)]
        this.setState({pickedWords: [...this.state.pickedWords, word]})
        return word
    }

    nomLetter(player, letterNomd) {
        letterNomd.eaten = true
        this.setStateForPlayer(player, {
            lettersCollected: [...player.lettersCollected, letterNomd.letter]
        })
    }

    letterSnakeCollidedWith(player) {
        return (
            this.allLettersOnBoard.find(letter => {
                return letter.position.x === this.getSnakePosition(player).x &&
                       letter.position.y === this.getSnakePosition(player).y &&
                       !letter.eaten
            })
        )
    }

    get allLettersOnBoard() {
        return this.state.players.reduce((allLetters, player) => {
            return allLetters.concat(player.currentWord.letters)
        }, [])
    }

    getRandomLetterPosition(takenPositions) {
        let position = null
        let tries = 0
        while (tries < 50 && (position === null || takenPositions[JSON.stringify(position)] !== undefined)) {
            tries++
            position = {x: Math.floor(Math.random() * 20),
                        y: Math.floor(Math.random() * 20)}
        }
        return position
    }

    updateSnakePosition(player) {
        const snakeState = {...player.snake}
        const newPos = {x: this.getSnakePosition(player).x + player.snake.facing.x,
                        y: this.getSnakePosition(player).y + player.snake.facing.y}
        if (newPos.x > 19)
            newPos.x = 0
        if (newPos.x < 0)
            newPos.x = 19
        if (newPos.y > 19)
            newPos.y = 0
        if (newPos.y < 0)
            newPos.y = 19
        snakeState.history.unshift(newPos)
        // get rid of old history if it's longer than needed to display tails
        if (snakeState.history.length > maxWordLength)
            snakeState.history.pop()
        this.setStateForPlayer(player, {snake: snakeState})
    }

    getSnakePosition(player) {
        return player.snake.history[0]
    }
}

module.exports=  {
  Game
}