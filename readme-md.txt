# Carta Astral Doble

Aplicación web simple para visualizar una carta astral doble, que permite comparar posiciones natales con tránsitos y mostrar coincidencias entre Fardarias y Relevos Zodiacales.

## Características

- Calculadora de carta astral natal y carta de tránsitos
- Visualización de posiciones planetarias
- Indicación de ascendente y tipo de nacimiento (seco o húmedo)
- Búsqueda de coincidencias entre ciclos de Fardarias y Relevos Zodiacales
- Botones para usar días específicos de coincidencias como fechas de tránsito

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tuusuario/carta-astral-doble.git
cd carta-astral-doble
```

2. No se requiere instalación de dependencias adicionales, ya que la aplicación utiliza CDN para Tailwind CSS.

## Ejecución

Para ejecutar el servidor localmente:

```bash
python server.py
```

Luego abre tu navegador y ve a `http://localhost:8000`

## Despliegue en Render

Esta aplicación está diseñada para desplegarse fácilmente en [Render.com](https://render.com):

1. Crea una nueva aplicación web en Render
2. Conecta tu repositorio GitHub
3. Configura el comando de inicio como: `python server.py`
4. No se requieren variables de entorno específicas
5. Despliega la aplicación

## Estructura del Proyecto

- `index.html` - La interfaz de usuario principal
- `js/chart.js` - Lógica para la generación y manipulación de la carta astral
- `server.py` - Servidor HTTP simple para servir la aplicación
- `README.md` - Este archivo

## Uso

1. Ingresa la ciudad, fecha y hora de nacimiento
2. Opcionalmente ingresa datos de tránsito
3. Haz clic en "Calcular"
4. Explora la carta astral, las posiciones planetarias y las coincidencias
5. Puedes usar las coincidencias como fechas de tránsito haciendo clic en los botones correspondientes

## Limitaciones Actuales

Esta es una versión simplificada que utiliza datos de demostración:
- Las posiciones planetarias son simuladas, no calculadas con precisión astronómica
- La búsqueda de ciudades es una simulación
- Las coincidencias entre Fardarias y Relevos son generadas aleatoriamente

## Licencia

MIT
