from sklearn.model_selection import train_test_split
from transformers import DistilBertTokenizer
import json
import torch

with open('intents.json') as f:
    data = json.load(f)

# Convert to lists of sentences and corresponding labels
texts = []
labels = []

for label, phrases in data.items():
    texts.extend(phrases)
    labels.extend([label] * len(phrases))

# Define class labels
class_names = list(data.keys())  # ['greet', 'job_listing', 'others']

# Convert labels to integers for model training
label_map = {label: i for i, label in enumerate(class_names)}
labels_int = [label_map[label] for label in labels]

# Split dataset into training and validation sets
train_texts, val_texts, train_labels, val_labels = train_test_split(texts, labels_int, test_size=0.2,
                                                                    stratify=labels_int,
                                                                    random_state=42)

# Load pre-trained DistilBERT tokenizer
tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

# Tokenize the text
train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=64)
val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=64)

class IntentDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)


# Create dataset objects for train and validation
train_dataset = IntentDataset(train_encodings, train_labels)
val_dataset = IntentDataset(val_encodings, val_labels)


"""
Fine tuning the model using Trainer API
"""
from transformers import DistilBertForSequenceClassification, Trainer, TrainingArguments

# Load pre-trained DistilBERT model with a classification head
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased',
                                                            num_labels=len(class_names))

# Set up training arguments
training_args = TrainingArguments(
    output_dir='./results',          # output directory
    eval_strategy="epoch",     # evaluation strategy
    learning_rate=5e-5,              # learning rate
    per_device_train_batch_size=8,   # batch size
    per_device_eval_batch_size=8,    # batch size for evaluation
    num_train_epochs=10,              # number of epochs
    weight_decay=0.05,               # strength of weight decay
    logging_dir='./logs',            # directory for storing logs
)

# Initialize Trainer
trainer = Trainer(
    model=model,                         # the model to train
    args=training_args,                  # training arguments
    train_dataset=train_dataset,         # training dataset
    eval_dataset=val_dataset,            # evaluation dataset
)

# Fine-tune the model
trainer.train()

# Evaluate the model
trainer.evaluate()

# Example inference function
# def predict_intent(text):
#     encoding = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=64)
#     with torch.no_grad():
#         output = model(**encoding)
#     logits = output.logits
#     predicted_class_id = torch.argmax(logits, dim=1).item()
#     return class_names[predicted_class_id]
#
# # Test with a new message
# new_message = "Can you show me some job listings?"
# intent = predict_intent(new_message)
# print(f"Predicted intent: {intent}")


# Save the fine-tuned model
# Save during training
label2id = {'greet': 0, 'job_listing': 1, 'others': 2}
id2label = {v: k for k, v in label2id.items()}
model.config.label2id = label2id
model.config.id2label = id2label
model.save_pretrained('./intent_classifier_model')
tokenizer.save_pretrained('./intent_classifier_model')




