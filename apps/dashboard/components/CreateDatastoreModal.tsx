import InfoIcon from '@mui/icons-material/Info';
import {
  Alert,
  Box,
  Container,
  Link,
  Modal,
  ModalDialog,
  Sheet,
  Typography,
} from '@mui/joy';
import Button from '@mui/joy/Button';
import Step from '@mui/material/Step';
import StepContent from '@mui/material/StepContent';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import dynamic from 'next/dynamic';
import React from 'react';

import { CreateDatastoreRequestSchema } from '@chaindesk/lib/types/dtos';
import {
  AppDatasource as Datasource,
  DatasourceType,
  Datastore,
  DatastoreType,
} from '@chaindesk/prisma';
import useStateReducer from '@chaindesk/ui/hooks/useStateReducer';

import DatasourceOptions from './DatasourceForms/DatasourceOptions';
import { DatastoreFormProps } from './DatastoreForms/types';
import { DatastoreFormsMap } from './DatastoreForms';

const DatasourceForm = dynamic(
  () => import('@app/components/DatasourceForms'),
  {
    ssr: false,
  }
);

type Props = {
  isOpen?: boolean;
  defaultValues?: CreateDatastoreRequestSchema;
  onSubmitSuccess?: (
    datasore: Partial<Datastore>,
    datasource: Partial<Datasource>
  ) => void;
  handleClose: () => void;
  // onSubmit: (values: CreateDatastoreRequestSchema) => void;
};

type State = {
  selectedStoreType?: DatastoreType;
  selectedSourceType?: DatasourceType;
  activeStep: number;
  datastore?: Partial<Datastore>;
};

const initialState: State = {
  selectedStoreType: DatastoreType.qdrant,
  selectedSourceType: undefined,
  activeStep: 0,
};

export default function CreateDatastoreModal(props: Props) {
  const [state, setState] = useStateReducer<State>(initialState);

  const handleNext = () => {
    setState({
      activeStep: state.activeStep + 1,
    });
  };

  const handleBack = () => {
    setState({
      activeStep: state.activeStep - 1,
    });
  };

  const handleReset = () => {
    setState({
      activeStep: 0,
    });
  };

  const steps = [
    // {
    //   label: 'Choose a Storage Provider',
    //   description: `For each ad campaign that you create, you can control how much
    //             you're willing to spend on clicks and conversions, which networks
    //             and geographical locations you want your ads to show on, and more.`,
    //   disableButtons: true,
    //   component: (
    //     <DatastoreOptions
    //       onSelect={(value) => {
    //         setState({
    //           selectedStoreType: value,
    //         });
    //         handleNext();
    //       }}
    //     />
    //   ),
    // },
    {
      label: 'Configuración de Datastore',
      // description: 'A Datastore can contain multiple datasources',
      disableButtons: true,
      component:
        DatastoreFormsMap?.[state.selectedStoreType!] &&
        React.createElement(DatastoreFormsMap?.[state.selectedStoreType!], {
          onSubmitSuccess: (datastore) => {
            setState({
              datastore,
            });
            handleNext();
          },
          customSubmitButton: (btnProps: any) => (
            <Box sx={{ mb: 2 }}>
              <div>
                <Button
                  type="submit"
                  variant="solid"
                  loading={btnProps.isLoading}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Continue
                </Button>
                {/* <Button
                  disabled={btnProps.isLoading}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                  variant="plain"
                >
                  Back
                </Button> */}
              </div>
            </Box>
          ),
        } as DatastoreFormProps),
    },
    {
      label: 'Elegir un tipo de fuente de datos',
      description: `¡Un Datastore vacío no es muy útil! Ahora agregue algunos datos en él`,
      disableButtons: true,
      component: (
        <DatasourceOptions
          onSelect={(value) => {
            setState({
              selectedSourceType: value,
            });
            handleNext();
          }}
        />
      ),
    },
    {
      label: 'Configurar la fuente de datos',
      description: `¡Un Datastore vacío no es muy útil! Ahora agregue algunos datos en él`,
      disableButtons: true,
      component: state.selectedSourceType && (
        <DatasourceForm
          type={state.selectedSourceType}
          defaultValues={{
            datastoreId: state.datastore?.id,
          }}
          onSubmitSuccess={(values: any) => {
            handleNext();

            props.handleClose();

            handleReset();

            props?.onSubmitSuccess?.(state.datastore!, values);
          }}
          customSubmitButton={(btnProps: any) => (
            <Box sx={{ mb: 2 }}>
              <div>
                <Button
                  type="submit"
                  loading={btnProps.isLoading}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Finalizar
                </Button>
                <Button
                  disabled={btnProps.isLoading}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                  variant="plain"
                >
                  Volver
                </Button>
              </div>
            </Box>
          )}
        />
      ),
    },
  ];

  return (
    <Modal
      onClose={props.handleClose}
      open={props.isOpen!}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        my: 3,
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          width: 600,
          maxWidth: '100%',
          borderRadius: 'md',
          p: 3,
          boxShadow: 'lg',
          maxHeight: '100%',
          overflowY: 'auto',
        }}
      >
        <Stepper activeStep={state.activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  index === 3 ? (
                    <Typography variant="plain">Último paso</Typography>
                  ) : null
                }
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <div className="flex flex-col space-y-4">
                  <Typography>{step.description}</Typography>
                  {step.component}

                  {!step.disableButtons && (
                    <Box sx={{ mb: 2 }}>
                      <div>
                        <Button
                          variant="outlined"
                          // color="secondary"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          {index === steps.length - 1
                            ? 'Finalizar'
                            : 'Continuar'}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Volver
                        </Button>
                      </div>
                    </Box>
                  )}
                </div>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Sheet>
    </Modal>
  );
}
