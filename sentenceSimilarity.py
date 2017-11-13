from nltk import word_tokenize, pos_tag
from nltk.corpus import wordnet as wn
import json
import itertools
import time as timemodule
from multiprocessing import Pool


# All code for sentece-similarty calculation taken from here 
# http://nlpforhackers.io/wordnet-sentence-similarity/ 
# The next 4 functions are used to calculate a similarity score between 
# sentences [0-1] using WordNet
def sentence_similarity(sentence1, sentence2):
    return (sentence_similarity_asym(sentence1, sentence2) + sentence_similarity_asym(sentence2, sentence1)) / 2
 
def penn_to_wn(tag):
    """ Convert between a Penn Treebank tag to a simplified Wordnet tag """
    if tag.startswith('N'):
        return 'n'
 
    if tag.startswith('V'):
        return 'v'
 
    if tag.startswith('J'):
        return 'a'
 
    if tag.startswith('R'):
        return 'r'
 
    return None
 
def tagged_to_synset(word, tag):
    wn_tag = penn_to_wn(tag)
    if wn_tag is None:
        return None
    # return wn.synsets(word, wn_tag)[0]
    try:
        return wn.synsets(word, wn_tag)[0]
    except:
        #print word, "tagging error"
        return None
 
def sentence_similarity_asym(sentence1, sentence2):
    """ compute the sentence similarity using Wordnet """
    # Tokenize and tag
    sentence1 = pos_tag(word_tokenize(sentence1))
    sentence2 = pos_tag(word_tokenize(sentence2))
 
    # Get the synsets for the tagged words
    synsets1 = [tagged_to_synset(*tagged_word) for tagged_word in sentence1]
    synsets2 = [tagged_to_synset(*tagged_word) for tagged_word in sentence2]
 
    # Filter out the Nones
    synsets1 = [ss for ss in synsets1 if ss]
    synsets2 = [ss for ss in synsets2 if ss]
 
    score, count = 0.0, 0

    # For each word in the first sentence
    for synset in synsets1:
        # Get the similarity value of the most similar word in the other sentence
        pathsim = [synset.path_similarity(ss) for ss in synsets2]
        if len(pathsim) == 0:
            #print sentence1, sentence2
            pathsim = [0]
        best_score = max(pathsim)
        
        # Check that the similarity could have been computed
        if best_score is not None:
            score += best_score
            count += 1

    if count == 0:
        return 0
    # Average the values
    score /= count
    return score
            

#TODO: write an ascii cleaner

# returns a version of the bible json with all verses
# in a book aggreagated into a single list.
# the initial json was the en_kjv.json file 
# from here - https://github.com/thiagobodruk/bible/
# but cleaned to remove non-ascii characters
def getCleanedBible():
    biblejson = json.load(open('bible.txt'))

    def cleanBible(bible):
        for book in bible:
            chapters = book['chapters']
            chapterList = []
            chapterInd = 0
            for chap in chapters:
                verseInds = [int(k) for k in chap[str(chapterInd+1)].keys()]
                verseInds.sort()
                chapterList.append([chap[str(chapterInd+1)][str(v)] for v in verseInds])
                chapterInd += 1
            book['cleanChap'] = chapterList
            book['allVerses'] = list(itertools.chain.from_iterable(chapterList))
                                     
    cleanBible(biblejson)

    return biblejson

# I wanted to parallelize the computation of simiarity 
# of Bible veses to a tweet, but it was a bit trick
# to get Python's Pool.map to work with arbitrary functions.
# This class is a hack for getting around using lambda functions 
# in Pool objects https://stackoverflow.com/a/4827520
class TweetSim(object):
    def __init__(self, tweet):
        self.tweet = tweet
    def __call__(self, verse):
        try:
            return (sentence_similarity(self.tweet, verse), verse)
        except Exception as e:
            print "VERSE ERROR", e, verse

#todo: reneable pooling in nearestVerse after debugging
#todo: make sure tweets are ascii so nltk doesn't break

# tweet is the tweet string
# bookIndex is the index of the book of the Bible
#     from which the most similar verse will be chosen
# bible is the bible-object that stores the structured text
# Returns the verse in the given book with the highest simiarlity
#     score relative to the given tweet
def nearestVerse(tweet, bookIndex, bible, pool):
    verses = bible[bookIndex]['allVerses']
    tweetsim = TweetSim(tweet)
    verseDistances = pool.map(tweetsim, bible[bookIndex]['allVerses'])
    mostSameVerse = max(verseDistances)
    return mostSameVerse[1]

#debugger method, same as nearestVerse() but returns all distance/sentence pairs     
def bookVerseDistances(tweet, bookIndex, bible, pool):
    verses = bible[bookIndex]['allVerses']
    tweetsim = TweetSim(tweet)
    verseDistances = pool.map(tweetsim, bible[bookIndex]['allVerses'])
    return verseDistances


## main method to test query speed
if __name__ == "__main__": 
    
    biblejson = getCleanedBible()
    focus_sentence = "Cats are beautiful animals."

    t = timemodule.time()
    vals = []
    singleThread = False
    print "starting calculation", "singleThread", singleThread 
    if singleThread:
        for sentence in biblejson[0]['allVerses']:
            vals.append( (focus_sentence, sentence, sentence_similarity(focus_sentence, sentence)))
    else:
        pool = Pool()
        sensim = SenSim(focus_sentence)
        vals = pool.map(sensim, biblejson[0]['allVerses'])
    print timemodule.time() - t
 