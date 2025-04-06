import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { composioClient } from '@app/lib/api/composio-client';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Accordion,
  AccordionGroup,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Chip,
  Input
} from '@mui/joy';
import { ToolSchema } from '@chaindesk/lib/types/dtos';
import { ModalActionsFilter } from './components/ModalActionsFilter';

interface Action {
  name: string;
  enum: string;
  logo: string;
  tags: string[];
  displayName: string;
  description: string;
  deprecated: boolean;
  display_name: string;
  method?: string;
}

interface Connection {
  name: string;
  appId: string;
  logo: string;
  actions: Action[];
}

interface AppToolModalProps {
  tools: object[];
  onSubmit: (values: ToolSchema) => void;
}

function AppToolModal({ onSubmit, tools, }: AppToolModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!session?.organization?.id) return;

      try {
        const organizationId = session.organization.id;
        const [response, responseTrigger] = await Promise.all([
          composioClient.getMeApps(organizationId),
          composioClient.getMeTriggersApps(organizationId)
        ]);

        if (!response || !response.connections) {
          throw new Error('No connections found in response');
        }

        if (!responseTrigger || !responseTrigger.connections) {
          throw new Error('No trigger connections found in responseTrigger');
        }

        const combinedConnections = response.connections.map((connection: any) => {
          const triggerConnection = responseTrigger.connections.find((trigger: any) => trigger.appId === connection.appId);
          return {
            ...connection,
            triggers: triggerConnection ? triggerConnection.triggers : []
          };
        });

        setConnections(combinedConnections);

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError('Error fetching connection status');
        setLoading(false);
      }
    };

    fetchConnectionStatus();
  }, [session]);

  const handleActionClick = async (action: Action, connection: Connection) => {
    try {
      let details;
      const isAction = action.method === 'action';

      // Obtener detalles según el tipo
      if (isAction) {
        details = await composioClient.getActionDetail(action.enum);

        // Payload para acciones
        const actionPayload: ToolSchema = {
          type: 'app',
          config: {
            name: action.displayName || action.display_name,
            description: action.description,
            appId: connection.appId,
            entityId: session?.organization?.id,
            logo: connection.logo,
            actionId: action.enum,
            body: Object.entries(details.parameters.properties).map(([key, value]) => ({
              key,
              value: '',
              isUserProvided: true,
              description: (value as any).description,
            })),
          },
        };

        await onSubmit(actionPayload);
      } else {
        // Obtener detalles del trigger
        details = await composioClient.getTriggerDetail(
          session?.organization?.id ?? '',
          action.enum,
          router?.query?.agentId as string
        );

        // Payload para triggers
        const triggerPayload: ToolSchema = {
          type: 'app',
          config: {
            name: action.displayName || action.display_name,
            description: action.description,
            appId: connection.appId,
            entityId: session?.organization?.id,
            logo: connection.logo,
            actionId: action.enum,
            // Aquí puedes agregar propiedades específicas de triggers si las necesitas
            ...details.parameters.properties,
          },
        };

        await onSubmit(triggerPayload);
      }

    } catch (error) {
      console.error(`Error fetching ${action.method} details:`, error);
    }
  };

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography color="danger">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography level="title-lg">
            Acciones Disponibles
          </Typography>
        </Box>
        <Divider />

        <AccordionGroup sx={{ mt: 2 }}>
          {connections.map((connection, index) => (
            <Accordion key={index}>
              <AccordionSummary>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={connection.logo}
                    alt={connection.name}
                    size="sm"
                  />
                  <Typography level="title-md" sx={{ textTransform: 'capitalize' }}>
                    {connection.name}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <ModalActionsFilter
                  tools={tools}
                  connection={connection}
                  handleActionClick={(selectedActions, connection) => {
                    handleActionClick(selectedActions, connection)
                  }}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </AccordionGroup>
      </CardContent>
    </Card>
  );
}

export default AppToolModal;