import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import React from 'react';

import useModal from '@app/hooks/useModal';
import useServiceProviders from '@app/hooks/useServiceProviders';

import { IntegrationSettingsMap } from '@chaindesk/integrations/import.browser';
import { ServiceProviderMercadolibreSchema, ServiceProviderMetaSchema, ServiceProviderWhatsappSchema } from '@chaindesk/lib/types/dtos';

import ListServiceProviders from './ListServiceProviders';
import { useFacebookLogin } from '@app/hooks/useFacebookLogin';
import { useMlLogin } from '@app/hooks/useMlLogin';
import Loader from '@chaindesk/ui/Loader';


type Props = {
  agentId: string;
};

function MercadolibreWidgetModal({ agentId }: Props) {
  const addAccountModal = useModal({ title: 'Mercadolibre' });
  const { handleMlLogin, loading } = useMlLogin({ agentId })
  const { query } = useServiceProviders({
    type: 'mercadolibre',
    agentId,
  });
  return (
    <>
      <Stack gap={2}>
        <ListServiceProviders
          type={'mercadolibre'}
          agentId={agentId}
          emptyLabel={'No hay cuentas de Mercadolibre vinculadas'}
          // listItemDecorator={<LocalPhoneRoundedIcon />}
          getListItemLabel={(provider) => {
            return (provider.config as ServiceProviderMercadolibreSchema['config'])
              ?.nickname
          }}
          withDelete
        />

        {/* <Divider /> */}

        <Button
          startDecorator={!loading && <AddCircleRoundedIcon fontSize="md" />}
          onClick={() => handleMlLogin()}
          disabled={loading}
        >
          {loading ? <Loader /> : 'Agregar cuenta de Mercado Libre'}
        </Button>
      </Stack>
    </>
  );
}

export default MercadolibreWidgetModal;
