from flask import Flask, request, jsonify
import cv2
import numpy as np
import pytesseract
from scipy.signal import find_peaks

app = Flask(__name__)

def digitize_pump_curve(image_path):
    # Load image
    img = cv2.imread(image_path)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply edge detection
    edges = cv2.Canny(gray, 50, 150)

    # Detect contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Placeholder for digitized data
    hp_curve = []
    head_curve = []
    efficiency_curve = []

    # Dummy example: Populate with fake data for now
    for i in range(100):
        hp_curve.append(i * 0.5)
        head_curve.append(i * 0.3)
        efficiency_curve.append(i * 0.2)

    return {
        "x": list(range(100)),  # Fake x-axis
        "hp": hp_curve,
        "head": head_curve,
        "efficiency": efficiency_curve,
    }

@app.route("/api/digitize", methods=["POST"])
def digitize():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    file_path = f"uploads/{file.filename}"
    file.save(file_path)

    digitized_data = digitize_pump_curve(file_path)
    return jsonify(digitized_data)

if __name__ == "__main__":
    app.run(debug=True)
