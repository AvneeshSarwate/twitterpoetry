#!/usr/bin/python
from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer
from os import curdir, sep
import cgi
import logging
import json
import threading
import pickle 
import sentenceSimilarity as sensim
from multiprocessing import Pool

PORT_NUMBER = 6310


bible = sensim.getCleanedBible()
pool = Pool()

# Wrapper around sentenceSimilarity.nearestVerse().
# I didn't want the sentenceSimilarity module to 
# be stateful or store the bible data or process pool on its own, 
# so that's why there's this bit of duplication of code
def nearestVerse(tweet, bibleIndex):
    return sensim.nearestVerse(tweet, bibleIndex, bible, pool)


#This class will handles any incoming request from
#the browser 
class myHandler(BaseHTTPRequestHandler):
    
    #Handler for the GET requests
    def do_GET(self):
        if self.path=="/":
            self.path="/twitterPoetryL1.html"

        try:
            #Check the file extension required and
            #set the right mime type

            sendReply = False
            if self.path.endswith(".html"):
                mimetype='text/html'
                sendReply = True
            if self.path.endswith(".jpg"):
                mimetype='image/jpg'
                sendReply = True
            if self.path.endswith(".gif"):
                mimetype='image/gif'
                sendReply = True
            if self.path.endswith(".js"):
                mimetype='application/javascript'
                sendReply = True
            if self.path.endswith(".css"):
                mimetype='text/css'
                sendReply = True

            if sendReply == True:
                #Open the static file requested and send it
                f = open(curdir + sep + self.path) 
                self.send_response(200)
                self.send_header('Content-type',mimetype)
                self.end_headers()
                self.wfile.write(f.read())
                f.close()
            return

        except IOError:
            self.send_error(404,'File Not Found: %s' % self.path)

    #Handler for the POST requests
    def do_POST(self):

        logging.error(self.headers)
        print "POST PATH", self.path, self.headers 
        # print "CONTENT", self.rfile.readline()

        form = cgi.FieldStorage(
            fp=self.rfile, 
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],
        })

        # the endpoint that calls the nearestVerse function
        if self.path == "/nearestverse":
            self.send_response(200)
            self.end_headers()
            tweetAscii = ''.join([i if ord(i) < 128 else ' ' for i in form['tweet'].value])
            verseStr = nearestVerse(tweetAscii, int(form['book'].value))
            print "VERSE", verseStr
            responseStr = json.dumps({"verse": verseStr}, separators=(",", ":"))  
            self.wfile.write(responseStr)

            
try:
    #Create a web server and define the handler to manage the
    #incoming request
    server = HTTPServer(('', PORT_NUMBER), myHandler)
    print 'Started httpserver on port ' , PORT_NUMBER
    
    #Wait forever for incoming htto requests
    server.serve_forever()

except KeyboardInterrupt:
    print '^C received, shutting down the web server'
    server.socket.close()