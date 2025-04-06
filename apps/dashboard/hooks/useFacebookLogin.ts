import toast from "react-hot-toast";
import useServiceProviders from "./useServiceProviders";
import { useState } from "react";

type Props = {
  agentId: string;
};
export const useFacebookLogin = ({ agentId }: Props) => {
  const { query } = useServiceProviders({
    type: 'meta',
    agentId,
  })
  const [loading, setLoading] = useState(false);
  const handleFacebookLogin = () => {
    console.log("Estoy por hacer el login en Facebook");
    console.log(process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID);
    console.log(agentId);

    FB.login(
      function (response) {
        if (response.status === 'connected') {
          const code = response.authResponse.code;
          setLoading(true);
          fetch(`/api/facebook/exchange-code?code=${code}&agentId=${agentId}`)
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
        } else {
          console.error("No se pudo iniciar sesión con Facebook");
        }
      },
      {
        config_id: "1541037313965077",
        response_type: 'code',
        override_default_response_type: true,
      }
    );
  };

  return {
    // methods
    handleFacebookLogin,
    // properties
    loading
  };
}
