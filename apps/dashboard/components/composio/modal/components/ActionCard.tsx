import React, { useState } from 'react';
import { Box, Typography, Chip, Checkbox, Button } from '@mui/joy';

interface ActionCardProps {
  action: {
    display_name?: string;
    displayName?: string;
    description: string;
    tags: string[];
  };
  actionIndex: number;
  handleActionSave: (selectedActions: any, matched: boolean) => void;
  selectedActions: any;
  connection: any;
  matched: any;
}

export const ActionCard: React.FC<ActionCardProps> = ({ matched, action, actionIndex, handleActionSave, selectedActions }) => {
  return (
    <Box
      key={actionIndex}
      sx={{
        p: 2,
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'divider',
        mb: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography level="title-sm">
          {action?.display_name || action?.displayName}
        </Typography>
        {action?.tags?.includes('important') && (
          <Chip
            size="sm"
            variant="soft"
            color="primary"
          >
            Importante
          </Chip>
        )}
        <Checkbox
          checked={matched}
          onChange={() => handleActionSave(action, matched)}
        />
      </Box>
      <Typography level="body-sm" color="neutral">
        {action.description}
      </Typography>
    </Box>
  );
};
