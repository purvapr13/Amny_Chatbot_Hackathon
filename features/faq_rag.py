import json
import numpy as np
from sentence_transformers import SentenceTransformer


def load_faq(path='faq.json'):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_demotivated_stories(path='demotivated.json'):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)["success_stories"]


def build_faq_index(faq_data, success_stories_data, model_path='local_models/all-MiniLM-L6-v2'):
    model = SentenceTransformer(model_path)
    faq_questions = [item['question'] for item in faq_data]
    faq_embeddings = model.encode(faq_questions)

    # Prepare Success Stories data embeddings
    success_stories = [item['story'] for item in success_stories_data]
    stories_embeddings = model.encode(success_stories)

    return {
        "model": model,
        "faq_data": faq_data,
        "faq_questions": faq_questions,
        "faq_embeddings": faq_embeddings,
        "stories_data": success_stories_data,
        "stories_embeddings": stories_embeddings
    }


def query_index(index, query, top_k=1, is_faq=True):
    if is_faq:
        # Query FAQ index
        embeddings = index["faq_embeddings"]
        data = index["faq_data"]
    else:
        # Query Success Stories index
        embeddings = index["stories_embeddings"]
        data = index["stories_data"]

    # Use the pre-loaded model to generate the query embedding
    query_embedding = index["model"].encode([query])

    # Compute similarities between query and stored embeddings
    similarities = np.dot(embeddings, query_embedding.T).flatten()

    top_indices = similarities.argsort()[-top_k:][::-1]
    top_result = data[top_indices[0]]

    return {
        "matched_text": top_result.get("answer", top_result.get("story")),
        "matched_question_or_story": top_result.get("question", top_result.get("story"))
    }
