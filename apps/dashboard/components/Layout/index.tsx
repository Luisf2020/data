import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import Intercom from '@intercom/messenger-js-sdk';

import { BsFillInboxesFill, BsTools } from "react-icons/bs";
import { RiRobot3Fill } from "react-icons/ri";
import { FaDatabase } from "react-icons/fa6";
import { FaWpforms } from "react-icons/fa";
import { MdOutlineAnalytics } from "react-icons/md";
import { MdEmail } from "react-icons/md";
import { RiContactsBook2Line } from "react-icons/ri";
import { IoSettings } from "react-icons/io5";
import { IoDocumentText } from "react-icons/io5";
import { SiGoogleanalytics } from "react-icons/si";

import ShowChartIcon from '@mui/icons-material/ShowChart';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Alert,
  Badge,
  Button,
  Chip,
  IconButton,
  Stack,
  Theme,
  useColorScheme,
} from '@mui/joy';
import Box from '@mui/joy/Box';
import { ColorPaletteProp, SxProps } from '@mui/joy/styles/types';
import Typography from '@mui/joy/Typography';
import getConfig from 'next/config';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';
import toast from 'react-hot-toast';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';

import useModal from '@app/hooks/useModal';
import { useNavbar } from '@app/hooks/useNavbar';
import useProduct from '@app/hooks/useProduct';
import { countUnread } from '@app/pages/api/logs/count-unread';
import { getStatus } from '@app/pages/api/status';

import { appUrl } from '@chaindesk/lib/config';
import { fetcher } from '@chaindesk/lib/swr-fetcher';
import { AppStatus, RouteNames } from '@chaindesk/lib/types';
import { Prisma } from '@chaindesk/prisma';

import Logo from '../Logo';
import SEO from '../SEO';

import ExpandedNavigation from './ExpandedNavigation';
import Main from './Main';
import Navigation from './Navigation';
import Root from './Root';
import SideDrawer from './SideDrawer';

type Props = {
  children: React.ReactNode;
  mainSxProps?: SxProps;
};

export default function Layout(props: Props) {
  const router = useRouter();
  const { mode, setMode } = useColorScheme();
  const { data: session, status } = useSession();
  const { product } = useProduct();
  const { open, setOpen } = useNavbar();

  const countUnreadQuery = useSWR<Prisma.PromiseReturnType<typeof countUnread>>(
    '/api/logs/count-unread',
    fetcher,
    {
      refreshInterval: 60000,
    }
  );

  const getStatusQuery = useSWR<Prisma.PromiseReturnType<typeof getStatus>>(
    '/api/status',
    fetcher,
    {
      refreshInterval: 60000,
    }
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [userMenuElement, setUserMenuElement] =
    React.useState<null | HTMLElement>(null);

  const shareFeedbackModal = useModal();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!session) return;
    console.log('session', session);

    Intercom({
      app_id: "a39n9c4m",
      user_id: session?.user?.id ?? undefined,
      name: session?.user?.name ?? undefined,
      email: session?.user?.email ?? undefined,
      created_at: session?.user?.createdAt ? new Date(session.user.createdAt).getTime() / 1000 : undefined,
      organization: session?.organization?.name ?? undefined,
      organization_is_premium: session?.organization?.isPremium ?? undefined,
      organization_current_plan: session?.organization?.currentPlan ?? undefined,
      organization_customer_id: session?.organization?.customerId ?? undefined,
      organization_id: session?.organization?.id ?? undefined,
      user_onboarding_status: session?.user?.onboardingStatus ?? undefined,
      user_onboarding_status_completed_at: session?.user?.onboarding_completed_at ?? undefined,
      user_role: session?.user?.role ?? undefined,
    });
  }, [session]);

  const isMenuOpen = Boolean(userMenuElement);

  const openUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUserMenuElement(event.currentTarget);
  };

  const closeUserMenu = () => {
    setUserMenuElement(null);
  };

  const appLinks = React.useMemo(() => {
    return [
      ...(product === 'chatsappai'
        ? [
          {
            label: 'Bandeja de entrada',
            route: RouteNames.LOGS,
            icon: (
              <Badge
                badgeContent={countUnreadQuery?.data}
                size="sm"
                color="danger"
                invisible={
                  !countUnreadQuery?.data || countUnreadQuery?.data <= 0
                }
              >
                <BsFillInboxesFill style={{ fontSize: '18px' }} />
              </Badge>
            ),
            active: router.route === RouteNames.LOGS,
            isNew: false,
          },
          {
            label: 'Agentes',
            route: RouteNames.AGENTS,
            icon: <RiRobot3Fill style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.AGENTS),
            isExperimental: false,
            isNew: false,
          },
          {
            label: 'Apps/Herramientas',
            route: RouteNames.TOOLS,
            icon: (
              <BsTools style={{ fontSize: '18px' }} />
            ),
            active: router.route === RouteNames.TOOLS,
            isExperimental: true,
            isNew: false
          },
          {
            label: 'Base de datos',
            route: RouteNames.DATASTORES,
            icon: <FaDatabase style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.DATASTORES),
            isNew: false,
          },
          {
            label: 'Formularios',
            route: RouteNames.FORMS,
            icon: <FaWpforms style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.FORMS),
            isNew: false,
            isExperimental: false,
          },
          {
            label: 'Analytics',
            route: RouteNames.ANALYTICS,
            icon: <SiGoogleanalytics style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.ANALYTICS),
            isNew: false,
          },
          {
            label: 'Bandejas de Email',
            route: RouteNames.EMAIL_INBOXES,
            icon: <MdEmail style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.EMAIL_INBOXES),
            // isExperimental: true,
            isNew: false,
          },
          {
            label: 'Contactos',
            route: RouteNames.CONTACTS,
            icon: <RiContactsBook2Line style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.CONTACTS),
            isNew: false,
          },
        ]
        : []),
      ...(product === 'cs'
        ? [
          {
            label: 'Bandeja de entrada',
            route: RouteNames.LOGS,
            icon: (
              <Badge
                badgeContent={countUnreadQuery?.data}
                size="sm"
                color="danger"
                invisible={
                  !countUnreadQuery?.data || countUnreadQuery?.data <= 0
                }
              >
                <InboxRoundedIcon style={{ fontSize: '18px' }} />
              </Badge>
            ),
            active: router.route === RouteNames.LOGS,
            isNew: false,
          },
          {
            label: 'Agentes',
            route: RouteNames.AGENTS,
            icon: <SmartToyRoundedIcon style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.AGENTS),
            isExperimental: false,
            isNew: false,
          },
        ]
        : []),
      ...(product === 'chat'
        ? [
          {
            label: 'Chat',
            route: RouteNames.CHAT,
            icon: <ChatRoundedIcon style={{ fontSize: '18px' }} />,
            active: router.route === RouteNames.CHAT,
            isExperimental: false,
            isNew: false,
          },
          {
            label: 'Fuente de datos',
            route: RouteNames.DATASTORES,
            icon: <StorageRoundedIcon style={{ fontSize: '18px' }} />,
            active: router.route.startsWith(RouteNames.DATASTORES),
            isNew: false,
          },
        ]
        : []),
    ];
  }, [router.route, countUnreadQuery?.data, product]);

  const settingLinks = React.useMemo(() => {
    return [
      // {
      //   label: 'Apps',
      //   route: RouteNames.APPS,
      //   icon: <AutoFixHighRoundedIcon fontSize="small" />,
      //   active: router.route === RouteNames.APPS,
      // },
      // {
      //   label: 'Configuración',
      //   route: RouteNames.SETTINGS,
      //   icon: <IoSettings style={{ fontSize: '18px' }} />,
      //   active: router.route.startsWith(RouteNames.SETTINGS),
      //   isExperimental: false,
      //   isNew: false,
      // },
    ];
  }, [router.route]);

  const docLinks = React.useMemo(() => {
    return [
      // {
      //   label: 'Documentación',
      //   route: 'https://docs.chatsappai.com/',
      //   icon: <IoDocumentText style={{ fontSize: '18px' }} />,
      //   target: 'blank',
      //   isExperimental: false,
      //   isNew: false,
      // },
      // {
      //   label: 'Help Center',
      //   route: 'https://chatsappai.com/help',
      //   icon: <HelpRoundedIcon fontSize="small" />,
      //   target: 'blank',
      //   isExperimental: false,
      //   isNew: false,
      // },
    ];
  }, [router.route]);

  const { publicRuntimeConfig } = getConfig();
  const isMaintenance = !!getStatusQuery?.data?.isMaintenance;

  const SystemStatusIndicator = getStatusQuery?.data?.status ? (
    <div></div>
  ) : (
    // <Link
    //   href={'https://status.chatsappai.com/'}
    //   target={'_blank'}
    //   className={!open ? 'fixed bottom-2' : ''}
    // >
    //   <Chip
    //     color={
    //       (
    //         {
    //           [AppStatus.OK]: 'success',
    //           [AppStatus.WARNING]: 'warning',
    //           [AppStatus.KO]: 'danger',
    //         } as Record<AppStatus, ColorPaletteProp>
    //       )[getStatusQuery?.data?.status]
    //     }
    //     variant="soft"
    //     sx={{ cursor: 'pointer' }}
    //     endDecorator={open ? <ArrowForwardRoundedIcon /> : null}
    //   >
    //     <Stack direction="row" alignItems={'center'} gap={1}>
    //       <Box
    //         sx={{
    //           width: '10px',
    //           height: '10px',
    //           borderRadius: '99px',
    //           // bgcolor: isStatusOK ? 'success.300' : 'danger.500',
    //           ...(getStatusQuery?.data?.status === AppStatus.OK && {
    //             bgcolor: 'success.300',
    //           }),
    //           ...(getStatusQuery?.data?.status === AppStatus.KO && {
    //             bgcolor: 'danger.500',
    //           }),
    //           ...(getStatusQuery?.data?.status === AppStatus.WARNING && {
    //             bgcolor: 'warning.500',
    //           }),
    //         }}
    //       />
    //       {open && <Typography level="body-sm">system status</Typography>}
    //     </Stack>
    //   </Chip>
    // </Link>
    <div />
  );

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (
        window.location.hostname === 'app.databerry.ai' ||
        window.location.hostname === 'www.chatsappai.com' ||
        window.location.hostname === 'chatsappai.com'
      ) {
        window.location.href =
          'https://dashboard.chatsappai.com' + window.location.pathname;
      }
    }
  }, []);

  React.useEffect(() => {
    if (
      getStatusQuery?.data?.status &&
      getStatusQuery?.data?.status !== AppStatus.OK
    ) {
      toast.error(
        'Estamos experimentando algunos problemas. Vuelva a intentarlo más tarde. ¡Disculpe las molestias!',
        {
          duration: 2000,
          id: 'status-error',
        }
      );
    }
  }, [getStatusQuery?.data?.status]);

  // const showPromoBanner =
  //   status !== 'loading' && !session?.organization?.isPremium;
  const showPromoBanner = false;
  const promoBannerHeight = showPromoBanner ? 45.5 : 0;

  return (
    <>
      <SEO
        title="Dashboard | ChatsappAI."
        description="Crea tu propio bot de chat de ChatGPT para tu negocio."
        baseUrl={appUrl}
        uri={router.pathname}
      />
      {drawerOpen && (
        <SideDrawer
          onClose={() => setDrawerOpen(false)}
          className={mounted ? mode : ''}
        >
          <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <ExpandedNavigation
              product={product}
              appLinks={appLinks}
              docLinks={docLinks as any}
              settingLinks={settingLinks}
              publicRuntimeConfig={publicRuntimeConfig}
              status={getStatusQuery?.data?.status}
            />
          </Box>
        </SideDrawer>
      )}
      {showPromoBanner && (
        <Stack
          sx={{
            width: '100vw',
            maxWidth: '100%',
            p: 0,
          }}
        >
          {/* <Alert
            size="sm"
            variant="soft"
            color="warning"
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              gap: 3,
              borderRadius: 0,
            }}
            invertedColors
          >
            <Stack direction="row" gap={1}>
              <Chip color="danger">Ending Soon!</Chip>
              <Typography>
                Share on social and get 30% off on your subscription!
              </Typography>
            </Stack>

            <Stack direction="row" gap={1}>
              <a
                target="_blank"
                className="w-full"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`This is a game changer! 
          
          ChatsappAIhas transformed the way we handle customer queries with its next-gen AI native solution. Definitely a game-changer!
          
          Find out more: https://www.chatsappai.com`)}`}
              >
                <Button
                  color="neutral"
                  // variant="outlined"
                  startDecorator={<TwitterIcon />}
                  size="sm"
                >
                  Share
                </Button>
              </a>
              <a
                target="_blank"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.chatsappai.com`}
                className="w-full"
              >
                <Button
                  color="neutral"
                  // variant="outlined"
                  startDecorator={<LinkedInIcon />}
                  size="sm"
                >
                  Share
                </Button>
              </a>
            </Stack>
          </Alert> */}
        </Stack>
      )}

      <Root
        className={mounted ? mode : ''}
        sx={{
          ...(drawerOpen && {
            height: `calc(100dvh - ${promoBannerHeight}px)`,
            overflow: 'hidden',
          }),
          maxHeight: `calc(100dvh - ${promoBannerHeight}px)`,
          minHeight: `calc(100dvh - ${promoBannerHeight}px)`,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* <IconButton
          variant="soft"
          size="sm"
          onClick={() => {
            setOpen(true);
            setDrawerOpen(true);
          }}
          sx={{
            display: { sm: 'none' },
            marginTop: '0.6rem',
            // left: -10,
            zIndex: 999,
            position: 'fixed',
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton> */}
        <Navigation
          latestVersion={getStatusQuery?.data?.latestVersion}
          product={product}
          appLinks={appLinks}
          docLinks={docLinks as any}
          settingLinks={settingLinks}
          publicRuntimeConfig={publicRuntimeConfig}
          status={getStatusQuery?.data?.status}
          isMaintenance={isMaintenance}
        />

        <Main
          sx={{
            position: 'relative',
            minHeight: `calc(100dvh - ${promoBannerHeight}px)`,
            maxHeight: `calc(100dvh - ${promoBannerHeight}px)`,
            height: '100dvh',
            overflowY: 'auto',
            width: '100%',

            ...props.mainSxProps,
            p: 0,
          }}
        >
          <Stack sx={{ height: '100%' }}>
            <Stack
              direction={'row'}
              sx={{
                position: 'sticky',
                width: '100%',

                display: {
                  sm: 'none',
                  // borderBottom: '1px solid',
                },
                p: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                gap: 2,
              }}
            >
              <IconButton
                variant="outlined"
                size="sm"
                onClick={() => {
                  setOpen(true);
                  setDrawerOpen(true);
                }}
                sx={{}}
              >
                <MenuRoundedIcon />
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Logo className="w-10" />
                <Typography component="h1" fontWeight="xl">
                  ChatsappAI
                </Typography>
              </Box>
            </Stack>
            <Stack
              sx={{
                overflowY: 'auto',
                height: '100%',
                pt: 1,
                px: 2,
              }}
            >
              {props.children}
            </Stack>
          </Stack>
        </Main>
        <shareFeedbackModal.component
          dialogProps={{
            sx: {
              height: '100%',
              flex: 1,
            },
          }}
        >
          <Box
            component={'iframe'}
            src={
              'https://dashboard.chatsappai.com/forms/clqz46y9u003e8ipv0lvfcnsg'
            }
            frameBorder="0"
            sx={{
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              borderRadius: 'xl',
              overflow: 'hidden',
            }}
          ></Box>
        </shareFeedbackModal.component>
      </Root>
    </>
  );
}
