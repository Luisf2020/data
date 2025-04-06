import { Card, CardActions, CardContent, Divider, Grid, Tooltip } from '@mui/material'
import Button from '@mui/joy/Button'
import Stack from '@mui/joy/Stack'
import Typography from '@mui/joy/Typography'
import Image from 'next/image'
import { StarOutline, AccessTime, AddCircleOutline } from '@mui/icons-material'
import AgentForm from './../AgentForm'
import ConnectForm from './../ConnectForm'
import ToolInputApify from '../ToolInputApify'
import { CreateAgentSchema } from '@chaindesk/lib/types/dtos'
import { ApifyTool, PricingInfo } from './ApifyTypes'

interface CardToolApifyProps {
  tool: ApifyTool
  agentId: string
  onToolClick: (id: string) => void
  forceUpdate?: number
}


const StatBadge = ({
  icon: Icon,
  value,
  tooltip,
  color = 'text-gray-500'
}: {
  icon: React.ElementType
  value: number | string
  tooltip?: string
  color?: string
}) => (
  <Tooltip title={tooltip || ''}>
    <span className={`text-xs ${color} flex items-center gap-1 hover:opacity-80 transition-opacity`}>
      <Icon className="w-4 h-4" />
      <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </span>
  </Tooltip>
);


export const CardToolApify = ({
  tool,
  agentId,
  forceUpdate,
  onToolClick
}: CardToolApifyProps) => {

  // Función auxiliar para determinar el color basado en la tasa de éxito
  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 75) return 'text-blue-500';
    if (rate >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const apiKey = localStorage.getItem("apikey");


  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card className="h-full hover:shadow-md transition-shadow duration-200" variant='outlined'>
        <CardContent className="p-4">
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Imagen */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => onToolClick(tool.id)}>
              {
                tool?.pictureUrl ? (
                  <Image
                    src={tool.pictureUrl || '/placeholder.png'}
                    alt={tool.title}
                    width={50}
                    height={50}
                    className="rounded object-cover"
                  />
                ) : (
                  <Image
                    src={'/apify/tool-apify.svg'}
                    alt={tool.title}
                    width={50}
                    height={50}
                    className="rounded object-cover"
                  />
                )
              }

            </div>

            {/* Contenido */}
            <Stack spacing={1} className="w-full min-w-0">
              {/* Título y descripción */}
              <div className="cursor-pointer" onClick={() => onToolClick(tool.id)}>
                <Typography component="h3" fontWeight="bold" className="line-clamp-1">
                  {tool.title}
                </Typography>
                <Typography level="body-sm" className="text-gray-500 mb-1">
                  por {tool.username}
                </Typography>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {tool.description}
                </p>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-2">
                <StatBadge
                  icon={StarOutline}
                  value={tool.stats.totalUsers}
                  tooltip="Total de usuarios"
                />
                {/* Cálculo del porcentaje de éxito */}
                <StatBadge
                  icon={AccessTime}
                  value={`${((tool.stats.publicActorRunStats30Days?.SUCCEEDED || 0) /
                    (tool.stats.publicActorRunStats30Days?.TOTAL || 1) * 100).toFixed(1)}%`}
                  tooltip="Tasa de éxito en los últimos 30 días"
                  color={getSuccessRateColor(
                    (tool.stats.publicActorRunStats30Days?.SUCCEEDED || 0) /
                    (tool.stats.publicActorRunStats30Days?.TOTAL || 1) * 100
                  )}
                />
              </div>
            </Stack>
          </Stack>
        </CardContent>

        <Divider />

        {/* Formulario */}
        <CardActions>
          <AgentForm agentId={agentId}>
            {({ query, mutation }) => (
              <ConnectForm<CreateAgentSchema>>
                {({ formState }) => (
                  <div className="w-full">
                    <ToolInputApify tool={tool} key={`${tool.id}-${forceUpdate}-${apiKey}`} />

                    {formState.isDirty && formState.isValid && (
                      <div className="mt-4 w-full">
                        <Button
                          type="submit"
                          loading={mutation.isMutating}
                          className="w-full h-full bg-green-600 hover:bg-green-700 transition-colors duration-200"
                          size="lg"
                          variant="solid"
                          startDecorator={<AddCircleOutline />}
                        >
                          <span className="flex items-center gap-2">
                            {mutation.isMutating ? 'Implementando...' : 'Agregar Herramienta'}
                          </span>
                        </Button>

                        {/* Información adicional */}
                        <Typography
                          level="body-xs"
                          className="text-gray-500 text-center mt-2"
                        >
                          {mutation.isMutating
                            ? 'Esto puede tomar unos segundos...'
                            : 'Esta herramienta se añadirá a tu agente'}
                        </Typography>
                      </div>
                    )}
                  </div>
                )}
              </ConnectForm>
            )}
          </AgentForm>
        </CardActions>
      </Card>
    </Grid>
  );
};