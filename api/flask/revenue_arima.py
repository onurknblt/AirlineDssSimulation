from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
import logging

app = Flask(__name__)

def forecast_financials(financial_data):
    try:
        # Veriyi DataFrame'e çevir
        df = pd.DataFrame(financial_data)
        
        # Veriyi kontrol et
        logging.info(f"Veri alındı: {df.head()}")

        # Tarih sütununu datetime tipine çevir ve indekse al
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        if df['date'].isnull().any():
            return {'error': 'Tarihler geçersiz veya eksik.'}

        df.set_index('date', inplace=True)
        df = df.sort_index()

        # Eksik verileri kontrol et ve NaN olanları ortalama ile doldur
        df.fillna(df.mean(), inplace=True)

        # Aylık bazda toplama işlemi yap
        df = df.resample('M').sum()  # Aylık veriler için sum() ile toplama

        # Gelir ve maliyet hesaplamaları
        df['total_revenue'] = df['cargo_revenue'] + df['ticket_sales'] + df['other_revenue']
        df['total_cost'] = df['fuel_cost'] + df['staff_cost'] + df['maintenance_cost'] + df['other_costs']

        # En az 6 ay veri kontrolü
        if len(df) < 6:
            return {'error': 'ARIMA için yeterli veri yok (en az 6 ay verisi gerekli).'}

        # ARIMA Modeli için her iki sütun da sayısal olmalı
        df['total_revenue'] = pd.to_numeric(df['total_revenue'], errors='coerce')
        df['total_cost'] = pd.to_numeric(df['total_cost'], errors='coerce')

        # NaN değerlerin kontrol edilmesi
        if df['total_revenue'].isnull().any() or df['total_cost'].isnull().any():
            return {'error': 'Gelir veya maliyet sütunlarında eksik veri var.'}

        logging.info(f"Veri hazır: {df.head()}")

        # ARIMA Modeli (Gelir & Maliyet)
        revenue_model = ARIMA(df['total_revenue'], order=(5,1,0))  # p=5, d=1, q=0 (örnek)
        cost_model = ARIMA(df['total_cost'], order=(5,1,0))  # p=5, d=1, q=0 (örnek)

        # Modeli eğit
        revenue_fit = revenue_model.fit()
        cost_fit = cost_model.fit()

        # 6 aylık tahmin yap
        revenue_forecast = revenue_fit.forecast(steps=6)
        cost_forecast = cost_fit.forecast(steps=6)

        # Sonuçları döndür
        return {
            'revenue_forecast': revenue_forecast.tolist(),
            'cost_forecast': cost_forecast.tolist()
        }

    except Exception as e:
        logging.error(f"ARIMA tahmini sırasında hata oluştu: {str(e)}")
        return {'error': f'ARIMA tahmini sırasında hata oluştu: {str(e)}'}

@app.route('/forecast', methods=['POST'])
def predict():
    try:
        # JSON verisi alın
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Yetersiz veri veya JSON formatı hatalı'}), 400

        flight_id = data.get('flight_id')
        financial_data = data.get('financial_data')

        if not financial_data or len(financial_data) == 0:
            return jsonify({'error': 'Yetersiz veri'}), 400

        # Tahmin işlemi
        forecast_result = forecast_financials(financial_data)

        if 'error' in forecast_result:
            return jsonify({'flight_id': flight_id, 'error': forecast_result['error']}), 400

        return jsonify({
            'flight_id': flight_id,
            'revenue_forecast': forecast_result['revenue_forecast'],
            'cost_forecast': forecast_result['cost_forecast']
        })

    except Exception as e:
        logging.error(f"Sunucu hatası: {str(e)}")
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)  # Bilgileri log'la
    app.run(debug=True, port=5001)
