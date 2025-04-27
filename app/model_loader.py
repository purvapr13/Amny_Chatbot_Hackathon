# model_loader.py
from model_utils.intent_classification import load_model
from features.faq_rag import load_faq, build_faq_index, load_demotivated_stories


class ModelLoader:
    def __init__(self):
        self.ml_models = {}

    def load_models(self):
        self.ml_models["intent_classification"] = load_model()
        faq_data = load_faq()
        success_stories_data = load_demotivated_stories()
        self.ml_models["index"] = build_faq_index(faq_data, success_stories_data)

    def get_models(self):
        return self.ml_models
