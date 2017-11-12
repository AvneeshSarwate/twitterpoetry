


var cb = new Codebird;
cb.setConsumerKey("7lHM870nMiqUMpqf3SWLcPmb8","THBUXCySJXIKsBFwc3DPxLFaFjJbc5guOF08pC6vhZs5Z22qSb");
cb.setToken("918876421904322560-HLI0klHG803aNbIhM4R3JZrKmMZh0o1", "ZDGLxiCRpRnSuugHjPTr22BHySuEMY8sAAHBj2XFr6Zms");
cb.setProxy("https://peaceful-sea-11713.herokuapp.com/");


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
        var t1 = "man what the heck is happening to this country";
        var t2 = "My cat is so stupid";
        var t3 = "How the fuck does my car always break down right when I need it to work";
        var tweetList = [t1, t2, t3].map((tweet) => {return {text:tweet}});
        searchTweets = analyzeTweets(tweetList, tweetTransform);
        tweets.push(searchTweets);
        if(postTweetLoad){
            postTweetLoad(searchTweets);
        }
    }
}

function queryBible(searchTweets, bookInd){

    function queryBibleRecursive(searchTweets, bookInd, tweetInd){ 
        $.post("/nearestverse", 
            {
                tweet: searchTweets.tweets[tweetInd],
                book: bookInd
            },
            function(response){
                matchResponse = response;
                console.log("RAW RESONSE", tweetInd, response)
                var responseObj = JSON.parse(response);
                bibleMatch.push([searchTweets.tweets[tweetInd], responseObj.verse])
                console.log("MATCH RESPONSE", bookInd, searchTweets.tweets[tweetInd], responseObj);
                if(bibleMatch.length < searchTweets.tweets.length){
                    queryBibleRecursive(searchTweets, bookInd, tweetInd+1)
                }
                else {
                    console.log("GOT MATCHES FOR ALL TWEETS", bibleMatch);
                }
            }
        );
    }
    queryBibleRecursive(searchTweets, bookInd, 0);
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
var path2 = "M 60,90 Q 160,20 260,90 Q 360,160 460,90";


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

// this functinon and general path interpolation strategy taken from 
//here - https://bl.ocks.org/mbostock/3916621
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

var wavingVerse;
var wavingTweet;
var textPath;
var path;
var drawTweetInd = 0;

$(function() {
    //Create the SVG
    svg = d3.select("body").append("svg")
            .attr("width", 1280)
            .attr("height", 720);

    var d3line = d3.line()
        .curve(d3.curveBasis);

    wavingVerse = createWavingText(svg, 'verse', path1, path2);
    wavingVerse.textPath.text("this will be replaced with a bible verse");

    wavingTweet = createWavingText(svg, 'tweet', path2, path1);
    wavingTweet.textPath.text("A tweet will go here instead");

    var pathLen = wavingVerse.path.node().getTotalLength();
    var textLen = wavingVerse.textPath.node().getComputedTextLength();
    console.log("LENGTHS", pathLen, textLen);


    function dragStarted_2() {
        var d = d3.event.subject,
                d2 = _.cloneDeep(d),
                x0 = d3.event.x,
                y0 = d3.event.y;
        
        wavingVerse.textPath.text(bibleMatch[drawTweetInd][1]);
        wavingVerse.path.datum(d);
        wavingVerse.textPath.datum(d);

        wavingTweet.textPath.text(bibleMatch[drawTweetInd][0]);
        wavingTweet.path.datum(d2);
        wavingTweet.textPath.datum(d2);

        drawTweetInd = (drawTweetInd+1) % bibleMatch.length;

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


function adjustTextSizeOnPath(wavingTextObj){
    var text = wavingTextObj.text;
    var textPath = wavingTextObj.textPath;
    var path = wavingTextObj.path;
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

var sinStep = 0;
var yDiff = 0;
var yDiffScale = 80;
var yDiffStep = 0.08

function setup() {
    // createCanvas(1280, 720);
    frameRate(60);
}

var tweetLoaded = false;

var tweetIndex = 0;
function draw() {
    sinStep += yDiffStep;
    yDiff = (Math.sin(sinStep)*yDiffScale);

    if(false && bibleMatch.length > 0) {
        clear();
        textSize(12);
        text(bibleMatch[tweetIndex][0], 0, 200);
       
       
        text(""+yDiff, 0, 100);
        text(bibleMatch[tweetIndex][1], 0, 30);
        tweetIndex = (tweetIndex + 1) % bibleMatch.length;
        if(!tweetLoaded) { 
            tweetLoaded = true;
            wavingTweet.textPath.text(bibleMatch[tweetIndex][0]);
            wavingVerse.textPath.text(bibleMatch[tweetIndex][1]);
            adjustTextSizeOnPath(wavingVerse);
            adjustTextSizeOnPath(wavingTweet);
        }
    }
}

