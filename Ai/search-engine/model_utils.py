import os
import pandas as pd
import joblib
import logging
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

DATA_FILE = 'backend/ai/future_data.csv'
PRICE_MODEL_PATH = 'models/price_predictor.pkl'
DURATION_MODEL_PATH = 'models/duration_predictor.pkl'
RANDOM_STATE = 42
TEST_SIZE = 0.2
CATEGORICAL_FEATURES = ['commodity_name', 'region']
FEATURES = CATEGORICAL_FEATURES
TARGET_PRICE = 'price'
TARGET_DURATION = 'duration_days'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def load_data(filepath):
    try:
        data = pd.read_csv(filepath)
        required_columns = FEATURES + [TARGET_PRICE, TARGET_DURATION]
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"CSV must contain columns: {required_columns}")
        logging.info(f"Data loaded successfully with {len(data)} records.")
        return data
    except Exception as e:
        logging.error(f"Failed to load data: {e}")
        raise


def build_pipeline():
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES)
        ]
    )

    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=RANDOM_STATE))
    ])
    return model


def train_models(data):
    X = data[FEATURES]
    y_price = data[TARGET_PRICE]
    y_duration = data[TARGET_DURATION]

    X_train, X_test, y_train_price, y_test_price = train_test_split(
        X, y_price, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    _, _, y_train_duration, y_test_duration = train_test_split(
        X, y_duration, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    price_model = build_pipeline()
    duration_model = build_pipeline()

    price_model.fit(X_train, y_train_price)
    duration_model.fit(X_train, y_train_duration)

    logging.info("Models trained successfully.")

    return price_model, duration_model


def save_model(model, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)
    logging.info(f"Model saved to {path}")


def load_model(path):
    try:
        model = joblib.load(path)
        logging.info(f"Model loaded from {path}")
        return model
    except Exception as e:
        logging.error(f"Failed to load model: {e}")
        raise


def predict_trade_details(price_model, duration_model, commodity, region):
    try:
        input_df = pd.DataFrame([{'commodity_name': commodity, 'region': region}])
        predicted_price = price_model.predict(input_df)[0]
        predicted_duration = duration_model.predict(input_df)[0]
        return {
            'commodity': commodity,
            'region': region,
            'predicted_price': round(predicted_price, 2),
            'predicted_duration_days': int(predicted_duration)
        }
    except Exception as e:
        logging.error(f"Prediction failed: {e}")
        return {
            'error': 'Invalid input or model issue.'
        }


if __name__ == "__main__":
    try:
        data = load_data(DATA_FILE)
        price_model, duration_model = train_models(data)
        save_model(price_model, PRICE_MODEL_PATH)
        save_model(duration_model, DURATION_MODEL_PATH)

        test_result = predict_trade_details(price_model, duration_model, "Fish Oil", "Kerala")
        print("Prediction Result:", test_result)

    except Exception as e:
        logging.critical(f"Pipeline failed: {e}")
