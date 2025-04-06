import {
  Box,
  Button,
  Chip,
  ColorPaletteProp,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/joy';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { ProductType } from '@app/hooks/useProduct';

import { AppStatus, RouteNames } from '@chaindesk/lib/types';
import DarkModeToggle from '@chaindesk/ui/DarkModeToggle';

import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import SelectOrganizationInput from '../AccountCard/SelectOrganizationInput';

export type AppLink =
  | {
    label: string;
    route: RouteNames;
    icon: JSX.Element;
    active: boolean;
    isNew: boolean;
    isExperimental?: undefined;
  }
  | {
    label: string;
    route: RouteNames;
    icon: JSX.Element;
    active: boolean;
    isExperimental: boolean;
    isNew: boolean;
  };

function NavigationLink(props: {
  href: string;
  target?: string;
  active?: boolean;
  icon?: React.ReactNode;
  label?: string | React.ReactElement;
  isExperimental?: boolean;
  isNew?: boolean;
}) {
  return (
    <Link key={props.href} href={props.href} target={props?.target}>
      <ListItem>
        <ListItemButton
          variant={props.active ? 'soft' : 'plain'}
          color={props.active ? 'primary' : 'neutral'}
        >
          <ListItemDecorator
            sx={{ color: props.active ? 'inherit' : 'neutral.500' }}
          >
            {props.icon}
          </ListItemDecorator>
          <ListItemContent>{props.label}</ListItemContent>

          <Stack direction="row" alignItems={'center'} sx={{ ml: 'auto' }}>
            {props.isNew && (
              <Chip
                className="text-white bg-gradient-to-r from-orange-500 via-red-500 to-red-500"
                size="sm"
              >
                new
              </Chip>
            )}

            {props.isExperimental && (
              <Chip
                className="text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                size="sm"
              >
                beta
              </Chip>
            )}
          </Stack>
        </ListItemButton>
      </ListItem>
    </Link>
  );
}

export default function ExpandedNavigation({
  product,
  appLinks,
  settingLinks,
  docLinks,
  publicRuntimeConfig,
  status,
}: {
  product: ProductType;
  appLinks: AppLink[];
  settingLinks: AppLink[];
  docLinks: AppLink[];
  status: AppStatus | undefined;
  publicRuntimeConfig: Record<string, unknown> & { version?: string };
}) {
  const { data: session } = useSession({
    required: true,
  });
  return (
    <>
      <Stack
        className="h-full px-2 overflow-y-auto"
        bgcolor="background.surface"
      >
        <List size="sm" sx={{ '--ListItem-radius': '8px' }}>
          <Stack
            direction="row"
            width="100%"
            gap={1}
            justifyContent="space-between"
            justifyItems="center"
            paddingTop={1}
            paddingBottom={1}
            px={1}
            mb={1}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <div className="relative w-7 h-7 mt-[0.5px] flex justify-center ">
                <Image layout="fill" src="/logo.png" alt="ChatsappAI" />
              </div>
              <Typography level="title-md">Laburen.com</Typography>
            </Stack>
            <DarkModeToggle variant="plain" color="neutral" />
          </Stack>

          <ListItem nested>
            {/* {!!session?.user?.id && (
              <Head>
                <script
                  id="chatbox"
                  type="module"
                  dangerouslySetInnerHTML={{
                    __html: `
            import Chatbox from 'https://cdn.jsdelivr.net/npm/@chatsappai/embeds@1.0.231/dist/chatbox/index.min.js';
            // import Chatbox from 'http://localhost:8000/dist/chatbox/index.js';
            try {
            Chatbox.initBubble({
                agentId: 'clzvs1pve000742eqo3k38p9z',
                // agentId: 'clrz0tn6h000108kxfyomdzxg',
                contact: {
                  userId: '${session?.user?.id}',
                  firstName: '${session?.user?.name || ''}',
                  email: '${session?.user?.email}',
                },
                // context: '${JSON.stringify(`Task Bug Reporting: Use the following step-by-step to collect information about the bug and report it to the development team.
                // 1- Please describe the bug in detail.
                // 2- Please provide the steps to reproduce the bug.
                // 3- Please provide the expected behavior.
                // 4- Please provide your ressource ID (Agent ID or Datastore ID or Form ID)
                // 5- Please share a screenshot or a video if possible.
                // 6- Tell the user that the bug has been reported and that the development team will take care of it.
                // `)}',
                interface: {
                  iconUrl: 'https://dashboard.chatsappai.com/_next/image?url=%2Flogo.png&w=1920&q=75',
                  position: 'right',
                  bubbleButtonStyle: {
                    width: '40px',
                    height: '40px',
                  },
                  bubbleIconStyle: {
                    // padding: '4px'
                    padding: '5px'
                  },
                  iconStyle: {
                    // padding: '7px'
                    padding: '5px'
                  },
                  isInitMessagePopupDisabled: true,
                  initialMessages: [
                    'Hola <strong>${session?.user?.name || session?.user?.email || ''
                      }</strong> 👋',
                    '¿Cómo puedo ayudarte?',
                  ],
                  messageTemplates: [
                    "🐛 Informe de errores",
                    "💬 Comentarios sobre el producto",
                    "❤️ Me encanta ChatsappAI",
                  ]
                } 
              });

            } catch (error) {
              console.log(error)
            }
            `,
                  }}
                />
              </Head>
            )} */}

            <List
              aria-labelledby="nav-list-browse"
              sx={{
                '& .JoyListItemButton-root': { p: '8px' },
                mt: 1,
              }}
            >
              {appLinks.map((each) => (
                <NavigationLink
                  key={each.route}
                  href={each.route}
                  active={each.active}
                  icon={each.icon}
                  label={each.label}
                  isExperimental={each.isExperimental}
                  isNew={each.isNew}
                  target={(each as any).target}
                />
              ))}

              {/* {settingLinks.map((each) => (
                <NavigationLink
                  key={each.route}
                  href={each.route}
                  active={each.active}
                  icon={each.icon}
                  label={each.label}
                  isExperimental={each.isExperimental}
                  isNew={each.isNew}
                  target={(each as any).target}
                />
              ))} */}
              {/* <Divider sx={{ my: 1 }} />
              {docLinks.map((each) => (
                <NavigationLink
                  key={each.route}
                  href={each.route}
                  active={(each as any).active}
                  icon={each.icon}
                  label={each.label}
                  isExperimental={each.isExperimental}
                  isNew={each.isNew}
                  target={(each as any).target}
                />
              ))} */}
              {/* {(['chatsappai', 'cs', 'chat'] as ProductType[]).includes(
                product
              ) && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    level="body-xs"
                    sx={{ mt: 1, mb: 1, ml: 1, fontStyle: 'italic' }}
                  >
                    Other Products
                  </Typography>

                  {(['chatsappai', 'cs'] as ProductType[]).includes(product) && (
                    <Stack spacing={1}>
                      <Link
                        href={
                          process.env.NODE_ENV === 'production'
                            ? 'https://chat.chatsappai.com/chat'
                            : 'http://chat.localhost:3000/chat'
                        }
                      >
                        <Button
                          sx={{ width: '100%' }}
                          className="font-title"
                          color="neutral"
                          variant="soft"
                          startDecorator={<ChatRoundedIcon fontSize="sm" />}
                        >
                          Search Assistant
                        </Button>
                      </Link>
                    </Stack>
                  )}
                  {(['chat'] as ProductType[]).includes(product) && (
                    <Link
                      href={
                        process.env.NODE_ENV === 'production'
                          ? `${appUrl}/agents`
                          : 'http://localhost:3000/agents'
                      }
                    >
                      <Button
                        sx={{ width: '100%' }}
                        color="neutral"
                        variant="soft"
                        endDecorator={
                          <Chip
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            size="sm"
                            sx={{
                              color: 'white',
                            }}
                          >
                            new
                          </Chip>
                        }
                      >
                        ChatsappAIAgents
                      </Button>
                    </Link>
                  )}

                  <Divider sx={{ my: 2 }} />
                </>
              )} */}
            </List>
          </ListItem>
        </List>

        {/* <AccountCard /> */}
        <SelectOrganizationInput />

        <Divider sx={{ my: 2 }} />

        <Stack gap={1}>
          <Link href="mailto:support@chatsappai.com" className="mx-auto">
            <Typography level="body-sm" mx={'auto'}>
              support@chatsappai.com
            </Typography>
          </Link>
        </Stack>

        <Stack gap={1} pb={4} mt={3}>
          <Link
            href="https://www.tella.tv/video/bienvenidos-a-chatsappaicom-11zn"
            target='_blank'
            className="mx-auto bg-green-500/60 text-black dark:text-white rounded-lg text-center p-2 w-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
          >
            <LinkIcon className="mr-1 w-4 h-4" />
            <p className='font-light text-[.9rem] ml-1'>
              Mirar Tutorial
            </p>
          </Link>
        </Stack>
      </Stack>
      {<Divider orientation="vertical" />}
    </>
  );
}
