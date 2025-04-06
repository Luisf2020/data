import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import Alert from '@mui/joy/Alert';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import axios from 'axios';
import Link from 'next/link';
import router from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';

import AgentForm from '@app/components/AgentForm';
import ModelInput from '@app/components/AgentInputs/ModelInput';
import SettingCard from '@app/components/ui/SettingCard';

import { RouteNames } from '@chaindesk/lib/types';
import { CreateAgentSchema } from '@chaindesk/lib/types/dtos';
import { Agent, AppDatasource as Datasource } from '@chaindesk/prisma';

import GeneralInput from '../AgentInputs/GeneralInput';
import ConnectForm from '../ConnectForm';

type Props = {
  defaultValues?: CreateAgentSchema;
  onSubmitSucces?: (agent: Agent) => any;
  agentId?: string;
};

export default function AgentGeneralSettingsTab(props: Props) {
  const handleDeleteAgent = async () => {
    if (
      window.confirm(
        '¿Está seguro de que desea eliminar este agente? Esta acción es irreversible.'
      )
    ) {
      try {
        await axios.delete(`/api/agents/${props.agentId}`);
        router.push(RouteNames.AGENTS);
      } catch (e) {
        toast.error('You can not perform deletion ', {
          duration: 3000,
        });
      }
    }
  };

  return props.agentId ? (
    <Stack gap={4}>
      <AgentForm agentId={router.query.agentId as string}>
        {({ query, mutation }) => (
          <ConnectForm<CreateAgentSchema>>
            {({ formState }) => {
              return (
                <SettingCard
                  title="Configuración General"
                  submitButtonProps={{
                    loading: mutation.isMutating,
                    disabled: !formState.isDirty || !formState.isValid,
                    children: 'Save',
                  }}
                >
                  <GeneralInput />
                </SettingCard>
              );
            }}
          </ConnectForm>
        )}
      </AgentForm>

      <SettingCard
        title="ID del Agente"
        description="Utilice el ID del Agente para consultar el agente a través de ChatsappAIAPI"
        disableSubmitButton
      >
        <Stack spacing={2}>
          <Alert
            color="neutral"
            startDecorator={<HelpOutlineRoundedIcon />}
            endDecorator={
              <Link href="https://docs.chatsappai.com" target="_blank">
                <Button
                  variant="plain"
                  size="sm"
                  endDecorator={<ArrowForwardRoundedIcon />}
                >
                  Documentación
                </Button>
              </Link>
            }
          >
            Aprende más sobre la API de ChatsappAI
          </Alert>

          <Alert
            color="neutral"
            sx={{
              cursor: 'copy',
            }}
            onClick={() => {
              navigator.clipboard.writeText(props.agentId!);
              toast.success('Copied!', {
                position: 'bottom-center',
              });
            }}
          >
            {props.agentId}
          </Alert>
        </Stack>
      </SettingCard>

      <SettingCard
        title="Eliminar Agente"
        description="Eliminará el agente permanentemente"
        cardProps={{
          color: 'danger',
        }}
        submitButtonProps={{
          onClick: handleDeleteAgent,
          color: 'danger',
          children: 'Delete',
          startDecorator: <DeleteIcon />,
        }}
      >
        <FormControl sx={{ gap: 1 }}>
          <Alert color="danger">Eliminar el Agente permanentemente</Alert>
        </FormControl>
      </SettingCard>
    </Stack>
  ) : null;
}
