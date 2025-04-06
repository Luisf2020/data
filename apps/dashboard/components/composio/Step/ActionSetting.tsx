import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/joy';
import { composioClient } from '@app/lib/api/composio-client';
import ActionTestingModal from '../modal/ActionTestingModal';

interface ActionParameter {
  type: string;
  description?: string;
  required?: boolean;
}

interface Action {
  displayName: string;
  description: string;
  parameters?: Record<string, ActionParameter>;
}

interface ActionSettingProps {
  actions: Action[];
  entityId: string;
  connectedAccountId: string;
}

interface Action {
  appId: string | null;
  appKey: string | null;
  deprecated: boolean;
  description: string;
  displayName: string;
  display_name: string;
  enum: string;
  logo: string;
  name: string;
}

interface ActionSettingProps {
  actions: Action[];
}

const ActionSetting: React.FC<ActionSettingProps> = ({ actions, entityId, connectedAccountId }) => {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleActionClick = async (action: Action) => {
    try {
      const data = await composioClient.getActionDetail(action.enum);
      setSelectedAction(data);
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching app details:', error);
    }
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography level="body-sm">
            Conecta los disparadores utilizando el siguiente:
          </Typography>
        </Box>
        <Divider />
        <Stack spacing={3} sx={{ mt: 2 }}>
          {actions?.map((act, index) => (
            <Box
              key={index}
              onClick={() => handleActionClick(act)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                p: 2,
                borderRadius: 'sm',
              }}
            >
              <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
                Action: {act.displayName}
              </Typography>
              <Typography level="body-sm">
                Description: {act.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
            </Box>
          ))}
        </Stack>
      </CardContent>

      {selectedAction && (
        <ActionTestingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          actionData={selectedAction}
          entityId={entityId}
          connectedAccountId={connectedAccountId}
        />
      )}
    </Card>
  );
};

export default ActionSetting;