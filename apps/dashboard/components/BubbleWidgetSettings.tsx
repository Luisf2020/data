import createCache from '@emotion/cache';
import { CacheProvider, ThemeProvider } from '@emotion/react';
import {
  Alert,
  Box,
  Button,
  CssBaseline,
  FormControl,
  FormLabel,
  Stack,
  Typography,
} from '@mui/joy';
import Radio from '@mui/joy/Radio';
import RadioGroup from '@mui/joy/RadioGroup';
import { CssVarsProvider, StyledEngineProvider } from '@mui/joy/styles';
import React from 'react';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import { Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/htmlbars';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/vs2015';

import { CreateAgentSchema } from '@chaindesk/lib/types/dtos';
import ChatBoxLoader from '@chaindesk/ui/ChatBoxLoader';
import ChatBubble from '@chaindesk/ui/embeds/chat-bubble';
import { useDeepCompareMemoize } from '@chaindesk/ui/hooks/useDeepCompareEffect';
import Markdown from '@chaindesk/ui/Markdown';
import WidgetThemeProvider from '@chaindesk/ui/themes/embeds-provider';

import CommonInterfaceInput from './AgentInputs/CommonInterfaceInput';
import CustomCSSInput from './AgentInputs/CustomCSSInput';
import AgentForm from './AgentForm';
import ConnectForm from './ConnectForm';
import ReactFrameStyleFix from './ReactFrameStyleFix';

if (typeof window !== 'undefined') {
  SyntaxHighlighter.registerLanguage('htmlbars', html);
}

type Props = {
  agentId: string;
};

function RenderWidget({ agentId, config }: any) {
  const memoizedConfig = useDeepCompareMemoize(config);
  const MemoizedChatBubble = React.useMemo(() => {
    return (
      <Frame
        style={{
          width: '100%',
          height: 600,
          border: '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: 20,
        }}
      >
        <FrameContextConsumer>
          {({ document }) => {
            const cache = createCache({
              key: 'iframe',
              container: document?.head,
              prepend: true,
              speedy: true,
            });

            return (
              <WidgetThemeProvider
                emotionCache={cache}
                prefix="chatsappai-bubble"
              >
                <ReactFrameStyleFix />

                <Box
                  sx={{
                    width: '100vw',
                    height: '100vh',
                    maxHeight: '100%',
                    overflow: 'hidden',
                    p: 2,
                  }}
                >
                  <ChatBoxLoader
                    // eslint-disable-next-line
                    children={ChatBubble}
                    agentId={agentId}
                    initConfig={memoizedConfig}
                  />

                  {memoizedConfig?.customCSS && (
                    <style
                      dangerouslySetInnerHTML={{
                        __html: memoizedConfig?.customCSS || '',
                      }}
                    ></style>
                  )}
                </Box>
              </WidgetThemeProvider>
            );
          }}
        </FrameContextConsumer>
      </Frame>
    );
  }, [agentId, memoizedConfig]);

  return MemoizedChatBubble;
}

export default function BubbleWidgetSettings(props: Props) {
  const installScript = `<script type="module">
  import Chatbox from 'https://cdn.jsdelivr.net/npm/@chatsappai/embeds@1.0.231/dist/chatbox/index.min.js';

  const widget = await Chatbox.initBubble({
    agentId: '${props.agentId}',
    
    // optional 
    // If provided will create a contact for the user and link it to the conversation
    contact: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@email.com',
      phoneNumber: '+33612345644',
      userId: '42424242',
    },
    // optional
    // Override initial messages
    initialMessages: [
      'Hello Georges how are you doing today?',
      'How can I help you ?',
    ],
    // optional
    // Provided context will be appended to the Agent system prompt
    context: "The user you are talking to is John. Start by Greeting him by his name.",
  });

  // open the chat bubble
  widget.open();

  // close the chat bubble
  widget.close()

  // or 
  widget.toggle()
</script>`;

  return (
    <AgentForm
      agentId={props.agentId}
      formProps={{
        sx: {
          alignItems: 'center',
          width: '100%',
        },
      }}
    >
      {({ query, mutation }) => {
        return (
          <ConnectForm<CreateAgentSchema>>
            {({ watch, register, control, formState, setValue }) => {
              const { isDirty, isValid } = formState;
              const config = watch('interfaceConfig');
              return (
                <>
                  <Stack gap={3} sx={{ width: '100%' }}>
                    <Alert color="warning">
                      {
                        '🚨 Para usar esta función se requiere que la visibilidad del Agente sea "pública"'
                      }
                    </Alert>

                    <Stack direction="row" gap={2} width="100%">
                      <Stack width="100%" gap={3}>
                        <CommonInterfaceInput />

                        <FormControl>
                          <FormLabel>Position</FormLabel>
                          <Controller
                            control={control}
                            name="interfaceConfig.position"
                            defaultValue={
                              (query as any).data?.interfaceConfig?.position
                            }
                            render={({ field }) => (
                              <RadioGroup {...field}>
                                <Radio
                                  value="left"
                                  label="Left"
                                  variant="soft"
                                />
                                <Radio
                                  value="right"
                                  label="Right"
                                  variant="soft"
                                />
                              </RadioGroup>
                            )}
                          />
                        </FormControl>

                        {isDirty && isValid && (
                          <Button
                            type="submit"
                            loading={mutation.isMutating}
                            sx={{
                              zIndex: 2,
                              ml: 'auto',
                              mt: 2,
                              position: 'fixed',
                              bottom: 20,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              borderRadius: '30px',
                            }}
                            size="lg"
                            color="success"
                          >
                            Save
                          </Button>
                        )}
                      </Stack>

                      <Stack
                        style={{
                          width: '100%',
                        }}
                        spacing={2}
                      >
                        {query?.data?.id && config && (
                          <RenderWidget
                            agentId={query?.data?.id}
                            config={config}
                          />
                        )}

                        <Stack>{<CustomCSSInput />}</Stack>
                      </Stack>
                    </Stack>

                    <Stack id="embed" gap={2} mb={2}>
                      <Typography level="body-sm">
                        Para incrustar el Agente como un Chat Bubble en su sitio web
                        pegue este código en la sección HTML Head
                      </Typography>

                      <Box
                        sx={{ cursor: 'copy' }}
                        onClick={() => {
                          navigator.clipboard.writeText(installScript);
                          toast.success('Copied!', {
                            position: 'bottom-center',
                          });
                        }}
                      >
                        <Markdown>{`~~~html\n${installScript}\n`}</Markdown>
                      </Box>
                    </Stack>
                  </Stack>
                </>
              );
            }}
          </ConnectForm>
        );
      }}
    </AgentForm>
  );
}
