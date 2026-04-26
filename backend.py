from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import math

app = Flask(__name__)
CORS(app)

# ===== Complete Villages Database =====
VILLAGES = [
    # Sindh - High Risk Areas
    {"id": 1, "name": "Qadirpur", "district": "Nowshero Feroze", "tehsil": "Qadirpur", 
     "latitude": 26.7856, "longitude": 68.0139, "elevation": 45, "population": 45000},
    {"id": 2, "name": "Sujawal", "district": "Sujawal", "tehsil": "Sujawal",
     "latitude": 24.6056, "longitude": 68.0781, "elevation": 12, "population": 35000},
    {"id": 3, "name": "Mehar", "district": "Dadu", "tehsil": "Mehar",
     "latitude": 27.1833, "longitude": 67.8167, "elevation": 38, "population": 55000},
    {"id": 4, "name": "Kashmore", "district": "Kashmore", "tehsil": "Kashmore",
     "latitude": 28.4333, "longitude": 69.5833, "elevation": 52, "population": 48000},
    {"id": 5, "name": "Ghotki", "district": "Ghotki", "tehsil": "Ghotki",
     "latitude": 28.0167, "longitude": 69.3167, "elevation": 48, "population": 42000},
    {"id": 6, "name": "Sukkur", "district": "Sukkur", "tehsil": "Sukkur City",
     "latitude": 27.7167, "longitude": 68.8667, "elevation": 55, "population": 500000},
    {"id": 7, "name": "Larkana", "district": "Larkana", "tehsil": "Larkana",
     "latitude": 27.5667, "longitude": 68.2167, "elevation": 42, "population": 490000},
    {"id": 8, "name": "Hyderabad", "district": "Hyderabad", "tehsil": "Hyderabad City",
     "latitude": 25.3667, "longitude": 68.3667, "elevation": 13, "population": 1800000},
    {"id": 9, "name": "Karachi", "district": "Karachi Central", "tehsil": "Karachi",
     "latitude": 24.8607, "longitude": 67.0011, "elevation": 8, "population": 16000000},
    {"id": 10, "name": "Multan", "district": "Multan", "tehsil": "Multan City",
     "latitude": 30.1575, "longitude": 71.5249, "elevation": 122, "population": 1900000},
    {"id": 11, "name": "Rajanpur", "district": "Rajanpur", "tehsil": "Rajanpur",
     "latitude": 29.1042, "longitude": 70.3297, "elevation": 85, "population": 98000},
    {"id": 12, "name": "Dera Ghazi Khan", "district": "Dera Ghazi Khan", "tehsil": "DG Khan",
     "latitude": 30.0561, "longitude": 70.6369, "elevation": 120, "population": 650000},
    {"id": 13, "name": "Muzaffargarh", "district": "Muzaffargarh", "tehsil": "Muzaffargarh",
     "latitude": 30.0705, "longitude": 71.1938, "elevation": 115, "population": 210000},
    {"id": 14, "name": "Rahim Yar Khan", "district": "Rahim Yar Khan", "tehsil": "Rahim Yar Khan",
     "latitude": 28.4202, "longitude": 70.2957, "elevation": 78, "population": 450000},
    {"id": 15, "name": "Bahawalpur", "district": "Bahawalpur", "tehsil": "Bahawalpur",
     "latitude": 29.3979, "longitude": 71.6833, "elevation": 110, "population": 800000},
    # Punjab - Medium Risk
    {"id": 16, "name": "Jhang", "district": "Jhang", "tehsil": "Jhang",
     "latitude": 31.2667, "longitude": 72.3167, "elevation": 157, "population": 414000},
    {"id": 17, "name": "Chiniot", "district": "Chiniot", "tehsil": "Chiniot",
     "latitude": 31.7167, "longitude": 72.9833, "elevation": 170, "population": 278000},
    {"id": 18, "name": "Layyah", "district": "Layyah", "tehsil": "Layyah",
     "latitude": 30.9667, "longitude": 70.9333, "elevation": 143, "population": 126000},
    # KPK - Low Risk
    {"id": 19, "name": "Peshawar", "district": "Peshawar", "tehsil": "Peshawar City",
     "latitude": 34.015, "longitude": 71.5806, "elevation": 331, "population": 1970000},
    {"id": 20, "name": "Mardan", "district": "Mardan", "tehsil": "Mardan",
     "latitude": 34.1983, "longitude": 72.04, "elevation": 311, "population": 358000},
]

# River data with history
RIVER_DATA = {
    "river_name": "Indus River",
    "station_name": "Kotri Barrage",
    "water_level": 7.2,
    "danger_level": 8.0,
    "flow_rate": 12500,
    "timestamp": datetime.now().isoformat()
}

RIVER_HISTORY = [5.2, 5.5, 5.8, 6.1, 6.4, 6.7, 7.0, 7.2]

def calculate_risk_score(village, river_data, rainfall_mm):
    """Advanced risk calculation algorithm"""
    risk_score = 0
    factors = []
    
    # Factor 1: Elevation (40% weight)
    elevation = village.get('elevation', 100)
    if elevation < 20:
        risk_score += 40
        factors.append("Critical low elevation zone")
    elif elevation < 50:
        risk_score += 25
        factors.append("Low elevation area")
    elif elevation < 100:
        risk_score += 10
        factors.append("Medium elevation area")
    else:
        factors.append("Safe elevation area")
    
    # Factor 2: River water level (35% weight)
    water_level = river_data.get('water_level', 5)
    danger_level = river_data.get('danger_level', 8)
    water_ratio = water_level / danger_level if danger_level > 0 else 0
    
    if water_ratio > 0.9:
        risk_score += 35
        factors.append(f"River at critical level: {water_level:.1f}/{danger_level:.1f}m")
    elif water_ratio > 0.75:
        risk_score += 25
        factors.append(f"River elevated: {water_level:.1f}/{danger_level:.1f}m")
    elif water_ratio > 0.6:
        risk_score += 15
        factors.append(f"River above normal")
    else:
        factors.append(f"River normal")
    
    # Factor 3: Rainfall (25% weight)
    if rainfall_mm > 150:
        risk_score += 25
        factors.append(f"Extreme rainfall: {rainfall_mm:.0f}mm")
    elif rainfall_mm > 80:
        risk_score += 18
        factors.append(f"Heavy rainfall: {rainfall_mm:.0f}mm")
    elif rainfall_mm > 40:
        risk_score += 10
        factors.append(f"Moderate rainfall: {rainfall_mm:.0f}mm")
    elif rainfall_mm > 20:
        risk_score += 5
        factors.append(f"Light rainfall: {rainfall_mm:.0f}mm")
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = "CRITICAL"
        confidence = 0.85 + (risk_score - 70) / 100
        suggestion = "IMMEDIATE EVACUATION REQUIRED"
    elif risk_score >= 50:
        risk_level = "HIGH"
        confidence = 0.70 + (risk_score - 50) / 70
        suggestion = "Prepare for possible evacuation"
    elif risk_score >= 30:
        risk_level = "MEDIUM"
        confidence = 0.55 + (risk_score - 30) / 50
        suggestion = "Stay alert and monitor updates"
    else:
        risk_level = "LOW"
        confidence = 0.70 - (30 - risk_score) / 100
        suggestion = "No immediate threat"
    
    confidence = min(0.98, max(0.30, confidence))
    
    return {
        "risk_level": risk_level,
        "confidence": round(confidence, 2),
        "risk_score": risk_score,
        "factors": factors,
        "suggestion": suggestion
    }

def generate_rainfall():
    """Generate realistic rainfall data"""
    base = random.uniform(5, 40)
    # 30% chance of heavy rainfall
    if random.random() < 0.3:
        base += random.uniform(50, 150)
    return round(base, 1)

# ===== API Endpoints =====

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    })

@app.route('/api/villages', methods=['GET'])
def get_villages():
    """Get all villages with current risk levels"""
    river_data = RIVER_DATA.copy()
    villages_with_risk = []
    
    for village in VILLAGES:
        rainfall = generate_rainfall()
        risk = calculate_risk_score(village, river_data, rainfall)
        
        villages_with_risk.append({
            "id": village["id"],
            "name": village["name"],
            "district": village["district"],
            "tehsil": village.get("tehsil", ""),
            "latitude": village["latitude"],
            "longitude": village["longitude"],
            "elevation": village["elevation"],
            "population": village.get("population", 0),
            "risk_level": risk["risk_level"],
            "confidence": risk["confidence"],
            "risk_score": risk["risk_score"],
            "rainfall_24h": rainfall,
            "suggestion": risk["suggestion"]
        })
    
    # Sort by risk severity
    risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    villages_with_risk.sort(key=lambda x: risk_order.get(x["risk_level"], 4))
    
    counts = {
        "critical": sum(1 for v in villages_with_risk if v["risk_level"] == "CRITICAL"),
        "high": sum(1 for v in villages_with_risk if v["risk_level"] == "HIGH"),
        "medium": sum(1 for v in villages_with_risk if v["risk_level"] == "MEDIUM"),
        "low": sum(1 for v in villages_with_risk if v["risk_level"] == "LOW"),
        "total": len(villages_with_risk)
    }
    
    return jsonify({
        "villages": villages_with_risk,
        "summary": counts,
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/villages/<int:village_id>', methods=['GET'])
def get_village(village_id):
    """Get specific village details"""
    village = next((v for v in VILLAGES if v["id"] == village_id), None)
    if not village:
        return jsonify({"error": "Village not found"}), 404
    
    river_data = RIVER_DATA.copy()
    rainfall = generate_rainfall()
    risk = calculate_risk_score(village, river_data, rainfall)
    
    return jsonify({
        "id": village["id"],
        "name": village["name"],
        "district": village["district"],
        "tehsil": village.get("tehsil", ""),
        "latitude": village["latitude"],
        "longitude": village["longitude"],
        "elevation": village["elevation"],
        "population": village.get("population", 0),
        "risk_level": risk["risk_level"],
        "confidence": risk["confidence"],
        "risk_score": risk["risk_score"],
        "factors": risk["factors"],
        "rainfall_24h": rainfall,
        "river_water_level": river_data["water_level"],
        "river_danger_level": river_data["danger_level"],
        "suggestion": risk["suggestion"],
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/river', methods=['GET'])
def get_river_status():
    """Get current river status with history"""
    # Simulate slight variations
    current_level = RIVER_DATA["water_level"]
    variation = random.uniform(-0.2, 0.2)
    new_level = round(current_level + variation, 1)
    new_level = max(4.0, min(9.0, new_level))
    
    RIVER_DATA["water_level"] = new_level
    RIVER_DATA["timestamp"] = datetime.now().isoformat()
    
    RIVER_HISTORY.append(new_level)
    if len(RIVER_HISTORY) > 30:
        RIVER_HISTORY.pop(0)
    
    if new_level >= 7.5:
        status = "CRITICAL"
    elif new_level >= 6.5:
        status = "DANGER"
    elif new_level >= 5.5:
        status = "ELEVATED"
    else:
        status = "NORMAL"
    
    return jsonify({
        "river_name": RIVER_DATA["river_name"],
        "station_name": RIVER_DATA["station_name"],
        "water_level": new_level,
        "danger_level": RIVER_DATA["danger_level"],
        "flow_rate": RIVER_DATA["flow_rate"],
        "status": status,
        "history": RIVER_HISTORY[-8:],
        "timestamp": RIVER_DATA["timestamp"]
    })

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get active flood alerts"""
    river_data = RIVER_DATA.copy()
    alerts = []
    
    for village in VILLAGES:
        rainfall = generate_rainfall()
        risk = calculate_risk_score(village, river_data, rainfall)
        
        if risk["risk_level"] in ["CRITICAL", "HIGH"]:
            alerts.append({
                "id": village["id"],
                "village_name": village["name"],
                "district": village["district"],
                "risk_level": risk["risk_level"],
                "message": f"Flood alert for {village['name']}: {risk['suggestion']}",
                "time": datetime.now().isoformat()
            })
    
    return jsonify({
        "alerts": alerts,
        "total_alerts": len(alerts),
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics"""
    river_data = RIVER_DATA.copy()
    
    critical_areas = []
    for village in VILLAGES:
        rainfall = generate_rainfall()
        risk = calculate_risk_score(village, river_data, rainfall)
        if risk["risk_level"] == "CRITICAL":
            critical_areas.append(village["name"])
    
    return jsonify({
        "total_areas_monitored": len(VILLAGES),
        "active_alerts": len([v for v in VILLAGES if calculate_risk_score(v, river_data, generate_rainfall())["risk_level"] in ["CRITICAL", "HIGH"]]),
        "critical_areas": critical_areas,
        "river_status": "ELEVATED" if river_data["water_level"] > 6 else "NORMAL",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🌊 FLOODWATCH PK - Backend Server")
    print("=" * 60)
    print(f"📍 Server: http://localhost:5000")
    print(f"📡 API: http://localhost:5000/api/villages")
    print(f"📊 Stats: http://localhost:5000/api/stats")
    print("=" * 60)
    print("Press CTRL+C to stop")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)