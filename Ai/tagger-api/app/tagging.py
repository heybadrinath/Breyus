import spacy
import gensim.downloader as api

# Load spaCy model for NLP
nlp = spacy.load("en_core_web_sm")

# Load pretrained word vectors (GloVe)
word_vectors = api.load("glove-wiki-gigaword-100")

# Known commodity tags (expandable)
KNOWN_TAGS = ["oil", "gold", "silver", "wheat", "synthetic", "lubricant", "petroleum", "precious metal"]

def get_similar_words(word: str):
    """Return top 3 similar words using GloVe embeddings."""
    try:
        similar = word_vectors.most_similar(word, topn=3)
        return [w[0] for w in similar]
    except KeyError:
        return []

def generate_tags(title: str):
    """Generate tags based on the input title."""
    doc = nlp(title.lower())
    tags = set()

    for token in doc:
        word = token.text
        if word in KNOWN_TAGS:
            tags.add(word)
        else:
            tags.update(get_similar_words(word))

    return list(tags) if tags else ["miscellaneous"]
