import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, CircularProgress, Button } from '@mui/joy';
import Layout from '@app/components/Layout';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/apps');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      component="main"
      className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50"
    >
      <Box className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center text-center w-full max-w-md">
        <CircularProgress size="lg" thickness={5} sx={{ mb: 3 }} />
        <Typography level="h4" className="font-semibold text-gray-900">
          ¡Éxito!
        </Typography>
        <Typography level="h4" className="text-gray-600 mt-2">
          Su acción se completó con éxito. Será redirigido en breve.
        </Typography>
        <Button
          onClick={() => router.push('/agents')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Ir al Tablero
        </Button>
      </Box>
    </Box>
  );
}

SuccessPage.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};
