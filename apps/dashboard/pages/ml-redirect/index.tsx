import { useEffect } from "react";
import { useRouter } from "next/router";
import Loader from "@chaindesk/ui/Loader";
import { Box } from "@mui/joy";

export default function MlRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Enviar el código a la ventana principal
      window.opener.postMessage({ code }, window.opener.location.origin);
      window.close(); // Cerrar la ventana emergente
    }
  }, []);

  return (
    <Box className="flex justify-center items-center h-screen">
      <Loader />
    </Box>
  );
}
