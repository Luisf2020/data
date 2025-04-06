import { useRouter } from 'next/router';
import { ReactElement, useState, useEffect } from 'react';
import Layout from '@app/components/Layout';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  TabList,
  Tab,
  Tabs,
  IconButton,
  Button,
  Divider,
  Chip,
} from '@mui/joy';
import { useSession } from 'next-auth/react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { composioClient } from '@app/lib/api/composio-client';
import { SettingsInputComponent } from '@mui/icons-material';
import ActionSetting from '@app/components/composio/Step/ActionSetting';

type ConnectionData = {
  status: string;
  message: string;
  connection: {
    integrationId: string;
    connectionParams: {
      scope: string;
      scopes: string;
      id_token: string;
      client_id: string;
      expires_in: string;
      token_type: string;
      redirectUrl: string;
      access_token: string;
      callback_url: string;
      client_secret: string;
      code_verifier: string;
      refresh_token: string;
      finalRedirectUri: string;
      oauth_redirect_uri: string;
      headers: {
        Authorization: string;
        'x-request-id': string;
      };
      queryParams: Record<string, string>;
      base_url: string;
    };
    appUniqueId: string;
    meta: {
      app: {
        get_current_user_endpoint: string;
      };
    };
    memberInfo: {
      id: string;
      orgId: string;
      email: string;
      name: string;
      role: string;
      metadata: null;
      createdAt: string;
      updatedAt: string;
      deletedAt: null;
    };
    isDisabled: boolean;
    id: string;
    memberId: string;
    clientUniqueUserId: string;
    status: string;
    statusReason: null;
    enabled: boolean;
    labels: string[];
    createdAt: string;
    updatedAt: string;
    member: {
      id: string;
      orgId: string;
      email: string;
      name: string;
      role: string;
      metadata: null;
      createdAt: string;
      updatedAt: string;
      deletedAt: null;
    };
    appName: string;
    entityId: string;
  } | null;
} | null;

export default function AppsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tabValue, setTabValue] = useState(0);
  const [connectionData, setConnectionData] = useState<ConnectionData>(null);
  const [action, setAction] = useState([]);
  const [detailApp, setDetailApp] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!session?.organization?.id) {
      setError('No se encontró el ID de la organización.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/composio/app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: session.organization.id,
          integrationId: router.query.appId as string,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la conexión.');
      }

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No se recibió URL de redirección');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al iniciar la conexión. Por favor, intente nuevamente.');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchConnectionStatus = async () => {
    if (!session?.organization?.id) return;

    try {
      const appId = router?.query?.appId as string;
      const organizationId = session.organization.id;

      const [response, actionsResponse, detailApp] = await Promise.all([
        composioClient.getConnectionStatus(appId, organizationId),
        composioClient.getActionApps(appId),
        composioClient.getAppDetails(appId)
      ]);
      if (!actionsResponse) {
        throw new Error('Error fetching actions');
      }
      if (!response) {
        throw new Error('Error fetching connection status');
      }

      setAction(actionsResponse?.actions);
      setDetailApp(detailApp)
      setConnectionData(response);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Error fetching connection status');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.organization?.id && router?.query?.appId) {
      fetchConnectionStatus();
    }
  }, [router?.query?.appId, session]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDisconnect = async (detail: any) => {
    try {
      const response = await composioClient.disconnectApp(detail?.connection?.id);

      if (response) {
        setAction([]);
        setConnectionData(null);
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box
        component="main"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!connectionData?.connection) {
    return (
      <Box
        component="main"
        sx={{
          px: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          width: '100%',
          mt: 10
        }}
      >
        {error && (
          <Alert
            color="danger"
            variant="soft"
            startDecorator={<ErrorOutlineIcon />}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Card variant="outlined" sx={{ mt: 2, mb: 4 }}>
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={detailApp?.logo}
                    alt={`${detailApp?.name} Logo`}
                    style={{ width: 40, height: 40, marginRight: 16 }}
                  />
                  <Box>
                    <Typography level="h4">Get {detailApp?.name} actions for connected account</Typography>
                    <Typography level="body-sm">{detailApp?.description}</Typography>
                  </Box>
                </Box>

                <Button
                  variant="soft"
                  color="primary"
                  startDecorator={<SettingsInputComponent />}
                  onClick={handleConnect}
                  loading={isConnecting}
                  loadingPosition="start"
                >
                  Setup {detailApp?.name} integration
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderConnectionInfo = () => {
    const connection = connectionData?.connection;
    if (!connection) return null;

    return (
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Last Updated At</Typography>
          <Typography level="body-sm">{formatDate(connection.updatedAt)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">App name</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography level="body-sm">{connection.appName.toUpperCase()}</Typography>
            <IconButton
              size="sm"
              variant="plain"
              onClick={() => handleCopy(connection.appName)}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Connection Id</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography level="body-sm" sx={{ fontFamily: 'monospace' }}>
              {connection.id}
            </Typography>
            <IconButton
              size="sm"
              variant="plain"
              onClick={() => handleCopy(connection.id)}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Entity</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography level="body-sm" sx={{ fontFamily: 'monospace' }}>
              {connection.entityId}
            </Typography>
            <IconButton
              size="sm"
              variant="plain"
              onClick={() => handleCopy(connection.entityId)}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Integration Id</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              level="body-sm"
              sx={{
                fontFamily: 'monospace',
                color: 'primary.500',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {connection.integrationId}
            </Typography>
            <IconButton
              size="sm"
              variant="plain"
              onClick={() => handleCopy(connection.integrationId)}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Status</Typography>
          <Chip
            color={connection.status === 'ACTIVE' ? 'success' : 'warning'}
            size="sm"
            startDecorator={connection.status === 'ACTIVE' ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
          >
            {connection.status}
          </Chip>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Perform actions</Typography>
          <Button
            variant="soft"
            color="primary"
            size="sm"
          >
            Execute actions
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">Enabled</Typography>
          <Chip
            color={connection.enabled ? 'success' : 'neutral'}
            size="sm"
          >
            {connection.enabled ? 'Enabled' : 'Disabled'}
          </Chip>
        </Box>
      </Stack>
    );
  };

  return (
    <Box
      component="main"
      sx={{
        px: { xs: 8, md: 12 },
        pb: { xs: 8, md: 12 },
        width: '100%',
        mt: 10
      }}
    >

      {error && (
        <Alert
          color="danger"
          variant="soft"
          startDecorator={<ErrorOutlineIcon />}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mt: 2, mb: 4 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img src={detailApp?.logo} alt="Gmail Logo" style={{ width: 40, height: 40, marginRight: 16 }} />
              <Box>
                <Typography level="h4">{detailApp?.name}</Typography>
                <Typography level="body-sm">{detailApp?.description}</Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs Container */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(event, newValue) => setTabValue(newValue as number)}
        >
          <TabList>
            <Tab
              component="button"
            // slotProps={{
            //   icon: InfoOutlinedIcon
            // }}
            >
              Información de Conexión
            </Tab>
            <Tab
              component="button"
            // slots={{
            //   icon: PlayArrowIcon
            // }}
            // iconPosition="start"
            >
              Acciones
            </Tab>
            <Tab
              component="button"
            // slots={{
            //   icon: BoltIcon
            // }}
            // iconPosition="start"
            >
              Disparadores
            </Tab>
          </TabList>
        </Tabs>
        <Button
          color="danger"
          variant="soft"
          startDecorator={<DeleteOutlineIcon />}
          onClick={() => handleDisconnect(connectionData)}
        >
          Eliminar
        </Button>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography level="body-sm">
                  Obtén los detalles de la conexión usando el código
                </Typography>

              </Box>
              <Divider />
              {renderConnectionInfo()}
            </Stack>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <ActionSetting
          actions={action}
          entityId={connectionData.connection.entityId}
          connectedAccountId={connectionData.connection.id}
        />
      )}

      {tabValue === 2 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography level="h4">Triggers Configuration</Typography>
            {/* Contenido de Triggers aquí */}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

AppsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};