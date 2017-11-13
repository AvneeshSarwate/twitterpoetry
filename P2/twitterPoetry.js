


var cb = new Codebird;
cb.setConsumerKey("7lHM870nMiqUMpqf3SWLcPmb8","THBUXCySJXIKsBFwc3DPxLFaFjJbc5guOF08pC6vhZs5Z22qSb");
cb.setToken("918876421904322560-HLI0klHG803aNbIhM4R3JZrKmMZh0o1", "ZDGLxiCRpRnSuugHjPTr22BHySuEMY8sAAHBj2XFr6Zms");
cb.setProxy("https://peaceful-sea-11713.herokuapp.com/");


console.log(cb);

var tweets = [];

//removes retweet prefixes and trailing hyperlinks from tweets
function cleanTweet(tweet){
    var rtSplit = tweet.split(/RT @[a-zA-Z0-9_]*: /);
    var twt = rtSplit[1%rtSplit.length];
    return twt.split(/https?:/)[0];
}

//Analyzes a set of tweets w/ rita
//This was used in earlier experiments but isn't any more, but is too
//embeded in the existing code to remove last-minute (which is when all code cleanup happens)
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

// a wrapper function for twitter search with codebird
// search string is the query string
// tweet transform a function that is used to transform tweets 
//      (a holdover from earlier experiments)
// postTeetLoad is a generic function of what to do with the cleaned/processed set of tweets
//      (here, used to kick off the sentence similarity search against the bible using wordnet)
function codeBirdSearch(seachString, tweetTransform, postTweetLoad){
    var codebirdWorking = true;
    if(codebirdWorking) {
        var params = {
            q: seachString
        };

        cb.__call(
            "search/tweets",
            params,
            function (reply, rate, error) {
                var searchTweets = analyzeTweets(reply.statuses, tweetTransform);
                tweets.push(searchTweets);
                if(postTweetLoad){
                    postTweetLoad(searchTweets);
                }
            }
        );
    }
    else {
        var t1 = "man what the heck is happening to this country";
        var t2 = "My cat is so stupid";
        var t3 = "How the fuck does my car always break down right when I need it to work";
        var tweetList = [t1, t2, t3].map((tweet) => {return {text:tweet}});
        var searchTweets = analyzeTweets(tweetList, tweetTransform);
        tweets.push(searchTweets);
        if(postTweetLoad){
            postTweetLoad(searchTweets);
        }
    }
}

/*a function to recursively query the server for the "most similar" bible verse 
for each tweet. The similarity-search endpoint takes some time (2-7 seconds) to respond per tweet, 
and I want the tweet-verse pairs to be available as fast as possible, so I used this 
recursive method to make the tweet-verse pairs available one by one rather than doing
them in batch and waiting ~1 minute for the whole set of tweet-verse pairs
*/
function queryBible(searchTweets, bookInds){

    function queryBibleRecursive(searchTweets, bookInds, tweetInd){ 
        $.post("/nearestverse", 
            {
                tweet: searchTweets.tweets[tweetInd],
                book: bookInds[tweetInd%bookInds.length]
            },
            function(response){
                console.log("RAW RESONSE", tweetInd, response)
                var responseObj = JSON.parse(response);
                bibleMatch.push([searchTweets.tweets[tweetInd], responseObj.verse])
                console.log("MATCH RESPONSE", bookInds[tweetInd%bookInds.length], searchTweets.tweets[tweetInd], responseObj);
                if(bibleMatch.length < searchTweets.tweets.length){
                    queryBibleRecursive(searchTweets, bookInds, tweetInd+1)
                }
                else {
                    console.log("GOT MATCHES FOR ALL TWEETS", bibleMatch);
                }
            }
        );
    }
    queryBibleRecursive(searchTweets, bookInds, 0);
}


//this holds the tweet-verse pairs
var bibleMatch = [];

//actuall do the search for tweets
codeBirdSearch("a crisis of faith", null, (tweets) => {queryBible(tweets, [40, 44, 2, 45, 46, 65])});



//these paths define the 
var path1 = "M 60,90 Q 160,160 260,90 Q 360,20 460,90";
var path2 = "M 60,90 Q 160,20 260,90 Q 360,160 460,90";


/* this function creates the initial criss cross pattern of the intro text.
the code structuring is a bit of a holdover from an earlier experiment.
*/
function createWavingText(svg, idBase, pathA, pathB){
                
    //Create an SVG path            
    var svgPath = svg.append("path")
        .attr("id", idBase) //very important to give the path element a unique ID to reference later
        .attr("d", pathB) //Notation for an SVG path, from bl.ocks.org/mbostock/2565344
        .style("fill", "none");
        

    //Create an SVG text element and append a textPath element
    var svgText = svg.append("text")
        .attr("id", idBase+"Text");

    var svgTextPath = svgText.append("textPath") //append a textPath to the text element
        .attr("id", idBase+"TextPath") //TODO: is this the right way to set ids?
        .attr("xlink:href", '#'+idBase) //place the ID of the path here
        .style("text-anchor","middle") //place the text halfway on the arc
        .attr("startOffset", "50%");

    return {path: svgPath, text: svgText, textPath:svgTextPath}
}



var wavingVerse; //the svg element holding the displayed bible verse
var wavingTweet; //the svg element holding the displayed tweet

//the index of the tweet-verse pair to draw
var drawTweetInd = 0;

$(function() {

    //Create the SVG elements and displays the intro text using the d3 library
    svg = d3.select("body").append("svg")
            .attr("width", 1280)
            .attr("height", 720);

    var d3line = d3.line()
        .curve(d3.curveBasis);

    wavingVerse = createWavingText(svg, 'verse', path1, path2);
    wavingVerse.textPath.text("To read the lines of the poem");
    wavingTweet = createWavingText(svg, 'tweet', path2, path1);
    wavingTweet.textPath.text("Click and drag across the screen");




    //defines the dragging drawing/animation using the d3 library
/*
drawing explanation - the user draws a path across the screen. The verse text is laid
out on a path p1 that is the drawn path + some yDeviation value. The tweet text is laid
out on a path p2 that is the drawn path - that same yDeviation value. The yDeviation
value varies sinusoidally in time (and is controlled by the p5 draw loop below)
*/
    function dragStarted_2() {
        var d = d3.event.subject,
                d2 = _.cloneDeep(d),
                x0 = d3.event.x,
                y0 = d3.event.y;
        console.log("path datum", d);

        if(bibleMatch.length > 0 ) {
            wavingVerse.textPath.text(bibleMatch[drawTweetInd][1]);
            wavingTweet.textPath.text(bibleMatch[drawTweetInd][0]);
        }

        wavingVerse.path.datum(d);
        wavingVerse.textPath.datum(d);

        wavingTweet.path.datum(d2);
        wavingTweet.textPath.datum(d2);

        wavingVerse.textPath.attr("d", d3line);
        wavingVerse.path.attr("d", d3line);
        wavingTweet.textPath.attr("d", d3line);
        wavingTweet.path.attr("d", d3line);

        if(bibleMatch.length > 0 ) drawTweetInd = (drawTweetInd+1) % bibleMatch.length;

        d3.event.on("drag", function() {
            var x1 = d3.event.x,
                    y1 = d3.event.y,
                    dx = x1 - x0,
                    dy = y1 - y0;
            
            if (dx * dx + dy * dy > 100) {
                d.push([x1, y1+yDiff]);
                d2.push([x1, y1-yDiff]);
                x0 = x1; 
                y0 = y1;
            } else {
                d[d.length - 1] = [x1, y1+yDiff];
                d2[d.length - 1] = [x1, y1-yDiff];
            }
            wavingVerse.textPath.attr("d", d3line);
            wavingVerse.path.attr("d", d3line);
            wavingTweet.textPath.attr("d", d3line);
            wavingTweet.path.attr("d", d3line);
        });
    }

    svg.call(d3.drag()
        .container(function(d) { return this; })
        .subject(function(d) { var p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on("start", dragStarted_2)); 
});


//this block sinusoidally varries the yDeviation value of the animation
var sinStep = 0;
var yDiff = 0;
var yDiffScale = 80;
var yDiffStep = 0.08

function setup() {
    // createCanvas(1280, 720);
    frameRate(60);
}

var tweetIndex = 0;
function draw() {
    sinStep += yDiffStep;
    yDiff = (Math.sin(sinStep)*yDiffScale);
}

