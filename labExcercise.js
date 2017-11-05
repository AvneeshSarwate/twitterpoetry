
var cb = new Codebird;
cb.setConsumerKey("7lHM870nMiqUMpqf3SWLcPmb8","THBUXCySJXIKsBFwc3DPxLFaFjJbc5guOF08pC6vhZs5Z22qSb");
cb.setToken("918876421904322560-HLI0klHG803aNbIhM4R3JZrKmMZh0o1", "ZDGLxiCRpRnSuugHjPTr22BHySuEMY8sAAHBj2XFr6Zms");

console.log(cb);
var tweets = [];
var partitionedTweets = [];
var searchTweets = {};

var riGrammar = new RiGrammar()
var grammarRules = {
    "<start>": "Well <p1> `printThis()`",
    "<p1>": "<p2> | <p3>",
    "<p2>": "here we go | here we go <p3>",
    "<p3>": "rambling again | rambling again <p3>"
};
riGrammar.load(grammarRules);

console.log(riGrammar.expand());

function printThis() {
    return "callbackVal";
}


function firstNounIndex(partitionedTweet, startInd=0){
    var posTagArray = partitionedTweet.posTags.slice(startInd, partitionedTweet.posTags.length);
    // var indF = posTagArray.indexOf;
    // var nounIndices = ['nn', 'nns', 'nnp', 'nnps'].map(indF);
    var nounIndices = ['nn', 'nns', 'nnp', 'nnps']
        .map(s => posTagArray.indexOf(s))
        .filter(i => i != -1);

    return nounIndices.length === 0 ? -1 : Math.min(...nounIndices)+startInd;
}

function firstVerbIndex(partitionedTweet, startInd=0){
    var posTagArray = partitionedTweet.posTags.slice(startInd, partitionedTweet.posTags.length);
    // var indF = posTagArray.indexOf;
    // var verbIndices = ['vb', 'vbd', 'vbg', 'vbn', 'vbp', 'vbz'].map(indF);
    var verbIndices = ['vb', 'vbd', 'vbg', 'vbn', 'vbp', 'vbz']
        .map(s => posTagArray.indexOf(s))
        .filter(i => i != -1)

    return verbIndices.length === 0 ? -1 : Math.min(...verbIndices)+startInd;
}

//quick heuristic for finding a subject - find the first noun;
function findSubject(partitionedTweet){
    var firstNounInd = firstNounIndex(partitionedTweet);
    if(firstNounInd === -1) {
        return "something";
    } else {
        return partitionedTweet.tokens[firstNounInd];
    }
}

//quick heuristic for finding the main verb - find the first verb after the first noun;
function findVerb(partitionedTweet){
    var firstNounInd = firstNounIndex(partitionedTweet)
    var firstVerbInd = firstVerbIndex(partitionedTweet, Math.max(firstNounInd, 0));
    if(firstVerbInd === -1){
        return "does";
    } else {
        return partitionedTweet.tokens[firstVerbInd];
    }
}

/*I'm trying to extract a subject/verb phrase from a tweet using the rough heuristics defined
for finding the subject and verb as described in the comments for findSubject() and findVerb()*/
function findSubjectPhrase(partitionedTweet){
    var firstNounInd = firstNounIndex(partitionedTweet)
    var firstVerbInd = firstVerbIndex(partitionedTweet, Math.max(firstNounInd, 0)+1);
    console.log("FIND SUBJECT PHRASE", firstNounInd, firstVerbInd);
    if(firstNounInd  === -1 && firstVerbInd === -1){
        return "something does";
    }
    if(firstNounInd  != -1 && firstVerbInd === -1){
        return findSubject(partitionedTweet) + " does";
    }
    if(firstNounInd  === -1 && firstVerbInd != -1){
        return "something " + findVerb(partitionedTweet);
    }
    if(firstNounInd  != -1 && firstVerbInd != -1){
        return partitionedTweet.tokens.slice(firstNounInd, firstVerbInd+1).join(" ")
    }
}

function cleanTweet(tweet){
    var rtSplit = tweet.split(/RT @[a-zA-Z0-9_]*: /);
    var twt = rtSplit[1%rtSplit.length];
    return twt.split(/https?:/)[0];
}

function analyzeTweets(tweetResult, tweetTransform){
    var tweetObj = {tweets: [], riTweets: [], tokens: [], posTags: [], partitionedTweets: []};
    for(var i = 0; i < tweetResult.length; i++){
        var tweet = tweetTransform ? tweetTransform(tweetResult[i].text) : tweetResult[i].text;
        tweetObj.tweets.push(cleanTweet(tweet));
    }
    tweetObj.riTweets = tweetObj.tweets.map(str => new RiString(RiTa.trimPunctuation(str)));
    tweetObj.tokens = tweetObj.tweets.map(t => RiTa.tokenize(t));
    tweetObj.posTags = tweetObj.tweets.map(t => RiTa.getPosTags(t));

    for (var i = 0; i < tweetObj.riTweets.length; i++) {
        tweetObj.riTweets[i].analyze();
        tweetObj.partitionedTweets.push({'tokens': tweetObj.tokens[i], 'posTags': tweetObj.posTags[i]});
    };
    return tweetObj;
}

function codeBirdSearch(seachString, tweetTransform){
    var params = {
        q: seachString
    };

    cb.__call(
        "search/tweets",
        params,
        function (reply, rate, error) {
            searchTweets = analyzeTweets(reply.statuses, tweetTransform);
            tweets.push(searchTweets);
        }
    );
}

function daddyToGod(twt){
    var tweet = twt.replace(/[Dd]addy[ -]?[Ii]ssues/, "problems with GOD");
    tweet = tweet.replace(/([Dd]add?y?)|([Ff]ather)/, "GOD");
    return tweet;
}

codeBirdSearch("daddy issues", daddyToGod);
codeBirdSearch("a crisis of faith");

/*
TODO tweet cleaning
    remove retweet = starts with RT ends with :
    remove trailing hyperlnks
*/
 
 /*
all of the twitter methods - https://developer.twitter.com/en/docs/api-reference-index


general  thought proccess
status
- still unsure of my process 
- have a general idea (paradise lost), but no specifics, and a dece survey of available tools

aesthetic
- but don't have a sense of "form"
    - in general, there's too much freedom for poems that aren't as "traditional"
    - i'm maybe too tied to the idea of things semantically making sense
- want to work in source text from paradise lost and the bible
    - not sure how to incorporate twitter, its a much less "controllable" data source
    - might try to see if i can pull tweets from specific accounts - https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-user_timeline
- in general - i have problems with "data driven" (as opposed to generally procedural) art where i don't control the data
    - because i am a bit of an artistic control freak 

technical 
- not much done still looking for tools
    - wordNet (usable, but needs server)
    - word2vec, not really that easily possible, (whole thing data - https://code.google.com/archive/p/word2vec/)
        - could do some basic stuff with deeplearn.js and a subset of dataset in-browser
        - could do more powerful stuff on server
    - rita - dece, part of speech is powerful, grammars are really cool
    - good data set of word valences - useful 


- trying to balance look-for-tools vs creative-within-limitations - its hard with no "vision"

visual poetry
contemporary/abstract/modern poetry 
EE cummings 

whole Twitter API in one place - https://developer.twitter.com/en/docs/api-reference-index 
simple text animation javascript - http://textillate.js.org/
bible JSON structure - https://github.com/thiagobodruk/bible 
 */


function setup() {
    createCanvas(1280, 720);
    frameRate(0.25);
}

var tweetIndex = 0;
function draw() {
    if(tweets.length > 1) {
        clear();
        textSize(12);
        text(tweets[0].tweets[tweetIndex], 0, 200);
        text(tweets[1].tweets[tweetIndex], 0, 30);
        text(riGrammar.expand(), 0, 500);
        text(findSubjectPhrase(tweets[0].partitionedTweets[tweetIndex]), 0, 600);
        tweetIndex = (tweetIndex + 1) % 15;
    }
}

