import { PlayCircle } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { FaHome, FaLightbulb, FaTools } from "react-icons/fa";
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import {
  Alert,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Link as JoyLink,
  Modal,
  Sheet,
  Stack,
  Typography,
  Chip
} from '@mui/joy';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next/types';
import { useSession } from 'next-auth/react';
import { ReactElement } from 'react';
import * as React from 'react';
import useSWR from 'swr';

import AgentForm from '@app/components/AgentForm';
import GeneralInput from '@app/components/AgentInputs/GeneralInput';
import ModelInput from '@app/components/AgentInputs/ModelInput';
import ToolsInput from '@app/components/AgentInputs/ToolsInput';
import AgentTable from '@app/components/AgentTable';
import Layout from '@app/components/Layout';
import SettingCard from '@app/components/ui/SettingCard';
import UsageLimitModal from '@app/components/UsageLimitModal';
import { getProductFromHostname } from '@app/hooks/useProduct';

import accountConfig from '@chaindesk/lib/account-config';
import { CUSTOMER_SUPPORT_V3 } from '@chaindesk/lib/prompt-templates';
import { fetcher } from '@chaindesk/lib/swr-fetcher';
import { RouteNames } from '@chaindesk/lib/types';
import { withAuth } from '@chaindesk/lib/withAuth';
import { Agent, AgentModelName, Prisma } from '@chaindesk/prisma';
import useStateReducer from '@chaindesk/ui/hooks/useStateReducer';

import { getAgents } from '../api/agents';
import { getDatastores } from '../api/datastores';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import { useMlLogin } from '@app/hooks/useMlLogin';
import { Grid } from '@mui/material';

export default function AgentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [state, setState] = useStateReducer({
    isCreateDatastoreModalOpen: false,
    isCreateDatasourceModalV2Open: false,
    currentDatastoreId: undefined as string | undefined,
    isAgentModalOpen: false,
    isUsageLimitModalOpen: false,
  });

  const getAgentsQuery = useSWR<Prisma.PromiseReturnType<typeof getAgents>>(
    '/api/agents',
    fetcher
  );

  return (
    <Box
      component="main"
      className="MainContent"
      sx={(theme) => ({
        px: {
          xs: 2,
          md: 6,
        },
        pt: {
          // xs: `calc(${theme.spacing(2)} + var(--Header-height))`,
          // sm: `calc(${theme.spacing(2)} + var(--Header-height))`,
          // md: 3,
        },
        pb: {
          xs: 2,
          sm: 2,
          md: 3,
        },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        // height: '100dvh',
        width: '100%',
        gap: 1,
      })}
    >
      <Breadcrumbs
        size="sm"
        aria-label="breadcrumbs"
        separator={<ChevronRightRoundedIcon />}
        sx={{
          '--Breadcrumbs-gap': '1rem',
          '--Icon-fontSize': '16px',
          fontWeight: 'lg',
          color: 'neutral.400',
          px: 0,
        }}
      >
        <Link href={RouteNames.HOME}>
          <FaHome />
        </Link>
        <Typography fontSize="inherit" color="neutral">
          Agentes
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          my: 1,
          gap: 1,
          flexWrap: 'wrap',
          // '& > *': {
          //   minWidth: 'clamp(0px, (500px - 100%) * 999, 100%)',
          //   flexGrow: 1,
          // },
        }}
      >
        <div className="flex items-center">
          <Typography level="h1" fontSize="xl4">
            Agentes
          </Typography>
          <Link href="https://www.tella.tv/video/crea-tu-primer-agente-de-ia-esbb" passHref target='_blank' className="ml-2 text-xs px-2 py-1 rounded-full bg-[rgba(34,197,94,0.5)] text-black opacity-70 dark:bg-[rgba(34,197,94,0.5)] dark:text-white flex items-center">
            <span className="mr-1 bg-green-500 !text-white text-xs px-1 py-0.5 rounded-full">Nuevo</span>
            <LinkIcon className="mr-1 w-4 h-4" />
            <h2>Ver tutorial - Creación de agentes</h2>
          </Link>
        </div>
        {/* <Box sx={{ flex: 999999 }} /> */}
        <Box sx={{ display: 'flex', gap: 1, '& > *': { flexGrow: 1 } }}>
          {/* <Button
            variant="outlined"
            color="neutral"
            startDecorator={<i data-feather="download-cloud" />}
          >
            Download PDF
          </Button> */}
          <Button
            variant="solid"
            color="primary"
            startDecorator={<AddIcon />}
            onClick={() => {
              if (
                (getAgentsQuery?.data?.length || 0) >=
                accountConfig[session?.organization?.currentPlan!]?.limits
                  ?.maxAgents
              ) {
                return setState({
                  isUsageLimitModalOpen: true,
                });
              }

              setState({ isAgentModalOpen: true });
            }}
          >
            Nuevo Agente
          </Button>
        </Box>
      </Box>

      <Alert
        variant="soft"
        color="neutral"
        startDecorator={<InfoRoundedIcon />}
        sx={{ mb: 2 }}
      >
        Los agentes son instancias personalizables de modelos de lenguaje
        grandes adaptadas para ajustarse a tus casos de uso específicos. Al
        conectarlos a un almacén de datos, puedes entrenarlos en tu base de
        conocimientos única.
      </Alert>

      <Grid container spacing={2} >
        {[
          {
            name: "Solicitar mejora",
            description: "Queres una nueva mejora?",
            icon: <FaTools style={{ fontSize: '1.5rem' }} />,
          },
        ].map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index} className='relative'>
            <Button
              className='relative'
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}
              variant="outlined">
              {/* main container */}
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip color="primary" sx={{ ml: 1 }} size="sm" className="absolute top-2 left-0">
                  Nuevo
                </Chip>
                {/* icon */}
                <Typography color="primary">{item.icon}</Typography>
                {/* text content */}
                <Stack className='flex-col items-start'>
                  <Typography component="h3" fontWeight="bold" className="line-clamp-1">
                    {item.name}
                  </Typography>
                  <Typography level='body-xs'>
                    {item.description}
                  </Typography>
                </Stack>
              </Box>
            </Button>
          </Grid>
        ))}

      </Grid>
      {getAgentsQuery.data && <AgentTable items={getAgentsQuery.data} />}

      <Modal
        onClose={() => setState({ isAgentModalOpen: false })}
        open={state.isAgentModalOpen}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Sheet
          variant="outlined"
          sx={{
            width: 600,
            maxWidth: '100%',
            borderRadius: 'md',
            p: 3,
            boxShadow: 'lg',
            overflowY: 'auto',
            maxHeight: '95vh',
          }}
        >
          <div>
            <Typography level="h3">
              Agentes
            </Typography>
          </div>
          <Divider sx={{ my: 4 }} />
          <AgentForm
            onSubmitSucces={(agent: Agent) => {
              setState({ isAgentModalOpen: false });
              if (agent?.id) {
                router.push(`${RouteNames.AGENTS}/${agent.id}`);
              }
            }}
          >
            {({ mutation }) => (
              <Stack gap={4}>
                <GeneralInput />

                <details>
                  <summary>Configuración del Modelo GPT / del Prompt</summary>
                  <Stack sx={{ pt: 2, px: 1 }}>
                    <ModelInput />
                  </Stack>
                </details>

                <SettingCard
                  title="Herramientas"
                  disableSubmitButton
                  description="Dale herramientas a tu Agente para hacerlo más inteligente"
                >
                  <ToolsInput />
                </SettingCard>

                <Button
                  type="submit"
                  variant="solid"
                  color="primary"
                  loading={mutation.isMutating}
                  sx={{ ml: 'auto', mt: 2 }}
                // disabled={!methods.formState.isValid}
                // startDecorator={<SaveRoundedIcon />}
                >
                  {'Create'}
                </Button>
              </Stack>
            )}
          </AgentForm>
        </Sheet>
      </Modal>
      <UsageLimitModal
        isOpen={state.isUsageLimitModalOpen}
        handleClose={() =>
          setState({
            isUsageLimitModalOpen: false,
          })
        }
      />
    </Box>
  );
}

AgentsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

// export const getServerSideProps = withAuth(
//   async (ctx: GetServerSidePropsContext) => {
//     return {
//       props: {
//         product: getProductFromHostname(ctx?.req?.headers?.host),
//       },
//     };
//   }
// );
