
/*
Initialize the codebird object and authenticate your app
This essentially means "logging in" with your app to 
access the Twitter api. 
*/
var cb = new Codebird;
cb.setConsumerKey("YOUR_CONSUMER_KEY","YOUR_CONSUMER_SECRET");
cb.setToken("YOUR_ACCESS_TOKEN", "YOUR_ACCESS_TOKEN_SECRET");

//print out the codebird object to inspect that everything look sgood
console.log(cb);

//The array where we will store the tweets we are displaying
var tweets = [];


/*
The parameters for the api endpoint. An api endpoint is 
bascically a function that lives on some external server. 
The parameters are the arguments you are giving to the 
function. 
*/
var params = {
    q: "NYC"
};

/*
Making a call to the api.
*/
cb.__call(
    /*the string that identifies the API endpoint. The
    codebird examples are a little out of date, so make
    sure to check against the API doc 
    - https://developer.twitter.com/en/docs/tweets
    */
    "search/tweets", 

    //set the parameters of the api call
    params, 

    /*
    When the api call returns with data, the CodeBird library will 
    call a function on it. Defining this function lets you 
    specify exactly how you want to deal with the returned data.
    The CodeBird library parses the response of the api and
    gives you 3 easy to work with objects. The "reply" object -  
    which will contain the data you requested, the "rate" object -
    which returns info about how often you are calling the api, 
    and the "error" object - which tells you about any errors
    that may have happened while processing your request. 
    */
    function (reply, rate, error) {
        //save all of the returned tweets to the tweets array
        for(var i = 0; i < reply.statuses.length; i++){
            tweets.push(reply.statuses[i].text);
        }
        console.log(tweets);
    }
);

//Set up a canvas that draws every 2 seconds. 
function setup() {
    createCanvas(1280, 720);
    frameRate(0.5);
}

var tweetIndex = 0;

/*
replace this with whatever logic you need to make sure
that all your data is ready before you draw anything
*/
function isDataReady(){
    return tweents.length > 0;
}

/*
Refresh the canvas and draw the next tweet on our list.
*/
function draw() {
    /*
    Because we are waiting for the twitter server to return the tweets to us, 
    it is possible that the draw loop will start running before the tweets are
    loaded, causing our program to crash. You can use p5 preload() to do this, 
    or you can use a quick hack like this: define some function that determines
    whether the data you need to draw is ready, and then use that function to 
    wrap the logic in the draw method, so that if your data is not yet ready, 
    the draw function does nothing. 
    */
    if(isDataReady()) {
        clear();
        textSize(12);
        text(tweets[tweetIndex], 0, 200);

        //wrap around back to the beginning when we reach the end of the list.
        tweetIndex = (tweetIndex + 1) % tweets.length;
    }

}

