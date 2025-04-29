from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
import os
import math
import json
from datetime import datetime, timedelta
import random
import sys

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración para producción
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["JSON_SORT_KEYS"] = False

# Constantes para cálculos astrológicos
SIGNS = [
    {"name": "ARIES", "start": 354, "length": 36, "symbol": "♈", "color": "#FFE5E5"},
    {"name": "TAURUS", "start": 30, "length": 30, "symbol": "♉", "color": "#E5FFE5"},
    {"name": "GEMINI", "start": 60, "length": 30, "symbol": "♊", "color": "#FFFFE5"},
    {"name": "CANCER", "start": 90, "length": 30, "symbol": "♋", "color": "#E5FFFF"},
    {"name": "LEO", "start": 120, "length": 30, "symbol": "♌", "color": "#FFE5E5"},
    {"name": "VIRGO", "start": 150, "length": 36, "symbol": "♍", "color": "#E5FFE5"},
    {"name": "LIBRA", "start": 186, "length": 24, "symbol": "♎", "color": "#FFFFE5"},
    {"name": "SCORPIO", "start": 210, "length": 30, "symbol": "♏", "color": "#E5FFFF"},
    {"name": "OPHIUCHUS", "start": 240, "length": 12, "symbol": "⛎", "color": "#FFFFE5"},
    {"name": "SAGITTARIUS", "start": 252, "length": 18, "symbol": "♐", "color": "#FFE5E5"},
    {"name": "CAPRICORN", "start": 270, "length": 36, "symbol": "♑", "color": "#E5FFE5"},
    {"name": "AQUARIUS", "start": 306, "length": 18, "symbol": "♒", "color": "#FFFFE5"},
    {"name": "PEGASUS", "start": 324, "length": 6, "symbol": "∩", "color": "#E5FFFF"},
    {"name": "PISCES", "start": 330, "length": 24, "symbol": "♓", "color": "#E5FFFF"}
]

ASPECTS = {
    "CONJUNCTION": {"angle": 0, "orb": 2, "color": "#000080", "name": "Armónico Relevante"},
    "SEXTILE": {"angle": 60, "orb": 2, "color": "#000080", "name": "Armónico Relevante"},
    "SQUARE": {"angle": 90, "orb": 2, "color": "#FF0000", "name": "Inarmónico Relevante"},
    "TRINE": {"angle": 120, "orb": 2, "color": "#000080", "name": "Armónico Relevante"},
    "OPPOSITION": {"angle": 180, "orb": 2, "color": "#000080", "name": "Armónico Relevante"}
}

# Constantes para Fardarias y Relevos Zodiacales
PLANET_DATA = {
    'SOL': {'numero': 1},
    'LUNA': {'numero': 6},
    'MERCURIO': {'numero': 4},
    'VENUS': {'numero': 3},
    'MARTE': {'numero': 5},
    'JÚPITER': {'numero': 2},
    'SATURNO': {'numero': 7}
}

PLANET_ORDER = {
    'seco': ['SOL', 'MARTE', 'JÚPITER', 'SATURNO', 'LUNA', 'MERCURIO', 'VENUS'],
    'humedo': ['LUNA', 'MERCURIO', 'VENUS', 'SOL', 'MARTE', 'JÚPITER', 'SATURNO']
}

DURACION_POR_NIVEL = {
    'virgo': 4, 'libra': 3, 'escorpio': 5, 'ofiuco': 7, 'sagitario': 2,
    'capricornio': 1, 'acuario': 6, 'piscis': 2, 'aries': 5, 'tauro': 3,
    'geminis': 4, 'cancer': 6, 'leo': 1
}

SIGNOS = {
    'virgo': {'planeta': 'MERCURIO', 'años': 4},
    'libra': {'planeta': 'VENUS', 'años': 3},
    'escorpio': {'planeta': 'MARTE', 'años': 5},
    'ofiuco': {'planeta': 'SATURNO', 'años': 7},
    'sagitario': {'planeta': 'JÚPITER', 'años': 2},
    'capricornio': {'planeta': 'SOL', 'años': 1},
    'acuario': {'planeta': 'LUNA', 'años': 6},
    'piscis': {'planeta': 'JÚPITER', 'años': 2},
    'aries': {'planeta': 'MARTE', 'años': 5},
    'tauro': {'planeta': 'VENUS', 'años': 3},
    'geminis': {'planeta': 'MERCURIO', 'años': 4},
    'cancer': {'planeta': 'LUNA', 'años': 6},
    'leo': {'planeta': 'SOL', 'años': 1}
}

DURACIONES = {
    'AÑO': 364,
    'MES': 28,
    'SEMANA': 7,
    'DIA': 1
}

# Simulación de datos de planetas para fines de demostración
def mock_calculate_positions(is_natal=True, add_variation=True):
    """Genera posiciones de planetas simuladas para demostración"""
    base_positions = [
        {"name": "SOL", "longitude": 120 if is_natal else 150, "sign": "LEO" if is_natal else "VIRGO"},
        {"name": "LUNA", "longitude": 186 if is_natal else 210, "sign": "LIBRA" if is_natal else "SCORPIO"},
        {"name": "MERCURIO", "longitude": 135 if is_natal else 145, "sign": "LEO" if is_natal else "VIRGO"},
        {"name": "VENUS", "longitude": 90 if is_natal else 100, "sign": "CANCER" if is_natal else "CANCER"},
        {"name": "MARTE", "longitude": 210 if is_natal else 240, "sign": "SCORPIO" if is_natal else "OPHIUCHUS"},
        {"name": "JÚPITER", "longitude": 270 if is_natal else 290, "sign": "CAPRICORN" if is_natal else "CAPRICORN"},
        {"name": "SATURNO", "longitude": 330 if is_natal else 350, "sign": "PISCES" if is_natal else "PISCES"},
        {"name": "URANO", "longitude": 30 if is_natal else 32, "sign": "TAURUS" if is_natal else "TAURUS"},
        {"name": "NEPTUNO", "longitude": 354 if is_natal else 355, "sign": "ARIES" if is_natal else "ARIES"},
        {"name": "PLUTÓN", "longitude": 252 if is_natal else 254, "sign": "SAGITTARIUS" if is_natal else "SAGITTARIUS"},
        {"name": "ASC", "longitude": 0 if is_natal else 10, "sign": "ARIES" if is_natal else "ARIES"},
        {"name": "MC", "longitude": 270 if is_natal else 280, "sign": "CAPRICORN" if is_natal else "CAPRICORN"}
    ]
    
    # Añadir variación aleatoria para cartas de tránsito o si se solicita
    if not is_natal and add_variation:
        for planet in base_positions:
            planet["longitude"] = (planet["longitude"] + random.uniform(-10, 10)) % 360
            # Recalcular el signo basado en la nueva longitud
            planet["sign"] = get_sign_for_longitude(planet["longitude"])
    
    return base_positions

def get_sign_for_longitude(longitude):
    """Determina el signo zodiacal basado en la longitud eclíptica"""
    longitude = float(longitude) % 360
    
    for sign in SIGNS:
        start = sign["start"]
        length = sign["length"]
        end = (start + length) % 360
        
        # Caso normal (sin cruzar 0°)
        if start < end:
            if start <= longitude < end:
                return sign["name"]
        # Caso especial (cruza 0°, como Aries)
        else:
            if longitude >= start or longitude < end:
                return sign["name"]
    
    return "ARIES"  # Por defecto

def calculate_aspects(planets1, planets2=None):
    """Calcula aspectos entre planetas"""
    aspects = []
    
    # Si solo pasamos un conjunto de planetas, calculamos aspectos internos
    if planets2 is None:
        planets2 = planets1
    
    # Filtramos planetas para incluir solo los tradicionales
    traditional_planets = ["SOL", "LUNA", "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO"]
    valid_planets1 = [p for p in planets1 if p["name"] in traditional_planets]
    valid_planets2 = [p for p in planets2 if p["name"] in traditional_planets]
    
    same_chart = planets1 is planets2
    
    for i, planet1 in enumerate(valid_planets1):
        start_j = i + 1 if same_chart else 0
        for j in range(start_j, len(valid_planets2)):
            planet2 = valid_planets2[j]
            
            # Evitar comparar un planeta consigo mismo
            if planet1 == planet2:
                continue
            
            diff = abs(planet1["longitude"] - planet2["longitude"])
            if diff > 180:
                diff = 360 - diff
            
            for aspect_type, aspect in ASPECTS.items():
                if abs(diff - aspect["angle"]) <= aspect["orb"]:
                    aspects.append({
                        "planet1": planet1["name"],
                        "planet2": planet2["name"],
                        "type": aspect_type,
                        "angle": diff,
                        "color": aspect["color"],
                        "isInterChart": not same_chart
                    })
                    break
    
    return aspects

def is_dry_birth(sun_longitude, asc_longitude):
    """Determina si un nacimiento es seco o húmedo basado en la posición del Sol."""
    # Es seco cuando el Sol está entre las casas 6 y 11 (inclusive)
    diff = (sun_longitude - asc_longitude) % 360
    house = (diff / 30) + 1
    
    # Es seco si el Sol está en las casas 6 a 11
    return 6 <= house <= 11

# Funciones para cálculo de Fardarias
def calculate_duration(planet, level):
    """Calcula la duración de un periodo de Fardaria."""
    number = PLANET_DATA[planet]['numero']
    if level == 1:
        return number * DURACIONES['AÑO']
    elif level == 2:
        return number * DURACIONES['MES']
    elif level == 3:
        return number * DURACIONES['SEMANA']
    elif level == 4:
        return number * DURACIONES['DIA']
    return 0

def get_rotated_planets(start_planet, planet_order):
    """Obtiene la secuencia de planetas rotada a partir del planeta inicial."""
    index = planet_order.index(start_planet)
    return planet_order[index:] + planet_order[:index]

def calculate_date_from_offset(birth_date, day_offset):
    """Calcula una fecha a partir de una fecha base y un desplazamiento en días."""
    if isinstance(birth_date, str):
        birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
    
    date = birth_date + timedelta(days=int(day_offset))
    return date

def calculate_sub_periods(main_planet, level, start_day, end_day, birth_date, planet_order):
    """Calcula subperiodos de Fardarias."""
    if level > 4:
        return []
    
    periods = []
    current_day = start_day
    rotated_planets = get_rotated_planets(main_planet, planet_order)
    
    for planet in rotated_planets:
        duration = calculate_duration(planet, level)
        actual_duration = min(duration, end_day - current_day)
        
        if actual_duration > 0:
            start_date = calculate_date_from_offset(birth_date, current_day)
            end_date = calculate_date_from_offset(birth_date, current_day + actual_duration)
            
            period = {
                'planet': planet,
                'level': level,
                'start': start_date.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d'),
                'startDay': current_day,
                'durationDays': actual_duration
            }
            
            period['subPeriods'] = calculate_sub_periods(
                planet,
                level + 1,
                current_day,
                current_day + actual_duration,
                birth_date,
                planet_order
            )
            
            periods.append(period)
            current_day += actual_duration
    
    return periods

def calculate_fardaria_periods(birth_date, is_dry, start_year=None, end_year=None):
    """Calcula los periodos de Fardarias para una fecha de nacimiento con filtrado opcional de años."""
    planet_order = PLANET_ORDER['seco'] if is_dry else PLANET_ORDER['humedo']
    all_periods = []
    current_day = 0
    max_years = 84  # Limitar a 84 años por defecto
    
    # Asegurar que birth_date es un objeto datetime
    if isinstance(birth_date, str):
        birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
    
    # Si se especifican años de inicio y fin, calcular límites en días
    start_day = 0
    end_day = max_years * DURACIONES['AÑO']  # Predeterminado a 84 años
    
    if start_year is not None and end_year is not None:
        birth_year = birth_date.year
        start_offset_years = max(0, start_year - birth_year)
        end_offset_years = min(max_years, end_year - birth_year + 1)
        
        start_day = start_offset_years * DURACIONES['AÑO']
        end_day = end_offset_years * DURACIONES['AÑO']
    
    # Continuar calculando periodos hasta llegar al límite
    while current_day < end_day:
        for planet in planet_order:
            duration = calculate_duration(planet, 1)
            
            # Verificar si este periodo está dentro del rango de interés
            if current_day + duration <= start_day:
                # El periodo termina antes del rango, saltamos
                current_day += duration
                continue
            
            if current_day >= end_day:
                # El periodo comienza después del rango, terminamos
                break
            
            # Calcular parte del periodo dentro del rango
            period_start_day = max(current_day, start_day)
            period_end_day = min(current_day + duration, end_day)
            period_duration = period_end_day - period_start_day
            
            if period_duration > 0:
                start_date = calculate_date_from_offset(birth_date, period_start_day)
                end_date = calculate_date_from_offset(birth_date, period_end_day)
                
                period = {
                    'planet': planet,
                    'level': 1,
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d'),
                    'startDay': period_start_day,
                    'durationDays': period_duration
                }
                
                # Añadir subperiodos para la parte dentro del rango
                period['subPeriods'] = calculate_sub_periods(
                    planet,
                    2,
                    period_start_day,
                    period_end_day,
                    birth_date,
                    planet_order
                )
                
                all_periods.append(period)
            
            current_day += duration
            if current_day >= end_day:
                break
    
    return all_periods

# Funciones para Relevo Zodiacal
def generar_secuencia(inicio):
    """Genera la secuencia de signos a partir del ascendente."""
    orden = list(SIGNOS.keys())
    try:
        idx = orden.index(inicio.lower())
        return orden[idx:] + orden[:idx]
    except ValueError:
        # Si el ascendente no está en la lista, usar 'aries' como predeterminado
        print(f"Ascendente '{inicio}' no encontrado, usando 'aries'")
        idx = orden.index('aries')
        return orden[idx:] + orden[:idx]

def calcular_relevod_periods(fecha_nac, ascendente, start_year=None, end_year=None):
    """Calcula periodos de relevo zodiacal con filtrado opcional de años."""
    # Normalizar y validar el ascendente
    ascendente_lower = ascendente.lower().strip()
    
    # Verificar si el ascendente está en la lista de SIGNOS
    if ascendente_lower not in SIGNOS:
        print(f"ADVERTENCIA: Ascendente '{ascendente}' no encontrado en SIGNOS. Usando 'aries' como predeterminado.")
        ascendente_lower = 'aries'
    
    # Ahora usar el ascendente validado
    secuencia = generar_secuencia(ascendente_lower)
    
    # Asegurar que fecha_nac es un objeto datetime
    if isinstance(fecha_nac, str):
        fecha_nac = datetime.strptime(fecha_nac, '%Y-%m-%d')
    
    # Si se especifican años de inicio y fin, calcular límites en días
    start_day = 0
    end_day = 84 * DURACIONES['AÑO']  # Predeterminado a 84 años
    
    if start_year is not None and end_year is not None:
        birth_year = fecha_nac.year
        start_offset_years = max(0, start_year - birth_year)
        end_offset_years = min(84, end_year - birth_year + 1)
        
        start_day = start_offset_years * DURACIONES['AÑO']
        end_day = end_offset_years * DURACIONES['AÑO']
    
    dia_actual = 0
    periodos = []
    
    # Continuar calculando periodos hasta llegar al límite
    while dia_actual < end_day:
        for signo in secuencia:
            dias_en_periodo = DURACION_POR_NIVEL[signo] * DURACIONES['AÑO']
            
            # Verificar si este periodo está dentro del rango de interés
            if dia_actual + dias_en_periodo <= start_day:
                # El periodo termina antes del rango, saltamos
                dia_actual += dias_en_periodo
                continue
            
            if dia_actual >= end_day:
                # El periodo comienza después del rango, terminamos
                break
            
            # Calcular parte del periodo dentro del rango
            periodo_inicio_dia = max(dia_actual, start_day)
            periodo_fin_dia = min(dia_actual + dias_en_periodo, end_day)
            duracion_periodo = periodo_fin_dia - periodo_inicio_dia
            
            if duracion_periodo > 0:
                fecha_inicio = calculate_date_from_offset(fecha_nac, periodo_inicio_dia)
                fecha_fin = calculate_date_from_offset(fecha_nac, periodo_fin_dia)
                
                periodo = {
                    'signo': signo,
                    'level': 1,
                    'planeta': SIGNOS[signo]['planeta'],
                    'start': fecha_inicio.strftime('%Y-%m-%d'),
                    'end': fecha_fin.strftime('%Y-%m-%d'),
                    'startDay': periodo_inicio_dia,
                    'durationDays': duracion_periodo
                }
                
                # Calcular subperiodos para la parte dentro del rango
                periodo['subPeriods'] = calcular_relevod_subperiodos(
                    fecha_nac,
                    periodo_inicio_dia,
                    duracion_periodo,
                    secuencia,
                    secuencia.index(signo),
                    2
                )
                
                periodos.append(periodo)
            
            dia_actual += dias_en_periodo
            if dia_actual >= end_day:
                break
    
    return periodos

def calcular_relevod_subperiodos(fecha_nac, dia_inicio, duracion_total, secuencia, idx_inicial, nivel):
    """Calcula subperiodos de relevo zodiacal."""
    if nivel > 4:
        return []
    
    periodos = []
    dia_actual = 0
    unidad_tiempo = 'MES' if nivel == 2 else 'SEMANA' if nivel == 3 else 'DIA'
    duracion_unidad = DURACIONES[unidad_tiempo]
    
    while dia_actual < duracion_total:
        for i in range(len(secuencia)):
            if dia_actual >= duracion_total:
                break
                
            signo = secuencia[(idx_inicial + i) % len(secuencia)]
            duracion_periodo = DURACION_POR_NIVEL[signo] * duracion_unidad
            duracion_real = min(duracion_periodo, duracion_total - dia_actual)
            
            if duracion_real > 0:
                fecha_inicio = calculate_date_from_offset(fecha_nac, dia_inicio + dia_actual)
                fecha_fin = calculate_date_from_offset(fecha_nac, dia_inicio + dia_actual + duracion_real)
                
                periodo = {
                    'signo': signo,
                    'level': nivel,
                    'planeta': SIGNOS[signo]['planeta'],
                    'start': fecha_inicio.strftime('%Y-%m-%d'),
                    'end': fecha_fin.strftime('%Y-%m-%d'),
                    'startDay': dia_inicio + dia_actual,
                    'durationDays': duracion_real
                }
                
                if nivel < 4:
                    periodo['subPeriods'] = calcular_relevod_subperiodos(
                        fecha_nac,
                        dia_inicio + dia_actual,
                        duracion_real,
                        secuencia,
                        (idx_inicial + i) % len(secuencia),
                        nivel + 1
                    )
                
                periodos.append(periodo)
                dia_actual += duracion_real
    
    return periodos

def extraer_periodos_nivel(periodos, nivel):
    """Extrae todos los periodos de un nivel específico."""
    resultado = []
    
    def recorrer_periodos(periodo):
        if periodo['level'] == nivel:
            resultado.append(periodo)
        elif 'subPeriods' in periodo and periodo['subPeriods']:
            for subperiodo in periodo['subPeriods']:
                recorrer_periodos(subperiodo)
    
    for periodo in periodos:
        recorrer_periodos(periodo)
    
    return resultado

def buscar_coincidencias(periodos_fardaria, periodos_relevo):
    """
    Busca coincidencias entre periodos de Fardarias y Relevos.
    Devuelve una lista de coincidencias agrupadas por año.
    """
    coincidencias = []
    
    # Extraer periodos de nivel 4 (días)
    dias_fardaria = extraer_periodos_nivel(periodos_fardaria, 4)
    dias_relevo = extraer_periodos_nivel(periodos_relevo, 4)
    
    print(f"Periodos de Fardaria nivel 4: {len(dias_fardaria)}")
    print(f"Periodos de Relevo nivel 4: {len(dias_relevo)}")
    
    # Buscar coincidencias
    for fardaria in dias_fardaria:
        for relevo in dias_relevo:
            if fardaria['planet'] == relevo['planeta']:
                # Convertir fechas a objetos datetime
                fardaria_start = datetime.strptime(fardaria['start'], '%Y-%m-%d')
                fardaria_end = datetime.strptime(fardaria['end'], '%Y-%m-%d')
                relevo_start = datetime.strptime(relevo['start'], '%Y-%m-%d')
                relevo_end = datetime.strptime(relevo['end'], '%Y-%m-%d')
                
                # Verificar si hay superposición de fechas
                if fardaria_start <= relevo_end and fardaria_end >= relevo_start:
                    # Calcular periodo de superposición
                    overlap_start = max(fardaria_start, relevo_start)
                    overlap_end = min(fardaria_end, relevo_end)
                    
                    coincidencias.append({
                        'planeta': fardaria['planet'],
                        'signo': relevo['signo'],
                        'fardariaPeriodo': {
                            'start': fardaria['start'],
                            'end': fardaria['end']
                        },
                        'relevoPeriodo': {
                            'start': relevo['start'],
                            'end': relevo['end'],
                            'signo': relevo['signo']
                        },
                        'overlap': {
                            'start': overlap_start.strftime('%Y-%m-%d'),
                            'end': overlap_end.strftime('%Y-%m-%d'),
                            'year': overlap_start.year
                        }
                    })
    
    # Ordenar por año y fecha de inicio
    coincidencias.sort(key=lambda x: (x['overlap']['year'], x['overlap']['start']))
    
    print(f"Total de coincidencias encontradas: {len(coincidencias)}")
    
    return coincidencias

# Rutas de la API
@app.route('/')
def index():
    """Ruta principal - Muestra la aplicación"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/calculate', methods=['POST'])
def calculate_chart():
    """Endpoint para calcular posiciones planetarias y aspectos"""
    try:
        data = request.json
        
        # Verificar si hay datos de natal
        if 'natal' not in data:
            return jsonify({"error": "Faltan datos de carta natal"}), 400
        
        # Generar posiciones planetarias para carta natal
        natal_planets = mock_calculate_positions(is_natal=True, add_variation=False)
        
        # Calcular aspectos internos de la carta natal
        internal_aspects = calculate_aspects(natal_planets)
        
        # Si se solicitan tránsitos, calcularlos también
        transit_planets = []
        inter_chart_aspects = []
        
        if data.get('showTransits', False) and 'transit' in data:
            transit_planets = mock_calculate_positions(is_natal=False, add_variation=True)
            inter_chart_aspects = calculate_aspects(natal_planets, transit_planets)
        
        # Solo calcular coincidencias si se solicita
        coincidencias = []
        if data.get('calculateCoincidences', False):
            # Encontrar planetas ASC y SOL
            asc_pos = next((p for p in natal_planets if p["name"] == "ASC"), None)
            sun_pos = next((p for p in natal_planets if p["name"] == "SOL"), None)
            
            if asc_pos and sun_pos:
                # Determinar tipo de nacimiento
                is_dry = is_dry_birth(sun_pos["longitude"], asc_pos["longitude"])
                
                # Calcular Fardarias para 7 años (para demo)
                birth_date = datetime.strptime(data['natal']['date'], '%Y-%m-%d')
                fardarias = calculate_fardaria_periods(birth_date, is_dry)
                
                # Convertir ascendente a formato para relevo
                asc_sign_map = {
                    "ARIES": "aries", "TAURUS": "tauro", "GEMINI": "geminis", 
                    "CANCER": "cancer", "LEO": "leo", "VIRGO": "virgo", 
                    "LIBRA": "libra", "SCORPIO": "escorpio", "OPHIUCHUS": "ofiuco", 
                    "SAGITTARIUS": "sagitario", "CAPRICORN": "capricornio",
                    "AQUARIUS": "acuario", "PISCES": "piscis"
                }
                
                relevo_sign = asc_sign_map.get(asc_pos["sign"].upper(), "aries")
                relevos = calcular_relevod_periods(birth_date, relevo_sign)
                
                # Buscar coincidencias
                coincidencias = buscar_coincidencias(fardarias, relevos)
        
        # Devolver resultados
        return jsonify({
            "natalPlanets": natal_planets,
            "transitPlanets": transit_planets,
            "internalAspects": internal_aspects,
            "interChartAspects": inter_chart_aspects,
            "coincidencias": coincidencias,
            "isDry": is_dry_birth(natal_planets[0]["longitude"], natal_planets[10]["longitude"]) if len(natal_planets) > 10 else None
        })
    
    except Exception as e:
        print(f"Error en cálculo: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/calculate_coincidences', methods=['POST'])
def calculate_coincidences():
    """Endpoint para calcular coincidencias entre Fardarias y Relevos para un rango de años específico."""
    try:
        data = request.json
        birth_date = data.get('birthDate')
        is_dry = data.get('isDry')
        ascendente = data.get('ascendente')
        start_year = data.get('startYear')
        end_year = data.get('endYear')
        
        if not all([birth_date, ascendente]) or is_dry is None:
            return jsonify({"error": "Faltan datos necesarios"}), 400
        
        # Validar años
        if start_year is None:
            start_year = datetime.strptime(birth_date, '%Y-%m-%d').year
        if end_year is None:
            end_year = start_year + 5
        
        # Asegurar que los años sean enteros
        start_year = int(start_year)
        end_year = int(end_year)
        
        # Limitar el rango a un máximo razonable
        if end_year - start_year > 30:
            end_year = start_year + 30
        
        print(f"Calculando coincidencias para: {birth_date}, {is_dry}, {ascendente}, {start_year}-{end_year}")
        
        # Calcular Fardarias para el rango especificado
        fardarias = calculate_fardaria_periods(birth_date, is_dry, start_year, end_year)
        
        # Calcular Relevo Zodiacal para el rango especificado
        relevos = calcular_relevod_periods(birth_date, ascendente, start_year, end_year)
        
        # Calcular coincidencias
        coincidencias = buscar_coincidencias(fardarias, relevos)
        
        return jsonify({
            "coincidencias": coincidencias,
            "startYear": start_year,
            "endYear": end_year
        })
        
    except Exception as e:
        print(f"Error calculando coincidencias: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/coincidence_transit', methods=['POST'])
def coincidence_transit():
    """Endpoint para calcular posiciones planetarias para una fecha de coincidencia específica."""
    try:
        data = request.json
        date = data.get('date')
        
        if not date:
            return jsonify({"error": "Fecha no especificada"}), 400
        
        # Simular posiciones planetarias para la fecha de coincidencia
        try:
            coincidence_date = datetime.strptime(date, '%Y-%m-%d')
            
            # Usar un factor determinista para variaciones basado en la fecha
            day_of_year = coincidence_date.timetuple().tm_yday
            
            # Generar posiciones planetarias
            transit_positions = mock_calculate_positions(is_natal=False, add_variation=False)
            
            # Aplicar variación determinista basada en la fecha
            for planet in transit_positions:
                variation = (day_of_year % 30) / 15.0  # Variación máxima de 2 grados
                planet["longitude"] = (planet["longitude"] + variation) % 360
                planet["sign"] = get_sign_for_longitude(planet["longitude"])
                
            return jsonify({
                "positions": transit_positions
            })
            
        except Exception as inner_e:
            print(f"Error procesando fecha de coincidencia: {str(inner_e)}")
            return jsonify({"error": f"Error procesando fecha: {str(inner_e)}"}), 500
            
    except Exception as e:
        print(f"Error en el cálculo de coincidencia: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health_check():
    """Endpoint de salud para monitoreo"""
    return jsonify({"status": "ok", "service": "carta-astral-api"})

# Plantilla HTML para la aplicación