// Constructor function for Answer
function Answer(response, respondentName, score, date) {
    this.response = response;
    this.respondentName = respondentName;
    this.score = score;
    this.date = date;
}

// Constructor function for Question
function Question(question, questionerName, date) {
    this.question = question;
    this.questionerName = questionerName;
    this.date = date;
    this.answers = [];

    // Method to add an answer to the question
    this.add = function(answer) {
        this.answers.push(answer);
    };

    // Method to find all answers by a given respondent name
    this.findAll = function(name) {
        return this.answers.filter(answer => answer.respondentName === name);
    };

    // Method to find answers after a given date
    this.afterDate = function(date) {
        return this.answers.filter(answer => answer.date > date);
    };

    // Method to list answers by date
    this.listByDate = function() {
        return this.answers.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Method to list answers by score
    this.listByScore = function() {
        return this.answers.slice().sort((a, b) => b.score - a.score);
    };
}

// Example usage
let question = new Question("What is your favorite programming language?", "John Doe", new Date());

question.add(new Answer("JavaScript", "Alice", 10, new Date(2024, 3, 1)));
question.add(new Answer("Python", "Bob", 8, new Date(2024, 3, 2)));
question.add(new Answer("Java", "Charlie", 7, new Date(2024, 3, 3)));
question.add(new Answer("C++", "Alice", 9, new Date(2024, 3, 4)));

console.log("All answers by Alice:", question.findAll("Alice"));
console.log("Answers after April 2, 2024:", question.afterDate(new Date(2024, 3, 2)));
console.log("Answers sorted by date:", question.listByDate());
console.log("Answers sorted by score:", question.listByScore());