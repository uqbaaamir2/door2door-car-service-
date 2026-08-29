"""Train a MotorMate text classifier using only the local project dataset.

The model uses locally calculated TF-IDF features and trains a neural network
from scratch using Python's standard library.
"""

import csv
import hashlib
import json
import math
import pickle
import random
import re
from datetime import datetime, timezone
from pathlib import Path


DATASET_PATH = Path(__file__).with_name("dataset.csv")
MODEL_PATH = Path(__file__).with_name("motormate_model.pth")
VOCABULARY_PATH = Path(__file__).with_name("vocabulary.json")
METADATA_PATH = Path(__file__).with_name("training_metadata.json")
RANDOM_SEED = 42
TEST_RATIO = 0.2
HIDDEN_SIZE = 32
EPOCHS = 100
LEARNING_RATE = 0.03


def tokenize(text):
    """Lowercase text, remove punctuation, and return word tokens."""
    return re.findall(r"[a-z]+", text.lower())


def feature_tokens(text):
    """Create cleaned unigram features from text."""
    return tokenize(text)


def load_dataset():
    """Load and validate the two-column local CSV dataset."""
    with DATASET_PATH.open("r", encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))

    if not rows or set(rows[0]) != {"text", "label"}:
        raise ValueError("dataset.csv must contain exactly the columns text,label")
    if any(not row["text"].strip() or not row["label"].strip() for row in rows):
        raise ValueError("Every dataset row must have text and label values")
    return rows


def stratified_split(rows, test_ratio):
    """Keep each label represented in both the training and test sets."""
    grouped = {}
    for row in rows:
        grouped.setdefault(row["label"], []).append(row)

    training_rows = []
    test_rows = []
    for label_rows in grouped.values():
        random.shuffle(label_rows)
        test_count = max(1, round(len(label_rows) * test_ratio))
        test_rows.extend(label_rows[:test_count])
        training_rows.extend(label_rows[test_count:])

    random.shuffle(training_rows)
    random.shuffle(test_rows)
    return training_rows, test_rows


def build_vocabulary(rows):
    """Build vocabulary and inverse-document frequencies from training text."""
    document_frequency = {}
    for row in rows:
        for token in set(feature_tokens(row["text"])):
            document_frequency[token] = document_frequency.get(token, 0) + 1
    words = sorted(document_frequency)
    vocabulary = {word: index for index, word in enumerate(words)}
    document_count = len(rows)
    inverse_document_frequency = [
        math.log((1 + document_count) / (1 + document_frequency[word])) + 1
        for word in words
    ]
    return vocabulary, inverse_document_frequency


def vectorize(text, vocabulary, inverse_document_frequency):
    """Represent text as a normalized TF-IDF vector."""
    vector = [0.0] * len(vocabulary)
    features = feature_tokens(text)
    for feature in features:
        if feature in vocabulary:
            index = vocabulary[feature]
            vector[index] += inverse_document_frequency[index]
    feature_count = max(1, len(features))
    vector = [value / feature_count for value in vector]
    length = math.sqrt(sum(value * value for value in vector))
    return [value / length for value in vector] if length else vector


def dot(left, right):
    return sum(left[index] * right[index] for index in range(len(left)))


def softmax(values):
    maximum = max(values)
    exponentials = [math.exp(value - maximum) for value in values]
    total = sum(exponentials)
    return [value / total for value in exponentials]


class NeuralNetwork:
    """A one-hidden-layer neural network with randomly initialized weights."""

    def __init__(self, input_size, hidden_size, output_size):
        input_scale = math.sqrt(2.0 / input_size)
        output_scale = math.sqrt(2.0 / hidden_size)
        self.weights_input = [
            [random.uniform(-input_scale, input_scale) for _ in range(input_size)]
            for _ in range(hidden_size)
        ]
        self.bias_hidden = [0.0] * hidden_size
        self.weights_output = [
            [random.uniform(-output_scale, output_scale) for _ in range(hidden_size)]
            for _ in range(output_size)
        ]
        self.bias_output = [0.0] * output_size

    def forward(self, inputs):
        hidden_linear = [
            dot(weights, inputs) + bias
            for weights, bias in zip(self.weights_input, self.bias_hidden)
        ]
        hidden = [max(0.0, value) for value in hidden_linear]
        output_linear = [
            dot(weights, hidden) + bias
            for weights, bias in zip(self.weights_output, self.bias_output)
        ]
        return hidden_linear, hidden, softmax(output_linear)

    def train_sample(self, inputs, target, learning_rate):
        hidden_linear, hidden, probabilities = self.forward(inputs)
        loss = -math.log(max(probabilities[target], 1e-12))

        output_gradient = probabilities[:]
        output_gradient[target] -= 1.0
        hidden_gradient = [
            sum(self.weights_output[label][unit] * output_gradient[label]
                for label in range(len(self.weights_output)))
            * (1.0 if hidden_linear[unit] > 0 else 0.0)
            for unit in range(len(hidden))
        ]

        for label in range(len(self.weights_output)):
            for unit in range(len(hidden)):
                self.weights_output[label][unit] -= learning_rate * output_gradient[label] * hidden[unit]
            self.bias_output[label] -= learning_rate * output_gradient[label]

        for unit in range(len(self.weights_input)):
            for word, value in enumerate(inputs):
                if value:
                    self.weights_input[unit][word] -= learning_rate * hidden_gradient[unit] * value
            self.bias_hidden[unit] -= learning_rate * hidden_gradient[unit]

        return loss

    def predict(self, inputs):
        probabilities = self.forward(inputs)[2]
        return max(range(len(probabilities)), key=probabilities.__getitem__)


def metric_report(model, samples, class_count):
    actual = [label for _, label in samples]
    predicted = [model.predict(vector) for vector, _ in samples]
    matrix = [[0] * class_count for _ in range(class_count)]
    for expected, result in zip(actual, predicted):
        matrix[expected][result] += 1

    accuracy = sum(expected == result for expected, result in zip(actual, predicted)) / len(actual)
    precision_values = []
    recall_values = []
    f1_values = []
    for label in range(class_count):
        true_positive = matrix[label][label]
        false_positive = sum(matrix[row][label] for row in range(class_count)) - true_positive
        false_negative = sum(matrix[label]) - true_positive
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        precision_values.append(precision)
        recall_values.append(recall)
        f1_values.append(f1)
    return (accuracy, sum(precision_values) / class_count,
            sum(recall_values) / class_count, sum(f1_values) / class_count, matrix)


def save_artifacts(model, vocabulary, inverse_document_frequency, labels, metadata):
    with MODEL_PATH.open("wb") as file:
        pickle.dump({
            "weights_input": model.weights_input,
            "bias_hidden": model.bias_hidden,
            "weights_output": model.weights_output,
            "bias_output": model.bias_output,
            "feature_type": "tfidf_unigram",
            "training_metadata": metadata,
        }, file)

    with VOCABULARY_PATH.open("w", encoding="utf-8") as file:
        json.dump({"word_to_index": vocabulary,
               "inverse_document_frequency": inverse_document_frequency,
               "labels": labels}, file, indent=2)

    with METADATA_PATH.open("w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)


def main():
    random.seed(RANDOM_SEED)
    rows = load_dataset()
    training_rows, test_rows = stratified_split(rows, TEST_RATIO)
    labels = sorted({row["label"] for row in rows})
    label_to_index = {label: index for index, label in enumerate(labels)}
    vocabulary, inverse_document_frequency = build_vocabulary(training_rows)

    def make_samples(source_rows):
        return [(vectorize(row["text"], vocabulary, inverse_document_frequency),
                 label_to_index[row["label"]]) for row in source_rows]

    training_samples = make_samples(training_rows)
    test_samples = make_samples(test_rows)
    model = NeuralNetwork(len(vocabulary), HIDDEN_SIZE, len(labels))

    for epoch in range(1, EPOCHS + 1):
        random.shuffle(training_samples)
        total_loss = sum(
            model.train_sample(vector, label, LEARNING_RATE)
            for vector, label in training_samples
        )
        train_accuracy = metric_report(model, training_samples, len(labels))[0]
        print(f"Epoch {epoch:03d}/{EPOCHS} - loss: {total_loss / len(training_samples):.4f} - accuracy: {train_accuracy:.2%}")

    accuracy, precision, recall, f1, confusion_matrix = metric_report(model, test_samples, len(labels))
    dataset_hash = hashlib.sha256(DATASET_PATH.read_bytes()).hexdigest()
    metadata = {
        "dataset_size": len(rows),
        "training_samples": len(training_samples),
        "test_samples": len(test_samples),
        "class_labels": labels,
        "random_seed": RANDOM_SEED,
        "epochs": EPOCHS,
        "learning_rate": LEARNING_RATE,
        "input_size": len(vocabulary),
        "hidden_size": HIDDEN_SIZE,
        "output_size": len(labels),
        "loss_function": "multiclass cross-entropy",
        "optimizer": "stochastic gradient descent",
        "feature_type": "tfidf_unigram",
        "evaluation": {
            "accuracy": accuracy,
            "macro_precision": precision,
            "macro_recall": recall,
            "macro_f1": f1,
            "confusion_matrix": confusion_matrix,
        },
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_sha256": dataset_hash,
        "trained_from_scratch": True,
        "pretrained_model_used": False,
        "external_dataset_used": False,
        "external_ai_api_used": False,
    }
    save_artifacts(model, vocabulary, inverse_document_frequency, labels, metadata)
    print("\nSupervisor summary:")
    print("Training from scratch: YES")
    print("Pre-trained model: NO")
    print("External dataset: NO")
    print("External AI API: NO")
    print(f"Dataset samples: {len(rows)}")
    print(f"Training samples: {len(training_samples)}")
    print(f"Test samples: {len(test_samples)}")
    print(f"Epochs: {EPOCHS}")
    print(f"Learning rate: {LEARNING_RATE}")
    print(f"Random seed: {RANDOM_SEED}")
    print(f"Test accuracy: {accuracy:.2%}")
    print(f"Macro precision: {precision:.2%}")
    print(f"Macro recall: {recall:.2%}")
    print(f"Macro F1: {f1:.2%}")
    print(f"\nFinal test accuracy: {accuracy:.2%}")
    print(f"Precision (macro): {precision:.2%}")
    print(f"Recall (macro): {recall:.2%}")
    print(f"F1 score (macro): {f1:.2%}")
    print("Confusion matrix (rows=actual, columns=predicted):")
    print("labels: " + ", ".join(labels))
    for matrix_row in confusion_matrix:
        print(" ".join(f"{value:2d}" for value in matrix_row))
    print(f"Training samples: {len(training_samples)}")
    print(f"Test samples: {len(test_samples)}")
    print(f"Vocabulary words: {len(vocabulary)}")
    print(f"Classes: {len(labels)}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved vocabulary: {VOCABULARY_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")


if __name__ == "__main__":
    main()