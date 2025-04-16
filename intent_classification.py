from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json

with open('intents.json') as f:
    intents = json.load(f)

#TODO: to add another sentence BERT or Distil-BERT classifier

model = SentenceTransformer('all-MiniLM-L6-v2')

# Prepare corpus
intent_sentences = []
intent_labels = []

for label, examples in intents.items():
    intent_sentences.extend(examples)
    intent_labels.extend([label] * len(examples))

# Encode the corpus
example_embeddings = model.encode(intent_sentences, show_progress_bar=True)

def predict_intent(user_input, threshold=0.6):
    user_embedding = model.encode([user_input])
    similarities = cosine_similarity(user_embedding, example_embeddings)[0]

    max_sim = np.max(similarities)
    best_match_index = np.argmax(similarities)

    if max_sim >= threshold:
        return intent_labels[best_match_index], float(max_sim)
    else:
        return "unknown_intent", float(max_sim)



