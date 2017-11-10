


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
    svgPath = svg.append("path")
        .attr("id", idBase) //very important to give the path element a unique ID to reference later
        .attr("d", pathB) //Notation for an SVG path, from bl.ocks.org/mbostock/2565344
        .style("fill", "none")
        .transition()
        .duration(2000)
        .on("start", function repeat() {
          d3.active(this)
              .attrTween("d", pathTween(pathA, 4))
            .transition()
              .attrTween("d", pathTween(pathB, 4))
            .transition()
              .on("start", repeat);
        });
        // .style("stroke", "#AAAAAA");

    //Create an SVG text element and append a textPath element
    svgText = svg.append("text")
        .attr("id", idBase+"Text");

    svgTextPath = svgText.append("textPath") //append a textPath to the text element
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

$(function() {
    //Create the SVG
    svg = d3.select("body").append("svg")
            .attr("width", 600)
            .attr("height", 200);

    wavingVerse = createWavingText(svg, 'verse', path1, path2);
    wavingVerse.textPath.text("this will be replaced with a bible verse");

    wavingTweet = createWavingText(svg, 'tweet', path2, path1);
    wavingTweet.textPath.text("A tweet will go here instead");

    var pathLen = wavingVerse.path.node().getTotalLength();
    var textLen = wavingVerse.textPath.node().getComputedTextLength();
    console.log("LENGTHS", pathLen, textLen);











    var width = 960,
        height = 500;

    var d3line = d3.line()
        .curve(d3.curveBasis);

    var input = d3.select("input")
        .on("input", changeLetters);

    var letters = input.node().value;

    var startingPath = getStartingPath();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.drag()
            .container(function(d) { return this; })
            .subject(function(d) { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on("start", dragStarted));

    var textPath = svg.append("defs").append("path")
        .attr("id", "textPath")
        .attr("d", startingPath);

    var path = svg.append("path")
        .attr("d", startingPath)
        .style("fill", "none");

    var d3text = svg.append("text").append("textPath")
        .attr("xlink:href", "#textPath")
        .text(letters);

    function changeLetters() {
        letters = input.node().value;
        d3text.text(letters);
    }

    function dragStarted() {
        var d = d3.event.subject,
                x0 = d3.event.x,
                y0 = d3.event.y;
        
        path.datum(d);
        textPath.datum(d);

        d3.event.on("drag", function() {
            var x1 = d3.event.x,
                    y1 = d3.event.y,
                    dx = x1 - x0,
                    dy = y1 - y0;
            
            if (dx * dx + dy * dy > 100) d.push([x0 = x1, y0 = y1]);
            else d[d.length - 1] = [x1, y1];
            textPath.attr("d", d3line);
            path.attr("d", d3line);
        });
    }


    function getStartingPath() {
        return "M83,265L84,263.6666666666667C85,262.3333333333333,87,259.6666666666667,88.83333333333333,257.1666666666667C90.66666666666667,254.66666666666666,92.33333333333333,252.33333333333334,94.5,249.66666666666666C96.66666666666667,247,99.33333333333333,244,101.83333333333333,241C104.33333333333333,238,106.66666666666667,235,109.16666666666667,232.33333333333334C111.66666666666667,229.66666666666666,114.33333333333333,227.33333333333334,117.33333333333333,225.16666666666666C120.33333333333333,223,123.66666666666667,221,126.83333333333333,219.16666666666666C130,217.33333333333334,133,215.66666666666666,136,214C139,212.33333333333334,142,210.66666666666666,145.16666666666666,209.16666666666666C148.33333333333334,207.66666666666666,151.66666666666666,206.33333333333334,154.83333333333334,205.16666666666666C158,204,161,203,164.33333333333334,202.5C167.66666666666666,202,171.33333333333334,202,175.16666666666666,202C179,202,183,202,187,202C191,202,195,202,198.66666666666666,202.66666666666666C202.33333333333334,203.33333333333334,205.66666666666666,204.66666666666666,209,206.16666666666666C212.33333333333334,207.66666666666666,215.66666666666666,209.33333333333334,218.83333333333334,210.83333333333334C222,212.33333333333334,225,213.66666666666666,228,215.33333333333334C231,217,234,219,237.16666666666666,220.83333333333334C240.33333333333334,222.66666666666666,243.66666666666666,224.33333333333334,246.83333333333334,226.33333333333334C250,228.33333333333334,253,230.66666666666666,255.83333333333334,232.83333333333334C258.6666666666667,235,261.3333333333333,237,264.1666666666667,239.33333333333334C267,241.66666666666666,270,244.33333333333334,273,246.66666666666666C276,249,279,251,282,253C285,255,288,257,291,258.8333333333333C294,260.6666666666667,297,262.3333333333333,300.1666666666667,264C303.3333333333333,265.6666666666667,306.6666666666667,267.3333333333333,310.1666666666667,269C313.6666666666667,270.6666666666667,317.3333333333333,272.3333333333333,321.1666666666667,273.8333333333333C325,275.3333333333333,329,276.6666666666667,332.6666666666667,277.5C336.3333333333333,278.3333333333333,339.6666666666667,278.6666666666667,343.1666666666667,278.8333333333333C346.6666666666667,279,350.3333333333333,279,354.1666666666667,279C358,279,362,279,365.6666666666667,279C369.3333333333333,279,372.6666666666667,279,376,278.6666666666667C379.3333333333333,278.3333333333333,382.6666666666667,277.6666666666667,386,276.8333333333333C389.3333333333333,276,392.6666666666667,275,396.1666666666667,274C399.6666666666667,273,403.3333333333333,272,406.6666666666667,271C410,270,413,269,416.3333333333333,267.8333333333333C419.6666666666667,266.6666666666667,423.3333333333333,265.3333333333333,426.6666666666667,263.6666666666667C430,262,433,260,436.3333333333333,258.1666666666667C439.6666666666667,256.3333333333333,443.3333333333333,254.66666666666666,446.8333333333333,253C450.3333333333333,251.33333333333334,453.6666666666667,249.66666666666666,457.1666666666667,248C460.6666666666667,246.33333333333334,464.3333333333333,244.66666666666666,467.8333333333333,243C471.3333333333333,241.33333333333334,474.6666666666667,239.66666666666666,477.6666666666667,238.33333333333334C480.6666666666667,237,483.3333333333333,236,486.6666666666667,234.83333333333334C490,233.66666666666666,494,232.33333333333334,497.6666666666667,231.5C501.3333333333333,230.66666666666666,504.6666666666667,230.33333333333334,508,229.83333333333334C511.3333333333333,229.33333333333334,514.6666666666666,228.66666666666666,517.6666666666666,228.16666666666666C520.6666666666666,227.66666666666666,523.3333333333334,227.33333333333334,526.8333333333334,227C530.3333333333334,226.66666666666666,534.6666666666666,226.33333333333334,538.8333333333334,226.16666666666666C543,226,547,226,550.8333333333334,226.16666666666666C554.6666666666666,226.33333333333334,558.3333333333334,226.66666666666666,561.8333333333334,227.66666666666666C565.3333333333334,228.66666666666666,568.6666666666666,230.33333333333334,571.8333333333334,231.83333333333334C575,233.33333333333334,578,234.66666666666666,581,236.5C584,238.33333333333334,587,240.66666666666666,590,242.83333333333334C593,245,596,247,599,249C602,251,605,253,608,255.16666666666666C611,257.3333333333333,614,259.6666666666667,616.8333333333334,262C619.6666666666666,264.3333333333333,622.3333333333334,266.6666666666667,625.1666666666666,268.8333333333333C628,271,631,273,634.3333333333334,274.8333333333333C637.6666666666666,276.6666666666667,641.3333333333334,278.3333333333333,644.8333333333334,279.8333333333333C648.3333333333334,281.3333333333333,651.6666666666666,282.6666666666667,655,283.5C658.3333333333334,284.3333333333333,661.6666666666666,284.6666666666667,665.1666666666666,285C668.6666666666666,285.3333333333333,672.3333333333334,285.6666666666667,676,285.8333333333333C679.6666666666666,286,683.3333333333334,286,687,286C690.6666666666666,286,694.3333333333334,286,698,286.1666666666667C701.6666666666666,286.3333333333333,705.3333333333334,286.6666666666667,707.5,286.8333333333333C709.6666666666666,287,710.3333333333334,287,710.6666666666666,287L711,287";
    }
















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

function setup() {
    createCanvas(1280, 720);
    frameRate(60);
}

var tweetLoaded = false;

var tweetIndex = 0;
function draw() {
    if(bibleMatch.length > 0) {
        clear();
        textSize(12);
        text(bibleMatch[tweetIndex][0], 0, 200);
        sinStep += 0.01
        text(""+(Math.sin(sinStep)*30), 0, 100);
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

