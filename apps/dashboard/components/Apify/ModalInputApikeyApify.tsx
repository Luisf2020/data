import React, { useState, useCallback } from 'react';
import { Modal } from '@mui/material';
import { Button } from '@mui/joy';

interface ModalInputApikeyApifyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultApiKey?: string;
}

export const ModalInputApikeyApify = ({
  isOpen,
  onClose,
  onSuccess,
  defaultApiKey = ""
}: ModalInputApikeyApifyProps) => {
  const [apiKey, setApiKey] = useState(defaultApiKey || localStorage.getItem("apikey") || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveApiKey = useCallback((newKey: string) => {
    setApiKey(newKey);
    setError("");
  }, []);

  const validateApiKey = (key: string) => {
    if (!key.trim()) {
      setError("Por favor ingrese una API key");
      return false;
    }
    if (key.length < 8) {
      setError("La API key debe tener al menos 8 caracteres");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateApiKey(apiKey)) {
      return;
    }

    setIsLoading(true);
    setError("");

    onSuccess();

    try {
      // Simulamos una validación rápida
      await new Promise(resolve => setTimeout(resolve, 500));

      localStorage.setItem("apikey", apiKey);
      setShowSuccess(true);

      // Cerramos después de mostrar el éxito
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError("Error al guardar la API key. Por favor intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="apify-config-modal"
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      bg-[#121212] text-gray-100 rounded-xl shadow-2xl w-[90%] max-w-2xl 
                      max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-800 bg-[#121212]">
          <h2 className="text-2xl font-semibold text-white">Configuración de Apify</h2>
          <p className="text-gray-400 mt-2">
            Configure su conexión con Apify para comenzar a utilizar nuestros servicios
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-8">
            {/* API Key Input Section */}
            <div className="space-y-2">
              <label htmlFor="apify-key" className="block text-sm font-medium text-gray-300">
                API Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="apify-key"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg 
                           text-gray-100 placeholder-gray-500 focus:ring-2 
                           focus:border-transparent transition duration-200
                           ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-[#209037]'}`}
                  placeholder="Pegue su API key aquí"
                  disabled={isLoading}
                />
                {!error && apiKey && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-[#209037]"></div>
                  </div>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Pasos para obtener su API Key:</h3>
              <ol className="space-y-5 text-gray-300">
                {/* ... (mismo contenido de la lista) ... */}
                <li className="flex items-start gap-4 group">
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#209037] 
                                 rounded-full text-sm font-medium text-white group-hover:shadow-lg 
                                 group-hover:shadow-[#209037]/20 transition-shadow">1</span>
                  <span className="pt-1">Inicie sesión en su cuenta de <a href="https://console.apify.com"
                    target="_blank" rel="noopener noreferrer"
                    className="text-[#209037] hover:text-[#1a7a2e] underline decoration-[#209037]/30 
                        hover:decoration-[#209037] transition-all">Apify Console</a>
                  </span>
                </li>
                <li className="flex items-start gap-4 group">
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#209037] 
                                 rounded-full text-sm font-medium text-white group-hover:shadow-lg 
                                 group-hover:shadow-[#209037]/20 transition-shadow">2</span>
                  <span className="pt-1">Navegue a <strong className="text-white">Settings</strong> → <strong className="text-white">API & Integrations</strong></span>
                </li>
                <li className="flex items-start gap-4 group">
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#209037] 
                                 rounded-full text-sm font-medium text-white group-hover:shadow-lg 
                                 group-hover:shadow-[#209037]/20 transition-shadow">3</span>
                  <span className="pt-1">Haga clic en el botón <strong className="text-white">+ Create new token</strong></span>
                </li>
                <li className="flex items-start gap-4 group">
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#209037] 
                                 rounded-full text-sm font-medium text-white group-hover:shadow-lg 
                                 group-hover:shadow-[#209037]/20 transition-shadow">4</span>
                  <span className="pt-1">Asigne un nombre al token y haga clic en <strong className="text-white">Create</strong></span>
                </li>
                <li className="flex items-start gap-4 group">
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#209037] 
                                 rounded-full text-sm font-medium text-white group-hover:shadow-lg 
                                 group-hover:shadow-[#209037]/20 transition-shadow">5</span>
                  <span className="pt-1">Copie el token generado y péguelo en el campo <strong className="text-white">API Key</strong> de arriba</span>
                </li>
              </ol>
            </div>

            {/* Video Tutorial */}
            <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg">
              <video
                src="/apify/apify-token.webm"
                className="w-full object-cover"
                controls={false}
                autoPlay={true}
                muted={true}
                loop={true}
              />
            </div>

            {/* Success Alert */}
            {showSuccess && (
              <div className="rounded-lg px-4 py-3 bg-[#209037]/10 border border-[#209037] text-[#209037]
                            flex items-center gap-2 animate-fadeIn">
                <div className="w-2 h-2 rounded-full bg-[#209037] animate-pulse"></div>
                <span>API Key guardada exitosamente</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="bg-[#121212] px-8 py-6 border-t border-gray-800 flex justify-end gap-3">
          <Button
            size="sm"
            variant="outlined"
            color="neutral"
            onClick={onClose}
            disabled={isLoading}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: '#fff',
              padding: '8px 16px',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              },
              '&:disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="solid"
            onClick={handleSave}
            disabled={isLoading || !apiKey.trim()}
            sx={{
              backgroundColor: '#209037',
              color: '#fff',
              padding: '8px 16px',
              position: 'relative',
              '&:hover': {
                backgroundColor: '#1a7a2e'
              },
              '&:disabled': {
                opacity: 0.5,
                cursor: 'not-allowed',
                backgroundColor: '#209037'
              }
            }}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalInputApikeyApify;