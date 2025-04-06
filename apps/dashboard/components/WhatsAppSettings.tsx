import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import React from 'react';

import useModal from '@app/hooks/useModal';
import useServiceProviders from '@app/hooks/useServiceProviders';

import { IntegrationSettingsMap } from '@chaindesk/integrations/import.browser';
import { ServiceProviderWhatsappSchema } from '@chaindesk/lib/types/dtos';

import ListServiceProviders from './ListServiceProviders';
import { useWhatsappLogin } from '@app/hooks/useWhatsappLogin';
import Loader from '@chaindesk/ui/Loader';

type Props = {
  agentId: string;
};

function WhatsAppSettings({ agentId }: Props) {
  const addAccountModal = useModal({ title: 'WhatsApp' });

  const { query } = useServiceProviders({
    type: 'whatsapp',
    agentId,
  });
  const { handleWhatsappLogin, loading } = useWhatsappLogin({ agentId })
  return (
    <>
      <Stack gap={2}>
        <ListServiceProviders
          type={'whatsapp'}
          agentId={agentId}
          emptyLabel={'No hay cuentas de WhatsApp vinculadas'}
          listItemDecorator={<LocalPhoneRoundedIcon />}
          getListItemLabel={(provider) => {
            return (provider.config as ServiceProviderWhatsappSchema['config'])
              ?.phoneNumber;
          }}
          renderItemActions={(provider) => {
            return (
              <a
                href={`https://wa.me/${(provider.config as ServiceProviderWhatsappSchema['config'])
                  ?.phoneNumber
                  }?text=Start`}
                target="_blank"
              >
                <Button size="sm" color="neutral" variant="soft">
                  Pruébalo
                </Button>
              </a>
            );
          }}
          withDelete
        />

        {/* <Divider /> */}

        {/* <Button
          startDecorator={<AddCircleRoundedIcon fontSize="md" />}
          onClick={() => addAccountModal.open()}
        >
          Agregar cuenta de WhatsApp
        </Button> */}
        <Button
          startDecorator={!loading && <AddCircleRoundedIcon fontSize="md" />}
          onClick={() => handleWhatsappLogin()}
          disabled={loading}
        >
          {loading ? <Loader /> : 'Agregar cuenta de WhatsApp'}

        </Button>
      </Stack>
      <addAccountModal.component
        dialogProps={{
          sx: {
            maxWidth: 'sm',
            height: 'auto',
          },
        }}
      >
        <IntegrationSettingsMap.whatsapp
          agentId={agentId}
          onSubmitSuccess={() => {
            addAccountModal.close();
            query.mutate();
          }}
        />
      </addAccountModal.component>
    </>
  );
}

export default WhatsAppSettings;
