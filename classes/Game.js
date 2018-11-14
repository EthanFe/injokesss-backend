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
      return {players: this.activePlayers, timer: this.state.msUntilWordChange}
    }

    get activePlayers() {
        return this.state.players.filter(player => player.snake !== null)
    }

    get when() {
      return this.events.on.bind(this.events)
    }

    get trigger() {
      return this.events.emit.bind(this.events)
    }

    addVote(message) {
        if (message !== null) {
            message = this.truncateMessage(message)
            this.state.wordVotes[message] = this.state.wordVotes[message] || 0
            this.state.wordVotes[message]++
        }
    }

    truncateMessage(message) {
        return message.slice(0, 50)
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

        this.trigger('gameUpdate', this.currentState)
    }

    removePlayer(socketId) {
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
            if (player.snake !== null) {
                this.updateSnakePosition(player)

                const letterNomd = this.letterSnakeCollidedWith(player)
                if (letterNomd !== undefined) {
                    this.nomLetter(player, letterNomd)
                    if (this.currentWordIsComplete(player)) {
                        this.finishWord(player)
                    }
                }
            }
        }
        this.incrementCountdownTimer()
        this.trigger('gameUpdate', this.currentState)
        console.log(`Time taken for tick: ${new Date().getTime() - startTime}ms`)
    }

    incrementCountdownTimer() {
        this.state.msUntilWordChange -= 100
        if (this.state.msUntilWordChange <= 0) {
            this.state.msUntilWordChange = 30 * 1000
            this.swapperoniAssignedWords()
            this.state.wordVotes = {}
        }
    }

    swapperoniAssignedWords() {
        const wordsToAssign = this.getTopVotedWords()
        while (wordsToAssign.length < this.activePlayers.length) {
            wordsToAssign.push(this.pickRandomWord())
        }
        for (const player of this.activePlayers) {
            this.finishWord(player)
            this.assignNewWord(player, wordsToAssign[this.activePlayers.indexOf(player)]) // change this janky shit to randomly assign
        }
    }

    // this should break ties randomly instead of whatever sort is doing (probably leaving them in whatever order from the object)
    getTopVotedWords() {
        const votesArray = []
        for (const word in this.state.wordVotes) {
            votesArray.push({word: word, votes: this.state.wordVotes[word]})
        }
        const sortedVotes = votesArray.sort((word1, word2) => word1.votes - word2.votes).map(word => word.word)
        return sortedVotes.slice(0, this.activePlayers.length)
    }

    currentWordIsComplete(player) {
        return player.lettersCollected.length === player.currentWord.word.length
    }

    finishWord(player) {
        this.setStateForPlayer(player, {
            wordsCompleted: [...player.wordsCompleted, player.lettersCollected.join("")],
            lettersCollected: []
        })
    }

    assignNewWord(player, newWord) {
        const newCurrentWord = this.makeCurrentWordObject(newWord)
        this.setStateForPlayer(player, {
            currentWord: newCurrentWord,
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
        return this.activePlayers.reduce((allLetters, player) => {
            if (player.currentWord !== null)
                return allLetters.concat(player.currentWord.letters)
            else
                return allLetters
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
