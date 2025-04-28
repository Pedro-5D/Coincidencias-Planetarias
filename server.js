const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Determinar la ruta correcta
const rootDir = path.resolve(__dirname);
console.log("Directorio raíz:", rootDir);

// Servir archivos estáticos
app.use(express.static(rootDir));

// Ruta para el index.html
app.get('/', (req, res) => {
  const indexPath = path.join(rootDir, 'index.html');
  console.log("Intentando servir:", indexPath);
  
  // Verificar si el archivo existe
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Archivo index.html no encontrado. Ruta: ' + indexPath);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
