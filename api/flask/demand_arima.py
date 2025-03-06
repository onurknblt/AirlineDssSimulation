from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
import logging

app = Flask(__name__)


def forecast_demand(sales_data):
    try:
        df = pd.DataFrame(sales_data)

        # Tarih formatına çevir ve sırala
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        df.set_index('sale_date', inplace=True)
        df = df.sort_index()

        # **Aylık** bazda veriyi yeniden düzenle
        df = df.resample('ME').sum()

        # Eğer yeterli veri yoksa hata döndür
        if len(df) < 6:
            return {'error': 'ARIMA için yeterli veri yok (en az 6 ay verisi gerekli).'}

        # ARIMA modelini tanımla (Aylık tahmin için)
        model = ARIMA(df['number_of_tickets'], order=(5,1,0))  # (p,d,q) parametreleri
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=6)  # **6 Aylık tahmin**

        return {'forecast': forecast.tolist()}
    
    except Exception as e:
        logging.error(f"ARIMA tahmini sırasında hata oluştu: {str(e)}")
        return {'error': f'ARIMA tahmini sırasında hata oluştu: {str(e)}'}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Yetersiz veri veya JSON formatı hatalı'}), 400

        flight_id = data.get('flight_id')
        sales_data = data.get('sales_data')

        if not sales_data or len(sales_data) == 0:
            return jsonify({'error': 'Yetersiz veri'}), 400

        forecast_result = forecast_demand(sales_data)

        if 'error' in forecast_result:
            return jsonify({'flight_id': flight_id, 'error': forecast_result['error']}), 400

        return jsonify({'flight_id': flight_id, 'forecast': forecast_result['forecast']})
    
    except Exception as e:
        logging.error(f"Sunucu hatası: {str(e)}")
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
