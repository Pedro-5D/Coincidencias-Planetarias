import http.server
import socketserver
import os

# Puerto por defecto para Render.com o puerto 8000 localmente
PORT = int(os.environ.get('PORT', 8000))

# Directorio actual como directorio de servicio
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Agregamos CORS headers para permitir pruebas locales
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
        super().end_headers()

# Crear el servidor
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor iniciado en http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario")
    finally:
        httpd.server_close()
