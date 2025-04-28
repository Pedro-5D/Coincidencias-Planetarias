document.addEventListener('DOMContentLoaded', function() {
    // Constantes
    const PLANET_DATA = {
        'SOL': { numero: 1 },
        'LUNA': { numero: 6 },
        'MERCURIO': { numero: 4 },
        'VENUS': { numero: 3 },
        'MARTE': { numero: 5 },
        'JÚPITER': { numero: 2 },
        'SATURNO': { numero: 7 }
    };
    
    const PLANET_ORDER = {
        seco: ['SOL', 'MARTE', 'JÚPITER', 'SATURNO', 'LUNA', 'MERCURIO', 'VENUS'],
        humedo: ['LUNA', 'MERCURIO', 'VENUS', 'SOL', 'MARTE', 'JÚPITER', 'SATURNO']
    };
    
    const DURACION_POR_NIVEL = {
        'virgo': 4, 'libra': 3, 'escorpio': 5, 'ofiuco': 7, 'sagitario': 2,
        'capricornio': 1, 'acuario': 6, 'piscis': 2, 'aries': 5, 'tauro': 3,
        'geminis': 4, 'cancer': 6, 'leo': 1
    };
    
    const SIGNOS = {
        'virgo': { planeta: 'MERCURIO', años: 4 },
        'libra': { planeta: 'VENUS', años: 3 },
        'escorpio': { planeta: 'MARTE', años: 5 },
        'ofiuco': { planeta: 'SATURNO', años: 7 },
        'sagitario': { planeta: 'JÚPITER', años: 2 },
        'capricornio': { planeta: 'SOL', años: 1 },
        'acuario': { planeta: 'LUNA', años: 6 },
        'piscis': { planeta: 'JÚPITER', años: 2 },
        'aries': { planeta: 'MARTE', años: 5 },
        'tauro': { planeta: 'VENUS', años: 3 },
        'geminis': { planeta: 'MERCURIO', años: 4 },
        'cancer': { planeta: 'LUNA', años: 6 },
        'leo': { planeta: 'SOL', años: 1 }
    };
    
    const DURACIONES = {
        AÑO: 364,
        MES: 28,
        SEMANA: 7,
        DIA: 1
    };
    
    const DIMENSIONS = {
        centerX: 300,
        centerY: 300,
        radius: 250,
        middleRadius: 180,
        innerRadius: 110,
        glyphRadius: 235
    };
    
    const SIGNS = [
        {name: 'ARIES', start: 0, length: 30, symbol: '♈', color: '#FFE5E5'},
        {name: 'TAURO', start: 30, length: 30, symbol: '♉', color: '#E5FFE5'},
        {name: 'GÉMINIS', start: 60, length: 30, symbol: '♊', color: '#FFFFE5'},
        {name: 'CÁNCER', start: 90, length: 30, symbol: '♋', color: '#E5FFFF'},
        {name: 'LEO', start: 120, length: 30, symbol: '♌', color: '#FFE5E5'},
        {name: 'VIRGO', start: 150, length: 30, symbol: '♍', color: '#E5FFE5'},
        {name: 'LIBRA', start: 180, length: 30, symbol: '♎', color: '#FFFFE5'},
        {name: 'ESCORPIO', start: 210, length: 30, symbol: '♏', color: '#E5FFFF'},
        {name: 'SAGITARIO', start: 240, length: 30, symbol: '♐', color: '#FFE5E5'},
        {name: 'CAPRICORNIO', start: 270, length: 30, symbol: '♑', color: '#E5FFE5'},
        {name: 'ACUARIO', start: 300, length: 30, symbol: '♒', color: '#FFFFE5'},
        {name: 'PISCIS', start: 330, length: 30, symbol: '♓', color: '#E5FFFF'}
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
    
    // API Keys
    const GEOAPIFY_API_KEY = "e19afa2a9d6643ea9550aab89eefce0b";
    
    // Variables globales
    let natalPlanets = [];
    let transitPlanets = [];
    let natalCityCoordinates = null;
    let transitCityCoordinates = null;
    let coincidencias = [];
    let isDry = null;
    let ascendente = "";
    
    // Elementos DOM
    const natalCityInput = document.getElementById('natal-city');
    const natalCityResults = document.getElementById('natal-city-results');
    const natalDateInput = document.getElementById('natal-date');
    const natalTimeInput = document.getElementById('natal-time');
    
    const transitCityInput = document.getElementById('transit-city');
    const transitCityResults = document.getElementById('transit-city-results');
    const transitDateInput = document.getElementById('transit-date');
    const transitTimeInput = document.getElementById('transit-time');
    
    const showTransitsToggle = document.getElementById('show-transits');
    const transitsContainer = document.getElementById('transits-container');
    
    const calculateBtn = document.getElementById('calculate-btn');
    const errorMsg = document.getElementById('error-msg');
    
    const coincidenciasSection = document.getElementById('coincidencias-section');
    const toggleCoincidenciasBtn = document.getElementById('toggle-coincidencias');
    const coincidenciasContainer = document.getElementById('coincidencias-container');
    
    const chartContainer = document.getElementById('chart-container');
    const chartSvg = document.getElementById('chart-svg');
    
    const natalInfo = document.getElementById('natal-info');
    const ascedenteText = document.getElementById('ascendente-text');
    const birthTypeText = document.getElementById('birth-type-text');
    
    const natalPositions = document.getElementById('natal-positions');
    const transitPositionsContainer = document.getElementById('transit-positions-container');
    const transitPositions = document.getElementById('transit-positions');
    const interChartAspectsContainer = document.getElementById('inter-chart-aspects-container');
    
    // Inicialización
    function init() {
        // Establecer fecha y hora actuales
        const now = new Date();
        natalDateInput.value = now.toISOString().split('T')[0];
        natalTimeInput.value = now.toTimeString().slice(0, 5);
        
        transitDateInput.value = now.toISOString().split('T')[0];
        transitTimeInput.value = now.toTimeString().slice(0, 5);
        
        // Event listeners
        natalCityInput.addEventListener('input', debounce(function() {
            handleCitySearch(natalCityInput.value, false);
        }, 300));
        
        transitCityInput.addEventListener('input', debounce(function() {
            handleCitySearch(transitCityInput.value, true);
        }, 300));
        
        showTransitsToggle.addEventListener('change', toggleTransits);
        calculateBtn.addEventListener('click', calculateChart);
        
        toggleCoincidenciasBtn.addEventListener('click', toggleCoincidencias);
        
        // Inicializar el estado de los tránsitos
        toggleTransits();
    }
    
    // Función para manejar la búsqueda de ciudades
    function handleCitySearch(searchText, isTransit) {
        const searchQuery = searchText.trim();
        const resultsContainer = isTransit ? transitCityResults : natalCityResults;
        
        if (searchQuery.length < 3) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.add('hidden');
            return;
        }
        
        // Crear ciudades de ejemplo (en lugar de llamar a la API)
        const cities = [
            { value: `${searchQuery}, España`, label: `${searchQuery}, España`, lat: 40.416, lon: -3.703 },
            { value: `${searchQuery}, México`, label: `${searchQuery}, México`, lat: 19.432, lon: -99.133 },
            { value: `${searchQuery}, Argentina`, label: `${searchQuery}, Argentina`, lat: -34.603, lon: -58.381 },
            { value: `${searchQuery}, Estados Unidos`, label: `${searchQuery}, Estados Unidos`, lat: 37.090, lon: -95.712 },
            { value: `${searchQuery}, Brasil`, label: `${searchQuery}, Brasil`, lat: -15.826, lon: -47.921 }
        ];
        
        displayCityResults(cities, resultsContainer, isTransit ? selectTransitCity : selectNatalCity);
    }
    
    // Función para obtener zona horaria a partir de coordenadas usando time_zone.csv local
    async function getTimezone(lat, lon, date) {
        try {
            // Intentar cargar el archivo CSV de zonas horarias
            const response = await fetch('time_zone.csv');
            const csvData = await response.text();
            
            // Parsear el CSV
            const lines = csvData.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Buscando columnas para offset, nombre de zona, etc.
            const possibleOffsetColumns = headers.filter(h => 
                h.toLowerCase().includes('offset') || 
                h.toLowerCase().includes('utc') || 
                h.toLowerCase().includes('gmt') ||
                h.match(/^[-+]?\d/)
            );
            
            const possibleNameColumns = headers.filter(h => 
                h.toLowerCase().includes('zone') || 
                h.toLowerCase().includes('region') || 
                h.toLowerCase().includes('name') || 
                h.toLowerCase().includes('area') ||
                h.toLowerCase().includes('location')
            );
            
            // Si no encontramos columnas adecuadas, usamos estimación por longitud
            if (possibleOffsetColumns.length === 0) {
                console.warn("No se encontraron columnas de offset en el CSV");
                return estimateTimezoneByLongitude(lon);
            }
            
            // Estimar la zona horaria basada en la longitud para comparación
            const estimatedOffset = Math.round(lon / 15);
            
            // Buscar la zona horaria más cercana
            let bestMatch = null;
            let smallestDifference = Infinity;
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue; // Saltar líneas vacías
                
                const columns = lines[i].split(',').map(c => c.trim());
                if (columns.length < headers.length) continue;
                
                // Intentar encontrar el offset en las columnas candidatas
                let foundOffset = null;
                for (const colName of possibleOffsetColumns) {
                    const colIndex = headers.indexOf(colName);
                    if (colIndex >= 0) {
                        // Intentar interpretar el valor como número
                        const rawValue = columns[colIndex];
                        const numValue = parseFloat(rawValue);
                        
                        if (!isNaN(numValue)) {
                            foundOffset = numValue;
                            break;
                        } else if (typeof rawValue === 'string') {
                            // Intentar extraer número de textos como "GMT+3" o "UTC-5"
                            const match = rawValue.match(/[+-]?\d+(\.\d+)?/);
                            if (match) {
                                foundOffset = parseFloat(match[0]);
                                break;
                            }
                        }
                    }
                }
                
                // Si no encontramos offset, saltamos esta línea
                if (foundOffset === null) continue;
                
                // Calcular la diferencia con el offset estimado
                const difference = Math.abs(estimatedOffset - foundOffset);
                
                if (difference < smallestDifference) {
                    smallestDifference = difference;
                    
                    // Intentar obtener el nombre de la zona
                    let zoneName = "Unknown";
                    for (const colName of possibleNameColumns) {
                        const colIndex = headers.indexOf(colName);
                        if (colIndex >= 0 && columns[colIndex]) {
                            zoneName = columns[colIndex];
                            break;
                        }
                    }
                    
                    bestMatch = {
                        name: zoneName,
                        offset: foundOffset,
                        abbreviation: `GMT${foundOffset >= 0 ? '+' : ''}${foundOffset}`,
                        source: 'csv'
                    };
                }
            }
            
            if (bestMatch) {
                console.log("Zona horaria encontrada en CSV:", bestMatch);
                return bestMatch;
            } else {
                throw new Error('No se encontró zona horaria adecuada en el CSV');
            }
        } catch (error) {
            console.error('Error obteniendo zona horaria desde CSV:', error);
            return estimateTimezoneByLongitude(lon);
        }
    }
    
    // Función auxiliar para estimar zona horaria por longitud
    function estimateTimezoneByLongitude(lon) {
        const estimatedOffset = Math.round(lon / 15);
        return {
            name: `Estimated GMT${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}`,
            offset: estimatedOffset,
            abbreviation: `GMT${estimatedOffset}`,
            estimated: true
        };
    }
    
    // Función para mostrar resultados de búsqueda de ciudades
    function displayCityResults(cities, resultsContainer, selectCallback) {
        resultsContainer.innerHTML = '';
        
        cities.forEach(city => {
            const div = document.createElement('div');
            div.className = 'p-2 hover:bg-gray-100 cursor-pointer';
            div.textContent = city.label;
            div.addEventListener('click', () => selectCallback(city));
            
            resultsContainer.appendChild(div);
        });
        
        resultsContainer.classList.remove('hidden');
    }
    
    // Función para seleccionar ciudad natal
    function selectNatalCity(city) {
        natalCityInput.value = city.value;
        natalCityResults.classList.add('hidden');
        natalCityCoordinates = { lat: city.lat, lon: city.lon };
        console.log("Coordenadas de ciudad natal establecidas:", natalCityCoordinates);
    }
    
    // Función para seleccionar ciudad de tránsito
    function selectTransitCity(city) {
        transitCityInput.value = city.value;
        transitCityResults.classList.add('hidden');
        transitCityCoordinates = { lat: city.lat, lon: city.lon };
        console.log("Coordenadas de ciudad de tránsito establecidas:", transitCityCoordinates);
    }
    
    // Función para mostrar/ocultar sección de tránsitos
    function toggleTransits() {
        const isChecked = showTransitsToggle.checked;
        
        if (isChecked) {
            transitsContainer.classList.remove('opacity-50', 'pointer-events-none');
            transitPositionsContainer.classList.remove('hidden');
            interChartAspectsContainer.classList.remove('hidden');
        } else {
            transitsContainer.classList.add('opacity-50', 'pointer-events-none');
            transitPositionsContainer.classList.add('hidden');
            interChartAspectsContainer.classList.add('hidden');
        }
    }
    
    // Función para mostrar/ocultar coincidencias
    function toggleCoincidencias() {
        const isVisible = coincidenciasContainer.classList.toggle('hidden');
        toggleCoincidenciasBtn.textContent = isVisible ? 'Mostrar Coincidencias' : 'Ocultar Coincidencias';
    }
    
    // Función para expandir/colapsar años en coincidencias
    function toggleYearExpansion(year) {
        // Cerrar todos los otros años
        document.querySelectorAll('.year-content').forEach(el => {
            if (el.id !== `coincidencias-${year}`) {
                el.classList.add('hidden');
            }
        });
        
        // Toggle del año seleccionado
        const yearContent = document.getElementById(`coincidencias-${year}`);
        yearContent.classList.toggle('hidden');
    }
    
    // Función para calcular la carta astral
    async function calculateChart() {
        // Verificar si hay ciudad pero no coordenadas, y asignar coordenadas predeterminadas
        if (natalCityInput.value && !natalCityCoordinates) {
            console.log("Coordenadas natales no encontradas, usando valores predeterminados");
            natalCityCoordinates = { lat: 40.416, lon: -3.703 }; // Madrid como predeterminado
        }
        
        if (showTransitsToggle.checked && transitCityInput.value && !transitCityCoordinates) {
            console.log("Coordenadas de tránsito no encontradas, usando valores predeterminados");
            transitCityCoordinates = { lat: 40.416, lon: -3.703 }; // Madrid como predeterminado
        }
        
        // Validar entradas
        if (!natalCityInput.value || !natalDateInput.value || !natalTimeInput.value) {
            showError("Debes ingresar ciudad, fecha y hora para la carta natal.");
            return;
        }
        
        if (showTransitsToggle.checked && (!transitCityInput.value || !transitDateInput.value || !transitTimeInput.value)) {
            showError("Debes ingresar ciudad, fecha y hora para los tránsitos.");
            return;
        }
        
        try {
            showError("Calculando... por favor espera", false);
            
            // Obtener zona horaria para la carta natal
            const natalTimezone = await getTimezone(
                natalCityCoordinates.lat, 
                natalCityCoordinates.lon, 
                natalDateInput.value
            );
            
            // Calcular ascendente usando datos reales
            const ascData = calculateAscendant(
                natalDateInput.value,
                natalTimeInput.value,
                natalCityCoordinates.lat,
                natalCityCoordinates.lon,
                natalTimezone.offset
            );
            
            // Calcular posiciones planetarias
            natalPlanets = mockCalculatePositions(true, ascData.sign, ascData.longitude);
            
            // Obtener info del tipo de nacimiento
            const ascPosition = natalPlanets.find(p => p.name === "ASC");
            const sunPosition = natalPlanets.find(p => p.name === "SOL");
            
            if (ascPosition && sunPosition) {
                // Determinar si es nacimiento seco o húmedo
                isDry = isDryBirth(sunPosition.longitude, ascPosition.longitude);
                ascendente = ascPosition.sign;
                
                // Mostrar info del nacimiento
                natalInfo.classList.remove('hidden');
                ascedenteText.textContent = ascendente;
                birthTypeText.textContent = isDry ? 'Seco' : 'Húmedo';
                
                // Calcular Fardarias y Relevos Zodiacales
                const birthDate = new Date(natalDateInput.value);
                const fardarias = calculateFardariaPeriods(birthDate, isDry);
                
                // Obtener signo para Relevo Zodiacal
                const signToRelevo = {
                    "ARIES": "aries", "TAURO": "tauro", "GÉMINIS": "geminis", "CÁNCER": "cancer",
                    "LEO": "leo", "VIRGO": "virgo", "LIBRA": "libra", "ESCORPIO": "escorpio",
                    "SAGITARIO": "sagitario", "CAPRICORNIO": "capricornio",
                    "ACUARIO": "acuario", "PISCIS": "piscis"
                };
                const releveSigno = signToRelevo[ascPosition.sign] || "aries";
                const relevos = calcularRelevodPeriods(birthDate, releveSigno);
                
                // Buscar coincidencias
                coincidencias = buscarCoincidencias(fardarias, relevos);
            }
            
            // Calcular tránsitos si están habilitados
            if (showTransitsToggle.checked) {
                const transitTimezone = await getTimezone(
                    transitCityCoordinates.lat, 
                    transitCityCoordinates.lon, 
                    transitDateInput.value
                );
                
                const transitAscData = calculateAscendant(
                    transitDateInput.value,
                    transitTimeInput.value,
                    transitCityCoordinates.lat,
                    transitCityCoordinates.lon,
                    transitTimezone.offset
                );
                
                transitPlanets = mockCalculatePositions(false, transitAscData.sign, transitAscData.longitude);
            } else {
                transitPlanets = [];
            }
            
            // Renderizar la carta
            renderChart();
            
            // Renderizar coincidencias
            renderCoincidencias();
            
            // Mostrar secciones relevantes
            chartContainer.classList.remove('hidden');
            
            if (coincidencias.length > 0) {
                coincidenciasSection.classList.remove('hidden');
            }
            
            clearError();
            
        } catch (error) {
            console.error("Error en los cálculos:", error);
            showError("Ocurrió un error en los cálculos. Por favor intenta de nuevo.");
        }
    }
    
    // Función para calcular el ascendente
    function calculateAscendant(date, time, lat, lon, timezoneOffset) {
        try {
            // Convertir fecha y hora a UTC teniendo en cuenta el huso horario
            const dateTime = new Date(`${date}T${time}`);
            
            // Ajustar a UTC restando el offset
            const utcTime = new Date(dateTime.getTime() - (timezoneOffset * 60 * 60 * 1000));
            
            // Día Juliano para la fecha/hora UTC
            const julianDay = calculateJulianDay(utcTime);
            
            // Tiempo sideral en Greenwich
            const gst = calculateGreenwichSiderealTime(julianDay);
            
            // Tiempo sideral local
            const lst = (gst + lon / 15) % 24;
            
            // Convertir a grados
            const lstDegrees = lst * 15;
            
            // Calcular el Ascendente
            const obliquity = 23.4393; // Oblicuidad de la eclíptica (aproximado)
            const ascendant = calculateAscendantFromLST(lstDegrees, lat, obliquity);
            
            // Determinar el signo zodiacal
            const sign = getSignFromLongitude(ascendant);
            
            return {
                longitude: ascendant,
                sign: sign,
                lstDegrees: lstDegrees
            };
        } catch (error) {
            console.error("Error calculando ascendente:", error);
            return {
                longitude: 0,
                sign: "ARIES",
                error: true
            };
        }
    }
    
    // Función para calcular el Día Juliano
    function calculateJulianDay(date) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hour = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
        
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
        
        let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 
                 Math.floor(y / 100) + Math.floor(y / 400) - 32045 + hour / 24;
        
        return jd;
    }
    
    // Función para calcular el Tiempo Sideral en Greenwich
    function calculateGreenwichSiderealTime(jd) {
        const t = (jd - 2451545.0) / 36525; // Siglos julianos desde J2000.0
        let gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                  t*t * (0.000387933 - t / 38710000);
        
        // Normalizar a rango 0-360
        gst = gst % 360;
        if (gst < 0) gst += 360;
        
        // Convertir a horas
        return gst / 15;
    }
    
    // Función para calcular el Ascendente a partir del Tiempo Sideral Local
    function calculateAscendantFromLST(lst, lat, obliquity) {
        // Convertir a radianes
        const latRad = lat * Math.PI / 180;
        const oblRad = obliquity * Math.PI / 180;
        const lstRad = lst * Math.PI / 180;
        
        // Calcular el ascendente
        const sinAsc = -Math.cos(lstRad) / Math.cos(latRad);
        const cosAsc = -Math.sin(lstRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
        
        // Obtener el ángulo en radianes y convertir a grados
        let asc = Math.atan2(sinAsc, cosAsc) * 180 / Math.PI;
        
        // Normalizar a rango 0-360
        if (asc < 0) asc += 360;
        
        return asc;
    }

// Función para determinar el signo basado en la longitud
function getSignFromLongitude(longitude) {
    longitude = longitude % 360;
    
    for (const sign of SIGNS) {
        const end = (sign.start + sign.length) % 360;
        if (sign.start <= end) {
            // Caso normal
            if (longitude >= sign.start && longitude < end) {
                return sign.name;
            }
        } else {
            // Caso especial que cruza 0°
            if (longitude >= sign.start || longitude < end) {
                return sign.name;
            }
        }
    }
    
    return "ARIES"; // Por defecto
}
    
    // Función para renderizar la carta astral
    function renderChart() {
        // Limpiar SVG
        chartSvg.innerHTML = '';
        
        // Dibujar círculo exterior
        appendSVG('circle', {
            cx: DIMENSIONS.centerX,
            cy: DIMENSIONS.centerY,
            r: DIMENSIONS.radius,
            fill: 'none',
            stroke: '#333',
            'stroke-width': 2
        });
        
        // Dibujar signos zodiacales
        SIGNS.forEach(sign => {
            const startAngle = sign.start;
            const endAngle = sign.start + sign.length;
            
            // Dibujar sector del signo
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', createArcPath(startAngle, endAngle));
            path.setAttribute('fill', sign.color);
            path.setAttribute('stroke', '#333');
            path.setAttribute('stroke-width', '1');
            path.classList.add('zodiac-sign');
            chartSvg.appendChild(path);
            
            // Añadir símbolo del signo
            const midAngle = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
            const symbolX = DIMENSIONS.centerX + (DIMENSIONS.radius - 30) * Math.cos(midAngle);
            const symbolY = DIMENSIONS.centerY + (DIMENSIONS.radius - 30) * Math.sin(midAngle);
            
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', symbolX);
            text.setAttribute('y', symbolY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('font-size', '20');
            text.textContent = sign.symbol;
            chartSvg.appendChild(text);
        });
        
        // Dibujar círculo intermedio para tránsitos si están habilitados
        if (showTransitsToggle.checked) {
            appendSVG('circle', {
                cx: DIMENSIONS.centerX,
                cy: DIMENSIONS.centerY,
                r: DIMENSIONS.middleRadius,
                fill: 'none',
                stroke: '#333',
                'stroke-width': 1,
                'stroke-dasharray': '5,5'
            });
        }
        
        // Dibujar círculo interior
        appendSVG('circle', {
            cx: DIMENSIONS.centerX,
            cy: DIMENSIONS.centerY,
            r: DIMENSIONS.innerRadius,
            fill: 'white',
            stroke: '#333',
            'stroke-width': 1
        });
        
        // Dibujar planetas natales
        natalPlanets.forEach(planet => {
            const angle = ((planet.longitude - 90) * Math.PI) / 180;
            const x = DIMENSIONS.centerX + (DIMENSIONS.innerRadius - 20) * Math.cos(angle);
            const y = DIMENSIONS.centerY + (DIMENSIONS.innerRadius - 20) * Math.sin(angle);
            
            // Círculo del planeta
            appendSVG('circle', {
                cx: x,
                cy: y,
                r: 5,
                fill: getPlanetColor(planet.name, planet.longitude),
                stroke: '#000',
                'stroke-width': 1,
                class: 'planet planet-natal'
            });
            
            // Símbolo del planeta
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', x);
            text.setAttribute('y', y - 10);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('font-size', '16');
            text.setAttribute('class', 'planet-symbol');
            text.textContent = PLANET_SYMBOLS[planet.name];
            chartSvg.appendChild(text);
        });
        
        // Dibujar planetas de tránsito si están habilitados
        if (showTransitsToggle.checked && transitPlanets.length > 0) {
            transitPlanets.forEach(planet => {
                const angle = ((planet.longitude - 90) * Math.PI) / 180;
                const x = DIMENSIONS.centerX + (DIMENSIONS.middleRadius + 20) * Math.cos(angle);
                const y = DIMENSIONS.centerY + (DIMENSIONS.middleRadius + 20) * Math.sin(angle);
                
                // Círculo del planeta
                appendSVG('circle', {
                    cx: x,
                    cy: y,
                    r: 5,
                    fill: getPlanetColor(planet.name, planet.longitude),
                    stroke: '#000',
                    'stroke-width': 1,
                    class: 'planet planet-transit'
                });
                
                // Símbolo del planeta
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('x', x);
                text.setAttribute('y', y - 10);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('alignment-baseline', 'middle');
                text.setAttribute('font-size', '16');
                text.setAttribute('class', 'planet-symbol');
                text.textContent = PLANET_SYMBOLS[planet.name];
                chartSvg.appendChild(text);
            });
        }
        
        // Renderizar posiciones de planetas
        renderPlanetPositions();
    }
    
    // Función para renderizar las posiciones de los planetas
    function renderPlanetPositions() {
        // Limpiar contenedores
        natalPositions.innerHTML = '';
        transitPositions.innerHTML = '';
        
        // Posiciones natales
        natalPlanets.forEach(planet => {
            const div = document.createElement('div');
            div.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer';
            div.innerHTML = `
                <span class="font-bold mr-2">${PLANET_SYMBOLS[planet.name]}</span>
                ${planet.name}: ${planet.longitude.toFixed(2)}° ${planet.sign}
            `;
            natalPositions.appendChild(div);
        });
        
        // Posiciones de tránsito si están habilitados
        if (showTransitsToggle.checked && transitPlanets.length > 0) {
            transitPlanets.forEach(planet => {
                const div = document.createElement('div');
                div.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer';
                div.innerHTML = `
                    <span class="font-bold mr-2">${PLANET_SYMBOLS[planet.name]}</span>
                    ${planet.name}: ${planet.longitude.toFixed(2)}° ${planet.sign}
                `;
                transitPositions.appendChild(div);
            });
        }
    }
    
    // Función para renderizar coincidencias
    function renderCoincidencias() {
        coincidenciasContainer.innerHTML = '';
        
        if (coincidencias.length === 0) return;
        
        // Agrupar por año
        const yearGroups = {};
        coincidencias.forEach(coin => {
            const year = coin.overlap.year;
            if (!yearGroups[year]) {
                yearGroups[year] = [];
            }
            yearGroups[year].push(coin);
        });
        
        // Crear elementos para cada año
        Object.keys(yearGroups).sort().forEach(year => {
            const yearDiv = document.createElement('div');
            yearDiv.className = 'border rounded-lg overflow-hidden';
            
            // Encabezado del año
            const yearHeader = document.createElement('div');
            yearHeader.className = 'bg-gray-100 p-3 font-semibold cursor-pointer flex justify-between items-center';
            yearHeader.innerHTML = `
                <span>Año ${year} (${yearGroups[year].length} coincidencias)</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            `;
            yearHeader.addEventListener('click', () => toggleYearExpansion(year));
            
            // Contenido del año (inicialmente oculto)
            const yearContent = document.createElement('div');
            yearContent.className = 'year-content hidden';
            yearContent.id = `coincidencias-${year}`;
            
            // Tabla de coincidencias
            const table = document.createElement('table');
            table.className = 'w-full table-auto';
            
            // Encabezado de la tabla
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr class="bg-gray-50">
                    <th class="p-2 text-left">Planeta (Fardarias)</th>
                    <th class="p-2 text-left">Signo (Relevo)</th>
                    <th class="p-2 text-left">Fecha Inicio</th>
                    <th class="p-2 text-left">Fecha Fin</th>
                    <th class="p-2 text-left">Acción</th>
                </tr>
            `;
            
            // Cuerpo de la tabla
            const tbody = document.createElement('tbody');
            
            yearGroups[year].forEach((coincidencia, index) => {
                const startFormatted = formatDate(coincidencia.overlap.start);
                const endFormatted = formatDate(coincidencia.overlap.end);
                
                // Calcular días de diferencia
                const daysDiff = Math.ceil(
                    (coincidencia.overlap.end - coincidencia.overlap.start) / (1000 * 60 * 60 * 24)
                );
                
                const tr = document.createElement('tr');
                tr.className = 'border-t hover:bg-gray-50';
                
                tr.innerHTML = `
                    <td class="p-2 font-medium">${coincidencia.planeta}</td>
                    <td class="p-2">${coincidencia.signo}</td>
                    <td class="p-2">${startFormatted}</td>
                    <td class="p-2">${endFormatted}</td>
                    <td class="p-2">
                        <div class="flex flex-wrap gap-1" id="buttons-coincidencia-${year}-${index}"></div>
                    </td>
                `;
                
                tbody.appendChild(tr);
                
                // Añadir botones dinámicamente
                setTimeout(() => {
                    const buttonsContainer = document.getElementById(`buttons-coincidencia-${year}-${index}`);
                    if (!buttonsContainer) return;
                    
                    if (daysDiff <= 3) {
                        // Crear botón para cada día
                        for (let i = 0; i <= daysDiff; i++) {
                            const date = new Date(coincidencia.overlap.start);
                            date.setDate(date.getDate() + i);
                            
                            const button = document.createElement('button');
                            button.className = 'bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded';
                            button.textContent = i + 1;
                            button.title = formatDate(date);
                            button.addEventListener('click', () => useCoincidenciaAsTransit(coincidencia, date));
                            
                            buttonsContainer.appendChild(button);
                        }
                    } else {
                        // Botones inicio, medio y fin
                        const startButton = document.createElement('button');
                        startButton.className = 'bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded';
                        startButton.textContent = 'Inicio';
                        startButton.title = startFormatted;
                        startButton.addEventListener('click', () => useCoincidenciaAsTransit(coincidencia, coincidencia.overlap.start));
                        
                        const midDate = new Date(coincidencia.overlap.start);
                        midDate.setDate(midDate.getDate() + Math.floor(daysDiff / 2));
                        const midButton = document.createElement('button');
                        midButton.className = 'bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded';
                        midButton.textContent = 'Medio';
                        midButton.title = formatDate(midDate);
                        midButton.addEventListener('click', () => useCoincidenciaAsTransit(coincidencia, midDate));
                        
                        const endButton = document.createElement('button');
                        endButton.className = 'bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded';
                        endButton.textContent = 'Final';
                        endButton.title = endFormatted;
                        endButton.addEventListener('click', () => useCoincidenciaAsTransit(coincidencia, coincidencia.overlap.end));
                        
                        buttonsContainer.appendChild(startButton);
                        buttonsContainer.appendChild(midButton);
                        buttonsContainer.appendChild(endButton);
                    }
                }, 0);
            });
            
            table.appendChild(thead);
            table.appendChild(tbody);
            yearContent.appendChild(table);
            
            yearDiv.appendChild(yearHeader);
            yearDiv.appendChild(yearContent);
            
            coincidenciasContainer.appendChild(yearDiv);
        });
    }
    
    // Función para usar una coincidencia como tránsito
    function useCoincidenciaAsTransit(coincidencia, specificDate) {
        const dateToUse = specificDate || coincidencia.overlap.start;
        
        // Formatear fecha
        const year = dateToUse.getFullYear();
        const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
        const day = String(dateToUse.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Establecer valores
        transitDateInput.value = formattedDate;
        
        // Si no hay ciudad de tránsito, usar la natal
        if (!transitCityInput.value) {
            transitCityInput.value = natalCityInput.value;
            transitCityCoordinates = natalCityCoordinates;
        }
        
        // Asegurar que los tránsitos estén activados
        showTransitsToggle.checked = true;
        toggleTransits();
        
        // Recalcular
        calculateChart();
    }
    
    // Funciones para Fardarias y Relevos Zodiacales
    
    // Función para calcular periodos de Fardarias (hasta 84 años)
    function calculateFardariaPeriods(birthDate, isDry) {
        const planetOrder = isDry ? PLANET_ORDER.seco : PLANET_ORDER.humedo;
        const allPeriods = [];
        let currentDay = 0;
        const maxDays = 84 * 365; // 84 años aproximadamente
        
        // Calculamos ciclos completos hasta llegar al máximo de días
        while (currentDay < maxDays) {
            for (let i = 0; i < planetOrder.length; i++) {
                const planet = planetOrder[i];
                const duration = calculateDuration(planet, 1);
                
                if (currentDay + duration > maxDays) {
                    // Recortamos el último período para no exceder el máximo
                    const remainingDays = maxDays - currentDay;
                    if (remainingDays > 0) {
                        const startDate = calculateDate(birthDate, currentDay);
                        const endDate = calculateDate(birthDate, maxDays);
                        
                        const period = {
                            planet,
                            level: 1,
                            start: startDate,
                            end: endDate,
                            startDay: currentDay,
                            durationDays: remainingDays
                        };
                        
                        // Añadir subperíodos para este período recortado
                        period.subPeriods = calculateSubPeriods(
                            planet,
                            2,
                            currentDay,
                            maxDays,
                            birthDate,
                            planetOrder
                        );
                        
                        allPeriods.push(period);
                    }
                    break;
                }
                
                const startDate = calculateDate(birthDate, currentDay);
                const endDate = calculateDate(birthDate, currentDay + duration);
                
                const period = {
                    planet,
                    level: 1,
                    start: startDate,
                    end: endDate,
                    startDay: currentDay,
                    durationDays: duration
                };
                
                // Añadir subperíodos
                period.subPeriods = calculateSubPeriods(
                    planet,
                    2,
                    currentDay,
                    currentDay + duration,
                    birthDate,
                    planetOrder
                );
                
                allPeriods.push(period);
                currentDay += duration;
                
                if (currentDay >= maxDays) break;
            }
        }
        
        return allPeriods;
    }
    
    // Función para calcular periodos de relevos zodiacales (hasta 84 años)
    function calcularRelevodPeriods(fechaNac, ascendente) {
        const secuencia = generarSecuencia(ascendente);
        let diaActual = 0;
        const periodos = [];
        const maxDays = 84 * 365; // 84 años aproximadamente
        
        // Calculamos ciclos completos hasta llegar al máximo de días
        while (diaActual < maxDays) {
            for (let i = 0; i < secuencia.length; i++) {
                const signo = secuencia[i];
                const diasEnPeriodo = DURACION_POR_NIVEL[signo] * DURACIONES.AÑO;
                
                if (diaActual + diasEnPeriodo > maxDays) {
                    // Recortamos el último período para no exceder el máximo
                    const diasRestantes = maxDays - diaActual;
                    if (diasRestantes > 0) {
                        const fechaInicio = new Date(fechaNac);
                        fechaInicio.setDate(fechaNac.getDate() + diaActual);
                        
                        const fechaFin = new Date(fechaNac);
                        fechaFin.setDate(fechaNac.getDate() + maxDays);
                        
                        const periodo = {
                            signo: signo,
                            level: 1,
                            planeta: SIGNOS[signo].planeta,
                            start: fechaInicio,
                            end: fechaFin,
                            startDay: diaActual,
                            durationDays: diasRestantes
                        };
                        
                        // Calcular subperiodos para este período recortado
                        periodo.subPeriods = calcularRelevodSubperiodos(
                            fechaNac,
                            diaActual,
                            diasRestantes,
                            secuencia,
                            i,
                            2
                        );
                        
                        periodos.push(periodo);
                    }
                    break;
                }
                
                const fechaInicio = new Date(fechaNac);
                fechaInicio.setDate(fechaNac.getDate() + diaActual);
                
                const fechaFin = new Date(fechaNac);
                fechaFin.setDate(fechaNac.getDate() + diaActual + diasEnPeriodo);
                
                const periodo = {
                    signo: signo,
                    level: 1,
                    planeta: SIGNOS[signo].planeta,
                    start: fechaInicio,
                    end: fechaFin,
                    startDay: diaActual,
                    durationDays: diasEnPeriodo
                };
                
                // Calcular subperiodos
                periodo.subPeriods = calcularRelevodSubperiodos(
                    fechaNac,
                    diaActual,
                    diasEnPeriodo,
                    secuencia,
                    i,
                    2
                );
                
                periodos.push(periodo);
                diaActual += diasEnPeriodo;
                
                if (diaActual >= maxDays) break;
            }
        }
        
        return periodos;
    }
    
    // Función para buscar coincidencias entre Fardarias y Relevos
    function buscarCoincidencias(periodosFardaria, periodosRelevo) {
        const coincidencias = [];
        
        // Extraer todos los periodos de nivel 4 (días) de Fardarias
        const diasFardaria = extraerPeriodosNivel(periodosFardaria, 4);
        
        // Extraer todos los periodos de nivel 4 (días) de Relevos
        const diasRelevo = extraerPeriodosNivel(periodosRelevo, 4);
        
        console.log(`Períodos Fardaria nivel 4: ${diasFardaria.length}`);
        console.log(`Períodos Relevo nivel 4: ${diasRelevo.length}`);
        
        // Buscar coincidencias de planetas y fechas superpuestas
        diasFardaria.forEach(fardaria => {
            diasRelevo.forEach(relevo => {
                if (fardaria.planet === relevo.planeta) {
                    // Verificar si las fechas se superponen
                    const fardiaStart = new Date(fardaria.start);
                    const fardiaEnd = new Date(fardaria.end);
                    const relevoStart = new Date(relevo.start);
                    const relevoEnd = new Date(relevo.end);
                    
                    if (fardiaStart <= relevoEnd && fardiaEnd >= relevoStart) {
                        // Calcular el período de superposición
                        const overlapStart = new Date(Math.max(fardiaStart.getTime(), relevoStart.getTime()));
                        const overlapEnd = new Date(Math.min(fardiaEnd.getTime(), relevoEnd.getTime()));
                        
                        coincidencias.push({
                            planeta: fardaria.planet,
                            signo: relevo.signo,
                            fardariaPeriodo: {
                                start: fardaria.start,
                                end: fardaria.end
                            },
                            relevoPeriodo: {
                                start: relevo.start,
                                end: relevo.end,
                                signo: relevo.signo
                            },
                            overlap: {
                                start: overlapStart,
                                end: overlapEnd,
                                year: overlapStart.getFullYear()
                            }
                        });
                    }
                }
            });
        });
        
        // Ordenar por año y fecha de inicio
        coincidencias.sort((a, b) => {
            if (a.overlap.year !== b.overlap.year) {
                return a.overlap.year - b.overlap.year;
            }
            return a.overlap.start - b.overlap.start;
        });
        
        console.log(`Total de coincidencias encontradas: ${coincidencias.length}`);
        
        return coincidencias;
    }
    
    // Función auxiliar para extraer periodos específicamente de nivel 4
    function extraerPeriodosNivel(periodos, nivel) {
        let resultado = [];
        
        function recorrerPeriodos(periodo) {
            if (periodo.level === nivel) {
                resultado.push(periodo);
            } else if (periodo.subPeriods && periodo.subPeriods.length > 0) {
                periodo.subPeriods.forEach(recorrerPeriodos);
            }
        }
        
        periodos.forEach(recorrerPeriodos);
        return resultado;
    }
    
    // Simulación de posiciones planetarias
    function mockCalculatePositions(isNatal, ascSign = null, ascLongitude = null) {
        const basePositions = [
            { name: "SOL", longitude: isNatal ? 120 : 150, sign: isNatal ? "LEO" : "VIRGO" },
            { name: "LUNA", longitude: isNatal ? 186 : 210, sign: isNatal ? "LIBRA" : "ESCORPIO" },
            { name: "MERCURIO", longitude: isNatal ? 135 : 145, sign: isNatal ? "LEO" : "VIRGO" },
            { name: "VENUS", longitude: isNatal ? 90 : 100, sign: isNatal ? "CÁNCER" : "CÁNCER" },
            { name: "MARTE", longitude: isNatal ? 210 : 240, sign: isNatal ? "ESCORPIO" : "SAGITARIO" },
            { name: "JÚPITER", longitude: isNatal ? 270 : 290, sign: isNatal ? "CAPRICORNIO" : "CAPRICORNIO" },
            { name: "SATURNO", longitude: isNatal ? 330 : 350, sign: isNatal ? "PISCIS" : "PISCIS" },
            { name: "URANO", longitude: isNatal ? 30 : 32, sign: isNatal ? "TAURO" : "TAURO" },
            { name: "NEPTUNO", longitude: isNatal ? 354 : 355, sign: isNatal ? "ARIES" : "ARIES" },
            { name: "PLUTÓN", longitude: isNatal ? 252 : 254, sign: isNatal ? "SAGITARIO" : "SAGITARIO" }
        ];
        
        // Si tenemos un ascendente calculado, usarlo para la carta natal
        if (ascSign && ascLongitude !== null) {
            // Añadir el ascendente calculado
            basePositions.push({ name: "ASC", longitude: ascLongitude, sign: ascSign });
            
            // Añadir el MC (aproximadamente a 90° del Ascendente)
            const mcLongitude = (ascLongitude + 90) % 360;
            const mcSign = getSignFromLongitude(mcLongitude);
            basePositions.push({ name: "MC", longitude: mcLongitude, sign: mcSign });
        } else {
            // Usar valores por defecto
            basePositions.push({ name: "ASC", longitude: isNatal ? 0 : 10, sign: isNatal ? "ARIES" : "ARIES" });
            basePositions.push({ name: "MC", longitude: isNatal ? 270 : 280, sign: isNatal ? "CAPRICORNIO" : "CAPRICORNIO" });
        }
        
        // Añadir variación a las posiciones para la segunda carta
        if (!isNatal) {
            return basePositions.map(planet => ({
                ...planet,
                longitude: (planet.longitude + Math.random() * 20 - 10) % 360
            }));
        }
        
        return basePositions;
    }
    
    // Obtener color para un planeta según su posición
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
    
    // Función para crear path SVG de arco
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
    
    // Función para mostrar un mensaje de error
    function showError(message, isError = true) {
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');
        
        if (isError) {
            errorMsg.classList.add('text-red-500');
            errorMsg.classList.remove('text-blue-500');
        } else {
            errorMsg.classList.add('text-blue-500');
            errorMsg.classList.remove('text-red-500');
        }
    }
    
// Función para limpiar mensaje de error
    function clearError() {
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
    }
    
    // Función para crear elementos SVG
    function appendSVG(tag, attributes) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        chartSvg.appendChild(element);
        return element;
    }
    
    // Función para formatear fecha
    function formatDate(date) {
        if (!(date instanceof Date)) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
    
    // Función de debounce para evitar demasiadas llamadas a la API
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Iniciar la aplicación
    init();
});
