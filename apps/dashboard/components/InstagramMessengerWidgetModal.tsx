import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import React from 'react';

import useModal from '@app/hooks/useModal';
import useServiceProviders from '@app/hooks/useServiceProviders';

import { IntegrationSettingsMap } from '@chaindesk/integrations/import.browser';
import { ServiceProviderMetaSchema, ServiceProviderWhatsappSchema } from '@chaindesk/lib/types/dtos';

import ListServiceProviders from './ListServiceProviders';
import { useFacebookLogin } from '@app/hooks/useFacebookLogin';
import Loader from '@chaindesk/ui/Loader';


type Props = {
  agentId: string;
};

function InstagramMessengerWidgetModal({ agentId }: Props) {
  const addAccountModal = useModal({ title: 'Meta' });
  const { handleFacebookLogin, loading } = useFacebookLogin({ agentId })
  const { query } = useServiceProviders({
    type: 'meta',
    agentId,
  });
  return (
    <>
      <Stack gap={2}>
        <ListServiceProviders
          type={'meta'}
          agentId={agentId}
          emptyLabel={'No hay cuentas de Facebook Business vinculadas'}
          // listItemDecorator={<LocalPhoneRoundedIcon />}
          getListItemLabel={(provider) => {
            return (provider.config as ServiceProviderMetaSchema['config'])
              ?.pageId
          }}
          // renderItemActions={(provider) => {
          //   return (
          //     <a
          //       href={`https://wa.me/${(provider.config as ServiceProviderWhatsappSchema['config'])
          //         ?.phoneNumber
          //         }?text=Start`}
          //       target="_blank"
          //     >
          //       <Button size="sm" color="neutral" variant="soft">
          //         Pruébalo
          //       </Button>
          //     </a>
          //   );
          // }}
          withDelete
        />

        {/* <Divider /> */}

        <Button
          startDecorator={!loading && <AddCircleRoundedIcon fontSize="md" />}
          onClick={() => handleFacebookLogin()}
          disabled={loading}
        >
          {loading ? <Loader /> : 'Agregar cuenta de Facebook Business'}
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

export default InstagramMessengerWidgetModal;
