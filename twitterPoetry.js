
var cb = new Codebird;
cb.setConsumerKey("7lHM870nMiqUMpqf3SWLcPmb8","THBUXCySJXIKsBFwc3DPxLFaFjJbc5guOF08pC6vhZs5Z22qSb");
cb.setToken("918876421904322560-HLI0klHG803aNbIhM4R3JZrKmMZh0o1", "ZDGLxiCRpRnSuugHjPTr22BHySuEMY8sAAHBj2XFr6Zms");

console.log(cb);
var tweets = [];
var partitionedTweets = [];
var searchTweets = {};


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

function codeBirdSearch(seachString, tweetTransform, postTweetLoad){
    var params = {
        q: seachString
    };

    cb.__call(
        "search/tweets",
        params,
        function (reply, rate, error) {
            searchTweets = analyzeTweets(reply.statuses, tweetTransform);
            tweets.push(searchTweets);
            if(postTweetLoad){
                postTweetLoad(searchTweets);
            }
        }
    );
}

function queryBible(searchTweets, bookInd){
    $.post("/nearestverse", 
        {
            tweet: searchTweets.tweets[0],
            book: bookInd
        },
        function(response){
            matchResponse = response;
            var responseObj = JSON.parse(response);
            bibleMatch.push([searchTweets.tweets[0], responseObj.verse])
            console.log("MATCH RESPONSE", bookInd, searchTweets.tweets[0], responseObj);
        }
    );
}

function daddyToGod(twt){
    var tweet = twt.replace(/[Dd]addy[ -]?[Ii]ssues/, "problems with GOD");
    tweet = tweet.replace(/([Dd]add?y?)|([Ff]ather)/, "GOD");
    return tweet;
}

codeBirdSearch("daddy issues", daddyToGod);
codeBirdSearch("a crisis of faith", null, function(tweets){queryBible(tweets, 46)});

var bibleMatch = [];
var matchResponse;


function setup() {
    createCanvas(1280, 720);
    frameRate(0.25);
}

var tweetIndex = 0;
function draw() {
    if(bibleMatch.length > 0) {
        clear();
        textSize(12);
        text(bibleMatch[tweetIndex][0], 0, 200);
        text(bibleMatch[tweetIndex][1], 0, 30);
        tweetIndex = (tweetIndex + 1) % bibleMatch.length;
    }
}

