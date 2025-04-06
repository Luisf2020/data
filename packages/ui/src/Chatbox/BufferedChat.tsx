import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Typography } from '@mui/joy';

const BufferedChat = ({ onSubmit }: { onSubmit: any }) => {
  // Estado para los mensajes acumulados
  const [bufferedMessages, setBufferedMessages] = useState<string[]>([]);
  // Estado para el tiempo restante
  const [timeRemaining, setTimeRemaining] = useState(0);
  // Estado para controlar si el timer está activo
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Función para manejar el envío de un nuevo mensaje al buffer
  const handleNewMessage = (message: any) => {
    setBufferedMessages(prev => [...prev, message]);
    // Añadir 4 segundos al timer
    setTimeRemaining(prev => prev + 4000);
    // Activar el timer si no está activo
    if (!isTimerActive) {
      setIsTimerActive(true);
      setTimeRemaining(prev => prev + 15000); // 15 segundos iniciales
    }
  };

  // Efecto para manejar el timer
  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;

    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) { // Si queda 1 segundo o menos
            // Enviar todos los mensajes acumulados
            if (bufferedMessages.length > 0) {
              onSubmit({
                query: bufferedMessages.join('\n'),
                files: [],
                attachmentsForAI: []
              });
              // Limpiar el buffer
              setBufferedMessages([]);
            }
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive, timeRemaining, bufferedMessages, onSubmit]);

  // Modificar el submit original para usar el buffer
  const handleSubmit = (query: string) => {
    if (!query) return;
    handleNewMessage(query);
  };

  return {
    handleSubmit,
    timeRemaining,
    bufferedMessages,
    isTimerActive
  };
};

export default BufferedChat;