import json
import numpy as np
from sentence_transformers import SentenceTransformer


def load_faq(path='faq.json'):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_faq_index(faq_data, model_path='local_models/all-MiniLM-L6-v2'):
    model = SentenceTransformer(model_path)
    questions = [item['question'] for item in faq_data]
    embeddings = model.encode(questions)

    return {
        "model": model,
        "faq_data": faq_data,
        "questions": questions,
        "embeddings": embeddings
    }


def query_faq(index, query, top_k=1):
    query_embedding = index["model"].encode([query])
    similarities = np.dot(index["embeddings"], query_embedding.T).flatten()

    top_indices = similarities.argsort()[-top_k:][::-1]
    top_result = index["faq_data"][top_indices[0]]

    return {
        "answer": top_result["answer"],
        "matched_question": top_result["question"]
    }
