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
    
    // Configuración para el zodíaco sideral de 13 signos
    const SIGNS = [
        {name: 'ARIES', start: 354, length: 36, symbol: '♈', color: '#FFE5E5'},
        {name: 'TAURO', start: 30, length: 30, symbol: '♉', color: '#E5FFE5'},
        {name: 'GÉMINIS', start: 60, length: 30, symbol: '♊', color: '#FFFFE5'},
        {name: 'CÁNCER', start: 90, length: 30, symbol: '♋', color: '#E5FFFF'},
        {name: 'LEO', start: 120, length: 30, symbol: '♌', color: '#FFE5E5'},
        {name: 'VIRGO', start: 150, length: 36, symbol: '♍', color: '#E5FFE5'},
        {name: 'LIBRA', start: 186, length: 24, symbol: '♎', color: '#FFFFE5'},
        {name: 'ESCORPIO', start: 210, length: 30, symbol: '♏', color: '#E5FFFF'},
        {name: 'OFIUCO', start: 240, length: 12, symbol: '⛎', color: '#FFFFE5'},
        {name: 'SAGITARIO', start: 252, length: 18, symbol: '♐', color: '#FFE5E5'},
        {name: 'CAPRICORNIO', start: 270, length: 36, symbol: '♑', color: '#E5FFE5'},
        {name: 'ACUARIO', start: 306, length: 18, symbol: '♒', color: '#FFFFE5'},
        {name: 'PISCIS', start: 324, length: 30, symbol: '♓', color: '#E5FFFF'}
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
        QUINCUNX: { angle: 150, orb: 2, color: '#FF0000', name: 'Inarmónico Relevante' },
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
    const internalAspects = document.getElementById('internal-aspects');
    const interChartAspects = document.getElementById('inter-chart-aspects');
    
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
    
    // Función para manejar la búsqueda de ciudades usando Geoapify
    function handleCitySearch(searchText, isTransit) {
        const searchQuery = searchText.trim();
        const resultsContainer = isTransit ? transitCityResults : natalCityResults;
        
        if (searchQuery.length < 3) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.add('hidden');
            return;
        }
        
        // Llamar a la API de Geoapify
        const apiUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    const cities = data.features.map(feature => {
                        const properties = feature.properties;
                        const label = `${properties.city || properties.name || searchQuery}, ${properties.country}`;
                        return {
                            value: label,
                            label: label,
                            lat: feature.geometry.coordinates[1],
                            lon: feature.geometry.coordinates[0]
                        };
                    });
                    displayCityResults(cities, resultsContainer, isTransit ? selectTransitCity : selectNatalCity);
                } else {
                    // Si no hay resultados, mostrar mensaje
                    resultsContainer.innerHTML = '<div class="p-2">No se encontraron resultados</div>';
                    resultsContainer.classList.remove('hidden');
                }
            })
            .catch(error => {
                console.error('Error en la búsqueda de ciudades:', error);
                // En caso de error, mostrar mensaje
                resultsContainer.innerHTML = '<div class="p-2 text-red-500">Error al buscar ciudades</div>';
                resultsContainer.classList.remove('hidden');
            });
    }
    
    // Función para obtener zona horaria a partir de coordenadas
    async function getTimezone(lat, lon, date) {
        try {
            // Usar la API de timezone para obtener la zona horaria
            const apiUrl = `https://api.geoapify.com/v1/timezone?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data && data.timezone) {
                const offset = data.timezone.offset_DST / 3600; // Convertir segundos a horas
                return {
                    name: data.timezone.name,
                    offset: offset,
                    abbreviation: data.timezone.abbreviation_DST,
                    source: 'api'
                };
            } else {
                return estimateTimezoneByLongitude(lon);
            }
        } catch (error) {
            console.error('Error obteniendo zona horaria:', error);
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
        // Verificar si hay ciudad pero no coordenadas, y mostrar error
        if (natalCityInput.value && !natalCityCoordinates) {
            showError("Por favor, selecciona una ciudad de la lista para la carta natal.");
            return;
        }
        
        if (showTransitsToggle.checked && transitCityInput.value && !transitCityCoordinates) {
            showError("Por favor, selecciona una ciudad de la lista para los tránsitos.");
            return;
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
            
            // Calcular posiciones planetarias reales
            natalPlanets = await calculateRealPlanetaryPositions(
                natalDateInput.value,
                natalTimeInput.value,
                natalCityCoordinates.lat,
                natalCityCoordinates.lon,
                natalTimezone.offset,
                true
            );
            
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
                    "OFIUCO": "ofiuco", "SAGITARIO": "sagitario", "CAPRICORNIO": "capricornio",
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
                
                transitPlanets = await calculateRealPlanetaryPositions(
                    transitDateInput.value,
                    transitTimeInput.value,
                    transitCityCoordinates.lat,
                    transitCityCoordinates.lon,
                    transitTimezone.offset,
                    false
                );
            } else {
                transitPlanets = [];
            }
            
            // Calcular aspectos
            const internalAspectsData = calculateAspects(natalPlanets);
            let interChartAspectsData = [];
            
            if (showTransitsToggle.checked) {
                interChartAspectsData = calculateAspects(natalPlanets, transitPlanets);
            }
            
            // Renderizar la carta
            renderChart();
            
            // Renderizar posiciones y aspectos
            renderPlanetPositions(internalAspectsData, interChartAspectsData);
            
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

    // Función para calcular posiciones planetarias reales usando algoritmos astronómicos
    async function calculateRealPlanetaryPositions(date, time, lat, lon, timezoneOffset, isNatal) {
        // Crear fecha y hora en UTC
        const datetime = new Date(`${date}T${time}`);
        const utcTime = new Date(datetime.getTime() - (timezoneOffset * 60 * 60 * 1000));
        
        // Convertir a formato Juliano para cálculos astronómicos
        const jd = calculateJulianDay(utcTime);
        
        // Calcular posiciones planetarias usando algoritmos astronómicos
        const planets = [];
        
        // SOL
        const sunPosition = calculateSunPosition(jd);
        planets.push({
            name: "SOL",
            longitude: sunPosition.longitude,
            sign: getSignFromLongitude(sunPosition.longitude)
        });
        
        // LUNA
        const moonPosition = calculateMoonPosition(jd);
        planets.push({
            name: "LUNA",
            longitude: moonPosition.longitude,
            sign: getSignFromLongitude(moonPosition.longitude)
        });
        
        // MERCURIO
        const mercuryPosition = calculatePlanetPosition(jd, 'mercury');
        planets.push({
            name: "MERCURIO",
            longitude: mercuryPosition.longitude,
            sign: getSignFromLongitude(mercuryPosition.longitude)
        });
        
        // VENUS
        const venusPosition = calculatePlanetPosition(jd, 'venus');
        planets.push({
            name: "VENUS",
            longitude: venusPosition.longitude,
            sign: getSignFromLongitude(venusPosition.longitude)
        });
        
        // MARTE
        const marsPosition = calculatePlanetPosition(jd, 'mars');
        planets.push({
            name: "MARTE",
            longitude: marsPosition.longitude,
            sign: getSignFromLongitude(marsPosition.longitude)
        });
        
        // JÚPITER
        const jupiterPosition = calculatePlanetPosition(jd, 'jupiter');
        planets.push({
            name: "JÚPITER",
            longitude: jupiterPosition.longitude,
            sign: getSignFromLongitude(jupiterPosition.longitude)
        });
        
        // SATURNO
        const saturnPosition = calculatePlanetPosition(jd, 'saturn');
        planets.push({
            name: "SATURNO",
            longitude: saturnPosition.longitude,
            sign: getSignFromLongitude(saturnPosition.longitude)
        });
        
        // URANO
        const uranusPosition = calculatePlanetPosition(jd, 'uranus');
        planets.push({
            name: "URANO",
            longitude: uranusPosition.longitude,
            sign: getSignFromLongitude(uranusPosition.longitude)
        });
        
        // NEPTUNO
        const neptunePosition = calculatePlanetPosition(jd, 'neptune');
        planets.push({
            name: "NEPTUNO",
            longitude: neptunePosition.longitude,
            sign: getSignFromLongitude(neptunePosition.longitude)
        });
        
        // PLUTÓN
        const plutoPosition = calculatePlanetPosition(jd, 'pluto');
        planets.push({
            name: "PLUTÓN",
            longitude: plutoPosition.longitude,
            sign: getSignFromLongitude(plutoPosition.longitude)
        });
        
        // Calcular Ascendente
        const ascData = calculateAscendant(date, time, lat, lon, timezoneOffset);
        planets.push({
            name: "ASC",
            longitude: ascData.longitude,
            sign: ascData.sign
        });
        
        // Calcular Medio Cielo (MC) - aproximadamente a 90° del Ascendente
        const mcLongitude = (ascData.longitude + 90) % 360;
        planets.push({
            name: "MC",
            longitude: mcLongitude,
            sign: getSignFromLongitude(mcLongitude)
        });
        
        return planets;
    }
    
    // Cálculo del Sol
    function calculateSunPosition(jd) {
        // T es el tiempo en siglos julianos desde J2000.0
        const T = (jd - 2451545.0) / 36525;
        
        // Longitud media del Sol
        let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        
        // Anomalía media del Sol
        let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
        
        // Normalizar ángulos a rango 0-360
        L0 = L0 % 360;
        if (L0 < 0) L0 += 360;
        
        M = M % 360;
        if (M < 0) M += 360;
        
        // Convertir a radianes para cálculos
        const Mrad = M * Math.PI / 180;
        
        // Ecuación del centro
        const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
                + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
                + 0.000289 * Math.sin(3 * Mrad);
        
        // Longitud verdadera del Sol
        const L = L0 + C;
        
        // Corrección para obtener longitud aparente
        const omega = 125.04 - 1934.136 * T;
        const lambda = L - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
        
        return {
            longitude: lambda % 360
        };
    }
    
    // Cálculo de la Luna
    function calculateMoonPosition(jd) {
        // Parámetros para el cálculo de la posición lunar
        const T = (jd - 2451545.0) / 36525;
        
        // Elementos de la órbita lunar
        let L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000;
        let M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000;
        let M1 = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000;
        let F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000;
        let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000;
        let A1 = 119.75 + 131.849 * T;
        let A2 = 53.09 + 479264.29 * T;
        let A3 = 313.45 + 481266.484 * T;
        
        // Normalizar ángulos a rango 0-360
        L0 = L0 % 360;
        if (L0 < 0) L0 += 360;
        
        M = M % 360;
        if (M < 0) M += 360;
        
        M1 = M1 % 360;
        if (M1 < 0) M1 += 360;
        
        F = F % 360;
        if (F < 0) F += 360;
        
        D = D % 360;
        if (D < 0) D += 360;
        
        // Convertir a radianes para cálculos
        const Mrad = M * Math.PI / 180;
        const M1rad = M1 * Math.PI / 180;
        const Frad = F * Math.PI / 180;
        const Drad = D * Math.PI / 180;
        const A1rad = A1 * Math.PI / 180;
        const A2rad = A2 * Math.PI / 180;
        const A3rad = A3 * Math.PI / 180;
        
        // Términos de perturbación para la longitud lunar
        let Ll = 6.288774 * Math.sin(M1rad)
              + 1.274027 * Math.sin(2 * Drad - M1rad)
              + 0.658314 * Math.sin(2 * Drad)
              + 0.213618 * Math.sin(2 * M1rad)
              - 0.185116 * Math.sin(Mrad)
              - 0.114332 * Math.sin(2 * Frad)
              + 0.058793 * Math.sin(2 * Drad - 2 * M1rad)
              + 0.057066 * Math.sin(2 * Drad - Mrad - M1rad)
              + 0.053322 * Math.sin(2 * Drad + M1rad)
              + 0.045758 * Math.sin(2 * Drad - Mrad)
              - 0.040923 * Math.sin(Mrad - M1rad)
              - 0.034720 * Math.sin(Drad)
              - 0.030383 * Math.sin(Mrad + M1rad);
        
        // Longitud eclíptica de la Luna
        const lambda = L0 + Ll;
        
        return {
            longitude: lambda % 360
        };
    }
    
    // Cálculo simplificado de los planetas
    function calculatePlanetPosition(jd, planet) {
        // Parámetros orbitales aproximados de los planetas a J2000
        const planetParams = {
            'mercury': {
                a: 0.387098, // Semieje mayor en UA
                e: 0.205630, // Excentricidad
                i: 7.0047, // Inclinación
                L: 252.2508, // Longitud media
                omega: 48.3313, // Longitud del perihelio
                Omega: 77.4561 // Longitud del nodo ascendente
            },
            'venus': {
                a: 0.723332,
                e: 0.006772,
                i: 3.3949,
                L: 181.9790,
                omega: 76.6799,
                Omega: 131.5633
            },
            'mars': {
                a: 1.523679,
                e: 0.093405,
                i: 1.8510,
                L: 355.4531,
                omega: 49.5574,
                Omega: 49.5580
            },
            'jupiter': {
                a: 5.202603,
                e: 0.048498,
                i: 1.3053,
                L: 34.3968,
                omega: 100.4542,
                Omega: 100.4647
            },
            'saturn': {
                a: 9.554909,
                e: 0.055546,
                i: 2.4845,
                L: 50.0784,
                omega: 113.6634,
                Omega: 113.7155
            },
            'uranus': {
                a: 19.218446,
                e: 0.047318,
                i: 0.7699,
                L: 314.0550,
                omega: 73.9872,
                Omega: 74.0005
            },
            'neptune': {
                a: 30.110387,
                e: 0.008606,
                i: 1.7692,
                L: 304.3487,
                omega: 131.7945,
                Omega: 131.7851
            },
            'pluto': {
                a: 39.48168677,
                e: 0.24880766,
                i: 17.14175,
                L: 238.92903833,
                omega: 224.06891629,
                Omega: 110.30393684
            }
        };
        
        const params = planetParams[planet];
        
        // T es el tiempo en siglos julianos desde J2000.0
        const T = (jd - 2451545.0) / 36525;
        
        // Período orbital en años
        const n = 0.9856076686 / Math.pow(params.a, 1.5);
        
        // Anomalía media
        let M = (params.L - params.omega) + n * 365.25 * T;
        
        // Normalizar a rango 0-360
        M = M % 360;
        if (M < 0) M += 360;
        
        // Convertir a radianes para cálculos
        const Mrad = M * Math.PI / 180;
        
        // Resolver la ecuación de Kepler para obtener la anomalía excéntrica (E)
        let E = Mrad;
        for (let i = 0; i < 10; i++) {
            E = E + (Mrad - E + params.e * Math.sin(E)) / (1 - params.e * Math.cos(E));
        }
        
        // Calcular la anomalía verdadera (v)
        const v = 2 * Math.atan(Math.sqrt((1 + params.e) / (1 - params.e)) * Math.tan(E / 2));
        
        // Calcular la distancia al Sol
        const r = params.a * (1 - params.e * Math.cos(E));
        
        // Calcular la longitud heliocéntrica
        const lonHC = (v * 180 / Math.PI + params.omega) % 360;
        
        // Simplificación: para una aproximación rápida, usamos la longitud heliocéntrica como eclíptica
        const longitude = lonHC;
        
        return {
            longitude: longitude
        };
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
                
                for (const [aspectType, aspect] of Object.entries(ASPECTS)) {
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
    
    // Función para calcular el ascendente
    function calculateAscendant(date, time, lat, lon, timezoneOffset) {
        try {
            // Convertir fecha y hora a UTC teniendo en cuenta el huso horario
            const dateTime = new Date(`${date}T${time}`);
            
            // Ajustar a UTC restando el offset
            const utcTime = new Date(dateTime.getTime() - (timezoneOffset * 60 * 60 * 1000));
            
            // Día Juliano para la fecha/hora UTC
            const jd = calculateJulianDay(utcTime);
            
            // Tiempo sideral en Greenwich
            const gst = calculateGreenwichSiderealTime(jd);
            
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
    
    // Función para calcular duración en las fardarias
    function calculateDuration(planet, level) {
        const number = PLANET_DATA[planet].numero;
        switch(level) {
            case 1: return number * DURACIONES.AÑO;
            case 2: return number * DURACIONES.MES;
            case 3: return number * DURACIONES.SEMANA;
            case 4: return number * DURACIONES.DIA;
            default: return 0;
        }
    }
    
    // Función para obtener orden rotado de planetas
    function getRotatedPlanets(startPlanet, planetOrder) {
        const index = planetOrder.indexOf(startPlanet);
        return [...planetOrder.slice(index), ...planetOrder.slice(0, index)];
    }
    
    // Función para convertir días a fecha
    function calculateDate(birthDate, dayOffset) {
        const date = new Date(birthDate);
        date.setDate(date.getDate() + Math.floor(dayOffset));
        return date;
    }
    
    // Función para calcular subperiodos de Fardarias
    function calculateSubPeriods(mainPlanet, level, startDay, endDay, birthDate, planetOrder) {
        if (level > 4) return [];
        
        const periods = [];
        let currentDay = startDay;
        const rotatedPlanets = getRotatedPlanets(mainPlanet, planetOrder);
        
        rotatedPlanets.forEach(planet => {
            const duration = calculateDuration(planet, level);
            const actualDuration = Math.min(duration, endDay - currentDay);
            
            if (actualDuration > 0) {
                const startDate = calculateDate(birthDate, currentDay);
                const endDate = calculateDate(birthDate, currentDay + actualDuration);
                
                const period = {
                    planet,
                    level,
                    start: startDate,
                    end: endDate,
                    startDay: currentDay,
                    durationDays: actualDuration
                };
                
                period.subPeriods = calculateSubPeriods(
                    planet,
                    level + 1,
                    currentDay,
                    currentDay + actualDuration,
                    birthDate,
                    planetOrder
                );
                
                periods.push(period);
                currentDay += actualDuration;
            }
        });
        
        return periods;
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
        
        // Calcular y dibujar aspectos
        const aspectsToDisplay = [
            ...calculateAspects(natalPlanets),
            ...(showTransitsToggle.checked ? calculateAspects(natalPlanets, transitPlanets) : [])
        ];
        
        // Dibujar aspectos
        aspectsToDisplay.forEach((aspect, index) => {
            // Determinar los planetas y sus posiciones
            const planet1Source = aspect.isInterChart ? natalPlanets : natalPlanets;
            const planet2Source = aspect.isInterChart ? transitPlanets : natalPlanets;
            
            const planet1 = planet1Source.find(p => p.name === aspect.planet1);
            const planet2 = planet2Source.find(p => p.name === aspect.planet2);
            
            if (!planet1 || !planet2) return;
            
            const angle1 = (planet1.longitude - 90) * Math.PI / 180;
            const angle2 = (planet2.longitude - 90) * Math.PI / 180;
            
            // Para aspectos internos, usamos el radio interno
            // Para aspectos entre cartas, conectamos desde los radios correspondientes
            const radius1 = aspect.isInterChart ? DIMENSIONS.innerRadius : DIMENSIONS.innerRadius;
            const radius2 = aspect.isInterChart ? DIMENSIONS.middleRadius : DIMENSIONS.innerRadius;
            
            const x1 = DIMENSIONS.centerX + radius1 * Math.cos(angle1);
            const y1 = DIMENSIONS.centerY + radius1 * Math.sin(angle1);
            const x2 = DIMENSIONS.centerX + radius2 * Math.cos(angle2);
            const y2 = DIMENSIONS.centerY + radius2 * Math.sin(angle2);
            
            const line = appendSVG('line', {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                stroke: aspect.color,
                'stroke-width': 1,
                'stroke-dasharray': aspect.isInterChart ? '3,3' : 'none',
                class: 'aspect-line',
                'data-aspect-index': index
            });
            
            // Añadir evento click
            line.addEventListener('click', () => {
                selectAspect(aspect);
            });
        });
        
        // Dibujar planetas natales
        natalPlanets.forEach(planet => {
            const angle = ((planet.longitude - 90) * Math.PI) / 180;
            const x = DIMENSIONS.centerX + (DIMENSIONS.innerRadius - 20) * Math.cos(angle);
            const y = DIMENSIONS.centerY + (DIMENSIONS.innerRadius - 20) * Math.sin(angle);
            
            // Círculo del planeta
            const circle = appendSVG('circle', {
                cx: x,
                cy: y,
                r: 5,
                fill: getPlanetColor(planet.name, planet.longitude),
                stroke: '#000',
                'stroke-width': 1,
                class: 'planet planet-natal',
                'data-planet': planet.name,
                'data-is-natal': 'true'
            });
            
            // Símbolo del planeta
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', x);
            text.setAttribute('y', y - 10);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('font-size', '16');
            text.setAttribute('class', 'planet-symbol');
            text.setAttribute('data-planet', planet.name);
            text.setAttribute('data-is-natal', 'true');
            text.textContent = PLANET_SYMBOLS[planet.name];
            chartSvg.appendChild(text);
            
            // Añadir eventos
            circle.addEventListener('click', () => {
                selectPlanet(planet.name, true);
            });
            
            text.addEventListener('click', () => {
                selectPlanet(planet.name, true);
            });
        });
        
        // Dibujar planetas de tránsito si están habilitados
        if (showTransitsToggle.checked && transitPlanets.length > 0) {
            transitPlanets.forEach(planet => {
                const angle = ((planet.longitude - 90) * Math.PI) / 180;
                const x = DIMENSIONS.centerX + (DIMENSIONS.middleRadius + 20) * Math.cos(angle);
                const y = DIMENSIONS.centerY + (DIMENSIONS.middleRadius + 20) * Math.sin(angle);
                
                // Círculo del planeta
                const circle = appendSVG('circle', {
                    cx: x,
                    cy: y,
                    r: 5,
                    fill: getPlanetColor(planet.name, planet.longitude),
                    stroke: '#000',
                    'stroke-width': 1,
                    class: 'planet planet-transit',
                    'data-planet': planet.name,
                    'data-is-natal': 'false'
                });
                
                // Símbolo del planeta
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('x', x);
                text.setAttribute('y', y - 10);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('alignment-baseline', 'middle');
                text.setAttribute('font-size', '16');
                text.setAttribute('class', 'planet-symbol');
                text.setAttribute('data-planet', planet.name);
                text.setAttribute('data-is-natal', 'false');
                text.textContent = PLANET_SYMBOLS[planet.name];
                chartSvg.appendChild(text);
                
                // Añadir eventos
                circle.addEventListener('click', () => {
                    selectPlanet(planet.name, false);
                });
                
                text.addEventListener('click', () => {
                    selectPlanet(planet.name, false);
                });
            });
        }
    }
    
    // Función para seleccionar planeta
    function selectPlanet(planetName, isNatal) {
        // Deseleccionar todos los planetas y aspectos
        document.querySelectorAll('.planet, .planet-symbol').forEach(el => {
            el.classList.remove('selected');
        });
        
        document.querySelectorAll('.aspect-line').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Seleccionar el planeta
        document.querySelectorAll(`.planet[data-planet="${planetName}"][data-is-natal="${isNatal}"], .planet-symbol[data-planet="${planetName}"][data-is-natal="${isNatal}"]`).forEach(el => {
            el.classList.add('selected');
        });
        
        // Actualizar las listas de posiciones
        document.querySelectorAll('.position-item').forEach(el => {
            el.classList.remove('bg-blue-100');
            if (el.getAttribute('data-planet') === planetName && el.getAttribute('data-is-natal') === String(isNatal)) {
                el.classList.add('bg-blue-100');
            }
        });
        
        // Desseleccionar aspectos
        document.querySelectorAll('.aspect-item').forEach(el => {
            el.classList.remove('bg-blue-100');
        });
    }
    
    // Función para seleccionar aspecto
    function selectAspect(aspect) {
        // Deseleccionar todos los planetas y aspectos
        document.querySelectorAll('.planet, .planet-symbol').forEach(el => {
            el.classList.remove('selected');
        });
        
        document.querySelectorAll('.aspect-line').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Seleccionar los planetas del aspecto
        document.querySelectorAll(`.planet[data-planet="${aspect.planet1}"][data-is-natal="true"]`).forEach(el => {
            el.classList.add('selected');
        });
        
        if (aspect.isInterChart) {
            document.querySelectorAll(`.planet[data-planet="${aspect.planet2}"][data-is-natal="false"]`).forEach(el => {
                el.classList.add('selected');
            });
        } else {
            document.querySelectorAll(`.planet[data-planet="${aspect.planet2}"][data-is-natal="true"]`).forEach(el => {
                el.classList.add('selected');
            });
        }
        
        // Actualizar las listas de aspectos
        document.querySelectorAll('.aspect-item').forEach(el => {
            el.classList.remove('bg-blue-100');
            const aspectPlanet1 = el.getAttribute('data-planet1');
            const aspectPlanet2 = el.getAttribute('data-planet2');
            const aspectType = el.getAttribute('data-aspect-type');
            const isInterChart = el.getAttribute('data-is-interchart') === 'true';
            
            if (aspectPlanet1 === aspect.planet1 && aspectPlanet2 === aspect.planet2 && 
                aspectType === aspect.type && isInterChart === aspect.isInterChart) {
                el.classList.add('bg-blue-100');
            }
        });
        
        // Deseleccionar posiciones
        document.querySelectorAll('.position-item').forEach(el => {
            el.classList.remove('bg-blue-100');
        });
    }
    
    // Función para renderizar las posiciones de los planetas y aspectos
    function renderPlanetPositions(internalAspectsData, interChartAspectsData) {
        // Limpiar contenedores
        natalPositions.innerHTML = '';
        transitPositions.innerHTML = '';
        internalAspects.innerHTML = '';
        interChartAspects.innerHTML = '';
        
        // Posiciones natales
        natalPlanets.forEach(planet => {
            const div = document.createElement('div');
            div.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer position-item';
            div.setAttribute('data-planet', planet.name);
            div.setAttribute('data-is-natal', 'true');
            div.innerHTML = `
                <span class="font-bold mr-2">${PLANET_SYMBOLS[planet.name]}</span>
                ${planet.name}: ${planet.longitude.toFixed(2)}° ${planet.sign}
            `;
            div.addEventListener('click', () => selectPlanet(planet.name, true));
            natalPositions.appendChild(div);
        });
        
        // Posiciones de tránsito si están habilitados
        if (showTransitsToggle.checked && transitPlanets.length > 0) {
            transitPlanets.forEach(planet => {
                const div = document.createElement('div');
                div.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer position-item';
                div.setAttribute('data-planet', planet.name);
                div.setAttribute('data-is-natal', 'false');
                div.innerHTML = `
                    <span class="font-bold mr-2">${PLANET_SYMBOLS[planet.name]}</span>
                    ${planet.name}: ${planet.longitude.toFixed(2)}° ${planet.sign}
                `;
                div.addEventListener('click', () => selectPlanet(planet.name, false));
                transitPositions.appendChild(div);
            });
        }
        
// Aspectos internos
        internalAspectsData.forEach((aspect, index) => {
            const div = document.createElement('div');
            div.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer aspect-item';
            div.setAttribute('data-planet1', aspect.planet1);
            div.setAttribute('data-planet2', aspect.planet2);
            div.setAttribute('data-aspect-type', aspect.type);
            div.setAttribute('data-is-interchart', 'false');
            div.innerHTML = `
                ${PLANET_SYMBOLS[aspect.planet1]} ${ASPECTS[aspect.type].name} ${PLANET_SYMBOLS[aspect.planet2]} (${aspect.angle.toFixed(2)}°)
            `;
            div.addEventListener('click', () => selectAspect(aspect));
            internalAspects.appendChild(div);
        });
        
        // Aspectos entre cartas
        if (showTransitsToggle.checked) {
            interChartAspectsData.forEach((aspect, index) => {
                const div = document.createElement('div');
                div.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer aspect-item';
                div.setAttribute('data-planet1', aspect.planet1);
                div.setAttribute('data-planet2', aspect.planet2);
                div.setAttribute('data-aspect-type', aspect.type);
                div.setAttribute('data-is-interchart', 'true');
                div.innerHTML = `
                    <span class="text-blue-800">${PLANET_SYMBOLS[aspect.planet1]}</span> ${ASPECTS[aspect.type].name} <span class="text-red-800">${PLANET_SYMBOLS[aspect.planet2]}</span> (${aspect.angle.toFixed(2)}°)
                `;
                div.addEventListener('click', () => selectAspect(aspect));
                interChartAspects.appendChild(div);
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
    
    // Función para generar secuencia de relevos zodiacales
    function generarSecuencia(inicio) {
        const orden = Object.keys(SIGNOS);
        const idx = orden.indexOf(inicio.toLowerCase());
        return [...orden.slice(idx), ...orden.slice(0, idx)];
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
    
    // Función para calcular subperiodos de relevos zodiacales
    function calcularRelevodSubperiodos(fechaNac, diaInicio, duracionTotal, secuencia, idxInicial, nivel) {
        if (nivel > 4) return [];
        
        const periodos = [];
        let diaActual = 0;
        const unidadTiempo = nivel === 2 ? 'meses' : nivel === 3 ? 'semanas' : 'dias';
        const duracionUnidad = nivel === 2 ? DURACIONES.MES : nivel === 3 ? DURACIONES.SEMANA : DURACIONES.DIA;
        
        while (diaActual < duracionTotal) {
            for (let i = 0; i < secuencia.length && diaActual < duracionTotal; i++) {
                const signo = secuencia[(idxInicial + i) % secuencia.length];
                const duracionPeriodo = DURACION_POR_NIVEL[signo] * duracionUnidad;
                const duracionReal = Math.min(duracionPeriodo, duracionTotal - diaActual);
                
                if (duracionReal > 0) {
                    const fechaInicio = new Date(fechaNac);
                    fechaInicio.setDate(fechaNac.getDate() + diaInicio + diaActual);
                    
                    const fechaFin = new Date(fechaNac);
                    fechaFin.setDate(fechaNac.getDate() + diaInicio + diaActual + duracionReal);
                    
                    const periodo = {
                        signo: signo,
                        level: nivel,
                        planeta: SIGNOS[signo].planeta,
                        start: fechaInicio,
                        end: fechaFin,
                        startDay: diaInicio + diaActual,
                        durationDays: duracionReal
                    };
                    
                    if (nivel < 4) {
                        periodo.subPeriods = calcularRelevodSubperiodos(
                            fechaNac,
                            diaInicio + diaActual,
                            duracionReal,
                            secuencia,
                            (idxInicial + i) % secuencia.length,
                            nivel + 1
                        );
                    }
                    
                    periodos.push(periodo);
                    diaActual += duracionReal;
                }
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
    
    // Determinar si un nacimiento es seco o húmedo
    function isDryBirth(sunLongitude, ascLongitude) {
        // Es seco cuando el Sol está entre las casas 6 y 11 (inclusive)
        const diff = (sunLongitude - ascLongitude) % 360;
        const house = Math.floor(diff / 30) + 1;
        
        // Es seco si el Sol está en las casas 6 a 11
        return 6 <= house && house <= 11;
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
                case 'MERCURIO': case 'URANO': return COLORS.YELLOW;
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
