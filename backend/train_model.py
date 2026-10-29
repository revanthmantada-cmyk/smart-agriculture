"""
Plant Disease Classification Model Training Script
===================================================
Uses Transfer Learning with MobileNetV2 (pre-trained on ImageNet).
Trains a lightweight, fast, and accurate vision classifier on the
15 PlantVillage disease classes extracted in Step 1.

Saves:
  - models/plant_disease_mobilenetv2.keras (Trained model weights)
  - models/class_indices.json (Class label list)
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np

# Configure console output encoding for Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Suppress verbose TensorFlow logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# ------------------------------------------------------------------------------
# 1. Paths
# ------------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATASET_DIR = PROJECT_ROOT / "datasets" / "PlantVillage"
MODELS_DIR = PROJECT_ROOT / "models"
MODEL_OUTPUT_PATH = MODELS_DIR / "plant_disease_mobilenetv2.keras"
CLASS_INDICES_PATH = MODELS_DIR / "class_indices.json"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
DEFAULT_EPOCHS = 5


def prepare_dataset(max_per_class=60, val_split=0.2, seed=42):
    """
    Creates a balanced training and validation dataset from PlantVillage.
    Using a balanced subset (e.g., 60 images per class = 900 images total)
    enables rapid, stable convergence on CPU in 1-2 minutes for hackathon demo.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if not DATASET_DIR.exists():
        raise FileNotFoundError(f"Dataset directory not found at: {DATASET_DIR}")

    classes = sorted([d.name for d in DATASET_DIR.iterdir() if d.is_dir()])
    print(f"[INFO] Found {len(classes)} plant disease classes:")
    for idx, cls in enumerate(classes):
        print(f"  [{idx:02d}] {cls}")

    # Build image file list with balanced sampling
    train_files = []
    train_labels = []
    val_files = []
    val_labels = []

    rng = np.random.default_rng(seed)

    for cls_idx, cls_name in enumerate(classes):
        cls_dir = DATASET_DIR / cls_name
        all_imgs = [str(p) for p in cls_dir.glob("*.JPG")] + [str(p) for p in cls_dir.glob("*.jpg")] + [str(p) for p in cls_dir.glob("*.png")]
        
        # Shuffle
        rng.shuffle(all_imgs)

        # Cap if requested
        if max_per_class and max_per_class > 0:
            selected_imgs = all_imgs[:max_per_class]
        else:
            selected_imgs = all_imgs

        split_idx = int(len(selected_imgs) * (1 - val_split))
        train_cls = selected_imgs[:split_idx]
        val_cls = selected_imgs[split_idx:]

        train_files.extend(train_cls)
        train_labels.extend([cls_idx] * len(train_cls))
        val_files.extend(val_cls)
        val_labels.extend([cls_idx] * len(val_cls))

    print(f"\n[DATA] Dataset Split Summary:")
    print(f"  Training samples:   {len(train_files)}")
    print(f"  Validation samples: {len(val_files)}")
    print(f"  Total samples:      {len(train_files) + len(val_files)}")

    # Function to load and preprocess images
    def load_image(filepath, label):
        img_bytes = tf.io.read_file(filepath)
        img = tf.io.decode_image(img_bytes, channels=3, expand_animations=False)
        img = tf.image.resize(img, IMAGE_SIZE)
        img = preprocess_input(img)  # Scale to [-1, 1] for MobileNetV2
        return img, label

    # Create tf.data.Dataset
    train_ds = (
        tf.data.Dataset.from_tensor_slices((train_files, train_labels))
        .shuffle(len(train_files), seed=seed)
        .map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(tf.data.AUTOTUNE)
    )

    val_ds = (
        tf.data.Dataset.from_tensor_slices((val_files, val_labels))
        .map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(tf.data.AUTOTUNE)
    )

    return train_ds, val_ds, classes


def build_transfer_model(num_classes):
    """
    Builds a Transfer Learning model using MobileNetV2 with pre-trained ImageNet weights.
    """
    print("\n[MODEL] Loading MobileNetV2 pre-trained base model...")
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False  # Freeze pre-trained weights for transfer learning

    # Data augmentation block
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
    ], name="data_augmentation")

    inputs = keras.Input(shape=(224, 224, 3))
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs, outputs, name="MobileNetV2_CropDisease")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


def main():
    parser = argparse.ArgumentParser(description="Train Plant Disease Classifier")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS, help="Number of training epochs")
    parser.add_argument("--max-per-class", type=int, default=60, help="Max images per class for fast balanced training (0 for all)")
    args = parser.parse_args()

    print("=" * 60)
    print("Smart Agriculture - Plant Disease Model Training")
    print(f"Dataset: {DATASET_DIR}")
    print(f"Output:  {MODEL_OUTPUT_PATH}")
    print("=" * 60)

    train_ds, val_ds, classes = prepare_dataset(max_per_class=args.max_per_class)
    model = build_transfer_model(len(classes))
    model.summary()

    print(f"\n[TRAIN] Starting Model Training for {args.epochs} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        verbose=1
    )

    final_val_acc = history.history["val_accuracy"][-1]
    final_val_loss = history.history["val_loss"][-1]
    print(f"\n[RESULT] Training Complete!")
    print(f"  Final Validation Accuracy: {final_val_acc * 100:.2f}%")
    print(f"  Final Validation Loss:     {final_val_loss:.4f}")

    # Save model and class indices
    print(f"\n[SAVE] Saving model to {MODEL_OUTPUT_PATH}...")
    model.save(str(MODEL_OUTPUT_PATH))

    print(f"[SAVE] Saving class labels to {CLASS_INDICES_PATH}...")
    with open(CLASS_INDICES_PATH, "w", encoding="utf-8") as f:
        json.dump(classes, f, indent=2)

    print("\n[SUCCESS] Trained model and class labels are ready.")


if __name__ == "__main__":
    main()
