import torch.nn as nn

class SymptomClassifier(nn.Module):
    """
    A simple 3-layer Neural Network for symptom classification.
    Input size corresponds to the vocabulary size (number of unique symptoms).
    """
    def __init__(self, input_size, num_classes):
        super(SymptomClassifier, self).__init__()
        
        # Define layers
        self.layer_1 = nn.Linear(input_size, 128)
        self.relu = nn.ReLU()
        self.layer_2 = nn.Linear(128, 64)
        self.output_layer = nn.Linear(64, num_classes)

    def forward(self, x):
        out = self.layer_1(x)
        out = self.relu(out)
        out = self.layer_2(out)
        out = self.relu(out)
        out = self.output_layer(out)
        return out