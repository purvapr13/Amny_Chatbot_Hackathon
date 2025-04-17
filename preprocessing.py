from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np
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
train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=128)
val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=128)


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

# Import necessary libraries for the model and training
from transformers import DistilBertForSequenceClassification, Trainer, TrainingArguments

# Load pre-trained DistilBERT model with a classification head
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased',
                                                            num_labels=len(class_names))

# Set up training arguments
training_args = TrainingArguments(
    output_dir='./results',          # output directory
    eval_strategy="epoch",           # evaluation strategy
    save_strategy="epoch",
    learning_rate=3e-5,              # learning rate
    per_device_train_batch_size=8,   # batch size
    per_device_eval_batch_size=8,    # batch size for evaluation
    num_train_epochs=12,              # number of epochs
    weight_decay=0.001,               # strength of weight decay
    logging_dir='./logs',            # directory for storing logs
    load_best_model_at_end=False,
)

# Define the compute_metrics function to calculate accuracy, precision, recall, and F1 score
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    # Calculate accuracy
    accuracy = accuracy_score(labels, predictions)

    # Calculate precision, recall, and F1 score
    precision, recall, f1, _ = precision_recall_fscore_support(labels, predictions, average=None,
                                                               labels=list(range(len(class_names))))

    return {
        'accuracy': accuracy,
        'precision': precision.tolist(),
        'recall': recall.tolist(),
        'f1': f1.tolist()
    }


# Initialize Trainer
trainer = Trainer(
    model=model,                         # the model to train
    args=training_args,                  # training arguments
    train_dataset=train_dataset,         # training dataset
    eval_dataset=val_dataset,            # evaluation dataset
    compute_metrics=compute_metrics      # add the compute_metrics function
)

# Fine-tune the model
print("Training will begin now...")
trainer.train()
print("Training completed.")


# Save the fine-tuned model
label2id = {'greet': 0, 'job_listing': 1, 'others': 2, 'events': 3,
            'mentorship': 4, 'sessions': 5, 'resume_help': 6,
            'skill_gap': 7, 'profile_assist': 8, 'about_platform': 9,
            'demotivated': 10, 'dodging': 11, 'bye': 12, 'fallback': 13}
id2label = {v: k for k, v in label2id.items()}
model.config.label2id = label2id
model.config.id2label = id2label
model.save_pretrained('./intent_classifier_model')
tokenizer.save_pretrained('./intent_classifier_model')

#model evaluation

eval_results = trainer.evaluate()

# print precision, recall, and F1 for each class
for i, intent in enumerate(class_names):
    print(f"Intent: {intent}")
    print(f" Precision: {eval_results['eval_precision'][i]:.4f}")
    print(f" Recall: {eval_results['eval_recall'][i]:.4f}")
    print(f" F1-Score: {eval_results['eval_f1'][i]:.4f}")
    print("-----")

