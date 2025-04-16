import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F

# Load the trained model and tokenizer
model_path = 'intent_classifier_model'  # Replace with the actual path to your saved model
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)
model.eval()

# Load intent label mapping from config (recommended)
id2label = model.config.id2label


def predict_intent(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    probs = F.softmax(logits, dim=1)
    predicted_id = torch.argmax(probs, dim=1).item()
    confidence = probs[0][predicted_id].item()
    predicted_label = id2label[predicted_id]
    return predicted_label, confidence
