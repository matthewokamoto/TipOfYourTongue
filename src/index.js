/**
    Written by Matthew Okamoto
	12/22/15
	
	
**/

'use strict';

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill'),
	questions = require('./questions'),
	phonetic = require('./phoneticAlphabet');

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.echo-sdk-ams.app.cacdc3ec-c2fc-4d06-8ce6-b8d16b7a434d"; 

var ToYT = function () {
    AlexaSkill.call(this, APP_ID);
};

var questionCount,
	intervalSeconds;
	
// Extend AlexaSkill
ToYT.prototype = Object.create(AlexaSkill.prototype);
ToYT.prototype.constructor = ToYT;

ToYT.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("ToYT onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

ToYT.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("ToYT onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Tip of Tongue game, say, new game, to start, or rulebook, for the rules and instructions";
    var repromptText = "I didn't catch that. Say, new game, to start, or rulebook, for the rules and instructions";
    response.ask(speechOutput, repromptText);
};

ToYT.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("ToYT onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

ToYT.prototype.intentHandlers = {
    // register custom intent handlers
    "ToYTMainIntent": function (intent, session, response) {
        response.ask("Would you like default or custom settings?", "I didn't catch that. Would you like default or custom settings?");
    },
	
	"ToYTSettingsIntent": function (intent, session, response) {
		handleNewGameRequest(intent, session, response);
    },
	
	"ToYTCustomQuestionCountIntent": function (intent, session, response) {
		handleCustomQuestionSettingsRequest(intent, session, response);
    },
	
	"ToYTCustomDifficultyIntent": function (intent, session, response) {
		handleCustomDifficultySettingsRequest(intent, session, response);
    },
	
    "ToYTRulesIntent": function (intent, session, response) {
        handleRulebookIntent(response);
    },
	
	"AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpIntent(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function handleNewGameRequest(intent, session, response) {
	if(intent.slots.Setting.value == "default") {
		handleGameStartRequest(10, "medium", response);
	} else {
		response.ask("How many questions would you like?", "I didn't catch that. How many questions would you like?");
	}
}

function handleCustomQuestionSettingsRequest(intent, session, response) {
	var questionCountConfirmation;
	
	if(intent.slots.QuestionCount.value > 20) {
		questionCount = 20;
		questionCountConfirmation = "The max questions for a round is twenty. Twenty questions have been set. ";
	} else {
		if(intent.slots.QuestionCount.value < 0) {
			questionCount = intent.slots.QuestionCount.value * -1;
		} else {
			questionCount = intent.slots.QuestionCount.value;
		}
		questionCountConfirmation = questionCount + " questions, got it. ";
	}
	
	response.ask(questionCountConfirmation + "What difficulty would you like? " + 
		"You can say: easy, medium, or hard.", 
		"I didn't catch that. How many seconds in between each question? The easier it is, the more time you have to answer each question");	
}

function handleCustomDifficultySettingsRequest(intent, session, response) {
	if(questionCount > 0 && intent.slots.hasOwnProperty("CustomDifficulty")) { //Has # of questions set and difficulty
		handleGameStartRequest(questionCount, intent.slots.CustomDifficulty.value, response);
	} else {
		response.ask("How many questions would you like?", "I didn't catch that. How many questions would you like?" + questionCount);
	}
}

function handleGameStartRequest(numberOfQuestions, difficulty, response) {
	var intervalInSeconds,
		breaktime;
		
	switch(difficulty) {
		case "easy":
			intervalInSeconds = "fifteen";
			breaktime = "<break time='10s'/><break time='2s'/>";
			break;
		case "medium":
			intervalInSeconds = "ten";
			breaktime = "<break time='8s'/>";
			break;
		case "hard":
			intervalInSeconds = "five";
			breaktime = "<break time='4s'/>";
			break;
		default:
			break;
	}
		
	var speechOutput = {
			speech: "<speak>Starting a new game with " + numberOfQuestions + " questions and " + intervalInSeconds + " second intervals. <break time='1s'/>",
			type: AlexaSkill.speechOutputType.SSML
		},
		gameLetter = getNewRandomLetter().toString(),
		randomQuestions = getRandomQuestionNumbers(numberOfQuestions),
		cardTitle = "Tip of Tongue Game",
		cardBody = numberOfQuestions + " questions and " + intervalInSeconds + " second intervals\n";
		
	speechOutput.speech += "Your letter is, " + gameLetter + ", as in " + phonetic[gameLetter] + "<break time='2s'/> ";
	cardBody += "Your letter is, " + gameLetter + " as in " + phonetic[gameLetter] + "\n";
	
	for (var i = 0; i < randomQuestions.length; i++) {
		speechOutput.speech += "Question " + (i+1).toString() + "; " + questions[randomQuestions[i]] + breaktime;
		cardBody += "\n" + (i+1).toString() + ". " + questions[randomQuestions[i]];
	};
	
	speechOutput.speech += "Pencils down, the round is over. Open the Alexa app to review all questions from this round.</speak>";
	
	response.tellWithCard(speechOutput, cardTitle, cardBody);
}


function getNewRandomLetter() {
	var alpha = "ABCDEFGHIJKLMNOPRSTUVWYZ";
	
	return alpha.charAt(Math.floor(Math.random() * alpha.length));
}

function getRandomQuestionNumbers(numberOfQuestions) {
	var randomQuestionArr = [],
		randomNumber,
		isDuplicate; 
	
	while(randomQuestionArr.length < numberOfQuestions) {
		randomNumber = (Math.floor(Math.random() * 150) + 1);
		isDuplicate = false;
		for(var i = 0; i < randomQuestionArr.length; i++) {
			if(randomQuestionArr[i] == randomNumber) {
				isDuplicate = true;
				break;
			}
		}
		
		if(!isDuplicate) {
			randomQuestionArr[randomQuestionArr.length] = randomNumber;
		}
	};
	
	return randomQuestionArr;
}

function handleRulebookIntent(response) {
	var rules = "Tip of Tongue rulebook and instructions.. A random letter will be chosen, followed by questions. " +
			"Each player writes a word or short phrase that starts with the " +
			"chosen letter before the next question. At the end of the round, compare " +
			"line by line with all players. First and last names are both valid, " + 
			"if the prompt is, movie actor and the letter is J; both Jonah Hill and " +
			"Dwayne Johnson are valid answers. If two or more players have the same answer, " +
			"they are offset and no points are awarded. If a player has a unique answer they are " +
			"awarded a point. Answers can be challenged and ruled invalid by majority vote. " +
			"Games are typically three rounds, at the end of the third round add up each player's points " +
			"from the rounds; the highest score wins. " + 
			"Say, new game; to start a new round.";
			
	response.askWithCard(rules, "Tip of Tongue Rules and Instructions", rules);
}

function handleHelpIntent(response) {
	response.ask("To play a new game say, new game. " + 
			"For the instructions and rules say, rulebook.");
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the ToYT skill.
    var toYT = new ToYT();
    toYT.execute(event, context);
};

