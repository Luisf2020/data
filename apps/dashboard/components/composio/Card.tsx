import { Button, Card, CardActions, CardContent, CardMedia, Divider, Grid, Tooltip, Chip } from '@mui/material';
import Stack from '@mui/joy/Stack';
import {
  Typography,
} from '@mui/joy';

interface CardToolApifyProps {
  app: {
    appId: string;
    categories: string[];
    createdAt: string;
    description: string;
    enabled: boolean;
    key: string;
    logo: string;
    meta: {
      is_custom_app: boolean;
      triggersCount: number;
      actionsCount: number;
      documentation_doc_text: string | null;
      configuration_docs_text: string | null;
    };
    name: string;
    no_auth: boolean;
    tags: string[];
    updatedAt: string;
  };
  agentId?: string;
  onAppClick?: (id: string) => void;
  forceUpdate?: number;
}

export const CardComposio = ({
  app,
  onAppClick
}: CardToolApifyProps) => {
  return (
    <Grid item style={{ display: 'flex', width: '100%' }}>
      <Card
        className="h-full hover:shadow-md transition-shadow duration-200"
        variant="outlined"
        style={{ width: '100%', height: '250px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
        onClick={() => onAppClick && onAppClick(app.key)}
      >
        <CardContent className="p-4 flex flex-col justify-between" style={{ flex: 1 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Logo */}
            <CardMedia
              component="img"
              height="40"
              width="40"
              image={app.logo || '/default-logo.png'}
              alt={app.name}
              className='w-10 h-10'
              style={{ borderRadius: '8px' }}
            />

            <Stack spacing={1} className="w-full flex-1 flex flex-col">
              <div className="h-[80px]">
                <Typography
                  component="h3"
                  fontWeight="bold"
                  className="line-clamp-1 text-black flex-1 dark:text-white uppercase"
                  style={{ fontSize: '1rem' }}
                >
                  {app?.name}
                </Typography>
                <Typography
                  component="h4"
                  fontWeight="semibold"
                  className="line-clamp-2 mb-2"
                  style={{ fontSize: '0.875rem' }}
                >
                  {app?.description}
                </Typography>
              </div>

              <Stack direction="row" spacing={1}>
                {app.categories.slice(0, 1).map((category, index) => (
                  <Chip
                    key={index}
                    label={category}
                    size="small"
                    color="primary"
                    className='text-black dark:text-white dark:!bg-white/20 font-semibold'
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
                  />
                ))}
              </Stack>

              <Divider style={{ margin: '10px 0' }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" textColor="text.secondary" style={{ fontSize: '0.75rem' }}>
                  <strong>{app.meta.actionsCount}</strong> actions
                </Typography>
                <Typography level="body-xs" textColor="text.secondary" style={{ fontSize: '0.75rem' }}>
                  <strong>{app.meta.triggersCount}</strong> triggers
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};
