


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
    var codebirdWorking = false;
    if(codebirdWorking) {
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
    else {
        var tweetStr = "man what the heck is happening to this country";
        searchTweets = analyzeTweets([{text: tweetStr}], tweetTransform);
        tweets.push(searchTweets);
        if(postTweetLoad){
            postTweetLoad(searchTweets);
        }
    }
}

function queryBible(searchTweets, bookInd){
    $.post("/nearestverse", 
        {
            tweet: searchTweets.tweets[0],
            book: bookInd
        },
        function(response){
            matchResponse = response;
            console.log("RAW RESONSE", response)
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

/*
twitter search phrases
crisis of faith
daddy isues
artsitic ego
*/

codeBirdSearch("daddy issues", daddyToGod);
codeBirdSearch("elemental forces", null, function(tweets){queryBible(tweets, 46)});

var bibleMatch = [];
var matchResponse;

var svg;
var svgPath;
var svgText;
var svgTextPath; 

var path1 = "M 60,90 Q 160,160 260,90 Q 360,20 460,90";
var path2 = "M 60,90 Q 160,20 260,90 Q 360,160 460,90"

function pathTween(d1, precision) {
  return function() {
    var path0 = this,
        path1 = path0.cloneNode(),
        n0 = path0.getTotalLength(),
        n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

    // Uniform sampling of distance based on specified precision.
    var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
    while ((i += dt) < 1) distances.push(i);
    distances.push(1);

    // Compute point-interpolators at each distance.
    var points = distances.map(function(t) {
      var p0 = path0.getPointAtLength(t * n0),
          p1 = path1.getPointAtLength(t * n1);
      return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
    });

    return function(t) {
      return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
    };
  };
}

$(function() {
//Create the SVG
svg = d3.select("body").append("svg")
        .attr("width", 600)
        .attr("height", 200);
            
//Create an SVG path            
svgPath = svg.append("path")
    .attr("id", "wavy") //very important to give the path element a unique ID to reference later
    .attr("d", path2) //Notation for an SVG path, from bl.ocks.org/mbostock/2565344
    .style("fill", "none")
    .transition()
    .duration(2000)
    .on("start", function repeat() {
      d3.active(this)
          .attrTween("d", pathTween(path1, 4))
        .transition()
          .attrTween("d", pathTween(path2, 4))
        .transition()
          .on("start", repeat);
    });
    // .style("stroke", "#AAAAAA");

//Create an SVG text element and append a textPath element
svgText = svg.append("text")
    .attr("id", "wavyText");

svgTextPath = svgText.append("textPath") //append a textPath to the text element
    .attr("id", "wavyTextPath") //TODO: is this the right way to set ids?
    .attr("xlink:href", "#wavy") //place the ID of the path here
    .style("text-anchor","middle") //place the text halfway on the arc
    .attr("startOffset", "50%");

svgTextPath.text("Yay, my text is on a wavy path");


var pathLen = svgPath.node().getTotalLength();
var textLen = svgTextPath.node().getComputedTextLength();
console.log("LENGTHS", pathLen, textLen);

});


function adjustTextSizeOnPath(text, textPath, path){
    var fontSize = 1;
    text.attr('font-size', fontSize+'px');
    var inc = 0.01;
    var getSign = () => Math.sign(path.node().getTotalLength() - textPath.node().getComputedTextLength());
    var sign = getSign();
    console.log("RESIZE", sign);
    while(sign === getSign()){
        fontSize += (sign * inc);
        text.attr('font-size', fontSize+'px');
    }
}

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
        svgTextPath.text(bibleMatch[tweetIndex][1]);
        adjustTextSizeOnPath(svgText, svgTextPath, svgPath);
    }
}

