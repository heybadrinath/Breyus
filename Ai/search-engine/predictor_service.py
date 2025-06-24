from flask import Flask, request, jsonify
from flask_cors import CORS
from model_utils import load_model, predict, PRICE_MODEL_PATH, DURATION_MODEL_PATH

app = Flask(__name__)
CORS(app)

price_model = load_model(PRICE_MODEL_PATH)
duration_model = load_model(DURATION_MODEL_PATH)

@app.route("/predict", methods=["POST"])
def predict_trade():
    try:
        data = request.get_json()
        commodity = data.get("commodity_name")
        region = data.get("region")

        if not commodity or not region:
            return jsonify({'error': 'Both commodity_name and region are required'}), 400

        result = predict(price_model, duration_model, commodity, region)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
