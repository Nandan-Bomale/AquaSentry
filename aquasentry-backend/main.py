"""
AquaSentry Backend - FastAPI Server
AI-powered Water Intelligence & Infrastructure Optimisation
MANTHAN 2.0 | Challenge 06
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from pydantic import BaseModel
import uvicorn

app = FastAPI(
    title="AquaSentry API",
    description="AI-powered Water Intelligence & Infrastructure Optimisation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SYNTHETIC DATA GENERATOR ─────────────────────────────────────────────────

ZONES = [
    {"id": "Z-001", "name": "Koramangala", "lat": 12.9279, "lng": 77.6271, "households": 12400, "vulnerability": 0.3, "pipes_km": 48.2},
    {"id": "Z-002", "name": "Whitefield",  "lat": 12.9698, "lng": 77.7499, "households": 18700, "vulnerability": 0.2, "pipes_km": 72.5},
    {"id": "Z-003", "name": "Jayanagar",   "lat": 12.9230, "lng": 77.5922, "households": 9800,  "vulnerability": 0.6, "pipes_km": 38.1},
    {"id": "Z-004", "name": "Yelahanka",   "lat": 13.1004, "lng": 77.5963, "households": 15200, "vulnerability": 0.4, "pipes_km": 61.8},
    {"id": "Z-005", "name": "Hebbal",      "lat": 13.0352, "lng": 77.5952, "households": 11100, "vulnerability": 0.5, "pipes_km": 44.3},
    {"id": "Z-006", "name": "Electronic City", "lat": 12.8458, "lng": 77.6624, "households": 22000, "vulnerability": 0.2, "pipes_km": 88.0},
    {"id": "Z-007", "name": "Rajajinagar", "lat": 12.9867, "lng": 77.5533, "households": 8900, "vulnerability": 0.7, "pipes_km": 35.6},
    {"id": "Z-008", "name": "Marathahalli","lat": 12.9591, "lng": 77.6971, "households": 16500, "vulnerability": 0.3, "pipes_km": 66.0},
]

PIPE_SEGMENTS = [
    {"id": "P-101", "zone_from": "Z-001", "zone_to": "Z-002", "diameter_mm": 300, "material": "Cast Iron", "age_years": 42, "length_km": 3.2, "lat1": 12.9279, "lng1": 77.6271, "lat2": 12.9698, "lng2": 77.7499, "pressure_bar": 2.8},
    {"id": "P-102", "zone_from": "Z-002", "zone_to": "Z-004", "diameter_mm": 250, "material": "HDPE",      "age_years": 8,  "length_km": 4.1, "lat1": 12.9698, "lng1": 77.7499, "lat2": 13.1004, "lng2": 77.5963, "pressure_bar": 3.1},
    {"id": "P-103", "zone_from": "Z-001", "zone_to": "Z-003", "diameter_mm": 200, "material": "Asbestos",  "age_years": 58, "length_km": 2.8, "lat1": 12.9279, "lng1": 77.6271, "lat2": 12.9230, "lng2": 77.5922, "pressure_bar": 2.1},
    {"id": "P-104", "zone_from": "Z-003", "zone_to": "Z-007", "diameter_mm": 150, "material": "Cast Iron", "age_years": 35, "length_km": 2.1, "lat1": 12.9230, "lng1": 77.5922, "lat2": 12.9867, "lng2": 77.5533, "pressure_bar": 1.9},
    {"id": "P-105", "zone_from": "Z-004", "zone_to": "Z-005", "diameter_mm": 350, "material": "Ductile Iron","age_years": 15, "length_km": 5.3, "lat1": 13.1004, "lng1": 77.5963, "lat2": 13.0352, "lng2": 77.5952, "pressure_bar": 3.4},
    {"id": "P-106", "zone_from": "Z-005", "zone_to": "Z-007", "diameter_mm": 200, "material": "Cast Iron", "age_years": 29, "length_km": 3.7, "lat1": 13.0352, "lng1": 77.5952, "lat2": 12.9867, "lng2": 77.5533, "pressure_bar": 2.3},
    {"id": "P-107", "zone_from": "Z-006", "zone_to": "Z-008", "diameter_mm": 400, "material": "HDPE",      "age_years": 5,  "length_km": 6.1, "lat1": 12.8458, "lng1": 77.6624, "lat2": 12.9591, "lng2": 77.6971, "pressure_bar": 3.8},
    {"id": "P-108", "zone_from": "Z-008", "zone_to": "Z-001", "diameter_mm": 300, "material": "PVC",       "age_years": 12, "length_km": 2.9, "lat1": 12.9591, "lng1": 77.6971, "lat2": 12.9279, "lng2": 77.6271, "pressure_bar": 3.0},
]

RESERVOIR = {"lat": 13.0500, "lng": 77.6200, "name": "Hesaraghatta Reservoir", "capacity_ML": 450}

def generate_time_series(zone_id: str, days: int = 90) -> List[Dict]:
    """Generate realistic daily water balance time series"""
    np.random.seed(hash(zone_id) % 10000)
    zone = next(z for z in ZONES if z["id"] == zone_id)
    base_supply = zone["households"] * 150  # 150 L/household/day
    series = []
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days - i)
        # Seasonal variation
        seasonal = 1.0 + 0.1 * math.sin(2 * math.pi * i / 365)
        # Weekly pattern
        dow = date.weekday()
        weekly = 1.05 if dow < 5 else 0.9
        
        supply = base_supply * seasonal * weekly * np.random.uniform(0.95, 1.05)
        
        # Inject anomalies at specific points
        anomaly_flag = False
        loss_pct = zone["vulnerability"] * 0.15 + 0.08  # 8-23% base NRW
        
        if i in [15, 16, 17] and zone_id in ["Z-003", "Z-007"]:  # Leak event
            loss_pct = 0.45
            anomaly_flag = True
        elif i in [40, 41] and zone_id == "Z-005":  # Meter fault
            loss_pct = 0.35
            anomaly_flag = True
        
        billed = supply * (1 - loss_pct) * np.random.uniform(0.97, 1.03)
        
        # Night flow (minimum night flow indicates leaks)
        night_flow_rate = 2.5 if anomaly_flag else 0.8  # L/s during 2-4am
        night_flow_rate += np.random.uniform(-0.2, 0.2)
        
        series.append({
            "date": date.strftime("%Y-%m-%d"),
            "supply_L": round(supply),
            "billed_L": round(billed),
            "unaccounted_L": round(supply - billed),
            "loss_pct": round(loss_pct * 100, 1),
            "night_flow_Lps": round(night_flow_rate, 2),
            "anomaly": anomaly_flag,
            "pressure_bar": round(2.5 + zone["vulnerability"] * 0.5 + np.random.uniform(-0.2, 0.2), 2),
        })
    return series

def run_isolation_forest(zone_id: str) -> Dict:
    """Run Isolation Forest anomaly detection"""
    series = generate_time_series(zone_id, 90)
    df = pd.DataFrame(series)
    
    features = df[["supply_L", "billed_L", "loss_pct", "night_flow_Lps", "pressure_bar"]].values
    scaler = StandardScaler()
    X = scaler.fit_transform(features)
    
    model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
    scores = model.fit_predict(X)
    anomaly_scores = model.score_samples(X)
    
    df["anomaly_predicted"] = (scores == -1)
    df["anomaly_score"] = anomaly_scores
    
    anomalies = df[df["anomaly_predicted"]].to_dict("records")
    
    return {
        "zone_id": zone_id,
        "total_days": len(df),
        "anomalies_detected": int(df["anomaly_predicted"].sum()),
        "anomaly_rate": round(float(df["anomaly_predicted"].mean()) * 100, 1),
        "anomalies": anomalies[:10],
        "time_series": series[-30:],  # Last 30 days
        "model": "Isolation Forest",
        "precision_estimate": 0.82,
        "recall_estimate": 0.79,
    }

def calculate_repair_priority(zone: Dict) -> Dict:
    """Score-based repair prioritisation engine"""
    series = generate_time_series(zone["id"], 30)
    df = pd.DataFrame(series)
    
    avg_loss_pct = df["loss_pct"].mean()
    avg_supply = df["supply_L"].mean()
    daily_loss_L = avg_supply * avg_loss_pct / 100
    
    # Multi-factor scoring
    # 1. Volume loss score (0-25)
    vol_score = min(25, daily_loss_L / 5000 * 25)
    
    # 2. Infrastructure risk score (0-25)
    pipe = next((p for p in PIPE_SEGMENTS if p["zone_from"] == zone["id"] or p["zone_to"] == zone["id"]), None)
    age_risk = min(1.0, (pipe["age_years"] if pipe else 20) / 60)
    material_risk = {"Asbestos": 1.0, "Cast Iron": 0.75, "Ductile Iron": 0.5, "PVC": 0.3, "HDPE": 0.1}.get(pipe["material"] if pipe else "Cast Iron", 0.5)
    infra_score = (age_risk * 0.6 + material_risk * 0.4) * 25
    
    # 3. Community vulnerability (0-20)
    vuln_score = zone["vulnerability"] * 20
    
    # 4. Anomaly confidence (0-15)
    anomaly_score = 15 if avg_loss_pct > 20 else (avg_loss_pct / 20) * 15
    
    # 5. Response urgency (0-15)
    urgency = 15 if avg_loss_pct > 30 else 8 if avg_loss_pct > 20 else 5
    
    total_score = vol_score + infra_score + vuln_score + anomaly_score + urgency
    
    # Classify loss type
    if avg_loss_pct > 25:
        loss_type = "Physical Leak"
        loss_confidence = 0.78
    elif avg_loss_pct > 15:
        loss_type = "Mixed (Leak + Meter Fault)"
        loss_confidence = 0.65
    else:
        loss_type = "Meter Inaccuracy / Data Gap"
        loss_confidence = 0.72
    
    # Financial impact
    tariff_per_KL = 8.50  # INR per kilolitre
    daily_revenue_loss = daily_loss_L / 1000 * tariff_per_KL
    annual_revenue_loss = daily_revenue_loss * 365
    repair_cost = random.uniform(50000, 400000)
    payback_days = repair_cost / daily_revenue_loss if daily_revenue_loss > 0 else 999
    
    priority = "CRITICAL" if total_score > 65 else "HIGH" if total_score > 50 else "MEDIUM" if total_score > 35 else "LOW"
    
    return {
        "zone_id": zone["id"],
        "zone_name": zone["name"],
        "priority": priority,
        "total_score": round(total_score, 1),
        "scores": {
            "volume_loss": round(vol_score, 1),
            "infrastructure_risk": round(infra_score, 1),
            "community_vulnerability": round(vuln_score, 1),
            "anomaly_confidence": round(anomaly_score, 1),
            "urgency": round(urgency, 1),
        },
        "loss_type": loss_type,
        "loss_confidence": loss_confidence,
        "avg_loss_pct": round(avg_loss_pct, 1),
        "daily_loss_L": round(daily_loss_L),
        "daily_revenue_loss_INR": round(daily_revenue_loss),
        "annual_revenue_loss_INR": round(annual_revenue_loss),
        "repair_cost_estimate_INR": round(repair_cost),
        "payback_days": round(payback_days),
        "recommended_action": f"Inspect pipe segment in {zone['name']} - {loss_type}",
        "households_affected": zone["households"],
        "vulnerability_level": "High" if zone["vulnerability"] > 0.5 else "Medium" if zone["vulnerability"] > 0.3 else "Low",
        "pipe_age_years": pipe["age_years"] if pipe else None,
        "pipe_material": pipe["material"] if pipe else None,
    }

# ─── API ENDPOINTS ────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0", "platform": "AquaSentry"}

@app.get("/api/dashboard/kpis")
def get_dashboard_kpis():
    """Main dashboard KPIs"""
    total_supply = sum(z["households"] for z in ZONES) * 150 * 1000  # L/day
    total_billed = total_supply * 0.776  # 77.6% metering efficiency
    nrw = total_supply - total_billed
    
    return {
        "system_input_ML": round(total_supply / 1_000_000, 2),
        "billed_ML": round(total_billed / 1_000_000, 2),
        "nrw_ML": round(nrw / 1_000_000, 2),
        "nrw_pct": 22.4,
        "open_investigations": 8,
        "critical_zones": 2,
        "alerts_today": 14,
        "water_recovered_ML_month": 12.7,
        "revenue_at_risk_lakh_INR": round(nrw / 1_000_000 * 8.5 * 365 / 100000, 1),
        "mean_response_hours": 18.4,
        "meter_completeness_pct": 91.2,
        "zones_total": len(ZONES),
        "pipe_network_km": sum(p["pipes_km"] for p in ZONES),
        "avg_pressure_bar": 2.78,
        "last_updated": datetime.now().isoformat(),
    }

@app.get("/api/zones")
def get_zones():
    """Zone data with live metrics"""
    result = []
    for zone in ZONES:
        series = generate_time_series(zone["id"], 30)
        df = pd.DataFrame(series)
        avg_loss = df["loss_pct"].mean()
        
        result.append({
            **zone,
            "avg_loss_pct": round(avg_loss, 1),
            "status": "CRITICAL" if avg_loss > 25 else "WARNING" if avg_loss > 15 else "NORMAL",
            "daily_supply_L": round(zone["households"] * 150),
            "daily_loss_L": round(zone["households"] * 150 * avg_loss / 100),
            "open_tickets": random.randint(0, 4),
            "last_inspection": (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d"),
        })
    return result

@app.get("/api/pipes")
def get_pipes():
    """Pipe segment data with status"""
    result = []
    for pipe in PIPE_SEGMENTS:
        # Compute risk
        age_factor = min(1.0, pipe["age_years"] / 60)
        mat_risk = {"Asbestos": 1.0, "Cast Iron": 0.75, "Ductile Iron": 0.5, "PVC": 0.3, "HDPE": 0.1}.get(pipe["material"], 0.5)
        risk_score = (age_factor * 0.6 + mat_risk * 0.4) * 100
        flow_rate = round(pipe["diameter_mm"] / 1000 * math.pi * (pipe["diameter_mm"] / 2000) ** 2 * pipe["pressure_bar"] * 0.6 * 1000, 1)
        
        result.append({
            **pipe,
            "risk_score": round(risk_score, 1),
            "risk_level": "HIGH" if risk_score > 65 else "MEDIUM" if risk_score > 40 else "LOW",
            "flow_rate_Lps": abs(flow_rate) + random.uniform(-0.5, 0.5),
            "last_maintenance": (datetime.now() - timedelta(days=random.randint(30, 500))).strftime("%Y-%m-%d"),
            "has_leak_signal": risk_score > 60 and random.random() > 0.4,
        })
    return result

@app.get("/api/zones/{zone_id}/timeseries")
def get_zone_timeseries(zone_id: str, days: int = 90):
    return generate_time_series(zone_id, days)

@app.get("/api/zones/{zone_id}/anomalies")
def get_zone_anomalies(zone_id: str):
    return run_isolation_forest(zone_id)

@app.get("/api/priority-list")
def get_priority_list():
    """AI-ranked repair priority worklist"""
    priorities = [calculate_repair_priority(z) for z in ZONES]
    priorities.sort(key=lambda x: x["total_score"], reverse=True)
    for i, p in enumerate(priorities):
        p["rank"] = i + 1
        p["investigation_id"] = f"INV-{2024100 + i}"
        p["assigned_team"] = f"Team {chr(65+i)}"
        p["created_at"] = (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat()
    return priorities

@app.get("/api/water-balance")
def get_water_balance():
    """System-level water balance (Sankey data)"""
    system_input = 100000000  # 100 ML in litres
    return {
        "system_input_L": system_input,
        "authorised_consumption_L": round(system_input * 0.70),
        "billed_authorised_L": round(system_input * 0.656),
        "unbilled_authorised_L": round(system_input * 0.044),
        "water_losses_L": round(system_input * 0.30),
        "real_losses_L": round(system_input * 0.18),
        "apparent_losses_L": round(system_input * 0.12),
        "physical_leakage_L": round(system_input * 0.158),
        "meter_errors_L": round(system_input * 0.072),
        "unauthorised_use_L": round(system_input * 0.048),
        "storage_overflow_L": round(system_input * 0.022),
        "nrw_pct": 22.4,
        "ili": 2.3,  # Infrastructure Leakage Index
        "date": datetime.now().strftime("%Y-%m-%d"),
    }

@app.get("/api/alerts")
def get_alerts():
    """Active alerts"""
    alerts = [
        {"id": "ALT-001", "zone": "Jayanagar", "zone_id": "Z-003", "type": "LEAK_SIGNAL", "severity": "CRITICAL", "message": "Night flow 3.1× above baseline — possible main break", "timestamp": (datetime.now() - timedelta(minutes=12)).isoformat(), "loss_rate_Lpm": 480},
        {"id": "ALT-002", "zone": "Rajajinagar", "zone_id": "Z-007", "type": "PRESSURE_DROP", "severity": "HIGH", "message": "Pressure dropped 0.8 bar in 2 hours — investigate service zone", "timestamp": (datetime.now() - timedelta(minutes=35)).isoformat(), "loss_rate_Lpm": 220},
        {"id": "ALT-003", "zone": "Hebbal", "zone_id": "Z-005", "type": "METER_FAULT", "severity": "HIGH", "message": "15 meters reporting zero — billing gap 41,000 L today", "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(), "loss_rate_Lpm": None},
        {"id": "ALT-004", "zone": "Yelahanka", "zone_id": "Z-004", "type": "NRW_SPIKE", "severity": "MEDIUM", "message": "NRW exceeded 25% threshold for 3 consecutive days", "timestamp": (datetime.now() - timedelta(hours=6)).isoformat(), "loss_rate_Lpm": 150},
        {"id": "ALT-005", "zone": "Koramangala", "zone_id": "Z-001", "type": "DATA_QUALITY", "severity": "LOW", "message": "14 meter reads delayed >48 hours — review data feed", "timestamp": (datetime.now() - timedelta(hours=18)).isoformat(), "loss_rate_Lpm": None},
        {"id": "ALT-006", "zone": "Marathahalli", "zone_id": "Z-008", "type": "COMPLAINT_CLUSTER", "severity": "MEDIUM", "message": "5 customer complaints in 2km radius — possible service leak", "timestamp": (datetime.now() - timedelta(hours=24)).isoformat(), "loss_rate_Lpm": 90},
    ]
    return alerts

@app.get("/api/impact-analytics")
def get_impact_analytics():
    """Impact tracking — water recovered, savings, KPIs"""
    months = []
    base_nrw = 28.0
    for i in range(12):
        date = datetime.now() - timedelta(days=330 - i*30)
        nrw = base_nrw - i * 0.48 + random.uniform(-0.5, 0.5)
        supply_ML = 95 + random.uniform(-2, 2)
        water_recovered = i * 1.2 + random.uniform(-0.3, 0.5)
        months.append({
            "month": date.strftime("%b %Y"),
            "nrw_pct": round(nrw, 1),
            "supply_ML": round(supply_ML, 1),
            "water_recovered_ML": round(water_recovered, 1),
            "revenue_saved_lakh": round(water_recovered * 8.5 * 365 / 12 / 100000, 2),
            "interventions": random.randint(2, 8),
            "mean_response_hours": round(42 - i * 2.5 + random.uniform(-2, 2), 1),
            "complaints_resolved": random.randint(10, 45),
        })
    return {
        "monthly": months,
        "total_water_recovered_ML": 12.7,
        "total_revenue_saved_lakh": 39.4,
        "total_interventions": 47,
        "nrw_reduction_pct_points": 5.6,
        "avg_response_time_improvement_hrs": 23.5,
        "vulnerable_zones_addressed": 3,
    }

@app.get("/api/meter-health")
def get_meter_health():
    """Meter data quality and health metrics"""
    result = []
    for zone in ZONES:
        total_meters = zone["households"]
        active = round(total_meters * random.uniform(0.85, 0.97))
        faulty = round((total_meters - active) * random.uniform(0.3, 0.6))
        delayed = round((total_meters - active - faulty) * random.uniform(0.4, 0.7))
        no_read = total_meters - active - faulty - delayed
        
        result.append({
            "zone_id": zone["id"],
            "zone_name": zone["name"],
            "total_meters": total_meters,
            "active_meters": active,
            "faulty_meters": faulty,
            "delayed_reads": delayed,
            "no_read_30d": max(0, no_read),
            "completeness_pct": round(active / total_meters * 100, 1),
            "avg_read_lag_hours": round(random.uniform(2, 48), 1),
        })
    return result

@app.get("/api/flow-rates/realtime")
def get_realtime_flow():
    """Simulated real-time flow rates (can be polled)"""
    result = []
    for pipe in PIPE_SEGMENTS:
        base_flow = pipe["diameter_mm"] * 0.08
        anomaly = pipe["id"] in ["P-103", "P-104"]
        flow = base_flow * (1.4 if anomaly else 1.0) + random.uniform(-2, 2)
        result.append({
            "pipe_id": pipe["id"],
            "flow_Lps": round(max(0, flow), 2),
            "pressure_bar": round(pipe["pressure_bar"] + random.uniform(-0.1, 0.1), 2),
            "temperature_c": round(22 + random.uniform(-2, 2), 1),
            "timestamp": datetime.now().isoformat(),
            "anomaly_flag": anomaly,
        })
    return result

@app.get("/api/simulation/diurnal")
def get_hydraulic_simulation(target_night_pressure: float = 1.8, replaced_km: float = 8.5, ami_coverage_pct: float = 65.0):
    """24-hour diurnal pressure and leak curve simulation using FAVAD equations"""
    hours_data = []
    for h in range(24):
        is_night = 1 <= h <= 5
        is_peak = (6 <= h <= 9) or (18 <= h <= 21)
        base_pressure = 3.4 if is_night else (2.1 if is_peak else 2.7)
        base_leak = 18.5 * math.pow(base_pressure / 2.5, 1.15)
        
        sim_pressure = target_night_pressure if is_night else base_pressure
        sim_leak = base_leak * math.pow(target_night_pressure / base_pressure, 1.15) if is_night else base_leak
        sim_leak *= (1.0 - (replaced_km / 50.0) * 0.45)
        sim_leak *= (1.0 - (ami_coverage_pct / 100.0) * 0.22)
        
        hours_data.append({
            "hour": f"{h:02d}:00",
            "baseline_pressure": round(base_pressure, 2),
            "simulated_pressure": round(sim_pressure, 2),
            "baseline_leak_lps": round(base_leak, 1),
            "simulated_leak_lps": round(sim_leak, 1),
            "water_saved_lps": round(max(0.0, base_leak - sim_leak), 1),
        })
    return {"simulation": hours_data}

@app.get("/api/water-balance/iwa")
def get_iwa_water_balance(siv: float = 100.0, billed_metered: float = 65.6):
    """IWA / AWWA M36 standard water balance decomposition"""
    billed_unmetered = 2.0
    unbilled_metered = 1.4
    unbilled_unmetered = 3.0
    meter_errors = 7.2
    theft = 4.8
    storage_overflow = 1.2
    
    auth_consumption = billed_metered + billed_unmetered + unbilled_metered + unbilled_unmetered
    revenue_water = billed_metered + billed_unmetered
    nrw = siv - revenue_water
    apparent_loss = meter_errors + theft
    real_loss = max(0.0, siv - auth_consumption - apparent_loss)
    mains_leakage = max(0.0, real_loss - storage_overflow)
    
    return {
        "siv_mld": siv,
        "revenue_water_mld": round(revenue_water, 2),
        "non_revenue_water_mld": round(nrw, 2),
        "nrw_pct": round((nrw / siv) * 100.0, 1),
        "authorized_consumption_mld": round(auth_consumption, 2),
        "apparent_losses_mld": round(apparent_loss, 2),
        "real_losses_mld": round(real_loss, 2),
        "mains_leakage_mld": round(mains_leakage, 2),
        "ili_index": round(real_loss / 4.2, 2),
    }

# WebSocket for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Push real-time flow + alert data every 2 seconds
            data = {
                "type": "flow_update",
                "timestamp": datetime.now().isoformat(),
                "flow_rates": get_realtime_flow(),
                "nrw_live": round(22.4 + random.uniform(-0.5, 0.5), 1),
                "active_alerts": len(get_alerts()),
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
