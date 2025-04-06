import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Modal,
  Button,
  Input,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  FormControl,
  FormLabel,
  FormHelperText
} from '@mui/joy';
import { ChevronRight, Close, Code, Info } from '@mui/icons-material';
import { composioClient } from '@app/lib/api/composio-client';

const ActionTestingModal = ({ open, onClose, actionData, entityId, connectedAccountId }: { open: boolean, onClose: () => void, actionData: any, entityId: string, connectedAccountId: string }) => {
  const [testResponse, setTestResponse] = useState(null);
  const [showResponse, setShowResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: Object.entries(actionData?.parameters?.properties || {}).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: (value as any)?.default || ''
    }), {})
  });
  const onSubmit = async (formData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        appName: actionData.appName,
        input: formData,
        entityId: entityId,
        connectedAccountId: connectedAccountId
        // authConfig: {
        //   parameters: [] // Si se necesitan parámetros de autenticación específicos
        // }
      };

      // Si hay un connectedAccountId disponible, agrégalo
      // if (actionData.connectedAccountId) {
      //   payload.connectedAccountId = connectedAccountId;
      //   payload.entityId = entityId;
      // }

      console.log('Executing action with payload:', actionData.name);

      // Llamada a la API
      const response = await composioClient.executeAction(actionData.name, payload as any);

      setTestResponse(response);
      setShowResponse(true);
    } catch (error: any) {
      console.error('Error executing action:', error);
      setError(error?.message || 'Error executing action');
    } finally {
      setIsLoading(false);
    }
  };
  const renderResponseSection = () => {
    if (!showResponse) return null;

    return (
      <Box className="mt-6 p-4 bg-gray-50 rounded-lg">
        <Box className="flex justify-between items-center mb-2">
          <Typography level="title-md" className="flex items-center">
            <Code fontSize="small" className="mr-2" />
            Response
          </Typography>
          <IconButton
            size="sm"
            variant="plain"
            onClick={() => setShowResponse(false)}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <pre className="bg-white p-3 rounded-md overflow-x-auto">
          {JSON.stringify(testResponse || {}, null, 2)}
        </pre>
      </Box>
    );
  };

  const renderInputField = (fieldName: any, fieldConfig: any) => {
    const isRequired = actionData?.parameters?.required?.includes(fieldName);

    return (
      <Controller
        name={fieldName as never}
        control={control}
        rules={{ required: isRequired }}
        render={({ field }) => (
          <FormControl error={!!errors?.[fieldName as keyof typeof errors]} className="mb-4">
            <FormLabel className="flex items-center">
              <Typography level="body-sm" className="font-semibold">
                {fieldName}
                {isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </Typography>
              {fieldConfig.description && (
                <Tooltip title={fieldConfig.description}>
                  <IconButton
                    size="sm"
                    variant="plain"
                    className="ml-1"
                    component="span"
                  >
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </FormLabel>

            <Input
              {...field}
              fullWidth
              placeholder={fieldConfig.description}
              color={errors[fieldName as keyof typeof errors] ? "danger" : "neutral"}
            />

            {fieldConfig.default && (
              <FormHelperText className="text-gray-500">
                Default: {fieldConfig.default}
              </FormHelperText>
            )}

            {errors[fieldName as keyof typeof errors] && (
              <FormHelperText className="text-red-500">
                {errors[fieldName as keyof typeof errors]?.message || 'This field is required'}
              </FormHelperText>
            )}
          </FormControl>
        )}
      />
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex items-center justify-center"
    >
      <Card
        variant="outlined"
        className="w-[90%] max-w-2xl max-h-[90vh] overflow-auto"
      >
        <CardContent>
          <Box className="flex items-center space-x-2 mb-4">
            {actionData?.logo && (
              <img
                src={actionData.logo}
                alt={actionData.appName}
                className="w-6 h-6"
              />
            )}
            <Typography level="h4">
              {actionData?.displayName}
            </Typography>
          </Box>

          {actionData?.deprecated && (
            <Alert
              color="warning"
              className="mb-4"
            >
              This action is deprecated. Please consider using a newer version.
            </Alert>
          )}

          <Typography level="body-sm" className="mb-4">
            {actionData?.description}
          </Typography>

          {actionData?.tags?.length > 0 && (
            <Box className="flex flex-wrap gap-2 mb-4">
              {actionData.tags.map((tag: any, index: any) => (
                <Chip
                  key={index}
                  size="sm"
                  variant="soft"
                >
                  {tag}
                </Chip>
              ))}
            </Box>
          )}

          <Divider className="my-4" />

          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography level="title-md" className="mb-4">
              Parameters
            </Typography>

            {Object.entries(actionData?.parameters?.properties || {}).map(([fieldName, fieldConfig]) => (
              renderInputField(fieldName, fieldConfig)
            ))}

            {renderResponseSection()}

            <Box className="flex justify-end gap-2 mt-6">
              <Button
                variant="outlined"
                color="neutral"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                startDecorator={<ChevronRight fontSize="small" />}
              >
                Test Action
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Modal>
  );
};

export default ActionTestingModal;