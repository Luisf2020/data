import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/joy/Box';
import React, { ComponentProps, ReactElement, useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { SWRResponse } from 'swr';

import {
  CUSTOMER_SUPPORT,
  CUSTOMER_SUPPORT_V3,
} from '@chaindesk/lib/prompt-templates';
import { CreateAgentSchema } from '@chaindesk/lib/types/dtos';
import { Agent, AgentModelName, Prisma, PromptType } from '@chaindesk/prisma';
import useAgent, {
  UseAgentMutation,
  UseAgentQuery,
} from '@chaindesk/ui/hooks/useAgent';
import useStateReducer from '@chaindesk/ui/hooks/useStateReducer';

// interface ConnectFormProps<TFieldValues extends FieldValues> {
//   children(children: UseFormReturn<TFieldValues>): ReactElement;
// }

type Props = {
  agentId?: string;
  defaultValues?: Partial<CreateAgentSchema>;
  onSubmitSucces?: (agent: Agent) => any;
  formProps?: ComponentProps<typeof Box>;
  children(children: {
    query: UseAgentQuery;
    mutation: UseAgentMutation;
  }): ReactElement;
  refreshQueryAfterMutation?: boolean;
};

function AgentForm(props: Props) {
  const [state, setState] = useStateReducer({
    isLoading: false,
  });

  const agentId = props?.agentId;

  const { query, mutation } = useAgent({ id: agentId });

  const methods = useForm<CreateAgentSchema>({
    // resolver: zodResolver(CreateAgentSchema),
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.log('formData', data);
      const validation = await zodResolver(CreateAgentSchema)(
        data,
        context,
        options
      );
      return validation;
    },
    defaultValues: {
      promptType: PromptType.raw,
      // prompt: CUSTOMER_SUPPORT,
      modelName: AgentModelName.gpt_4o,
      systemPrompt: CUSTOMER_SUPPORT_V3,
      userPrompt: '{query}',
      includeSources: true,
      restrictKnowledge: true,
      useLanguageDetection: true,
      useMarkdown: true,
      useContextDataAgents: true,
      ...props.defaultValues,
    },
  });

  const onSubmit = async (values: CreateAgentSchema) => {
    try {
      setState({ isLoading: true });
      const agent = await toast.promise(
        mutation.trigger({
          ...values,
        } as any),
        {
          loading: 'Actualizando...',
          success: '¡Actualizado!',
          error: 'Algo salió mal',
        }
      );

      if (props?.refreshQueryAfterMutation) {
        query.mutate();
      }

      props?.onSubmitSucces?.(agent as Agent);
    } catch (err) {
      console.log('error', err);
    } finally {
      setState({ isLoading: false });
    }
  };

  useEffect(() => {
    if (query?.data) {
      methods.reset({
        ...(query.data as any),
      });
    }
  }, [query?.data]);

  // Weired bug, without this, the form is valid after a second update

  return (
    <FormProvider {...methods}>
      <Box
        className="flex flex-col w-full"
        {...props.formProps}
        component="form"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        {props.children({
          query,
          mutation,
        })}
      </Box>
    </FormProvider>
  );
}

export default AgentForm;
