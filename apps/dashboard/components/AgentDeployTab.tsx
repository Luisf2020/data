import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { IconButton, List, ListItem } from '@mui/joy';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { Card, CardActions, CardContent, Grid } from '@mui/material';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';

import useModal from '@app/hooks/useModal';

import { AgentVisibility, DatastoreVisibility } from '@chaindesk/prisma';
import useAgent from '@chaindesk/ui/hooks/useAgent';
import useStateReducer from '@chaindesk/ui/hooks/useStateReducer';

import SettingCard from './ui/SettingCard';
import UsageLimitModal from './UsageLimitModal';

const SlackBotModal = dynamic(
  () => import('@app/components/SlackSettingsModal'),
  {
    ssr: false,
  }
);

const CrispSettingsModal = dynamic(
  () => import('@app/components/CrispSettingsModal'),
  {
    ssr: false,
  }
);

const IFrameWidgetSettings = dynamic(
  () => import('@app/components/IFrameWidgetSettings'),
  {
    ssr: false,
  }
);

const BubbleWidgetSettings = dynamic(
  () => import('@app/components/BubbleWidgetSettings'),
  {
    ssr: false,
  }
);

const CRMChatsappAI = dynamic(
  () => import('@app/components/CRM'),
  {
    ssr: false,
  }
);

const CRMChatwoot = dynamic(
  () => import('@app/components/BubbleWidgetSettings'),
  {
    ssr: false,
  }
);

const StandalonePageWidgetSettings = dynamic(
  () => import('@app/components/StandalonePageWidgetSettings'),
  {
    ssr: false,
  }
);
const ZendeskSettings = dynamic(
  () => import('@app/components/ZendeskSettings'),
  {
    ssr: false,
  }
);

const ShopifySettings = dynamic(
  () => import('@app/components/ShopifySettings'),
  {
    ssr: false,
  }
);

const WhatsAppSettings = dynamic(
  () => import('@app/components/WhatsAppSettings'),
  {
    ssr: false,
  }
);

const TelegramSettings = dynamic(
  () => import('@app/components/TelegramSettings'),
  {
    ssr: false,
  }
);

const InstagramMessengerWidgetModal = dynamic(
  () => import('@app/components/InstagramMessengerWidgetModal'),
  {
    ssr: false,
  }
);
const MercadolibreWidgetModal = dynamic(
  () => import('@app/components/MercadolibreWidgetModal'),
  {
    ssr: false,
  }
);
type Props = {
  agentId: string;
};

function AgentDeployTab(props: Props) {
  const { data: session, status } = useSession();

  const router = useRouter();
  const [state, setState] = useStateReducer({
    isSlackModalOpen: false,
    isUsageModalOpen: false,
    isCrispModalOpen: false,
  });

  const bubbleWidgetModal = useModal();
  const iframeWidgetModal = useModal();
  const standalonePageModal = useModal();
  const zendeskModal = useModal();
  const whatsappModal = useModal();
  const telegramModal = useModal();
  const shopifyModal = useModal();
  const crmChatsappAI = useModal();
  const crmChatwoot = useModal();
  const instagramMessengerWidgetModal = useModal();
  const mercadolibreWidgetModal = useModal();

  const { query, mutation } = useAgent({
    id: props.agentId as string,
  });

  const agent = query?.data;

  if (!agent) {
    return null;
  }

  return (
    <div className='p-2'>
      <div className='mb-5'>
        <Typography level="title-md">Implementar</Typography>
        <Typography level="body-sm">Implemente su agente con los siguientes widgets o integraciones</Typography>
      </div>
      <div
      >
        <Grid container spacing={2} >
          {[
            {
              name: 'Web / Bubble - Incrustar en una burbuja de chat',
              icon: (
                <IconButton
                  size="sm"
                  variant="solid"
                  sx={(theme) => ({
                    borderRadius: '100%',
                  })}
                >
                  <AutoAwesomeIcon />
                </IconButton>
              ),
              action: () => {
                bubbleWidgetModal.open();
              },
              publicAgentRequired: true,
            },
            {
              name: 'Web / Estándar - Incrustar en un contenedor en su sitio web',
              icon: <Typography sx={{ fontSize: 32 }}>📺</Typography>,
              action: () => {
                iframeWidgetModal.open();
              },
              publicAgentRequired: true,
            },
            {
              name: 'Web / Independiente - Página web sin código alojada en ChatsappAI',
              icon: <Typography sx={{ fontSize: 32 }}>💅</Typography>,
              action: () => {
                standalonePageModal.open();
              },
              publicAgentRequired: true,
            },
            {
              name: 'CRM Chatsappai',
              icon: (
                <Image
                  className="w-8"
                  src="/crm_chatsappai/icon.svg"
                  width={100}
                  height={100}
                  alt="Chatwoot Logo"
                />
              ),
              action: () => {
                crmChatsappAI.open();
              },
              isPremium: false,
            },
            {
              name: 'Chatwoot',
              icon: (
                <Image
                  className="w-8"
                  src="/chatwoot/icon.svg"
                  width={100}
                  height={100}
                  alt="Chatwoot Logo"
                />
              ),
              action: () => {
                crmChatwoot.open();
              },
              isPremium: true,
            },
            {
              hidden: false,
              name: 'WhatsApp',
              icon: (
                <Image
                  className="w-8"
                  src="/integrations/whatsapp/icon.svg"
                  width={100}
                  height={100}
                  alt="Whatsapp Logo"
                />
              ),
              action: async () => {
                whatsappModal.open();
              },
              isPremium: true,
            },
            {
              hidden: false,
              name: 'Shopify',
              icon: (
                <Image
                  className="w-8"
                  src="/shopify/icon.svg"
                  width={100}
                  height={100}
                  alt="Shopify Logo"
                />
              ),
              action: async () => {
                shopifyModal.open();
              },
              isPremium: true,
            },
            {
              name: 'Zapier',
              isPremium: true,
              icon: (
                <img
                  className="w-8"
                  src="https://images.ctfassets.net/lzny33ho1g45/6YoKV9RS3goEx54iFv96n9/78100cf9cba971d04ac52d927489809a/logo-symbol.png"
                  alt="zapier logo"
                ></img>
              ),
              action: () => {
                // Remplace to ChatsappAI
              },
            },
            {
              hidden: false,
              name: 'Telegram',
              icon: (
                <Image
                  className="w-8"
                  src="/integrations/telegram/icon.svg"
                  width={100}
                  height={100}
                  alt="Telegram Logo"
                />
              ),
              action: async () => {
                telegramModal.open();
              },
              isPremium: true,
            },
            {
              name: 'Slack',
              icon: (
                <Image
                  className="w-8"
                  src="/shared/images/logos/slack.png"
                  width={100}
                  height={100}
                  alt="slack logo"
                ></Image>
              ),
              isPremium: true,
              action: () => {
                // Remplace to ChatsappAI logic
                // setState({ isSlackModalOpen: true });
              },
            },
            {
              name: 'Crisp',
              isPremium: true,
              icon: (
                <Image
                  className="w-20"
                  src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Logo_de_Crisp.svg"
                  width={20}
                  height={20}
                  alt="crisp logo"
                ></Image>
              ),
              action: () => {
                setState({ isCrispModalOpen: true });
              },
            },
            {
              name: 'WordPress',
              icon: (
                <Image
                  className="w-8"
                  src="https://upload.wikimedia.org/wikipedia/commons/0/09/Wordpress-Logo.svg"
                  width={100}
                  height={100}
                  alt="Wordpress Logo"
                />
              ),
              action: () => {
                window.open(
                  'https://wordpress.com/plugins/chatsappai',
                  '_blank'
                );
              },
              publicAgentRequired: true,
            },
            {
              name: 'META',
              isPremium: true,
              icon: (
                <Typography sx={{ fontSize: 20 }}>
                  <FacebookIcon />
                  <InstagramIcon />
                </Typography>
              ),
              action: async () => {
                instagramMessengerWidgetModal.open();
              },
            },
            {
              name: 'MercadoLibre',
              isPremium: false,
              icon: (
                <Image
                  className="w-8"
                  src="/mercadolibre/icon.svg"
                  width={100}
                  height={100}
                  alt="Mercadolibre logo"
                />
              ),
              action: async () => {
                mercadolibreWidgetModal.open();
              },
            },
          ]
            .filter((each) =>
              router.query.showHidden === 'true' ? true : !each.hidden
            )
            .map((each, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} className='relative'>
                <Card className='relative' sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 100 }} variant="outlined">
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" gap={2} alignItems={'center'}>
                      {each.icon}
                      <Typography fontWeight={'bold'}>{each.name}</Typography>
                      {each.isPremium && (
                        <Chip className="absolute bottom-1 right-1 py-1 px-3" color="warning" size="sm" variant="soft">
                          Premium
                        </Chip>
                      )}
                    </Stack>
                  </CardContent>
                  <CardActions>
                    {(!each?.isPremium ||
                      (each.isPremium && session?.organization?.isPremium)) &&
                      (each?.publicAgentRequired &&
                        agent?.visibility === DatastoreVisibility.private ? (
                        <Button
                          size="sm"
                          variant="outlined"
                          startDecorator={<ToggleOffIcon />}
                          loading={mutation.isMutating}
                          onClick={async () => {
                            const accepted = await confirm(
                              'Esta función requiere que su Agente sea público. Los usuarios no autenticados (visitantes) pueden consultarlo. ¿Hacerlo público?'
                            );

                            if (!accepted) {
                              return;
                            }

                            await mutation.trigger({
                              ...agent,
                              visibility: AgentVisibility.public,
                            } as any);

                            await query.mutate();
                          }}
                        >
                          Enable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outlined"
                          startDecorator={<TuneRoundedIcon />}
                          onClick={each.action}
                          disabled={
                            ['zapier', 'slack', 'wordpress', 'chatwoot'].includes(
                              each?.name?.toLowerCase()
                            )
                              ? true
                              : false
                          }
                        >
                          {['zapier', 'slack', 'wordpress'].includes(
                            each?.name?.toLowerCase()
                          )
                            ? 'Proximamente'
                            : 'Configuraciones'}
                        </Button>
                      ))}
                    {each.isPremium && !session?.organization?.isPremium && (
                      <Button
                        size="sm"
                        variant="outlined"
                        color="warning"
                        onClick={() => setState({ isUsageModalOpen: true })}
                      >
                        Suscribirse
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
      </div>

      {query?.data?.id! && (
        <>
          <SlackBotModal
            agentId={query?.data?.id!}
            isOpen={state.isSlackModalOpen}
            handleCloseModal={() => setState({ isSlackModalOpen: false })}
          />

          <CrispSettingsModal
            agentId={query?.data?.id!}
            isOpen={state.isCrispModalOpen}
            handleCloseModal={() => setState({ isCrispModalOpen: false })}
          />

          <bubbleWidgetModal.component
            title="Burbuja de Chat"
            description="Configuraciones"
            dialogProps={{
              sx: {
                maxWidth: 'lg',
              },
            }}
          >
            <BubbleWidgetSettings agentId={query?.data?.id!} />
          </bubbleWidgetModal.component>

          <iframeWidgetModal.component
            title="Chatbox Estándar"
            description="Configuraciones"
            dialogProps={{
              sx: {
                maxWidth: 'lg',
              },
            }}
          >
            <IFrameWidgetSettings agentId={query?.data?.id!} />
          </iframeWidgetModal.component>

          <standalonePageModal.component
            title="Página Web Independiente"
            description="Configuraciones"
            dialogProps={{
              sx: {
                maxWidth: 'lg',
              },
            }}
          >
            <StandalonePageWidgetSettings agentId={query?.data?.id!} />
          </standalonePageModal.component>

          <crmChatsappAI.component
            title="CRM / ChatsappAI - Integración nativa con CRM ChatsappAI"
            description="Configuraciones"
            dialogProps={{
              sx: {
                maxWidth: 'sm',
                height: 'auto',
              },
            }}
          >
            <CRMChatsappAI agent={query?.data!} />
          </crmChatsappAI.component>

          <telegramModal.component
            title={
              <Typography
                startDecorator={
                  <Image
                    className="w-6"
                    src="/integrations/telegram/icon.svg"
                    width={100}
                    height={100}
                    alt="Telegram Logo"
                  />
                }
              >
                Telegram
              </Typography>
            }
            dialogProps={{
              sx: {
                maxWidth: 'sm',
                height: 'auto',
              },
            }}
          >
            <TelegramSettings agentId={props.agentId} />
          </telegramModal.component>
          <instagramMessengerWidgetModal.component
            title="CRM / ChatsappAI - Integración nativa con CRM ChatsappAI"
            description="Configuraciones"
            dialogProps={{
              sx: {
                maxWidth: 'sm',
                height: 'auto',
              },
            }}
          >
            <InstagramMessengerWidgetModal agentId={props.agentId} />
          </instagramMessengerWidgetModal.component>
          <mercadolibreWidgetModal.component
            description="Configuraciones"
            dialogProps={{
              sx: {
                maxWidth: 'sm',
                height: 'auto',
              },
            }}
          >
            <MercadolibreWidgetModal agentId={props.agentId} />
          </mercadolibreWidgetModal.component>
          <whatsappModal.component
            title={
              <Typography
                startDecorator={
                  <Image
                    className="w-6"
                    src="/integrations/whatsapp/icon.svg"
                    width={100}
                    height={100}
                    alt="Whatsapp Logo"
                  />
                }
              >
                WhatsApp
              </Typography>
            }
            dialogProps={{
              sx: {
                maxWidth: 'sm',
                height: 'auto',
              },
            }}
          >
            <WhatsAppSettings agentId={props.agentId} />
          </whatsappModal.component>

          <shopifyModal.component
            title={
              <Typography
                startDecorator={
                  <Image
                    className="w-6"
                    src="/shopify/icon.svg"
                    width={100}
                    height={100}
                    alt="Whatsapp Logo"
                  />
                }
              >
                Shopify
              </Typography>
            }
            dialogProps={{
              sx: {
                maxWidth: 'md',
                height: 'auto',
              },
            }}
          >
            <ShopifySettings agentId={props.agentId} />
          </shopifyModal.component>
        </>
      )}

      <UsageLimitModal
        title="Actualice a premium para usar esta función"
        description="Esta función está restringida solo a usuarios premium"
        isOpen={state.isUsageModalOpen}
        handleClose={() => {
          setState({
            isUsageModalOpen: false,
          });
        }}
      />
    </div>
  );
}

export default AgentDeployTab;
