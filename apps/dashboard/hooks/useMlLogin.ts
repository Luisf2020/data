// hooks/useMlLogin.ts
import { useCallback, useState } from "react";
import useServiceProviders from "./useServiceProviders";
import toast from "react-hot-toast";
type Props = {
  agentId: string;
};
export function useMlLogin({ agentId }: Props) {
  const { query } = useServiceProviders({
    type: 'mercadolibre',
    agentId,
  })
  // Estado para controlar la carga
  const [loading, setLoading] = useState(false);
  // Recuperar las variables de entorno
  // const APP_ID = process.env.NEXT_PUBLIC_ML_APP_ID;
  console.log('process.env.NEXT_PUBLIC_MERCADOLIBRE_CLIENT_ID', process.env.NEXT_PUBLIC_MERCADOLIBRE_CLIENT_ID);
  const APP_ID = process.env.NEXT_PUBLIC_MERCADOLIBRE_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_MERCADOLIBRE_BASE_URL}ml-redirect`;

  const handleMlLogin = useCallback(() => {
    if (!APP_ID) {
      return;
    }

    // Construir la URL de autenticación
    const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}`;

    // Configurar las dimensiones y posición de la ventana emergente
    const width = 600;
    const height = 700;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    // Abrir la ventana emergente
    const popup = window.open(
      authUrl,
      "_blank",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      console.error("No se pudo abrir la ventana emergente.");
      return;
    }

    // Función para escuchar el mensaje del popup
    const messageListener = (event: MessageEvent) => {
      // Verificar que el mensaje provenga del mismo origen por seguridad

      if (event.origin !== window.location.origin) return;

      if (event.data.code) {
        console.log("Código recibido:", event.data.code);
        popup.close();
        window.removeEventListener("message", messageListener);

        setLoading(true);
        fetch(`/api/mercadolibre/exchange-code?code=${event.data.code}&agentId=${agentId}`)
          .then((res) => res.json())
          .then((data) => {
            console.log('Access Token Intercambiado:', data);
            if (data.error) {
              toast.error(data.error);
            }
            query.mutate()
          })
          .catch((error) => {
            console.error("Error al intercambiar el código:", error);
            if (error.error) {
              toast.error(error.error);
            } else {
              toast.error('Error al conectar la cuenta de mercadolibre');
            }
          })
          .finally(() => {
            // Finalizamos el loader
            setLoading(false);
          });
      }
    };

    window.addEventListener("message", messageListener);
  }, [APP_ID, REDIRECT_URI]);

  return {
    // methods
    handleMlLogin,
    // properties
    loading
  };
}
