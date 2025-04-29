from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
import os
import math
import json
from datetime import datetime
import random

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

# HTML con la carta astral responsiva
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
        
        # Devolver resultados
        return jsonify({
            "natalPlanets": natal_planets,
            "transitPlanets": transit_planets,
            "internalAspects": internal_aspects,
            "interChartAspects": inter_chart_aspects
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Plantilla HTML para la aplicación
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carta Astral Responsive</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 15px;
            background-color: #f0f0f0;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .toggle-container {
            display: flex;
            align-items: center;
        }

        /* Estilo para el switch toggle */
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }

        .switch input { 
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: #2196F3;
        }

        input:focus + .slider {
            box-shadow: 0 0 1px #2196F3;
        }

        input:checked + .slider:before {
            transform: translateX(26px);
        }

        /* Contenedor principal de la carta astral */
        .chart-container {
            position: relative;
            width: 100%;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 15px;
            overflow: hidden;
        }

        /* Asegurando que el SVG mantenga la proporción adecuada */
        .chart-container::before {
            content: "";
            display: block;
            padding-top: 100%; /* Proporción 1:1 */
        }

        .chart-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            touch-action: none;
        }

        /* Panel de información */
        .info-panel {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
        }

        .info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }

        .selected-info {
            padding: 10px;
            background-color: #e6f7ff;
            border-radius: 5px;
        }

        .tooltip {
            position: absolute;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 14px;
            pointer-events: none;
            z-index: 100;
            display: none;
        }

        /* Mejoras para móviles */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            h1 {
                font-size: 1.5rem;
            }
            
            .chart-container {
                margin-bottom: 10px;
            }
            
            .info-panel {
                max-height: 150px;
            }
        }

        /* Estilos para controles de entrada de datos */
        .input-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 15px;
            margin-bottom: 15px;
        }

        .form-group {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
        }

        .input-group {
            flex: 1;
            min-width: 200px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }

        .btn {
            padding: 10px 20px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        }

        .btn:hover {
            background-color: #0b7dda;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Carta Astral</h1>
        
        <!-- Controles de entrada de datos -->
        <div class="input-container">
            <h2>Datos de Nacimiento</h2>
            <div class="form-group">
                <div class="input-group">
                    <label for="city">Ciudad:</label>
                    <input type="text" id="city" placeholder="Madrid, España">
                </div>
                <div class="input-group">
                    <label for="date">Fecha:</label>
                    <input type="date" id="date">
                </div>
                <div class="input-group">
                    <label for="time">Hora:</label>
                    <input type="time" id="time">
                </div>
            </div>
            
            <div class="toggle-container" style="margin-bottom: 15px;">
                <label class="switch">
                    <input type="checkbox" id="show-transits" checked>
                    <span class="slider"></span>
                </label>
                <span style="margin-left: 10px;">Mostrar Tránsitos</span>
            </div>
            
            <div id="transit-controls">
                <h3>Datos de Tránsito</h3>
                <div class="form-group">
                    <div class="input-group">
                        <label for="transit-city">Ciudad:</label>
                        <input type="text" id="transit-city" placeholder="Madrid, España">
                    </div>
                    <div class="input-group">
                        <label for="transit-date">Fecha:</label>
                        <input type="date" id="transit-date">
                    </div>
                    <div class="input-group">
                        <label for="transit-time">Hora:</label>
                        <input type="time" id="transit-time">
                    </div>
                </div>
            </div>
            
            <button id="calculate-btn" class="btn">Calcular Carta</button>
        </div>
        
        <header>
            <h2>Visualización de Carta</h2>
            <div class="toggle-container">
                <label class="switch">
                    <input type="checkbox" id="toggle-transits" checked>
                    <span class="slider"></span>
                </label>
                <span style="margin-left: 10px;">Tránsitos</span>
            </div>
        </header>
        
        <div class="chart-container">
            <svg id="chart" class="chart-svg" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
                <!-- El contenido SVG se generará dinámicamente mediante JavaScript -->
            </svg>
            <div id="tooltip" class="tooltip"></div>
        </div>
        
        <div class="info-panel">
            <div class="info-header">
                <h3>Información</h3>
                <span id="info-toggle" style="cursor: pointer;">▼</span>
            </div>
            <div id="info-content">
                <div id="selected-info" class="selected-info">
                    Selecciona un planeta o aspecto para ver detalles
                </div>
            </div>
        </div>
    </div>

    <script>
        // Constantes
        const DIMENSIONS = {
            centerX: 300,
            centerY: 300,
            radius: 280,         // Aumentado para maximizar el espacio
            innerRadius: 120,    // Ajustado para mejorar el espacio entre los elementos
            glyphRadius: 265     // Ajustado para posicionar los símbolos del zodiaco
        };

        const SIGNS = [
            {name: 'ARIES', start: 354, length: 36, symbol: '♈', color: '#FFE5E5'},
            {name: 'TAURUS', start: 30, length: 30, symbol: '♉', color: '#E5FFE5'},
            {name: 'GEMINI', start: 60, length: 30, symbol: '♊', color: '#FFFFE5'},
            {name: 'CANCER', start: 90, length: 30, symbol: '♋', color: '#E5FFFF'},
            {name: 'LEO', start: 120, length: 30, symbol: '♌', color: '#FFE5E5'},
            {name: 'VIRGO', start: 150, length: 36, symbol: '♍', color: '#E5FFE5'},
            {name: 'LIBRA', start: 186, length: 24, symbol: '♎', color: '#FFFFE5'},
            {name: 'SCORPIO', start: 210, length: 30, symbol: '♏', color: '#E5FFFF'},
            {name: 'OPHIUCHUS', start: 240, length: 12, symbol: '⛎', color: '#FFFFE5'},
            {name: 'SAGITTARIUS', start: 252, length: 18, symbol: '♐', color: '#FFE5E5'},
            {name: 'CAPRICORN', start: 270, length: 36, symbol: '♑', color: '#E5FFE5'},
            {name: 'AQUARIUS', start: 306, length: 18, symbol: '♒', color: '#FFFFE5'},
            {name: 'PEGASUS', start: 324, length: 6, symbol: '∩', color: '#E5FFFF'},
            {name: 'PISCES', start: 330, length: 24, symbol: '♓', color: '#E5FFFF'}
        ];

        const PLANET_SYMBOLS = {
            'SOL': '☉',
            'LUNA': '☽',
            'MERCURIO': '☿',
            'VENUS': '♀',
            'MARTE': '♂',
            'JÚPITER': '♃',
            'SATURNO': '♄',
            'URANO': '♅',
            'NEPTUNO': '♆',
            'PLUTÓN': '♇',
            'ASC': 'ASC',
            'MC': 'MC',
            'DSC': 'DSC',
            'IC': 'IC'
        };

        const ASPECTS = {
            CONJUNCTION: { angle: 0, orb: 2, color: '#000080', name: 'Armónico Relevante' },
            SEXTILE: { angle: 60, orb: 2, color: '#000080', name: 'Armónico Relevante' },
            SQUARE: { angle: 90, orb: 2, color: '#FF0000', name: 'Inarmónico Relevante' },
            TRINE: { angle: 120, orb: 2, color: '#000080', name: 'Armónico Relevante' },
            OPPOSITION: { angle: 180, orb: 2, color: '#000080', name: 'Armónico Relevante' }
        };

        const COLORS = {
            RED: '#FF0000',
            GREEN: '#00FF00',
            BLUE: '#0000FF',
            YELLOW: '#FFFF00'
        };

        // Estado global
        let natalPlanets = [];
        let transitPlanets = [];
        let internalAspects = [];
        let interChartAspects = [];
        let showTransits = true;
        let selectedPlanet = null;
        let selectedAspect = null;
        
        // Referencias a elementos DOM
        const chartSvg = document.getElementById('chart');
        const tooltipEl = document.getElementById('tooltip');
        const toggleTransitsCheckbox = document.getElementById('toggle-transits');
        const showTransitsCheckbox = document.getElementById('show-transits');
        const transitControlsDiv = document.getElementById('transit-controls');
        const selectedInfoEl = document.getElementById('selected-info');
        const infoToggleEl = document.getElementById('info-toggle');
        const infoContentEl = document.getElementById('info-content');
        const calculateBtn = document.getElementById('calculate-btn');
        const cityInput = document.getElementById('city');
        const dateInput = document.getElementById('date');
        const timeInput = document.getElementById('time');
        const transitCityInput = document.getElementById('transit-city');
        const transitDateInput = document.getElementById('transit-date');
        const transitTimeInput = document.getElementById('transit-time');

        // Establecer fechas actuales por defecto
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const timeStr = today.toTimeString().slice(0, 5);
        
        dateInput.value = dateStr;
        timeInput.value = timeStr;
        transitDateInput.value = dateStr;
        transitTimeInput.value = timeStr;

        // Event listeners
        toggleTransitsCheckbox.addEventListener('change', function() {
            showTransits = this.checked;
            renderChart();
        });
        
        showTransitsCheckbox.addEventListener('change', function() {
            transitControlsDiv.style.display = this.checked ? 'block' : 'none';
        });
        
        calculateBtn.addEventListener('click', calculateChart);
        
        infoToggleEl.addEventListener('click', function() {
            if (infoContentEl.style.display === 'none') {
                infoContentEl.style.display = 'block';
                infoToggleEl.textContent = '▼';
            } else {
                infoContentEl.style.display = 'none';
                infoToggleEl.textContent = '▶';
            }
        });

        // Calcular la carta
        async function calculateChart() {
            try {
                // Recoger datos del formulario
                const natalData = {
                    city: cityInput.value,
                    date: dateInput.value,
                    time: timeInput.value
                };
                
                const transitData = {
                    city: transitCityInput.value,
                    date: transitDateInput.value,
                    time: transitTimeInput.value
                };
                
                // Realizar petición al servidor
                const response = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        natal: natalData,
                        transit: transitData,
                        showTransits: showTransitsCheckbox.checked
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Error en la petición al servidor');
                }
                
                const data = await response.json();
                
                // Actualizar datos
                natalPlanets = data.natalPlanets;
                transitPlanets = data.transitPlanets;
                internalAspects = data.internalAspects;
                interChartAspects = data.interChartAspects;
                
                // Renderizar la carta
                renderChart();
                
            } catch (error) {
                console.error('Error:', error);
                alert('Error al calcular la carta: ' + error.message);
            }
        }

        // Función para calcular aspectos entre planetas
        function calculateAspects(planets1, planets2 = null) {
            const aspects = [];
            
            // Si solo pasamos un conjunto de planetas, calculamos aspectos internos
            if (!planets2) {
                planets2 = planets1;
            }
            
            // Filtramos planetas para incluir solo los tradicionales
            const validPlanets1 = planets1.filter(p => 
                ["SOL", "LUNA", "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO"].includes(p.name)
            );
            
            const validPlanets2 = planets2.filter(p => 
                ["SOL", "LUNA", "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO"].includes(p.name)
            );

            // Si estamos calculando aspectos entre dos cartas diferentes, usamos todos los planetas
            // Si estamos calculando aspectos dentro de la misma carta, evitamos duplicados
            for (let i = 0; i < validPlanets1.length; i++) {
                const startJ = planets1 === planets2 ? i + 1 : 0;
                for (let j = startJ; j < validPlanets2.length; j++) {
                    const planet1 = validPlanets1[i];
                    const planet2 = validPlanets2[j];
                    
                    // Evitar comparar un planeta consigo mismo
                    if (planet1 === planet2) continue;
                    
                    let diff = Math.abs(planet1.longitude - planet2.longitude);
                    if (diff > 180) diff = 360 - diff;
                    
                    for (const aspectType in ASPECTS) {
                        const aspect = ASPECTS[aspectType];
                        if (Math.abs(diff - aspect.angle) <= aspect.orb) {
                            aspects.push({
                                planet1: planet1.name,
                                planet2: planet2.name,
                                type: aspectType,
                                angle: diff,
                                color: aspect.color,
                                isInterChart: planets1 !== planets2
                            });
                            break;
                        }
                    }
                }
            }
            return aspects;
        }

        // Función para renderizar la carta
        function renderChart() {
            // Limpiar SVG
            chartSvg.innerHTML = '';
            
            // Dibujar círculo exterior
            createSvgElement('circle', {
                cx: DIMENSIONS.centerX,
                cy: DIMENSIONS.centerY,
                r: DIMENSIONS.radius,
                fill: 'none',
                stroke: '#333',
                'stroke-width': 2
            }, chartSvg);
            
            // Dibujar signos zodiacales
            SIGNS.forEach(sign => {
                const midAngle = ((sign.start + sign.length/2 - 90) * Math.PI) / 180;
                const glyphX = DIMENSIONS.centerX + DIMENSIONS.glyphRadius * Math.cos(midAngle);
                const glyphY = DIMENSIONS.centerY + DIMENSIONS.glyphRadius * Math.sin(midAngle);
                
                // Dibujar sector
                const path = createSvgElement('path', {
                    d: createArcPath(sign.start, sign.start + sign.length),
                    fill: sign.color,
                    stroke: '#333',
                    'stroke-width': 1
                }, chartSvg);
                
                // Añadir símbolo
                const text = createSvgElement('text', {
                    x: glyphX,
                    y: glyphY,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    'font-size': 20
                }, chartSvg);
                text.textContent = sign.symbol;
            });
            
            // Dibujar círculo interior
            createSvgElement('circle', {
                cx: DIMENSIONS.centerX,
                cy: DIMENSIONS.centerY,
                r: DIMENSIONS.innerRadius,
                fill: 'white',
                stroke: '#333',
                'stroke-width': 1
            }, chartSvg);
            
            // Dibujar aspectos
            const aspectsToDisplay = [
                ...internalAspects,
                ...(showTransits ? interChartAspects : [])
            ];
            
            aspectsToDisplay.forEach((aspect, index) => {
                // Determinar los planetas y sus posiciones
                const planet1Source = aspect.isInterChart ? natalPlanets : natalPlanets;
                const planet2Source = aspect.isInterChart ? transitPlanets : natalPlanets;
                
                const planet1 = planet1Source.find(p => p.name === aspect.planet1);
                const planet2 = planet2Source.find(p => p.name === aspect.planet2);
                
                if (!planet1 || !planet2) return;
                
                const angle1 = (planet1.longitude - 90) * Math.PI / 180;
                const angle2 = (planet2.longitude - 90) * Math.PI / 180;
                
                const radius = DIMENSIONS.innerRadius;
                // Para planetas de tránsito, usamos un radio ligeramente mayor al renderizar
                const radius2 = aspect.isInterChart ? DIMENSIONS.innerRadius + 60 : radius;
                
                const x1 = DIMENSIONS.centerX + radius * Math.cos(angle1);
                const y1 = DIMENSIONS.centerY + radius * Math.sin(angle1);
                const x2 = DIMENSIONS.centerX + radius2 * Math.cos(angle2);
                const y2 = DIMENSIONS.centerY + radius2 * Math.sin(angle2);
                
                const line = createSvgElement('line', {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2,
                    stroke: aspect.color,
                    'stroke-width': selectedAspect === aspect ? "3" : "1",
                    'stroke-dasharray': aspect.isInterChart ? "3,3" : "none",
                    'class': 'aspect-line',
                    'data-aspect-index': index
                }, chartSvg);
                
                line.addEventListener('click', () => {
                    selectAspect(aspect);
                });
                
                line.addEventListener('mouseover', (e) => {
                    showTooltip(`${aspect.planet1} ${ASPECTS[aspect.type].name} ${aspect.planet2} (${aspect.angle.toFixed(2)}°)`, e);
                });
                
                line.addEventListener('mouseout', hideTooltip);
            });
            
            // Dibujar planetas natales
            natalPlanets.forEach((planet) => {
                const adjustment = adjustPlanetLabel(planet, natalPlanets, DIMENSIONS.innerRadius - 20);
                const adjustedAngle = ((planet.longitude + adjustment.angleOffset - 90) * Math.PI) / 180;
                const x = DIMENSIONS.centerX + DIMENSIONS.innerRadius * Math.cos(adjustedAngle);
                const y = DIMENSIONS.centerY + DIMENSIONS.innerRadius * Math.sin(adjustedAngle);
                
                const labelX = DIMENSIONS.centerX + adjustment.radius * Math.cos(adjustedAngle);
                const labelY = DIMENSIONS.centerY + adjustment.radius * Math.sin(adjustedAngle);
                
                const isSelected = selectedPlanet && 
                                    selectedPlanet.name === planet.name && 
                                    selectedPlanet.isNatal;
                
                const color = getPlanetColor(planet.name, planet.longitude);
                
                // Dibujar círculo del planeta
                const circle = createSvgElement('circle', {
                    cx: x,
                    cy: y,
                    r: isSelected ? "8" : "6",
                    fill: color,
                    stroke: '#000',
                    'stroke-width': isSelected ? "2" : "1",
                    'class': 'planet-circle',
                    'data-planet': planet.name,
                    'data-is-natal': 'true'
                }, chartSvg);
                
                // Dibujar símbolo del planeta
                const text = createSvgElement('text', {
                    x: labelX,
                    y: labelY,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    'font-size': isSelected ? "18" : "16",
                    'font-weight': 'bold',
                    'fill': '#111',
                    'class': 'planet-symbol',
                    'data-planet': planet.name,
                    'data-is-natal': 'true'
                }, chartSvg);
                text.textContent = PLANET_SYMBOLS[planet.name] || planet.name;
                
                // Añadir eventos
                [circle, text].forEach(element => {
                    element.addEventListener('click', () => {
                        selectPlanet(planet.name, true);
                    });
                    
                    element.addEventListener('mouseover', (e) => {
                        showTooltip(`${planet.name}: ${planet.longitude.toFixed(2)}° ${planet.sign}`, e);
                    });
                    
                    element.addEventListener('mouseout', hideTooltip);
                });
            });
            
            // Dibujar planetas de tránsito
            if (showTransits && transitPlanets.length > 0) {
                transitPlanets.forEach((planet) => {
                    const transitRadius = DIMENSIONS.innerRadius + 60;
                    
                    const adjustment = adjustPlanetLabel(planet, transitPlanets, transitRadius + 20);
                    const adjustedAngle = ((planet.longitude + adjustment.angleOffset - 90) * Math.PI) / 180;
                    
                    const x = DIMENSIONS.centerX + transitRadius * Math.cos(adjustedAngle);
                    const y = DIMENSIONS.centerY + transitRadius * Math.sin(adjustedAngle);
                    
                    const labelX = DIMENSIONS.centerX + (transitRadius + 20) * Math.cos(adjustedAngle);
                    const labelY = DIMENSIONS.centerY + (transitRadius + 20) * Math.sin(adjustedAngle);
                    
                    const isSelected = selectedPlanet && 
                                        selectedPlanet.name === planet.name && 
                                        !selectedPlanet.isNatal;
                    
                    const color = getPlanetColor(planet.name, planet.longitude);
                    
                    // Dibujar círculo del planeta
                    const circle = createSvgElement('circle', {
                        cx: x,
                        cy: y,
                        r: isSelected ? "8" : "6",
                        fill: color,
                        stroke: '#000',
                        'stroke-width': isSelected ? "2" : "1",
                        'class': 'planet-circle',
                        'data-planet': planet.name,
                        'data-is-natal': 'false'
                    }, chartSvg);
                    
                    // Dibujar símbolo del planeta
                    const text = createSvgElement('text', {
                        x: labelX,
                        y: labelY,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle',
                        'font-size': isSelected ? "18" : "16",
                        'font-weight': 'bold',
                        'fill': '#555',
                        'class': 'planet-symbol',
                        'data-planet': planet.name,
                        'data-is-natal': 'false'
                    }, chartSvg);
                    text.textContent = PLANET_SYMBOLS[planet.name] || planet.name;
                    
                    // Añadir eventos
                    [circle, text].forEach(element => {
                        element.addEventListener('click', () => {
                            selectPlanet(planet.name, false);
                        });
                        
                        element.addEventListener('mouseover', (e) => {
                            showTooltip(`${planet.name} (Tránsito): ${planet.longitude.toFixed(2)}° ${planet.sign}`, e);
                        });
                        
                        element.addEventListener('mouseout', hideTooltip);
                    });
                });
            }
            
            // Actualizar panel de información
            updateInfoPanel();
        }

        // Función para actualizar el panel de información
        function updateInfoPanel() {
            if (selectedPlanet) {
                const planetSource = selectedPlanet.isNatal ? natalPlanets : transitPlanets;
                const planet = planetSource.find(p => p.name === selectedPlanet.name);
                
                if (planet) {
                    selectedInfoEl.innerHTML = `
                        <h4 class="font-bold">${planet.name} ${!selectedPlanet.isNatal ? '(Tránsito)' : ''}</h4>
                        <div>${planet.longitude.toFixed(2)}° ${planet.sign}</div>
                    `;
                }
            } else if (selectedAspect) {
                const aspectName = ASPECTS[selectedAspect.type]?.name || selectedAspect.type;
                selectedInfoEl.innerHTML = `
                    <div class="font-bold">
                        ${selectedAspect.planet1} ${aspectName} ${selectedAspect.planet2}
                    </div>
                    <div>${selectedAspect.angle.toFixed(2)}°</div>
                `;
            } else {
                selectedInfoEl.textContent = 'Selecciona un planeta o aspecto para ver detalles';
            }
        }

        // Funciones para selección
        function selectPlanet(planetName, isNatal) {
            if (selectedPlanet && selectedPlanet.name === planetName && selectedPlanet.isNatal === isNatal) {
                selectedPlanet = null;
            } else {
                selectedPlanet = { name: planetName, isNatal };
                selectedAspect = null;
            }
            
            renderChart();
        }

        function selectAspect(aspect) {
            if (selectedAspect === aspect) {
                selectedAspect = null;
            } else {
                selectedAspect = aspect;
                selectedPlanet = null;
            }
            
            renderChart();
        }

        // Funciones para tooltip
        function showTooltip(text, event) {
            tooltipEl.textContent = text;
            tooltipEl.style.display = 'block';
            
            const rect = chartSvg.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            tooltipEl.style.left = (x + 10) + 'px';
            tooltipEl.style.top = (y + 10) + 'px';
        }

        function hideTooltip() {
            tooltipEl.style.display = 'none';
        }

        // Funciones auxiliares
        function createSvgElement(tag, attributes = {}, parent = null) {
            const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
            
            for (const [attr, value] of Object.entries(attributes)) {
                element.setAttribute(attr, value);
            }
            
            if (parent) {
                parent.appendChild(element);
            }
            
            return element;
        }

        function createArcPath(startAngle, endAngle) {
            const start = ((startAngle - 90) * Math.PI) / 180;
            const end = ((endAngle - 90) * Math.PI) / 180;
            
            const x1 = DIMENSIONS.centerX + DIMENSIONS.radius * Math.cos(start);
            const y1 = DIMENSIONS.centerY + DIMENSIONS.radius * Math.sin(start);
            const x2 = DIMENSIONS.centerX + DIMENSIONS.radius * Math.cos(end);
            const y2 = DIMENSIONS.centerY + DIMENSIONS.radius * Math.sin(end);
            
            const x1Inner = DIMENSIONS.centerX + DIMENSIONS.innerRadius * Math.cos(start);
            const y1Inner = DIMENSIONS.centerY + DIMENSIONS.innerRadius * Math.sin(start);
            const x2Inner = DIMENSIONS.centerX + DIMENSIONS.innerRadius * Math.cos(end);
            const y2Inner = DIMENSIONS.centerY + DIMENSIONS.innerRadius * Math.sin(end);
            
            const largeArcFlag = end - start <= Math.PI ? "0" : "1";
            
            return `M ${x1} ${y1} A ${DIMENSIONS.radius} ${DIMENSIONS.radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x2Inner} ${y2Inner} A ${DIMENSIONS.innerRadius} ${DIMENSIONS.innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner} Z`;
        }

        function adjustPlanetLabel(planet, allPlanets, radius) {
            const angleDiff = 7;
            
            const nearbyPlanets = allPlanets.filter(p => {
                if (p.name === planet.name) return false;
                let diff = Math.abs(p.longitude - planet.longitude);
                if (diff > 180) diff = 360 - diff;
                return diff < angleDiff;
            });
            
            if (nearbyPlanets.length === 0) {
                return {
                    radius: radius,
                    angleOffset: 0
                };
            }
            
            const isLower = planet.name < nearbyPlanets[0].name;
            const radiusOffset = isLower ? 0 : 15;
            const angleOffset = isLower ? -1 : 1;
            
            return {
                radius: radius + radiusOffset,
                angleOffset: angleOffset * 3
            };
        }

        function getPlanetColor(planet, longitude) {
            if (planet === 'ASC' || planet === 'MC' || planet === 'DSC' || planet === 'IC') return '#000000';
            
            if (planet === 'JÚPITER') {
                if ((longitude >= 306.00 && longitude <= 360.00) || (longitude >= 0.00 && longitude <= 150.00)) 
                    return COLORS.BLUE;
                if (longitude > 150.00 && longitude < 306.00) 
                    return COLORS.RED;
            }

            if (planet === 'SATURNO') {
                if ((longitude >= 330.00 && longitude <= 360.00) || (longitude >= 0.00 && longitude <= 150.00))
                    return COLORS.YELLOW;
                if (longitude > 240.00 && longitude <= 252.00) return COLORS.YELLOW;
                if (longitude > 252.00 && longitude <= 330.00) return COLORS.RED;
                if (longitude > 150.00 && longitude <= 240.00) return COLORS.RED;
                return COLORS.YELLOW;
            }

            if (longitude > 150.00 && longitude <= 330.00) {
                switch(planet) {
                    case 'SOL': case 'MERCURIO': case 'URANO': return COLORS.GREEN;
                    case 'VENUS': case 'LUNA': return COLORS.YELLOW;
                    case 'MARTE': case 'PLUTÓN': return COLORS.BLUE;
                    case 'NEPTUNO': return COLORS.RED;
                    default: return '#000000';
                }
            } else {
                switch(planet) {
                    case 'SOL': case 'MARTE': case 'PLUTÓN': return COLORS.RED;
                    case 'VENUS': return COLORS.GREEN;
                    case 'MERCURIO': case 'SATURNO': case 'URANO': return COLORS.YELLOW;
                    case 'LUNA': case 'NEPTUNO': return COLORS.BLUE;
                    default: return '#000000';
                }
            }
        }

        // Iniciar la aplicación con datos de ejemplo
        calculateChart();
    </script>
</body>
</html>
"""