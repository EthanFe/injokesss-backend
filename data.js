const defaultState = {
  players: [
    // {
      // snake: {
      //   facing: {x: 0, y: 1},
      //   history: [
      //     {x: 5, y: 17},
      //   ]
      // },
      // currentWord: null,
      // lettersCollected: [],
      // wordsCompleted: ["booleanicing", "hell yeah", "word", "fuckingcompleted"],
    // }
  ],
  pickedWords: []
}

const injokes = [
  "thejonathan",
  "welcome,",
  "hormones",
  "woich",
  "injoke",
  "booleanicing",
  "sneezecounttwo",
  "smoothyisthicc",
  "flowflowflow",
  "herpe",
  "forkreposgitmoney",
  "twoandawoo",
  "ghostsushi",
  "bananas",
  "cake",
  "vent",
  "tank",
  "friendship",
  "ilovemyjob",
  "leaderboard",
  "cookies",
  "finger",
  "howwastrivia",
  "blaugs",
  "pong",
  "orangeroughness",
  "holistichelp",
  "isthatpapyrus",
  "perfectcode"
]

const maxWordLength = injokes.reduce(
  (word1, word2) => word1.length > word2.length ? word1 : word2
  )
// const maxWordLength = 50

const colors = [
  "#ef5777",
  "#575fcf",
  "#4bcffa",
  "#34e7e4",
  "#0be881",
  "#f53b57",
  "#3c40c6",
  "#0fbcf9",
  "#00d8d6",
  "#05c46b",
  "#ffc048",
  "#ffdd59",
  "#ff5e57",
  "#d2dae2",
  "#485460",
  "#ffa801",
  "#ffd32a",
  "#ff3f34",
  "#808e9b",
  "#1e272e"
]

module.exports=  {
  defaultState,
  injokes,
  colors,
  maxWordLength
}