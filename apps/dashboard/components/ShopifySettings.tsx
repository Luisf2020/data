import { Box, Divider, Stack, Typography } from '@mui/joy';
import Image from 'next/image';
import React from 'react';
import toast from 'react-hot-toast';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/htmlbars';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/vs2015';

import { ImageZoom } from '@chaindesk/ui/ImageZoom';

if (typeof window !== 'undefined') {
  SyntaxHighlighter.registerLanguage('htmlbars', html);
}

type Props = {
  agentId: string;
};

export default function ShopifySettings(props: Props) {
  const installScript = `<script type="module">
  import Chatbox from 'https://cdn.jsdelivr.net/npm/@chatsappai/embeds@1.0.231/dist/chatbox/index.min.js';

  Chatbox.initBubble({
    agentId: '${props.agentId}',
     
    // optionally, Override initial messages
    // initialMessages: [
    //   'Hello Georges how are you doing today?',
    //   'How can I help you ?',
    // ],
     
    // optionally Provided context will be appended to the Agent system prompt
    // context: "your custom context goes here 🙂",
  })   
</script>`;

  return (
    <Stack gap={3}>
      <Typography level="title-lg">Pasos de Instalación</Typography>
      <Stack>
        <Typography level="body-lg">
          1- En el dashboard de tu tienda, ve a edición de código de tema
        </Typography>
        <ImageZoom src="/shopify/theme.png"></ImageZoom>
      </Stack>
      <Stack>
        <Typography level="body-lg">
          2- Copia el código a continuación{' '}
        </Typography>
        <Box
          sx={{ cursor: 'copy' }}
          onClick={() => {
            navigator.clipboard.writeText(installScript);
            toast.success('Copiado!', {
              position: 'bottom-center',
            });
          }}
        >
          <SyntaxHighlighter
            language="htmlbars"
            style={docco}
            customStyle={{
              borderRadius: 10,
            }}
          >
            {installScript}
          </SyntaxHighlighter>
        </Box>
      </Stack>
      <Stack>
        <Typography level="body-lg">
          3- Pega el código justo encima de <code>{'</head>'} </code>en el
          código theme.liquid.
        </Typography>
        <ImageZoom src="/shopify/code.png"></ImageZoom>
      </Stack>
      <Stack>
        <Typography>4- Guarda tus cambios 🎉 </Typography>
      </Stack>
      <Divider />
    </Stack>
  );
}
