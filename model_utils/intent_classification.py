import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_path = 'intent_classifier_model'
print("CUDA status", torch.cuda.is_available())
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Internal cache
_model = None
_tokenizer = None
_id2label = None


def load_model():
    global _model, _tokenizer, _id2label
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(model_path)
        _model = AutoModelForSequenceClassification.from_pretrained(model_path)
        _model.to(device)
        _model.eval()
        _id2label = _model.config.id2label
        print(f"Model is loaded on device: {next(_model.parameters()).device}")


def predict_intent(text):
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    # noinspection PyCallingNonCallable
    inputs = _tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = _model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=1)
    pred_id = torch.argmax(probs, dim=1).item()
    return _id2label[pred_id], probs[0][pred_id].item()
