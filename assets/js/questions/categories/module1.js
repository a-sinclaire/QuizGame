// Module 1: Introduction Questions
// All difficulty levels in one file

export const module1Questions = [
  // Easy Questions
  {
    id: "m1-easy-001",
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctIndex: 2,
    correctResponse: "Correct! Paris is the capital of France and has been since 987 AD.",
    incorrectResponses: {
      0: "Berlin is the capital of Germany, not France.",
      1: "Madrid is the capital of Spain, not France.",
      3: "Rome is the capital of Italy, not France."
    },
    category: "module1",
    difficulty: "easy",
    points: 10,
    hints: [
      "It's a major European city known for art and culture.",
      "The Eiffel Tower is located here.",
      "It starts with the letter 'P'."
    ]
  },
  {
    id: "m1-easy-002",
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
    correctResponse: "Correct! There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.",
    incorrectResponses: {
      0: "There are more than 5 continents. Think about all the major landmasses.",
      1: "There are more than 6 continents. Don't forget Antarctica!",
      3: "There are fewer than 8 continents. Some models combine certain regions."
    },
    category: "module1",
    difficulty: "easy",
    points: 10,
    hints: [
      "The number is between 6 and 8.",
      "Antarctica is one of them.",
      "The answer is 7."
    ]
  },
  
  // Medium Questions
  {
    id: "m1-medium-001",
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctIndex: 3,
    correctResponse: "Correct! The Pacific Ocean is the largest ocean, covering about one-third of Earth's surface.",
    incorrectResponses: {
      0: "The Atlantic Ocean is the second largest, but not the largest.",
      1: "The Indian Ocean is the third largest ocean.",
      2: "The Arctic Ocean is actually the smallest of the major oceans."
    },
    category: "module1",
    difficulty: "medium",
    points: 20,
    hints: [
      "It's named after a word meaning 'peaceful'.",
      "It's located between Asia/Australia and the Americas.",
      "It's the Pacific Ocean."
    ]
  },
  {
    id: "m1-medium-002",
    question: "Which planet is known as the 'Red Planet'?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    correctResponse: "Correct! Mars is called the Red Planet due to iron oxide (rust) on its surface giving it a reddish appearance.",
    incorrectResponses: {
      0: "Venus is the hottest planet, but not the red one.",
      1: "Jupiter is a gas giant, the largest planet in our solar system.",
      3: "Saturn is known for its rings, not its red color."
    },
    category: "module1",
    difficulty: "medium",
    points: 20,
    hints: [
      "It's the fourth planet from the Sun.",
      "NASA has sent several rovers to explore this planet.",
      "It's Mars."
    ]
  },
  
  // Hard Questions
  {
    id: "m1-hard-001",
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctIndex: 2,
    correctResponse: "Correct! Au comes from the Latin word 'aurum' meaning gold.",
    incorrectResponses: {
      0: "Go is not a valid chemical symbol.",
      1: "Gd is the symbol for Gadolinium, not gold.",
      3: "Ag is the symbol for silver (from Latin 'argentum'), not gold."
    },
    category: "module1",
    difficulty: "hard",
    points: 30,
    hints: [
      "The symbol comes from the Latin name for gold.",
      "It's a two-letter symbol starting with 'A'.",
      "It's Au."
    ]
  },
  {
    id: "m1-hard-002",
    question: "What is the speed of light in a vacuum (approximately)?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
    correctIndex: 0,
    correctResponse: "Correct! The speed of light in a vacuum is approximately 299,792,458 meters per second, or about 300,000 km/s.",
    incorrectResponses: {
      1: "Light travels faster than 150,000 km/s.",
      2: "Light doesn't travel quite that fast - it's slower than 450,000 km/s.",
      3: "That's twice the actual speed of light - nothing can travel that fast!"
    },
    category: "module1",
    difficulty: "hard",
    points: 30,
    hints: [
      "It's a fundamental constant in physics.",
      "The value is approximately 300,000 kilometers per second.",
      "It's 300,000 km/s."
    ]
  }
];

