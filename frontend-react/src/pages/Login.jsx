import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import partnerLogo from '../assets/partner.svg';

const Login = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const loginCardRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setIsSuccess(false);

    if (!dni.trim() || !password.trim()) {
      setError('Por favor complete todos los campos');
      shakeForm();
      setLoading(false);
      return;
    }

    try {
      const result = await login(dni.trim(), password.trim());
      if (result.success) {
        showSuccessEffect();
        // Redirigir después de la animación
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError(result.message || 'Error en la autenticación');
        shakeForm();
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
      shakeForm();
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const shakeForm = () => {
    if (loginCardRef.current) {
      loginCardRef.current.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        if (loginCardRef.current) {
          loginCardRef.current.style.animation = '';
        }
      }, 500);
    }
  };

  const showSuccessEffect = () => {
    setIsSuccess(true);
    if (loginCardRef.current) {
      loginCardRef.current.style.animation = 'successPulse 1s ease-in-out';
      setTimeout(() => {
        if (loginCardRef.current) {
          loginCardRef.current.style.animation = '';
        }
      }, 1000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>')`,
          pointerEvents: 'none',
          zIndex: 1
        }
      }}
    >
      {/* Contenedor principal */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 450,
          px: 2
        }}
      >
        {/* Tarjeta de login */}
        <Box
          ref={loginCardRef}
          sx={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            animation: 'slideInUp 0.6s ease-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2)'
            },
            '@keyframes slideInUp': {
              from: {
                opacity: 0,
                transform: 'translateY(30px)'
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)'
              }
            },
            '@keyframes shake': {
              '0%, 100%': { transform: 'translateX(0)' },
              '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
              '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
            },
            '@keyframes successPulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.02)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        >
          {/* Header del login */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1e40af, #475569)',
              color: 'white',
              p: 5,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                animation: 'rotate 20s linear infinite',
                '@keyframes rotate': {
                  from: { transform: 'rotate(0deg)' },
                  to: { transform: 'rotate(360deg)' }
                }
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              {/* Logo */}
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src={partnerLogo}
                  alt="Logo Partner"
                  sx={{
                    width: 60,
                    height: 60,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' }
                    }
                  }}
                />
              </Box>
              
              {/* Título */}
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  mb: 1
                }}
              >
                Bienvenido
              </Typography>
              
              {/* Subtítulo */}
              <Typography
                variant="body1"
                sx={{
                  fontSize: '0.95rem',
                  opacity: 0.9,
                  fontWeight: 400
                }}
              >
                Sistema de Gestión de Empleados
              </Typography>
            </Box>
          </Box>

          {/* Cuerpo del formulario */}
          <Box sx={{ p: 5, background: '#ffffff' }}>
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '12px',
                    '& .MuiAlert-icon': { color: '#dc2626' }
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* Campo DNI */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  component="label"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    mb: 1.5,
                    fontSize: '0.95rem',
                    display: 'block'
                  }}
                >
                  <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Usuario
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Ingrese su DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  disabled={loading}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#3498db'
                      },
                      '&.Mui-focused': {
                        borderColor: '#3498db',
                        boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.15)',
                        background: '#ffffff',
                        transform: 'translateY(-2px)'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '1rem 1.25rem'
                    }
                  }}
                />
              </Box>

              {/* Campo Contraseña */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  component="label"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    mb: 1.5,
                    fontSize: '0.95rem',
                    display: 'block'
                  }}
                >
                  <LockIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Contraseña
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                          sx={{
                            color: '#64748b',
                            '&:hover': {
                              color: '#3498db',
                              background: 'rgba(52, 152, 219, 0.1)'
                            }
                          }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#3498db'
                      },
                      '&.Mui-focused': {
                        borderColor: '#3498db',
                        boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.15)',
                        background: '#ffffff',
                        transform: 'translateY(-2px)'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '1rem 1.25rem',
                      paddingRight: '3rem'
                    }
                  }}
                />
              </Box>

              {/* Botón de login */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={loading ? (
                  <Box
                    sx={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      borderTopColor: 'white',
                      animation: 'spin 1s ease-in-out infinite',
                      '@keyframes spin': {
                        to: { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                ) : isSuccess ? (
                  <CheckIcon />
                ) : (
                  <LoginIcon />
                )}
                sx={{
                  background: isSuccess 
                    ? 'linear-gradient(135deg, #059669, #10b981)' 
                    : 'linear-gradient(135deg, #3498db, #2980b9)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: isSuccess 
                      ? '0 10px 25px rgba(5, 150, 105, 0.4)'
                      : '0 10px 25px rgba(52, 152, 219, 0.4)',
                    background: isSuccess 
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #2980b9, #3498db)'
                  },
                  '&:active': {
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    opacity: 0.7,
                    transform: 'none'
                  }
                }}
              >
                {loading ? 'Ingresando...' : isSuccess ? '¡Bienvenido!' : 'Ingresar al Sistema'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
