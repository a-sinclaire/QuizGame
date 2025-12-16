// Test Pack - Generic questions for testing purposes
// This pack contains generic, non-domain-specific questions

export const testPackQuestions = [
  // Easy questions
  {
    id: "test-easy-001",
    question: "What is the capital city of France?",
    options: [
      "London",
      "Berlin",
      "Paris",
      "Madrid"
    ],
    correctIndex: 2,
    correctResponse: "Correct! Paris is the capital and largest city of France.",
    incorrectResponses: {
      0: "London is the capital of England, not France.",
      1: "Berlin is the capital of Germany, not France.",
      3: "Madrid is the capital of Spain, not France."
    },
    category: "test-pack",
    difficulty: "easy",
    points: 10,
    hints: [
      "It's a famous city known for the Eiffel Tower.",
      "The city starts with the letter P.",
      "It's the largest city in France."
    ]
  },
  {
    id: "test-easy-002",
    question: "What is 2 + 2?",
    options: [
      "3",
      "4",
      "5",
      "6"
    ],
    correctIndex: 1,
    correctResponse: "Correct! 2 + 2 equals 4.",
    incorrectResponses: {
      0: "3 is incorrect. Try adding 2 and 2 again.",
      2: "5 is incorrect. The sum of 2 and 2 is less than 5.",
      3: "6 is incorrect. The sum of 2 and 2 is less than 6."
    },
    category: "test-pack",
    difficulty: "easy",
    points: 10,
    hints: [
      "This is a simple addition problem.",
      "Think about counting: 2, then 2 more.",
      "The answer is 4."
    ]
  },
  {
    id: "test-easy-003",
    question: "Which planet is closest to the Sun?",
    options: [
      "Venus",
      "Earth",
      "Mercury",
      "Mars"
    ],
    correctIndex: 2,
    correctResponse: "Correct! Mercury is the closest planet to the Sun.",
    incorrectResponses: {
      0: "Venus is the second planet from the Sun, not the closest.",
      1: "Earth is the third planet from the Sun.",
      3: "Mars is the fourth planet from the Sun."
    },
    category: "test-pack",
    difficulty: "easy",
    points: 10,
    hints: [
      "It's the smallest planet in our solar system.",
      "It's named after a Roman messenger god.",
      "It's the first planet from the Sun."
    ]
  },
  {
    id: "test-easy-004",
    question: "What color do you get when you mix red and blue?",
    options: [
      "Green",
      "Yellow",
      "Purple",
      "Orange"
    ],
    correctIndex: 2,
    correctResponse: "Correct! Mixing red and blue creates purple (or violet).",
    incorrectResponses: {
      0: "Green is created by mixing blue and yellow, not red and blue.",
      1: "Yellow is a primary color, not created by mixing red and blue.",
      3: "Orange is created by mixing red and yellow, not red and blue."
    },
    category: "test-pack",
    difficulty: "easy",
    points: 10,
    hints: [
      "This color is often associated with royalty.",
      "It's a secondary color made from two primary colors.",
      "The color starts with the letter P."
    ]
  },
  {
    id: "test-easy-005",
    question: "How many days are in a week?",
    options: [
      "5",
      "6",
      "7",
      "8"
    ],
    correctIndex: 2,
    correctResponse: "Correct! A week has 7 days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and Sunday.",
    incorrectResponses: {
      0: "5 days is a work week, but a full week has more days.",
      1: "6 days is not the standard length of a week.",
      3: "8 days would be more than a week."
    },
    category: "test-pack",
    difficulty: "easy",
    points: 10,
    hints: [
      "Think about the days: Monday through Sunday.",
      "It's a single-digit number.",
      "The answer is 7."
    ]
  },
  
  // Medium questions
  {
    id: "test-medium-001",
    question: "What is the square root of 64?",
    options: [
      "6",
      "7",
      "8",
      "9"
    ],
    correctIndex: 2,
    correctResponse: "Correct! The square root of 64 is 8, because 8 × 8 = 64.",
    incorrectResponses: {
      0: "6 squared is 36, not 64.",
      1: "7 squared is 49, not 64.",
      3: "9 squared is 81, not 64."
    },
    category: "test-pack",
    difficulty: "medium",
    points: 20,
    hints: [
      "Think about what number multiplied by itself equals 64.",
      "It's between 7 and 9.",
      "8 × 8 = 64."
    ]
  },
  {
    id: "test-medium-002",
    question: "In which year did World War II end?",
    options: [
      "1943",
      "1944",
      "1945",
      "1946"
    ],
    correctIndex: 2,
    correctResponse: "Correct! World War II ended in 1945.",
    incorrectResponses: {
      0: "1943 was during the war, but it didn't end until later.",
      1: "1944 was during the war, but it didn't end until 1945.",
      3: "1946 was after the war had already ended."
    },
    category: "test-pack",
    difficulty: "medium",
    points: 20,
    hints: [
      "The war ended in the mid-1940s.",
      "It ended after 1944.",
      "The year is 1945."
    ]
  },
  {
    id: "test-medium-003",
    question: "What is the chemical symbol for gold?",
    options: [
      "Go",
      "Gd",
      "Au",
      "Ag"
    ],
    correctIndex: 2,
    correctResponse: "Correct! Au is the chemical symbol for gold, derived from the Latin word 'aurum'.",
    incorrectResponses: {
      0: "Go is not a chemical symbol.",
      1: "Gd is the symbol for gadolinium, not gold.",
      3: "Ag is the symbol for silver, not gold."
    },
    category: "test-pack",
    difficulty: "medium",
    points: 20,
    hints: [
      "The symbol comes from the Latin name for gold.",
      "It's a two-letter symbol starting with A.",
      "The symbol is Au."
    ]
  },
  {
    id: "test-medium-004",
    question: "Who wrote the novel '1984'?",
    options: [
      "George Orwell",
      "Aldous Huxley",
      "Ray Bradbury",
      "H.G. Wells"
    ],
    correctIndex: 0,
    correctResponse: "Correct! '1984' was written by George Orwell and published in 1949.",
    incorrectResponses: {
      1: "Aldous Huxley wrote 'Brave New World', not '1984'.",
      2: "Ray Bradbury wrote 'Fahrenheit 451', not '1984'.",
      3: "H.G. Wells wrote 'The War of the Worlds', not '1984'."
    },
    category: "test-pack",
    difficulty: "medium",
    points: 20,
    hints: [
      "The author's first name is George.",
      "He also wrote 'Animal Farm'.",
      "The author is George Orwell."
    ]
  },
  {
    id: "test-medium-005",
    question: "What is the speed of light in a vacuum (approximately)?",
    options: [
      "300,000 km/s",
      "150,000 km/s",
      "450,000 km/s",
      "600,000 km/s"
    ],
    correctIndex: 0,
    correctResponse: "Correct! The speed of light in a vacuum is approximately 299,792,458 meters per second, which rounds to about 300,000 km/s.",
    incorrectResponses: {
      1: "150,000 km/s is half the actual speed of light.",
      2: "450,000 km/s is faster than the speed of light, which is impossible.",
      3: "600,000 km/s is twice the speed of light, which is impossible."
    },
    category: "test-pack",
    difficulty: "medium",
    points: 20,
    hints: [
      "It's a very large number, around 300,000 km/s.",
      "This is a fundamental constant in physics.",
      "The speed is approximately 300,000 km/s."
    ]
  },
  
  // Hard questions
  {
    id: "test-hard-001",
    question: "What is the time complexity of binary search in Big O notation?",
    options: [
      "O(n)",
      "O(log n)",
      "O(n log n)",
      "O(n²)"
    ],
    correctIndex: 1,
    correctResponse: "Correct! Binary search has a time complexity of O(log n) because it eliminates half of the remaining elements in each iteration.",
    incorrectResponses: {
      0: "O(n) is linear time, which is slower than binary search.",
      2: "O(n log n) is the complexity of efficient sorting algorithms, not binary search.",
      3: "O(n²) is quadratic time, which is much slower than binary search."
    },
    category: "test-pack",
    difficulty: "hard",
    points: 30,
    hints: [
      "Binary search divides the search space in half each time.",
      "The complexity involves a logarithm.",
      "The answer is O(log n)."
    ]
  },
  {
    id: "test-hard-002",
    question: "What is the derivative of x² with respect to x?",
    options: [
      "x",
      "2x",
      "x²",
      "2x²"
    ],
    correctIndex: 1,
    correctResponse: "Correct! The derivative of x² is 2x, using the power rule: d/dx(xⁿ) = n·xⁿ⁻¹.",
    incorrectResponses: {
      0: "x is the derivative of x²/2, not x².",
      2: "x² is the original function, not its derivative.",
      3: "2x² is not the derivative; that would be the derivative of (2/3)x³."
    },
    category: "test-pack",
    difficulty: "hard",
    points: 30,
    hints: [
      "Use the power rule for derivatives.",
      "Multiply the exponent by the coefficient.",
      "The derivative is 2x."
    ]
  },
  {
    id: "test-hard-003",
    question: "In which programming paradigm does 'everything is an object' apply?",
    options: [
      "Functional programming",
      "Object-oriented programming",
      "Procedural programming",
      "Logic programming"
    ],
    correctIndex: 1,
    correctResponse: "Correct! In object-oriented programming, especially in languages like Smalltalk and Ruby, 'everything is an object' is a fundamental principle.",
    incorrectResponses: {
      0: "Functional programming focuses on functions, not objects.",
      2: "Procedural programming uses procedures/functions, not objects.",
      3: "Logic programming uses logical relations, not objects."
    },
    category: "test-pack",
    difficulty: "hard",
    points: 30,
    hints: [
      "This paradigm organizes code around objects and classes.",
      "Languages like Java and Python use this paradigm.",
      "The answer is object-oriented programming."
    ]
  }
];

