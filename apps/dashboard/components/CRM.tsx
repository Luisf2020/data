import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import Button from '@mui/joy/Button';
import Stack from '@mui/material/Stack';
import React, { useState, useEffect } from 'react';
import useModal from '@app/hooks/useModal';
import { TextField, Typography, Stepper, Step, StepLabel, Box, Alert, Select, MenuItem, SelectChangeEvent, InputLabel, FormControl } from '@mui/material';
import LinkButton from '@chaindesk/ui/LinkButton';
import axios from 'axios';
import { Agent } from '@chaindesk/prisma';
import { toast } from 'react-hot-toast';
import { Spinner } from '@react-pdf-viewer/core';

interface CRMChatsappAIProps {
  agent: Agent;
}

interface Account {
  id: string;
  name: string;
}

const CRMChatsappAI: React.FC<CRMChatsappAIProps> = ({ agent }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);

  const [userData, setUserData] = useState({ token: '', account: '', agent: '' });
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const addAccountModal = useModal({ title: 'CRM' });

  const steps = ['Agregar Token', 'Agregar Agente'];

  useEffect(() => {
    const fetchSavedToken = async () => {
      console.log(agent)
      setLoading(true);
      try {
        const response = await axios.get(`/api/crm/token?organizationId=${agent?.organizationId}`);
        if (response.data.token) {
          setSavedToken(response.data.token);
          setUserData((prevData) => ({ ...prevData, token: response.data.token }));
          setAccounts(response.data.accounts)
        } else {
          setSavedToken(null);
        }
      } catch (error) {
        console.error('Error fetching saved token:', error);
        setSavedToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedToken();
  }, [agent?.organizationId]);

  const handleNext = async () => {
    if (activeStep === 0) {
      setLoading(true);
      const isValid = await validateToken();
      setLoading(false);

      if (!isValid) {
        alert('Token inválido. Por favor, inténtelo de nuevo.');
        return;
      } else {
        toast.success('Token validado correctamente.');
        setTimeout(() => {
          setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }, 3000);
        return;
      }
    }

    if (activeStep === 1) {
      setLoading(true);
      try {
        const response = await axios.post('/api/crm/agentBot', {
          organizationId: agent?.organizationId,
          token: userData.token,
          agentId: agent?.id,
          nameAccount: userData.account,
          accountId: selectedAccount?.id
        });

        if (response.status === 201) {
          toast.success('Agente creado correctamente.');
          setTimeout(() => {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
          }, 3000);
        } else {
          toast.error('Error al crear el agente. Por favor, inténtelo de nuevo.');
        }
      } catch (error) {
        console.error('Error creating agent:', error);
        toast.error('Error al crear el agente. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }

    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const validateToken = async () => {
    try {
      const response = await axios.post('/api/crm/token', {
        organizationId: agent?.organizationId,
        token: userData.token,
      });
      if (response.status === 200) {
        setAccounts(response?.data?.account);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Add your submit logic here
    setLoading(false);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedAccountId = event.target.value as string;
    const selectedAccount = accounts.find((account: { id: string }) => account.id === selectedAccountId) || null;
    setSelectedAccount(selectedAccount);
  };

  return (
    <>
      <Stack gap={2}>
        <div className='relative p-2 border border-gray-500 rounded-lg'>
          {loading ? (
            <p>Cargando...</p>
          ) : savedToken ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px', padding: '8px', borderRadius: '4px' }}>
              <p className='font-bold text-xs'>Token:</p>
              <TextField
                value={savedToken}
                type="password"
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
                size="small"
                fullWidth
              />
            </Box>
          ) : (
            <div className='flex items-center gap-2'>
              <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" width="50.63626" height="50.17383" viewBox="0 0 647.63626 632.17383" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M687.3279,276.08691H512.81813a15.01828,15.01828,0,0,0-15,15v387.85l-2,.61005-42.81006,13.11a8.00676,8.00676,0,0,1-9.98974-5.31L315.678,271.39691a8.00313,8.00313,0,0,1,5.31006-9.99l65.97022-20.2,191.25-58.54,65.96972-20.2a7.98927,7.98927,0,0,1,9.99024,5.3l32.5498,106.32Z" transform="translate(-276.18187 -133.91309)" fill="#f2f2f2" /><path d="M725.408,274.08691l-39.23-128.14a16.99368,16.99368,0,0,0-21.23-11.28l-92.75,28.39L380.95827,221.60693l-92.75,28.4a17.0152,17.0152,0,0,0-11.28028,21.23l134.08008,437.93a17.02661,17.02661,0,0,0,16.26026,12.03,16.78926,16.78926,0,0,0,4.96972-.75l63.58008-19.46,2-.62v-2.09l-2,.61-64.16992,19.65a15.01489,15.01489,0,0,1-18.73-9.95l-134.06983-437.94a14.97935,14.97935,0,0,1,9.94971-18.73l92.75-28.4,191.24024-58.54,92.75-28.4a15.15551,15.15551,0,0,1,4.40966-.66,15.01461,15.01461,0,0,1,14.32032,10.61l39.0498,127.56.62012,2h2.08008Z" transform="translate(-276.18187 -133.91309)" fill="#3f3d56" /><path d="M398.86279,261.73389a9.0157,9.0157,0,0,1-8.61133-6.3667l-12.88037-42.07178a8.99884,8.99884,0,0,1,5.9712-11.24023l175.939-53.86377a9.00867,9.00867,0,0,1,11.24072,5.9707l12.88037,42.07227a9.01029,9.01029,0,0,1-5.9707,11.24072L401.49219,261.33887A8.976,8.976,0,0,1,398.86279,261.73389Z" transform="translate(-276.18187 -133.91309)" fill="#6c63ff" /><circle cx="190.15351" cy="24.95465" r="20" fill="#6c63ff" /><circle cx="190.15351" cy="24.95465" r="12.66462" fill="#fff" /><path d="M878.81836,716.08691h-338a8.50981,8.50981,0,0,1-8.5-8.5v-405a8.50951,8.50951,0,0,1,8.5-8.5h338a8.50982,8.50982,0,0,1,8.5,8.5v405A8.51013,8.51013,0,0,1,878.81836,716.08691Z" transform="translate(-276.18187 -133.91309)" fill="#e6e6e6" /><path d="M723.31813,274.08691h-210.5a17.02411,17.02411,0,0,0-17,17v407.8l2-.61v-407.19a15.01828,15.01828,0,0,1,15-15H723.93825Zm183.5,0h-394a17.02411,17.02411,0,0,0-17,17v458a17.0241,17.0241,0,0,0,17,17h394a17.0241,17.0241,0,0,0,17-17v-458A17.02411,17.02411,0,0,0,906.81813,274.08691Zm15,475a15.01828,15.01828,0,0,1-15,15h-394a15.01828,15.01828,0,0,1-15-15v-458a15.01828,15.01828,0,0,1,15-15h394a15.01828,15.01828,0,0,1,15,15Z" transform="translate(-276.18187 -133.91309)" fill="#3f3d56" /><path d="M801.81836,318.08691h-184a9.01015,9.01015,0,0,1-9-9v-44a9.01016,9.01016,0,0,1,9-9h184a9.01016,9.01016,0,0,1,9,9v44A9.01015,9.01015,0,0,1,801.81836,318.08691Z" transform="translate(-276.18187 -133.91309)" fill="#6c63ff" /><circle cx="433.63626" cy="105.17383" r="20" fill="#6c63ff" /><circle cx="433.63626" cy="105.17383" r="12.18187" fill="#fff" /></svg>
              <h2>No se ha encontrado resultados</h2>
            </div>
          )}
        </div>
        <Button
          startDecorator={<AddCircleRoundedIcon />}
          onClick={() => addAccountModal.open()}
        >
          Conectar CRM
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
        <Box sx={{ width: '100%' }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 2 }}>
            {activeStep === 0 && (
              <Box>
                <h2 className="text-sm font-bold">Paso 1: Agregar Token</h2>
                <p className="font-bold text-sm mt-3">
                  Ingrese el token del CRM. Para obtener más información, visite <LinkButton
                    linkProps={{
                      href: 'https://crm.chatsappai.com/',
                      target: '_blank',
                    }}
                    buttonProps={{
                      size: 'sm',
                      color: 'primary',
                      variant: 'soft',
                    }}
                  >
                    Ingrese a su crm
                  </LinkButton>
                </p>
                <Alert className='mt-3' component="div" severity="warning">Aviso: Una vez configurado, no volver a ingresar a menos que cambies el token de acceso</Alert>
                <TextField
                  fullWidth
                  label="Agregar Token"
                  name="token"
                  type="password"
                  value={userData.token}
                  onChange={handleChange}
                  margin="normal"
                />
                <Button color="primary" onClick={handleNext} loading={loading}>
                  Siguiente
                </Button>
              </Box>
            )}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6">Paso 2: Crear Agente Bot</Typography>
                <FormControl className='mt-3' fullWidth>
                  <Select
                    labelId="demo-simple-select-label"
                    value={selectedAccount?.id ?? ''}
                    onChange={handleSelectChange}
                    placeholder='Seleccionar cuenta'
                    fullWidth
                    margin="dense"
                  >
                    <MenuItem value="" disabled>
                      Seleccione una cuenta
                    </MenuItem>
                    {Array.isArray(accounts) && accounts.map((account: { id: string; name: string }) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Nombre de la cuenta"
                  name="account"
                  value={userData.account}
                  onChange={handleChange}
                  margin="normal"
                  className='mt-3'
                />
                <Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                  Anterior
                </Button>
                <Button color="primary" onClick={handleNext} sx={{ mt: 1 }} loading={loading}>
                  Siguiente
                </Button>
              </Box>
            )}
            {activeStep > 2 && (
              <Box>
                <Typography variant="h6">¡Listo!</Typography>
                <Typography>El usuario ha sido creado y el agente ha sido agregado.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </addAccountModal.component>
    </>
  );
};

export default CRMChatsappAI;