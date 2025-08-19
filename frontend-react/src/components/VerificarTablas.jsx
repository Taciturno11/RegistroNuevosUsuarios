import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { api } from '../utils/capacitaciones/api';

const VerificarTablas = () => {
  const [tablas, setTablas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verificarTablas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api('/capacitaciones/verificar-tablas');
      setTablas(data);
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 Verificación de Tablas de Base de Datos
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={verificarTablas}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? 'Verificando...' : 'Verificar Tablas Disponibles'}
      </Button>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">❌ Error: {error}</Typography>
        </Paper>
      )}

      {tablas && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📋 Resultados de Verificación
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Total de tablas encontradas: <strong>{tablas.totalTables}</strong>
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            🎯 Tablas Relacionadas con Capacitaciones
          </Typography>
          
          {tablas.tablasCapacitaciones.length > 0 ? (
            <List>
              {tablas.tablasCapacitaciones.map((tabla, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`${tabla.TABLE_SCHEMA}.${tabla.TABLE_NAME}`}
                    secondary={`Tipo: ${tabla.TABLE_TYPE}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No se encontraron tablas relacionadas con capacitaciones
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            📚 Todas las Tablas Disponibles
          </Typography>
          
          <List dense>
            {tablas.allTables.slice(0, 20).map((tabla, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={`${tabla.TABLE_SCHEMA}.${tabla.TABLE_NAME}`}
                  secondary={`Tipo: ${tabla.TABLE_TYPE}`}
                />
              </ListItem>
            ))}
          </List>
          
          {tablas.allTables.length > 20 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ... y {tablas.allTables.length - 20} tablas más
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default VerificarTablas;
