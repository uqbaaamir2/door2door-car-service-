"""Local inference for the MotorMate text classifier."""

import json
import math
import pickle
import re
from functools import lru_cache
from pathlib import Path


AI_MODEL_DIRECTORY = Path(__file__).resolve().parents[1] / "ai_model"
MODEL_PATH = AI_MODEL_DIRECTORY / "motormate_model.pth"
VOCABULARY_PATH = AI_MODEL_DIRECTORY / "vocabulary.json"
TOKEN_PATTERN = re.compile(r"[a-z]+")


def _tokenize(text: str) -> list[str]:
    return TOKEN_PATTERN.findall(text.lower())


def _vectorize(
    text: str,
    vocabulary: dict[str, int],
    inverse_document_frequency: list[float],
) -> list[float]:
    features = _tokenize(text)
    vector = [0.0] * len(vocabulary)
    for feature in features:
        if feature in vocabulary:
            index = vocabulary[feature]
            vector[index] += inverse_document_frequency[index]

    feature_count = max(1, len(features))
    vector = [value / feature_count for value in vector]
    length = math.sqrt(sum(value * value for value in vector))
    return [value / length for value in vector] if length else vector


def _dot(left: list[float], right: list[float]) -> float:
    return sum(left[index] * right[index] for index in range(len(left)))


def _softmax(values: list[float]) -> list[float]:
    maximum = max(values)
    exponentials = [math.exp(value - maximum) for value in values]
    total = sum(exponentials)
    return [value / total for value in exponentials]


class MotorMateModel:
    """Loaded model weights and the exact feature transformation used in training."""

    def __init__(self) -> None:
        try:
            with VOCABULARY_PATH.open("r", encoding="utf-8") as file:
                vocabulary_data = json.load(file)
            # This is a local, application-owned artifact produced by train.py.
            with MODEL_PATH.open("rb") as file:
                model_data = pickle.load(file)
        except (OSError, pickle.PickleError, EOFError, json.JSONDecodeError) as exc:
            raise RuntimeError("MotorMate AI artifacts could not be loaded") from exc

        self.vocabulary = vocabulary_data["word_to_index"]
        self.inverse_document_frequency = vocabulary_data["inverse_document_frequency"]
        self.labels = vocabulary_data["labels"]
        self.weights_input = model_data["weights_input"]
        self.bias_hidden = model_data["bias_hidden"]
        self.weights_output = model_data["weights_output"]
        self.bias_output = model_data["bias_output"]
        self._validate_artifacts()

    def _validate_artifacts(self) -> None:
        vocabulary_size = len(self.vocabulary)
        if len(self.inverse_document_frequency) != vocabulary_size:
            raise RuntimeError("Vocabulary and IDF sizes do not match")
        if len(self.weights_input) != len(self.bias_hidden):
            raise RuntimeError("Input weight and hidden bias sizes do not match")
        if any(len(row) != vocabulary_size for row in self.weights_input):
            raise RuntimeError("Input weights do not match the vocabulary size")
        if len(self.weights_output) != len(self.labels):
            raise RuntimeError("Output weights do not match the label count")
        if any(len(row) != len(self.bias_hidden) for row in self.weights_output):
            raise RuntimeError("Output weights do not match the hidden layer size")
        if len(self.bias_output) != len(self.labels):
            raise RuntimeError("Output bias and label sizes do not match")

    def predict(self, text: str) -> tuple[str, float]:
        vector = _vectorize(
            text,
            self.vocabulary,
            self.inverse_document_frequency,
        )
        hidden_linear = [
            _dot(weights, vector) + bias
            for weights, bias in zip(self.weights_input, self.bias_hidden)
        ]
        hidden = [max(0.0, value) for value in hidden_linear]
        output_linear = [
            _dot(weights, hidden) + bias
            for weights, bias in zip(self.weights_output, self.bias_output)
        ]
        probabilities = _softmax(output_linear)
        label_index = max(range(len(probabilities)), key=probabilities.__getitem__)
        return self.labels[label_index], probabilities[label_index]


@lru_cache(maxsize=1)
def get_model() -> MotorMateModel:
    """Load the local artifacts once and reuse them for all requests."""
    return MotorMateModel()


def predict_text(text: str) -> tuple[str, float]:
    return get_model().predict(text)