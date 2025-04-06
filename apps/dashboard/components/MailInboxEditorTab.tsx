import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  Textarea,
} from '@mui/joy';
import { useSession } from 'next-auth/react';
import React, { useRef } from 'react';
import useSWRMutation from 'swr/mutation';

import { generateActionFetcher, HTTP_METHOD } from '@chaindesk/lib/swr-fetcher';

import AlertPremiumFeature from './AlertPremiumFeature';
import Input from './Input';
import MailInboxFormProvider from './MailInboxFormProvider';
import MailInboxMessagePreview from './MailInboxMessagePreview';
import UsageLimitCard from './UsageLimitCard';
import UserFree from './UserFree';
import UserPremium from './UserPremium';

type Props = {
  inboxId: string;
};

function MailInboxEditorTab({ inboxId }: Props) {
  const { data: session } = useSession();

  const startVerifyEmailMutation = useSWRMutation(
    `/api/mail-inboxes/${inboxId}/start-verify-email`,
    generateActionFetcher(HTTP_METHOD.POST)
  );

  return (
    <MailInboxFormProvider inboxId={inboxId}>
      {({ methods, query, refinement }) => {
        const values = methods.watch();
        const inboxEmail = `${values.alias}@chatsappai.com`;

        return (
          <Stack direction="row" sx={{ width: '100%', maxWidth: 'xl' }} gap={2}>
            <Stack gap={2} sx={{ width: '100%' }}>
              {/* <Alias /> */}

              <Input
                control={methods.control}
                label="Alias"
                helperText={`Los correos electrónicos serán enviados desde: ${inboxEmail}`}
                endDecorator={
                  !!methods.formState.dirtyFields?.alias &&
                  (methods.formState.isValidating ||
                    methods.formState.isSubmitting) ? (
                    <CircularProgress size="sm" />
                  ) : undefined
                }
                // onInput={e => e.currentTarget.value = e.target.value.toLowerCase()}
                {...methods.register('alias', {
                  // onChange: (e) => {
                  //   e.target.value = e.target.value.toLowerCase();
                  //   return refinement?.invalidate();
                  // },
                })}
                onBlur={(e) => {}}
              />

              <FormControl>
                <UserPremium>
                  <Input
                    control={methods.control}
                    label="Correo electrónico personalizado"
                    endDecorator={
                      query.data?.customEmail &&
                      query.data?.isCustomEmailVerified ? (
                        <Chip color="success">verificado</Chip>
                      ) : (
                        query?.data?.customEmail && (
                          <Button
                            loading={startVerifyEmailMutation.isMutating}
                            size="sm"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              await startVerifyEmailMutation.trigger({});

                              await query.mutate();
                            }}
                          >
                            verify
                          </Button>
                        )
                      )
                    }
                    {...methods.register('customEmail')}
                  />
                </UserPremium>

                <UserFree>
                  <FormControl>
                    <FormLabel>Correo electrónico personalizado</FormLabel>
                    <AlertPremiumFeature title="Correo electrónico personalizado es una característica premium" />
                  </FormControl>
                </UserFree>

                {query?.data?.customEmail &&
                  query?.data?.customEmailVerificationTokenId && (
                    <Alert sx={{ mt: 1 }} color="primary">
                      Se ha enviado un correo electrónico de verificación a
                      <strong>{`${query?.data?.customEmail}`}</strong>
                    </Alert>
                  )}
              </FormControl>

              <Input
                control={methods.control}
                label="FROM name"
                {...methods.register('fromName')}
              />

              <FormControl>
                <FormLabel>Firma</FormLabel>
                <Textarea
                  // value={prompt || ''}
                  minRows={2}
                  {...methods.register('signature')}
                />
                <FormHelperText>Se permite HTML básico</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Marca</FormLabel>

                <Checkbox
                  checked={Boolean(values.showBranding)}
                  label="Mostrar marca de ChatsappAI"
                  {...methods.register('showBranding')}
                  disabled={!session?.organization?.isPremium}
                />
                <FormHelperText>
                  Se requiere una cuenta premium para deshabilitar esta opción
                </FormHelperText>
              </FormControl>
            </Stack>

            <MailInboxMessagePreview />
          </Stack>
        );
      }}
    </MailInboxFormProvider>
  );
}

export default MailInboxEditorTab;
