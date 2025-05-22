from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_compress import Compress
from datetime import datetime, timezone, timedelta
import sys
import os
import requests
import math
import csv
from pathlib import Path
from functools import lru_cache

try:
    from skyfield.api import load, wgs84
    import numpy as np
    SKYFIELD_AVAILABLE = True
    print("Skyfield disponible para cálculos astronómicos precisos")
except ImportError:
    SKYFIELD_AVAILABLE = False
    print("ADVERTENCIA: Skyfield no está instalado. Se usarán cálculos aproximados.")

try:
    import swisseph as swe
    SWISSEPH_AVAILABLE = True
    print("Swiss Ephemeris disponible para cálculos de casas precisos")
except ImportError:
    SWISSEPH_AVAILABLE = False
    print("NOTA: Swiss Ephemeris no disponible - usando cálculos aproximados")
    print("Para máxima precisión, instala pyswisseph (requiere Visual C++ Build Tools)")

app = Flask(__name__)
# Configurar CORS
CORS(app)
# Comprimir respuestas
try:
    Compress(app)
    print("Compresión de respuestas habilitada")
except:
    print("No se pudo habilitar la compresión - asegúrate de tener Flask-Compress instalado")

# Variables globales para recursos precargados
eph = None
ts = None
time_zone_df = None

# API Key para geocodificación
API_KEY = "e19afa2a9d6643ea9550aab89eefce0b"  # Para demo, en producción usar variables de entorno

# Constantes para cálculos astrológicos
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

DIMENSIONS = {
    'centerX': 300,
    'centerY': 300,
    'radius': 280,  # Aumentado para maximizar el tamaño de la rueda
    'middleRadius': 190,  # Radio para la carta externa
    'innerRadius': 110,  # Radio para la carta interna
    'glyphRadius': 265
}

SIGNS = [
    {'name': 'ARIES', 'start': 354, 'length': 36, 'symbol': '♈', 'color': '#FFE5E5'},
    {'name': 'TAURUS', 'start': 30, 'length': 30, 'symbol': '♉', 'color': '#E5FFE5'},
    {'name': 'GEMINI', 'start': 60, 'length': 30, 'symbol': '♊', 'color': '#FFFFE5'},
    {'name': 'CANCER', 'start': 90, 'length': 30, 'symbol': '♋', 'color': '#E5FFFF'},
    {'name': 'LEO', 'start': 120, 'length': 30, 'symbol': '♌', 'color': '#FFE5E5'},
    {'name': 'VIRGO', 'start': 150, 'length': 36, 'symbol': '♍', 'color': '#E5FFE5'},
    {'name': 'LIBRA', 'start': 186, 'length': 24, 'symbol': '♎', 'color': '#FFFFE5'},
    {'name': 'SCORPIO', 'start': 210, 'length': 30, 'symbol': '♏', 'color': '#E5FFFF'},
    {'name': 'OPHIUCHUS', 'start': 240, 'length': 12, 'symbol': '⛎', 'color': '#FFFFE5'},
    {'name': 'SAGITTARIUS', 'start': 252, 'length': 18, 'symbol': '♐', 'color': '#FFE5E5'},
    {'name': 'CAPRICORN', 'start': 270, 'length': 36, 'symbol': '♑', 'color': '#E5FFE5'},
    {'name': 'AQUARIUS', 'start': 306, 'length': 18, 'symbol': '♒', 'color': '#FFFFE5'},
    {'name': 'PEGASUS', 'start': 324, 'length': 6, 'symbol': '∩', 'color': '#E5FFFF'},
    {'name': 'PISCES', 'start': 330, 'length': 24, 'symbol': '♓', 'color': '#E5FFFF'}
]

ASPECTS = {
    'CONJUNCTION': {'angle': 0, 'orb': 2, 'color': '#000080', 'name': 'Armónico Relevante'},
    'SEXTILE': {'angle': 60, 'orb': 2, 'color': '#000080', 'name': 'Armónico Relevante'},
    'SQUARE': {'angle': 90, 'orb': 2, 'color': '#FF0000', 'name': 'Inarmónico Relevante'},
    'TRINE': {'angle': 120, 'orb': 2, 'color': '#000080', 'name': 'Armónico Relevante'},
    'OPPOSITION': {'angle': 180, 'orb': 2, 'color': '#000080', 'name': 'Armónico Relevante'}
}

COLORS = {
    'RED': '#FF0000',
    'GREEN': '#00FF00',
    'BLUE': '#0000FF',
    'YELLOW': '#FFFF00'
}

# Precarga de recursos
def preload_resources():
    global eph, ts, time_zone_df
    
    print("Precargando recursos...")
    
    # Cargar efemérides desde GitHub
    try:
        # Cargar desde archivo local
        eph_path = Path('de421.bsp')
        if not eph_path.exists():
            # Intentar cargar desde la carpeta docs
            eph_path = Path('docs') / 'de421.bsp'
        
        print(f"Cargando efemérides desde: {eph_path}")
        eph = load(str(eph_path))
    except Exception as e:
        print(f"Error cargando efemérides: {e}")
        # Intento alternativo
        try:
            print("Intentando cargar efemérides alternativas...")
            eph = load('de440s.bsp')
        except Exception as e2:
            print(f"Error en carga alternativa: {e2}")
            sys.exit(1)  # Salir si no se pueden cargar las efemérides
    
    ts = load.timescale()
    
    # Cargar zona horaria desde CSV
    try:
        time_zone_df = []
        with open('time_zone.csv', 'r') as csv_file:
            csv_reader = csv.reader(csv_file)
            for row in csv_reader:
                if len(row) >= 6:  # asegurarse de que hay suficientes columnas
                    time_zone_df.append({
                        'timezone': row[0],
                        'country_code': row[1],
                        'abbreviation': row[2],
                        'timestamp': int(row[3]) if row[3].isdigit() else 0,
                        'utc_offset': float(row[4]) if row[4].replace('.', '', 1).isdigit() else 0,
                        'dst': int(row[5]) if row[5].isdigit() else 0
                    })
        print(f"Cargado archivo de zonas horarias: {len(time_zone_df)} entradas")
    except Exception as e:
        print(f"Error cargando zonas horarias: {e}")
        time_zone_df = []
    
    print("Recursos precargados correctamente")

# Cachear obtención de datos de ciudad
@lru_cache(maxsize=100)
def obtener_datos_ciudad(ciudad, fecha=None, hora=None):
    url = f"https://api.geoapify.com/v1/geocode/search?text={ciudad}&apiKey={API_KEY}"
    try:
        response = requests.get(url, timeout=10)  # Timeout para evitar demoras
        if response.status_code == 200:
            datos = response.json()
            if datos.get("features"):
                opciones = [{
                    "nombre": resultado["properties"]["formatted"],
                    "lat": resultado["properties"]["lat"],
                    "lon": resultado["properties"]["lon"],
                    "pais": resultado["properties"].get("country", "")
                }
                for resultado in datos["features"]]
                return opciones
            return {"error": "Ciudad no encontrada"}
        return {"error": f"Error en la consulta: {response.status_code}"}
    except requests.exceptions.Timeout:
        return {"error": "Timeout en la consulta"}
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

def obtener_zona_horaria(coordenadas, fecha):
    """
    Obtiene la zona horaria usando el archivo time_zone.csv y ajusta para horario de verano/invierno
    basado en las coordenadas y la fecha, considerando hemisferio norte/sur
    """
    try:
        lat = coordenadas["lat"]
        lon = coordenadas["lon"]
        fecha_obj = datetime.strptime(fecha, "%Y-%m-%d")
        
        # Determinar hemisferio (norte o sur)
        hemisferio = "norte" if lat >= 0 else "sur"
        
        # Verificar si la fecha está en horario de verano
        # Esta función necesita ser más precisa para fechas históricas
        is_dst = determinar_horario_verano(fecha_obj, hemisferio, coordenadas)
        
        # Buscar en el CSV por aproximación de longitud
        estimated_offset = round(lon / 15)
        
        # Ajustar para países específicos con información conocida
        pais = coordenadas.get("pais", "").lower()
        abbr = "UTC"
        tz_name = "UTC"
        offset = estimated_offset  # valor por defecto
        
        if "spain" in pais or "españa" in pais:
            tz_name = "Europe/Madrid"
            abbr = "CET"
            abbr_dst = "CEST"
            offset = 1
            if is_dst:
                offset = 2
                abbr = abbr_dst
        elif "argentina" in pais:
            tz_name = "America/Argentina/Buenos_Aires"
            abbr = "ART"
            offset = -3
            # Argentina no usa DST actualmente
        elif "mexico" in pais or "méxico" in pais:
            tz_name = "America/Mexico_City"
            abbr = "CST"
            abbr_dst = "CDT"
            offset = -6
            if is_dst:
                offset = -5
                abbr = abbr_dst
        else:
            # Buscar en el CSV la zona más cercana a la longitud estimada
            closest_zone = None
            min_diff = float('inf')
            
            if time_zone_df:
                for zone in time_zone_df:
                    # Los offsets en el CSV están en segundos, convertir a horas
                    csv_offset = zone['utc_offset'] / 3600
                    diff = abs(csv_offset - estimated_offset)
                    
                    if diff < min_diff:
                        min_diff = diff
                        closest_zone = zone
                
                if closest_zone:
                    offset = closest_zone['utc_offset'] / 3600
                    abbr = closest_zone['abbreviation']
                    tz_name = closest_zone['timezone']
                    
                    # Ajustar por DST si corresponde
                    if is_dst and closest_zone['dst'] == 1:
                        offset += 1
            else:
                # Si no hay datos en el CSV, usar la estimación por longitud
                offset = estimated_offset
                abbr = f"GMT{offset:+d}"
                tz_name = f"Estimated/GMT{offset:+d}"
        
        print(f"Zona horaria determinada: {tz_name}, offset: {offset}, DST: {is_dst}")
        
        return {
            "name": tz_name,
            "offset": offset,
            "abbreviation_STD": abbr,
            "abbreviation_DST": abbr,
            "is_dst": is_dst,
            "hemisphere": hemisferio
        }
    
    except Exception as e:
        print(f"Error obteniendo zona horaria: {str(e)}")
        # Si hay un error, devolver un mensaje claro
        print("Error en obtención de zona horaria, usando estimación basada en longitud")
        
        try:
            # Estimar zona horaria basada en longitud
            lon = coordenadas["lon"]
            estimated_offset = round(lon / 15)  # 15 grados = 1 hora
            
            # Para ciudades conocidas, usar valores predeterminados
            pais = coordenadas.get("pais", "").lower()
            
            if "spain" in pais or "españa" in pais:
                estimated_offset = 1
            elif "argentina" in pais:
                estimated_offset = -3
            elif "mexico" in pais or "méxico" in pais:
                estimated_offset = -6
            elif "united states" in pais or "estados unidos" in pais:
                # Aproximación basada en longitud para EEUU
                if lon < -100:
                    estimated_offset = -8  # Pacífico
                elif lon < -90:
                    estimated_offset = -7  # Montaña
                elif lon < -75:
                    estimated_offset = -6  # Central
                else:
                    estimated_offset = -5  # Este
            
            return {
                "name": f"GMT{estimated_offset:+d}",
                "offset": estimated_offset,
                "abbreviation_STD": f"GMT{estimated_offset:+d}",
                "abbreviation_DST": f"GMT{estimated_offset:+d}",
                "is_dst": False,
                "hemisphere": "norte" if coordenadas["lat"] >= 0 else "sur",
                "lon": lon  # Añadir longitud para referencia
            }
        except Exception as inner_e:
            print(f"Error en estimación de zona horaria: {str(inner_e)}")
            # Valor por defecto UTC si todo falla
            return {
                "name": "UTC",
                "offset": 0,
                "abbreviation_STD": "UTC",
                "abbreviation_DST": "UTC",
                "is_dst": False,
                "hemisphere": "norte",
                "estimated": True
            }

def determinar_horario_verano(fecha, hemisferio, coordenadas):
    """
    Determina si una fecha está en horario de verano (DST)
    Basado en reglas históricas y específicas por país
    """
    año = fecha.year
    mes = fecha.month
    dia = fecha.day
    
    # Obtener país
    pais = coordenadas.get("pais", "").lower()
    
    # Reglas específicas para España
    if "spain" in pais or "españa" in pais:
        # España antes de 1974: no había DST
        if año < 1974:
            return False
        elif año >= 1974 and año <= 1975:
            # En 1974-1975, DST fue del 13 de abril al 6 de octubre
            if (mes > 4 and mes < 10) or (mes == 4 and dia >= 13) or (mes == 10 and dia <= 6):
                return True
            return False
        elif año >= 1976 and año <= 1996:
            # Reglas más genéricas para 1976-1996
            # Primavera a otoño, aproximadamente marzo/abril a septiembre/octubre
            if mes > 3 and mes < 10:
                return True
            return False
        else:
            # Desde 1997: Regla actual de la UE - último domingo de marzo a último domingo de octubre
            if mes > 3 and mes < 10:
                return True
            # Marzo: último domingo
            elif mes == 3 and dia >= 25:  # Aproximación al último domingo
                return True
            # Octubre: último domingo
            elif mes == 10 and dia <= 25:  # Aproximación al último domingo
                return True
            return False
    
    # Reglas para otros países
    # Hemisferio Norte (Europa, América del Norte, Asia)
    elif hemisferio == "norte":
        # La mayoría de los países del hemisferio norte siguen este patrón
        # Horario de verano: finales de marzo a finales de octubre
        if año < 1970:
            # Antes de 1970 era menos común el DST
            return False
        
        if mes > 3 and mes < 10:
            return True
        elif mes == 3 and dia >= 25:  # Aproximación al último domingo de marzo
            return True
        elif mes == 10 and dia <= 25:  # Aproximación al último domingo de octubre
            return True
        return False
    
    # Hemisferio Sur (Australia, Nueva Zelanda, Sudamérica)
    else:
        # Muchos países del hemisferio sur no utilizan DST
        # Algunos que sí lo utilizan: Australia, Nueva Zelanda, Chile, Paraguay
        
        # Lista de países conocidos del hemisferio sur con DST
        south_dst_countries = ["australia", "new zealand", "nueva zelanda", "chile", "paraguay"]
        
        # Si no está en la lista, asumimos que no usa DST
        pais_usa_dst = any(country in pais for country in south_dst_countries)
        if not pais_usa_dst:
            return False
            
        # Horario de verano: finales de octubre a finales de marzo
        if mes < 3 or mes > 10:
            return True
        elif mes == 3 and dia <= 25:  # Aproximación al último domingo de marzo
            return True
        elif mes == 10 and dia >= 25:  # Aproximación al último domingo de octubre
            return True
        return False

def convertir_a_utc(fecha, hora, timezone_info):
    """
    Convierte fecha y hora local a UTC considerando zona horaria y DST
    Para cálculos astrológicos correctos, debemos asegurarnos de que la hora UTC sea precisa
    """
    try:
        # Combinar fecha y hora en un objeto datetime
        fecha_hora_str = f"{fecha} {hora}"
        dt_local = datetime.strptime(fecha_hora_str, "%Y-%m-%d %H:%M")
        
        # Obtener offset en horas desde la API de zona horaria
        # Si estamos en DST, la API ya incluye ese offset
        offset_hours = timezone_info["offset"]
        
        print(f"Offset de zona horaria: {offset_hours} horas")
        print(f"Hora local ingresada: {dt_local}")
        
        # Crear un timezone con el offset
        tz = timezone(timedelta(hours=offset_hours))
        
        # Aplicar timezone al datetime
        dt_local_with_tz = dt_local.replace(tzinfo=tz)
        
        # Convertir a UTC
        dt_utc = dt_local_with_tz.astimezone(timezone.utc)
        
        print(f"Hora convertida a UTC: {dt_utc}")
        return dt_utc
    except Exception as e:
        print(f"Error en conversión a UTC: {str(e)}")
        # Si falla, usar la hora proporcionada con offset manual aproximado
        dt_local = datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M")
        
        # Intentar estimar offset basado en longitud si no tenemos zona horaria
        if "lon" in timezone_info:
            lon = timezone_info["lon"]
            est_offset = round(lon / 15)  # 15 grados = 1 hora
            est_tz = timezone(timedelta(hours=est_offset))
            dt_with_tz = dt_local.replace(tzinfo=est_tz)
            return dt_with_tz.astimezone(timezone.utc)
        
        # Fallback: asumir UTC
        return dt_local.replace(tzinfo=timezone.utc)

def calculate_positions_with_utc(utc_datetime, lat=None, lon=None):
    """
    Calcula posiciones planetarias con un datetime UTC
    Asegura que el tiempo se ajusta correctamente según la zona horaria
    """
    try:
        # Usar el datetime UTC directamente
        print(f"Calculando posiciones para UTC: {utc_datetime}")
        t = ts.from_datetime(utc_datetime)
        earth = eph['earth']
        
        positions = []
        bodies = {
            'SOL': eph['sun'],
            'LUNA': eph['moon'],
            'MERCURIO': eph['mercury'],
            'VENUS': eph['venus'],
            'MARTE': eph['mars'],
            'JÚPITER': eph['jupiter barycenter'],
            'SATURNO': eph['saturn barycenter'],
            'URANO': eph['uranus barycenter'],
            'NEPTUNO': eph['neptune barycenter'],
            'PLUTÓN': eph['pluto barycenter']
        }
        
        for body_name, body in bodies.items():
            pos = earth.at(t).observe(body).apparent()
            lat_ecl, lon_ecl, dist = pos.ecliptic_latlon(epoch='date')
            
            longitude = float(lon_ecl.degrees) % 360
            positions.append({
                "name": body_name,
                "longitude": longitude,
                "sign": get_sign(longitude)
            })
        
        if lat is not None and lon is not None:
            asc, mc = calculate_asc_mc(t, lat, lon)
            
            positions.append({
                "name": "ASC",
                "longitude": float(asc),
                "sign": get_sign(asc)
            })
            
            positions.append({
                "name": "MC",
                "longitude": float(mc),
                "sign": get_sign(mc)
            })
        
        return positions
    except Exception as e:
        print(f"Error calculando posiciones: {str(e)}")
        # No lanzar excepción, simplemente retornar un error formateado
        print("Usando método alternativo de cálculo")
        try:
            return calculate_positions(
                utc_datetime.strftime("%d/%m/%Y"),
                utc_datetime.strftime("%H:%M"),
                lat,
                lon
            )
        except Exception as inner_e:
            print(f"Error en método alternativo: {str(inner_e)}")
            return []

def calculate_positions(date_str, time_str, lat=None, lon=None):
    try:
        if '-' in date_str:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            date_str = date_obj.strftime("%d/%m/%Y")
            
        local_dt = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
        spain_tz = timezone(timedelta(hours=1))
        local_dt = local_dt.replace(tzinfo=spain_tz)
        utc_dt = local_dt.astimezone(timezone.utc)
        
        t = ts.from_datetime(utc_dt)
        earth = eph['earth']
        
        positions = []
        bodies = {
            'SOL': eph['sun'],
            'LUNA': eph['moon'],
            'MERCURIO': eph['mercury'],
            'VENUS': eph['venus'],
            'MARTE': eph['mars'],
            'JÚPITER': eph['jupiter barycenter'],
            'SATURNO': eph['saturn barycenter'],
            'URANO': eph['uranus barycenter'],
            'NEPTUNO': eph['neptune barycenter'],
            'PLUTÓN': eph['pluto barycenter']
        }
        
        for body_name, body in bodies.items():
            pos = earth.at(t).observe(body).apparent()
            lat_ecl, lon_ecl, dist = pos.ecliptic_latlon(epoch='date')
            
            longitude = float(lon_ecl.degrees) % 360
            positions.append({
                "name": body_name,
                "longitude": longitude,
                "sign": get_sign(longitude)
            })
        
        if lat is not None and lon is not None:
            asc, mc = calculate_asc_mc(t, lat, lon)
            
            positions.append({
                "name": "ASC",
                "longitude": float(asc),
                "sign": get_sign(asc)
            })
            
            positions.append({
                "name": "MC",
                "longitude": float(mc),
                "sign": get_sign(mc)
            })
        
        return positions
    except Exception as e:
        print(f"Error calculando posiciones: {str(e)}")
        return []

# Reemplazar la función calculate_asc_mc existente con esta nueva versión
def calculate_asc_mc(t, lat, lon):
    """
    Calcula Ascendente y Medio Cielo usando Swiss Ephemeris si está disponible,
    sino usa la aproximación con Skyfield
    """
    try:
        if SWISSEPH_AVAILABLE:
            # Usar Swiss Ephemeris para cálculos precisos
            julian_day = t.tt
            houses_data = swe.houses(julian_day, lat, lon, b'A')  # Sistema Placidus
            
            # houses_data[1] contiene ASC, MC, ARMC, Vertex
            asc_mc_data = houses_data[1]
            ascendente = asc_mc_data[0]  # Ascendente
            mc = asc_mc_data[1]          # Medio Cielo
            
            print(f"Swiss Ephemeris - ASC: {ascendente:.4f}°, MC: {mc:.4f}°")
            return ascendente, mc
        else:
            # Usar el método original con Skyfield como fallback
            return calculate_asc_mc_skyfield(t, lat, lon)
            
    except Exception as e:
        print(f"Error en calculate_asc_mc con Swiss Ephemeris: {str(e)}")
        # Si falla, usar el método de Skyfield
        return calculate_asc_mc_skyfield(t, lat, lon)

def calculate_asc_mc_skyfield(t, lat, lon):
    """Método original con Skyfield como fallback"""
    try:
        # Obtener tiempo sideral en Greenwich en grados
        gst = t.gast
        # Tiempo sideral local = GST + longitud
        lst = (gst * 15 + lon) % 360
        # MC es directamente el LST
        mc = lst % 360
        
        # Calcular Ascendente
        lat_rad = np.radians(lat)
        ra_rad = np.radians(lst)
        eps_rad = np.radians(23.4367)  # Oblicuidad de la eclíptica (aprox.)
        
        # Fórmula para el Ascendente
        tan_asc = np.cos(ra_rad) / (np.sin(ra_rad) * np.cos(eps_rad) + np.tan(lat_rad) * np.sin(eps_rad))
        asc = np.degrees(np.arctan(-tan_asc))
        
        # Ajustar cuadrante
        if 0 <= lst <= 180:
            if np.cos(ra_rad) > 0:
                asc = (asc + 180) % 360
        else:
            if np.cos(ra_rad) < 0:
                asc = (asc + 180) % 360
                
        asc = asc % 360
        
        print(f"Skyfield fallback - ASC: {asc:.4f}°, MC: {mc:.4f}°")
        return asc, mc
        
    except Exception as e:
        print(f"Error en calculate_asc_mc_skyfield: {str(e)}")
        # Valores por defecto en caso de error
        return 0, 0

def get_sign(longitude):
    longitude = float(longitude) % 360
    signs = [
        ("ARIES", 354.00, 36.00),
        ("TAURO", 30.00, 30.00),
        ("GÉMINIS", 60.00, 30.00),
        ("CÁNCER", 90.00, 30.00),
        ("LEO", 120.00, 30.00),
        ("VIRGO", 150.00, 36.00),
        ("LIBRA", 186.00, 24.00),
        ("ESCORPIO", 210.00, 30.00),
        ("OFIUCO", 240.00, 12.00),
        ("SAGITARIO", 252.00, 18.00),
        ("CAPRICORNIO", 270.00, 36.00),
        ("ACUARIO", 306.00, 18.00),
        ("PEGASO", 324.00, 6.00),
        ("PISCIS", 330.00, 24.00)
    ]
    
    for name, start, length in signs:
        end = start + length
        if start <= longitude < end:
            return name
        elif start > 354.00 and (longitude >= start or longitude < (end % 360)):
            # Caso especial para Aries que cruza 0°
            return name
    
    return "ARIES"  # Valor por defecto

def calculate_positions_with_skyfield(utc_datetime, lat=None, lon=None):
    """Calcula posiciones planetarias usando Skyfield para mayor precisión"""
    try:
        if not SKYFIELD_AVAILABLE:
            raise Exception("Skyfield no está disponible")
        
        print(f"Calculando posiciones para UTC: {utc_datetime}")
        t = ts.from_datetime(utc_datetime)
        earth = eph['earth']
        
        positions = []
        bodies = {
            'SOL': eph['sun'],
            'LUNA': eph['moon'],
            'MERCURIO': eph['mercury'],
            'VENUS': eph['venus'],
            'MARTE': eph['mars'],
            'JÚPITER': eph['jupiter barycenter'],
            'SATURNO': eph['saturn barycenter'],
            'URANO': eph['uranus barycenter'],
            'NEPTUNO': eph['neptune barycenter'],
            'PLUTÓN': eph['pluto barycenter']
        }
        
        for body_name, body in bodies.items():
            pos = earth.at(t).observe(body).apparent()
            lat_ecl, lon_ecl, dist = pos.ecliptic_latlon(epoch='date')
            
            longitude = float(lon_ecl.degrees) % 360
            positions.append({
                "name": body_name,
                "longitude": longitude,
                "sign": get_sign(longitude)
            })
        
        if lat is not None and lon is not None:
            asc, mc = calculate_asc_mc(t, lat, lon)
            
            positions.append({
                "name": "ASC",
                "longitude": float(asc),
                "sign": get_sign(asc)
            })
            
            positions.append({
                "name": "MC",
                "longitude": float(mc),
                "sign": get_sign(mc)
            })
            
            # Añadir descendente (opuesto al ascendente)
            desc = (asc + 180) % 360
            positions.append({
                "name": "DSC",
                "longitude": float(desc),
                "sign": get_sign(desc)
            })
            
            # Añadir Fondo de Cielo (IC) (opuesto al MC)
            ic = (mc + 180) % 360
            positions.append({
                "name": "IC",
                "longitude": float(ic),
                "sign": get_sign(ic)
            })
        
        return positions
    except Exception as e:
        print(f"Error calculando posiciones con Skyfield: {str(e)}")
        return calculate_positions_with_approximation(utc_datetime, lat, lon)

def calculate_positions_with_approximation(utc_datetime, lat=None, lon=None):
    """Método alternativo para calcular posiciones planetarias sin Skyfield"""
    try:
        print("Usando método aproximado para cálculos planetarios")
        
        # Fecha y hora en formato compatible
        date_str = utc_datetime.strftime("%Y-%m-%d")
        time_str = utc_datetime.strftime("%H:%M")
        
        # Base para cálculos aproximados basados en la época J2000
        j2000 = datetime(2000, 1, 1, 12, 0).replace(tzinfo=timezone.utc)
        days_since_j2000 = (utc_datetime - j2000).total_seconds() / 86400
        
        # Posiciones planetarias medias aproximadas (grados/día desde J2000)
        # Estos valores son aproximados y solo para uso de demostración
        planet_rates = {
            'SOL': 0.9856,              # 1 vuelta al año
            'LUNA': 13.1764,            # 1 vuelta cada ~27.3 días
            'MERCURIO': 4.0923,         # 1 vuelta cada ~88 días
            'VENUS': 1.6021,            # 1 vuelta cada ~225 días
            'MARTE': 0.5240,            # 1 vuelta cada ~687 días
            'JÚPITER': 0.0830,          # 1 vuelta cada ~12 años
            'SATURNO': 0.0334,          # 1 vuelta cada ~29 años
            'URANO': 0.0117,            # 1 vuelta cada ~84 años
            'NEPTUNO': 0.006,           # 1 vuelta cada ~165 años
            'PLUTÓN': 0.004             # 1 vuelta cada ~248 años
        }
        
        # Posiciones de base en J2000 (aproximadas)
        planet_base = {
            'SOL': 280.0,
            'LUNA': 218.3,
            'MERCURIO': 90.0,
            'VENUS': 160.0,
            'MARTE': 200.0,
            'JÚPITER': 270.0,
            'SATURNO': 330.0,
            'URANO': 30.0,
            'NEPTUNO': 330.0,
            'PLUTÓN': 230.0
        }
        
        # Calcular posiciones actuales aproximadas
        positions = []
        for planet, rate in planet_rates.items():
            base_pos = planet_base[planet]
            current_pos = (base_pos + rate * days_since_j2000) % 360
            
            positions.append({
                "name": planet,
                "longitude": current_pos,
                "sign": get_sign(current_pos)
            })
        
        # Si tenemos coordenadas, calcular puntos cardinales de la carta
        if lat is not None and lon is not None:
            asc, mc = calculate_asc_mc(utc_datetime, lat, lon)
            
            positions.append({
                "name": "ASC",
                "longitude": float(asc),
                "sign": get_sign(asc)
            })
            
            positions.append({
                "name": "MC",
                "longitude": float(mc),
                "sign": get_sign(mc)
            })
            
            # Añadir descendente (opuesto al ascendente)
            desc = (asc + 180) % 360
            positions.append({
                "name": "DSC",
                "longitude": float(desc),
                "sign": get_sign(desc)
            })
            
            # Añadir Fondo de Cielo (IC) (opuesto al MC)
            ic = (mc + 180) % 360
            positions.append({
                "name": "IC",
                "longitude": float(ic),
                "sign": get_sign(ic)
            })
        
        return positions
    
    except Exception as e:
        print(f"Error en calculate_positions_with_approximation: {str(e)}")
        # Si todo falla, devolver datos simulados
        return mockCalculatePositions(True)

# Simulación de datos planetarios para fines de demostración
def mockCalculatePositions(is_natal=True, asc_sign=None, asc_longitude=None):
    """
    Función que provee posiciones planetarias simuladas basadas en los datos 
    del archivo original Aplicación de Carta Astral Doble.tsx
    """
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
    
    # Si no es natal, añadir una variación aleatoria a las posiciones
    if not is_natal:
        import random
        for planet in base_positions:
            # Esta variación mantiene la lógica del archivo original
            planet["longitude"] = (planet["longitude"] + random.uniform(-10, 10)) % 360
            planet["sign"] = get_sign(planet["longitude"])
    
    return base_positions

def calculate_aspects(planets1, planets2=None):
    """Calcula los aspectos entre planetas."""
    if planets2 is None:
        planets2 = planets1
    
    aspects = []
    traditional_planets = ["SOL", "LUNA", "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO"]
    
    # Filtrar planetas tradicionales
    valid_planets1 = [p for p in planets1 if p["name"] in traditional_planets]
    valid_planets2 = [p for p in planets2 if p["name"] in traditional_planets]
    
    for i, planet1 in enumerate(valid_planets1):
        # Si estamos calculando aspectos en la misma carta, evitar duplicados
        start_j = i + 1 if planets1 == planets2 else 0
        
        for j in range(start_j, len(valid_planets2)):
            planet2 = valid_planets2[j]
            
            # Evitar comparar un planeta consigo mismo
            if planet1 == planet2:
                continue
            
            # Calcular la diferencia angular
            diff = abs(planet1["longitude"] - planet2["longitude"])
            if diff > 180:
                diff = 360 - diff
            
            # Buscar aspectos
            for aspect_type, aspect_data in ASPECTS.items():
                if abs(diff - aspect_data["angle"]) <= aspect_data["orb"]:
                    aspects.append({
                        "planet1": planet1["name"],
                        "planet2": planet2["name"],
                        "type": aspect_type,
                        "angle": diff,
                        "color": aspect_data["color"],
                        "isInterChart": planets1 is not planets2
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

# Funciones para Fardarias
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

def calculate_date(birth_date, day_offset):
    """Calcula una fecha a partir de una fecha base y un desplazamiento en días."""
    if isinstance(birth_date, str):
        birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
    
    date = birth_date + timedelta(days=int(day_offset))
    return date.strftime('%Y-%m-%d')  # Devolver en formato de cadena consistente
    
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
            start_date = calculate_date(birth_date, current_day)
            end_date = calculate_date(birth_date, current_day + actual_duration)
            
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
    max_years = 84  # Limitar a 84 años por defecto
    
    # Asegurar que birth_date es un objeto datetime
    if isinstance(birth_date, str):
        birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
    
    # Calcular límites en días relativos a la fecha exacta de nacimiento
    birth_year = birth_date.year
    
    if start_year is not None and end_year is not None:
        start_offset_years = max(0, start_year - birth_year)
        end_offset_years = min(max_years, end_year - birth_year + 1)
        
        start_day = start_offset_years * DURACIONES['AÑO']
        end_day = end_offset_years * DURACIONES['AÑO']
    else:
        start_day = 0
        end_day = max_years * DURACIONES['AÑO']
    
    # Variable para rastrear el día actual desde el nacimiento
    current_day = 0
    
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
                start_date = calculate_date(birth_date, period_start_day)
                end_date = calculate_date(birth_date, period_end_day)
                
                period = {
                    'planet': planet,
                    'level': 1,
                    'start': start_date,
                    'end': end_date,
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
    idx = orden.index(inicio.lower())
    return orden[idx:] + orden[:idx]

def calcular_relevodPeriods(fecha_nac, ascendente, start_year=None, end_year=None):
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
    
    # Calcular límites en días relativos a la fecha exacta de nacimiento
    birth_year = fecha_nac.year
    max_years = 84  # Limitar a 84 años por defecto
    
    if start_year is not None and end_year is not None:
        start_offset_years = max(0, start_year - birth_year)
        end_offset_years = min(max_years, end_year - birth_year + 1)
        
        start_day = start_offset_years * DURACIONES['AÑO']
        end_day = end_offset_years * DURACIONES['AÑO']
    else:
        start_day = 0
        end_day = max_years * DURACIONES['AÑO']
    
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
                fecha_inicio = calculate_date(fecha_nac, periodo_inicio_dia)
                fecha_fin = calculate_date(fecha_nac, periodo_fin_dia)
                
                periodo = {
                    'signo': signo,
                    'level': 1,
                    'planeta': SIGNOS[signo]['planeta'],
                    'start': fecha_inicio,
                    'end': fecha_fin,
                    'startDay': periodo_inicio_dia,
                    'durationDays': duracion_periodo
                }
                
                # Calcular subperiodos para la parte dentro del rango
                periodo['subPeriods'] = calcular_relevodSubperiodos(
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
    
def calcular_relevodSubperiodos(fecha_nac, dia_inicio, duracion_total, secuencia, idx_inicial, nivel):
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
                fecha_inicio = calculate_date(fecha_nac, dia_inicio + dia_actual)
                fecha_fin = calculate_date(fecha_nac, dia_inicio + dia_actual + duracion_real)
                
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
                    periodo['subPeriods'] = calcular_relevodSubperiodos(
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
                # Verificar si las fechas se superponen
                fardaria_start = datetime.strptime(fardaria['start'], '%Y-%m-%d')
                fardaria_end = datetime.strptime(fardaria['end'], '%Y-%m-%d')
                relevo_start = datetime.strptime(relevo['start'], '%Y-%m-%d')
                relevo_end = datetime.strptime(relevo['end'], '%Y-%m-%d')
                
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

def getPlanetColor(planet, longitude):
    """Determina el color de un planeta según su posición."""
    if planet in ['ASC', 'MC', 'DSC', 'IC']:
        return '#000000'
    
    if planet == 'JÚPITER':
        if (longitude >= 306.00 and longitude <= 360.00) or (longitude >= 0.00 and longitude <= 150.00):
            return COLORS['BLUE']
        if longitude > 150.00 and longitude < 306.00:
            return COLORS['RED']
    
    if planet == 'SATURNO':
        if (longitude >= 330.00 and longitude <= 360.00) or (longitude >= 0.00 and longitude <= 150.00):
            return COLORS['YELLOW']
        if longitude > 240.00 and longitude <= 252.00:
            return COLORS['YELLOW']
        if longitude > 252.00 and longitude <= 330.00:
            return COLORS['RED']
        if longitude > 150.00 and longitude <= 240.00:
            return COLORS['RED']
        return COLORS['YELLOW']
    
    if longitude > 150.00 and longitude <= 330.00:
        if planet in ['SOL', 'MERCURIO', 'URANO']:
            return COLORS['GREEN']
        if planet in ['VENUS', 'LUNA']:
            return COLORS['YELLOW']
        if planet in ['MARTE', 'PLUTÓN']:
            return COLORS['BLUE']
        if planet == 'NEPTUNO':
            return COLORS['RED']
    else:
        if planet in ['SOL', 'MARTE', 'PLUTÓN']:
            return COLORS['RED']
        if planet == 'VENUS':
            return COLORS['GREEN']
        if planet in ['MERCURIO', 'SATURNO', 'URANO']:
            return COLORS['YELLOW']
        if planet in ['LUNA', 'NEPTUNO']:
            return COLORS['BLUE']
    
    return '#000000'

# Rutas del servidor Flask
@app.route('/')
def index():
    """Sirve la página principal."""
    return send_file('index.html')

@app.route('/cities', methods=['GET'])
def cities():
    """Busca ciudades basado en el texto de entrada."""
    ciudad = request.args.get('ciudad', '')
    if not ciudad:
        return jsonify({'error': 'Debes proporcionar una ciudad'}), 400
    
    try:
        # Usar API de Geoapify para autocompletado
        ciudades_result = obtener_datos_ciudad(ciudad)
        
        if isinstance(ciudades_result, dict) and "error" in ciudades_result:
            return jsonify({"error": ciudades_result["error"], "ciudades": []}), 400
        
        return jsonify({"ciudades": ciudades_result})
        
    except Exception as e:
        print(f"Error al buscar ciudades: {str(e)}")
        return jsonify({"error": str(e), "ciudades": []})

@app.route('/calculate', methods=['POST'])
def calculate():
    """Calcula la carta astral y devuelve los resultados."""
    try:
        data = request.json
        city = data.get('city')
        date = data.get('date')
        time = data.get('time')
        calculate_coincidences = data.get('calculateCoincidences', False)
        
        if not all([city, date, time]):
            return jsonify({"error": "Faltan datos necesarios"}), 400
        
        # Obtener coordenadas de la ciudad
        city_data_result = obtener_datos_ciudad(city, date, time)
        
        if isinstance(city_data_result, dict) and "error" in city_data_result:
            return jsonify(city_data_result), 400
        
        if not city_data_result or len(city_data_result) == 0:
            return jsonify({"error": "No se pudo encontrar la ciudad especificada"}), 400
        
        # Usar la primera ciudad encontrada
        city_data = city_data_result[0]
        
        # Obtener zona horaria de la ciudad
        timezone_info = obtener_zona_horaria(city_data, date)
        
        # Convertir hora local a UTC para cálculos precisos
        utc_datetime = convertir_a_utc(date, time, timezone_info)
        
        # Calcular posiciones planetarias
        positions = calculate_positions_with_utc(utc_datetime, city_data["lat"], city_data["lon"])
        
        # Extraer posiciones del ascendente y sol para verificar si es nacimiento seco o húmedo
        asc_pos = next((p for p in positions if p["name"] == "ASC"), None)
        sun_pos = next((p for p in positions if p["name"] == "SOL"), None)
        
        if not asc_pos or not sun_pos:
            return jsonify({"error": "No se pudo determinar el ASC o SOL"}), 500
        
        # Determinar si es seco o húmedo
        is_dry = is_dry_birth(sun_pos["longitude"], asc_pos["longitude"])
        
        # Calcular aspectos entre planetas
        aspects = calculate_aspects(positions)
        
        # Respuesta base sin coincidencias
        response_data = {
            "positions": positions,
            "isDry": is_dry,
            "aspects": aspects,
            "city": city_data["nombre"],
            "coordinates": {
                "latitude": city_data["lat"],
                "longitude": city_data["lon"]
            },
            "timezone": timezone_info,
            "utc_time": utc_datetime.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Solo calcular coincidencias si se solicita explícitamente
        if calculate_coincidences:
            # Calcular Fardarias
            birth_date = datetime.strptime(date, '%Y-%m-%d')
            fardarias = calculate_fardaria_periods(birth_date, is_dry)
            
            # Calcular Relevo Zodiacal
            signo_asc = asc_pos["sign"].lower()
            signo_map = {
                "ARIES": "aries", "TAURUS": "tauro", "GEMINI": "geminis", "CANCER": "cancer",
                "LEO": "leo", "VIRGO": "virgo", "LIBRA": "libra", "SCORPIO": "escorpio",
                "OPHIUCHUS": "ofiuco", "SAGITTARIUS": "sagitario", "CAPRICORN": "capricornio",
                "AQUARIUS": "acuario", "PISCES": "piscis"
            }
            relevo_signo = signo_map.get(signo_asc.upper(), "aries")
            relevos = calcular_relevodPeriods(birth_date, relevo_signo)
            
            # Calcular coincidencias
            coincidencias = buscar_coincidencias(fardarias, relevos)
            
            # Añadir a la respuesta
            response_data["fardarias"] = fardarias
            response_data["relevos"] = relevos
            response_data["coincidencias"] = coincidencias
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error en el cálculo: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/calculate_coincidence', methods=['POST'])
def calculate_coincidence():
    """Calcula posiciones planetarias para una fecha de coincidencia específica."""
    try:
        data = request.json
        date = data.get('date')
        
        if not date:
            return jsonify({"error": "Fecha no especificada"}), 400
        
        # Simular posiciones planetarias para la fecha de coincidencia
        try:
            coincidence_date = datetime.strptime(date, '%Y-%m-%d')
            # Convertir a datetime con zona horaria UTC para usar con Skyfield
            utc_date = coincidence_date.replace(tzinfo=timezone.utc)
            
            # Usar cálculos precisos si están disponibles
            if SKYFIELD_AVAILABLE:
                transit_positions = calculate_positions_with_skyfield(utc_date)
            else:
                transit_positions = calculate_positions_with_approximation(utc_date)
                
            # Hacer una variación determinista basada en la fecha
            day_of_year = coincidence_date.timetuple().tm_yday
            
            for planet in transit_positions:
                # Añadir una variación basada en el día del año para simular diferencias
                variation = (day_of_year % 30) / 15.0  # Variación máxima de 2 grados
                planet["longitude"] = (planet["longitude"] + variation) % 360
                planet["sign"] = get_sign(planet["longitude"])
        except Exception as inner_e:
            print(f"Error procesando fecha: {str(inner_e)}")
            # Usar posiciones simuladas como fallback
            transit_positions = mockCalculatePositions(False)
        
        return jsonify({
            "positions": transit_positions
        })
        
    except Exception as e:
        print(f"Error en el cálculo de coincidencia: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/calculate_coincidences', methods=['POST'])
def calculate_coincidences():
    """Calcula coincidencias entre Fardarias y Relevos para un rango de años específico."""
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
        relevos = calcular_relevodPeriods(birth_date, ascendente, start_year, end_year)
        
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

if __name__ == '__main__':
    # Precargar recursos al iniciar el servidor
    preload_resources()
    
    # Detectar si estamos en Render
    is_render = os.environ.get('RENDER', False)
    # En Render, el puerto se proporciona como variable de entorno
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Iniciando servidor en puerto {port}, entorno: {'Render' if is_render else 'Local'}")
    
    # Siempre usamos el servidor integrado de Flask
    app.run(host='0.0.0.0', port=port, debug=not is_render)