from flask import Flask, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error
from xgboost import XGBRegressor

app = Flask(__name__)

@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.json
    months = data['months']
    feedback = pd.DataFrame(data['feedback'])
    loyalty_programs = pd.DataFrame(data['loyaltyPrograms'])
    customers = pd.DataFrame(data['customers'])

    # Veri ön işleme
    feedback['sentimentScore'] = feedback['sentimentScore'].astype(float)
    feedback['rating'] = feedback['rating'].astype(float)
    loyalty_programs['total_points'] = loyalty_programs['total_points'].astype(float)

    # Müşteri memnuniyeti modeli
    X_satisfaction = feedback[['sentimentScore', 'rating']]
    y_satisfaction = feedback['rating']  # Müşteri memnuniyeti için rating kullanılıyor

    # Modeli eğitmeden önce veriyi eğitim ve test setlerine ayır
    X_train, X_test, y_train, y_test = train_test_split(X_satisfaction, y_satisfaction, test_size=0.2, random_state=42)

    # Hiperparametre optimizasyonu
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [10, 20, 30]
    }

    grid_search = GridSearchCV(RandomForestRegressor(random_state=42), param_grid, cv=5)
    grid_search.fit(X_train, y_train)

    # En iyi model
    model_satisfaction = grid_search.best_estimator_

    # Sadakat modeli
    X_loyalty = feedback[['sentimentScore', 'rating']]
    y_loyalty = loyalty_programs['total_points']  # Sadakat için total_points kullanılıyor

    model_loyalty = XGBRegressor(n_estimators=200, max_depth=10, random_state=42)
    model_loyalty.fit(X_loyalty, y_loyalty)

    # Gelecekteki tahminler
    future_sentiment = np.linspace(-1, 1, months) + np.random.normal(0, 0.2, months)  # Trend + gürültü
    future_ratings = np.linspace(1, 5, months) + np.random.normal(0, 0.2, months)    # Trend + gürültü
    future_X = pd.DataFrame({'sentimentScore': future_sentiment, 'rating': future_ratings})

    # Müşteri memnuniyeti tahminleri
    predicted_satisfaction = model_satisfaction.predict(future_X)

    # Sadakat tahminleri
    predicted_loyalty = model_loyalty.predict(future_X)

    # JSON formatında sonuç döndür
    forecast = [{"month": i + 1, "predicted_satisfaction": round(float(predicted_satisfaction[i]), 1)} for i in range(months)]
    loyalty_forecast = [{"month": i + 1, "predicted_loyalty": round(float(predicted_loyalty[i]), 1)} for i in range(months)]

    return jsonify({
        "forecast": forecast,
        "loyalty_forecast": loyalty_forecast
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5002, debug=False)