import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useModal from '@app/hooks/useModal';
import { agentToolConfig, createTool, NormalizedTool } from '@chaindesk/lib/agent-tool-format';
import { CreateAgentSchema, ToolSchema } from '@chaindesk/lib/types/dtos';
import { AppDatasource as Datasource, ToolType } from '@chaindesk/prisma';
import useDeepCompareEffect from '@chaindesk/ui/hooks/useDeepCompareEffect';
import useStateReducer from '@chaindesk/ui/hooks/useStateReducer';
import { HttpToolForm, HttpToolTestForm } from './HttpToolForm';
import HttpToolInput from './AgentInputs/HttpToolInput';
import axios from 'axios';

interface SchemaField {
  field: string;
  description: string;
  defaultValue: string | null;
  type: string;
  isOptional: boolean;
}

type ToolCardProps = Partial<NormalizedTool> & {
  type: ToolType;
  mode: 'create' | 'edit';
  onDelete?(): any;
  onEdit?(): any;
  onCreate?(): any;
  link?: string;
};

const editableTools = ['form', 'http', 'lead_capture'];

const ToolCard = ({
  name,
  description,
  type,
  mode,
  link,
  onCreate,
  onDelete,
  onEdit,
}: ToolCardProps) => {
  return (
    <Stack direction="row" className="flex items-center justify-center w-full">

      {mode === 'edit' && (
        <>
          {editableTools.includes(type) && (
            <IconButton
              variant="plain"
              color="neutral"
              size="md"
              onClick={onEdit}
            >
              <TuneRoundedIcon />
            </IconButton>
          )}

          <IconButton
            variant="plain"
            color="danger"
            size="md"
            onClick={onDelete}
          >
            <RemoveCircleOutlineRoundedIcon />
          </IconButton>
        </>
      )}

      {mode === 'create' && (
        <>
          <IconButton
            variant="plain"
            color="success"
            size="md"
            onClick={onCreate}
            className="flex items-center gap-10 justify-center w-full"
          >
            Agregar Herramienta <AddCircleOutlineRoundedIcon />
          </IconButton>
        </>
      )}
    </Stack>
  );
};

function ToolsInput({ tool }: any) {
  const [defaultValues, setDefaultValues] = useState<any>();
  const { watch, setValue, formState, getValues } = useFormContext<CreateAgentSchema>();
  const btnSubmitRef = useRef<HTMLButtonElement>(null);
  const isToolValidRef = useRef(false);
  const [state, setState] = useStateReducer({
    currentToolIndex: -1,
    currentToolId: '',
  });
  const currentToolConfig = getValues([
    `tools.${state.currentToolIndex}.config.url`,
    `tools.${state.currentToolIndex}.config.body`,
    `tools.${state.currentToolIndex}.config.headers`,
    `tools.${state.currentToolIndex}.config.method`,
    `tools.${state.currentToolIndex}.config.pathVariables`,
    `tools.${state.currentToolIndex}.config.queryParameters`,
  ]);
  const newApiToolForm = useModal();
  const editApiToolForm = useModal({
    onClose: () => {
      isToolValidRef.current = false;
    },
  });

  const validateToolModal = useModal();


  const tools = (watch('tools') || []) as Exclude<
    ToolSchema,
    { type: 'connector' } | { type: 'agent' }
  >[];

  // config changed, allow re-test.
  useDeepCompareEffect(() => {
    isToolValidRef.current = false;
  }, [currentToolConfig]);


  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async (owner: any, toolName: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/apify/apify-schema', {
        params: {
          owner,
          toolName
        }
      });

      console.log("/api/apify/apify-schema?owner=" + owner + "&toolName=" + toolName);

      setDefaultValues({
        config: {
          name: tool.title,
          url: `https://api.apify.com/v2/acts/${tool.id}/run-sync-get-dataset-items?token=${localStorage.getItem("apikey")}`,
          description: tool.description,
          method: "POST",
          body: response.data,
          headers: [
            {
              key: "Content-Type",
              description: "",
              value: "application/json",
              isUserProvided: false
            }
          ],
          queryParameters: [
            {
              key: "token",
              description: "",
              value: localStorage.getItem("apikey"),
              isUserProvided: false
            }
          ]
        }
      })

      setSchemaFields(response.data);
    } catch (error) {
      setError('Error al obtener el schema');
      console.error('Failed to scrape schema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema(tool.username, tool.name);
  }, []);


  return (
    <Stack className="w-full h-full">
      {/* Contenido */}
      {schemaFields.length > 0 && (
        <div className="transition-all duration-300 ease-in-out">
          <ToolCard
            id="http-tool"
            type={ToolType.http}
            name={agentToolConfig.http.title}
            description={agentToolConfig.http.description}
            mode="create"
            onCreate={newApiToolForm.open}
            link='https://googo.com'
          />
        </div>
      )}

      {/* Estado de carga con Skeleton y animación */}
      {isLoading && (
        <div className="flex justify-center m-2 w-full h-full">
          <div className="inline-flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Cargando schema...</span>
          </div>
        </div>
      )}


      <newApiToolForm.component
        title={agentToolConfig.http.title}
        description={agentToolConfig.http.description}
        dialogProps={{
          sx: {
            maxWidth: 'md',
            height: 'auto',
          },
        }}
      >
        <HttpToolForm
          onSubmit={(values) => {
            setValue('tools', [...tools, createTool(values)], {
              shouldDirty: true,
              shouldValidate: true,
            });
            newApiToolForm.close();
            // auto save.
            btnSubmitRef?.current?.click();
          }}
          defaultValues={defaultValues}
        />


      </newApiToolForm.component>

      <editApiToolForm.component
        title={agentToolConfig.http.title}
        description={agentToolConfig.http.description}
        dialogProps={{
          sx: {
            maxWidth: 'md',
            height: 'auto',
          },
        }}
      >
        {state.currentToolIndex >= 0 && (
          <Stack gap={2}>
            <HttpToolInput name={`tools.${state.currentToolIndex}`} />
            <validateToolModal.component
              title="Set up a request to your endpoint"
              description="Send a request to your endpoint to make sure it's working well."
              dialogProps={{
                sx: {
                  maxWidth: '50%',
                },
              }}
            >
              <HttpToolTestForm
                setToolValidState={(state: boolean) => {
                  isToolValidRef.current = state;
                }}
                name={`tools.${state.currentToolIndex}`}
                handleCloseModal={validateToolModal.close}
              />
            </validateToolModal.component>

            <Button
              type="button"
              loading={formState.isSubmitting}
              color={isToolValidRef.current ? 'success' : 'primary'}
              onClick={() => {
                if (!isToolValidRef.current && formState.isValid) {
                  validateToolModal.open();
                  return;
                } else if (isToolValidRef.current) {
                  editApiToolForm.close();
                  btnSubmitRef?.current?.click();
                }
              }}
            >
              {isToolValidRef.current ? 'Update' : 'Validate Config'}
            </Button>
          </Stack>
        )}
      </editApiToolForm.component>


      {/* Trick to submit form from HttpToolInput modal */}
      <button
        ref={btnSubmitRef}
        type="submit"
        style={{ width: 0, height: 0, visibility: 'hidden' }}
      >
        submit
      </button>
    </Stack>
  );
}

export default ToolsInput;