import toast from "react-hot-toast";
import useServiceProviders from "./useServiceProviders";
import { log } from "console";
import { useEffect, useState } from "react";

type Props = {
  agentId: string;
};

export const useWhatsappLogin = ({ agentId }: Props) => {
  const { query } = useServiceProviders({
    type: 'whatsapp',
    agentId,
  })

  const [phoneNumberId, setPhoneNumberId] = useState<string | null>(null);
  const [wabaId, setWabaId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Función para manejar los mensajes entrantes
    const handleMessage = (event: MessageEvent) => {
      // Verifica que el mensaje provenga de Facebook
      if (event.origin !== 'https://www.facebook.com') {
        return;
      }

      try {
        // Verificar si event.data es un JSON válido antes de parsear
        if (typeof event.data !== "string" || !event.data.startsWith("{")) {
          return;
        }

        const eventData = JSON.parse(event.data);
        console.log(eventData);

        // Verifica que el mensaje sea del tipo WA_EMBEDDED_SIGNUP y que el evento sea FINISH
        if (eventData.type === 'WA_EMBEDDED_SIGNUP' && eventData.event === 'FINISH') {
          console.log("Estoy por setear los datos del phone");
          const { phone_number_id, waba_id } = eventData.data;
          setPhoneNumberId(phone_number_id);
          setWabaId(waba_id);
          console.log('Phone Number ID:', phone_number_id);
          console.log('WABA ID:', waba_id);
        }
      } catch (error) {
        console.error('Error al procesar el mensaje:', error);
      }
    };

    // Agrega el listener de mensajes
    window.addEventListener('message', handleMessage);

    // Limpia el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Este useEffect se ejecutará cuando tengamos los tres valores
  useEffect(() => {
    if (code && phoneNumberId && wabaId) {
      console.log("Los tres valores están listos, enviando al backend...");
      setLoading(true);
      fetch(`/api/wp-embedded/exchange-code?code=${code}&agentId=${agentId}&phoneNumberId=${phoneNumberId}&wabaId=${wabaId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('Access Token Intercambiado:', data);
          query.mutate()
        })
        .catch((error) => {
          console.error("Error al intercambiar el código:", error);
        })
        .finally(() => {
          // Finalizamos el loader
          setLoading(false);
        });
    }
  }, [code, phoneNumberId, wabaId]); // Se ejecutará cuando cualquiera de estos valores cambie

  const handleWhatsappLogin = () => {
    console.log("Estoy por hacer el login en Facebook");
    console.log(process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID);
    console.log(agentId);

    FB.login(
      function (response) {
        if (response.status === 'connected' && response.authResponse.code) {
          setCode(response.authResponse.code);
        } else {
          console.error("No se pudo iniciar sesión con Facebook");
        }
      },
      {
        config_id: "1129295041989408",
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        }
      }
    );
  };

  return {
    // methods
    handleWhatsappLogin,
    // properties
    loading
  };
};
