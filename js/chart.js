document.addEventListener('DOMContentLoaded', function() {
    // Constantes básicas para la aplicación
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
        'MC': 'MC'
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
    
    // Variables globales
    let natalPlanets = [];
    let transitPlanets = [];
    let natalCityCoordinates = null;
    let transitCityCoordinates = null;
    let coincidencias = [];
    
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
    
    // Inicialización
    function init() {
        // Establecer fecha y hora actuales
        const now = new Date();
        natalDateInput.value = now.toISOString().split('T')[0];
        natalTimeInput.value = now.toTimeString().slice(0, 5);
        
        transitDateInput.value = now.toISOString().split('T')[0];
        transitTimeInput.value = now.toTimeString().slice(0, 5);
        
        // Event listeners
        natalCityInput.addEventListener('input', function() {
            handleCitySearch(natalCityInput.value, false);
        });
        
        transitCityInput.addEventListener('input', function() {
            handleCitySearch(transitCityInput.value, true);
        });
        
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
        
        // Crear ciudades de ejemplo
        const cities = [
            { value: `${searchQuery}, España`, label: `${searchQuery}, España`, lat: 40.416, lon: -3.703 },
            { value: `${searchQuery}, México`, label: `${searchQuery}, México`, lat: 19.432, lon: -99.133 },
            { value: `${searchQuery}, Argentina`, label: `${searchQuery}, Argentina`, lat: -34.603, lon: -58.381 },
            { value: `${searchQuery}, Estados Unidos`, label: `${searchQuery}, Estados Unidos`, lat: 37.090, lon: -95.712 },
            { value: `${searchQuery}, Brasil`, label: `${searchQuery}, Brasil`, lat: -15.826, lon: -47.921 }
        ];
        
        displayCityResults(cities, resultsContainer, isTransit ? selectTransitCity : selectNatalCity);
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
        } else {
            transitsContainer.classList.add('opacity-50', 'pointer-events-none');
            transitPositionsContainer.classList.add('hidden');
        }
    }
    
    // Función para mostrar/ocultar coincidencias
    function toggleCoincidencias() {
        const isVisible = coincidenciasContainer.classList.toggle('hidden');
        toggleCoincidenciasBtn.textContent = isVisible ? 'Mostrar Coincidencias' : 'Ocultar Coincidencias';
    }
    
    // Función para calcular la carta astral
    function calculateChart() {
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
            
            // Generar posiciones planetarias simuladas
            natalPlanets = mockCalculatePositions(true);
            
            // Para esta versión simplificada, asignamos datos fijos
            const ascendente = "ARIES";
            const isDry = false;
            
            // Mostrar info del nacimiento
            natalInfo.classList.remove('hidden');
            ascedenteText.textContent = ascendente;
            birthTypeText.textContent = isDry ? 'Seco' : 'Húmedo';
            
            // Generar coincidencias de ejemplo
            coincidencias = generateExampleCoincidencias();
            
            // Calcular tránsitos si están habilitados
            if (showTransitsToggle.checked) {
                transitPlanets = mockCalculatePositions(false);
            } else {
                transitPlanets = [];
            }
            
            // Renderizar la carta y coincidencias
            renderChart();
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
    
    // Simulación de posiciones planetarias
    function mockCalculatePositions(isNatal) {
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
            { name: "PLUTÓN", longitude: isNatal ? 252 : 254, sign: isNatal ? "SAGITARIO" : "SAGITARIO" },
            { name: "ASC", longitude: isNatal ? 0 : 10, sign: isNatal ? "ARIES" : "ARIES" },
            { name: "MC", longitude: isNatal ? 270 : 280, sign: isNatal ? "CAPRICORNIO" : "CAPRICORNIO" }
        ];
        
        // Añadir variación a las posiciones para la segunda carta
        if (!isNatal) {
            return basePositions.map(planet => ({
                ...planet,
                longitude: (planet.longitude + Math.random() * 20 - 10) % 360
            }));
        }
        
        return basePositions;
    }
    
    // Generar coincidencias para demostración
    function generateExampleCoincidencias() {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        const coincidencias = [];
        const planetas = ["SOL", "LUNA", "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO"];
        const signos = ["aries", "tauro", "geminis", "cancer", "leo", "virgo", "libra", 
                     "escorpio", "sagitario", "capricornio", "acuario", "piscis"];
        
        // Generar coincidencias para el año actual y los siguientes 5 años
        for (let year = currentYear; year <= currentYear + 5; year++) {
            const numCoincidencias = 2 + Math.floor(Math.random() * 3); // 2-4 coincidencias por año
            
            for (let i = 0; i < numCoincidencias; i++) {
                const planeta = planetas[Math.floor(Math.random() * planetas.length)];
                const signo = signos[Math.floor(Math.random() * signos.length)];
                
                // Fechas aleatorias dentro del año
                const startMonth = Math.floor(Math.random() * 12);
                const startDay = 1 + Math.floor(Math.random() * 28);
                const durationDays = 1 + Math.floor(Math.random() * 5); // 1-5 días
                
                const startDate = new Date(year, startMonth, startDay);
                const endDate = new Date(year, startMonth, startDay + durationDays);
                
                coincidencias.push({
                    planeta: planeta,
                    signo: signo,
                    fardariaPeriodo: {
                        start: startDate,
                        end: endDate
                    },
                    relevoPeriodo: {
                        start: startDate,
                        end: endDate,
                        signo: signo
                    },
                    overlap: {
                        start: startDate,
                        end: endDate,
                        year: year
                    }
                });
            }
        }
        
        return coincidencias;
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
                fill: '#3B82F6', // Color azul para todos los planetas natales
                stroke: '#000',
                'stroke-width': 1
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
                    fill: '#EF4444', // Color rojo para todos los planetas de tránsito
                    stroke: '#000',
                    'stroke-width': 1
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
            table.className =
