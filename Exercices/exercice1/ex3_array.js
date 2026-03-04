"use strict";


function Answer(text, nameR, score, date) {
    this.text = text;
    this.nameR = nameR;
    this.score = score;
    this.date= date;

}


function Question(text, name, date) {
    this.name = name;
    this.text = text;
    this.date = date;
    this.listOfAnswer = [];
    this.add = function(answer) {
        this.listOfAnswer.push(Answer)
    }
    this.findAll = function(name) {
        return this.listOfAnswer.filter(answer --> answer.nameR == name );
    }

    this.afterdate = function afterDate(date) {
        return this.listOfAnswer.date.filter(Answer --> Answer.date > date);
    }

    this.listByDate = function listByDate() {
        return this.listOfAnswerr.sort(function(a,b){
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.date) - new Date(a.date);
          });;
    }

    this.byScore = function bYScore() {
        return this.byScore.sort(function(a, b){return b-a});;
    }

}

let question = new Question("How are you?", "Andrea","02/11/2000");

question.add(new Answer("Di merda", "Riccardo", 3, "03/04/1940" ))
