import React, { useState, useEffect } from 'react';
import { Card, Grid } from '@mui/material';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Image from 'next/image';
import useAgent from '@chaindesk/ui/hooks/useAgent';
import useSWR from 'swr';
import useApify from '@chaindesk/ui/hooks/useApify';
import { ModalInputApikeyApify } from './Apify/ModalInputApikeyApify';
import { ModalDetailToolApify } from './Apify/ModalDetailToolApify';
import { CardToolApify } from './Apify/CardToolApify';
import { FilterToolsApify } from './Apify/FilterToolsApify';
import { ApifyTool, defaultFilters, Filters } from './Apify/ApifyTypes';

import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ITEMS_PER_PAGE = 20;

interface Props {
  agentId: string;
}

function AgentToolsGlobalTab({ agentId }: Props) {
  const [page, setPage] = useState(1);
  const [updateKey, setUpdateKey] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(localStorage.getItem("apikey")));

  const [filters, setFilters] = useState<Filters>(() => {
    const savedFilters = localStorage.getItem('toolFilters');
    return savedFilters ? JSON.parse(savedFilters) : defaultFilters;
  });

  const [visibleTools, setVisibleTools] = useState<ApifyTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  const { query, mutation } = useAgent({ id: agentId });
  const { tools, isLoading } = useApify(filters);
  const agent = query?.data;

  const { data: toolDetails } = useSWR(
    selectedTool ? `https://api.apify.com/v2/acts/${selectedTool}?token=apify_api_MOn3eqqpqMMIaWH4yymBbRg9USyfam4i4pW3` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      return res.json();
    }
  );

  const reloadData = async () => {
    setVisibleTools([]);
    setPage(1);
  };

  useEffect(() => {
    if (tools && Array.isArray(tools)) {
      setVisibleTools(tools.slice(0, page * ITEMS_PER_PAGE));
    }
  }, [tools, page, updateKey]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollableDiv = document.getElementById('scrollable-container');
      if (scrollableDiv) {
        const { scrollTop, clientHeight, scrollHeight } = scrollableDiv;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          setPage(prev => prev + 1);
        }
      }
    };

    const scrollableDiv = document.getElementById('scrollable-container');
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      return () => scrollableDiv.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    setOpen(true);
  };

  const onClose = async () => {
    setOpenConfig(false);
    setHasApiKey(Boolean(localStorage.getItem("apikey")));
    setUpdateKey(prev => prev + 1);
    await reloadData();
  };

  if (!agent) return null;

  return (
    <>
      <div id="scrollable-container" className="p-4 h-full overflow-y-auto">
        <section className='flex justify-between content-start'>
          <section>
            <div className="mb-5">
              <Typography level="title-md">Herramientas</Typography>
              <Typography level="body-sm" className="mt-1">
                Mejoré sus agentes con los siguientes scrappers e integraciones
              </Typography>
            </div>

            <FilterToolsApify
              filters={filters}
              setFilters={setFilters}
            />
          </section>

          <section className='flex gap-4 max-w-[40%] items-center justify-between'>
            <Image src={"/ApifyLogo.png"} width={50} height={50} alt="Logo Apify" />

            <div className='flex flex-col gap-4'>
              <Typography level='body-xs'>
                Apify es una plataforma dinámica donde las herramientas de scraping web y automatización
                de navegadores cobran vida. LaburenAI está completamente integrado con Apify, lo que
                hace que sea increíblemente fácil usar estas poderosas herramientas. Crear una clave
                API es tan fácil como una, dos, tres.
              </Typography>

              <Button
                size="sm"
                variant="outlined"
                startDecorator={hasApiKey ? <CheckCircleIcon /> : <WarningIcon />}
                loading={mutation.isMutating}
                className="w-full"
                onClick={() => setOpenConfig(true)}
              >
                {hasApiKey ? "CLAVE APIFY CONFIGURADA" : "CONFIGURAR CLAVE DE APIFY"}
              </Button>
            </div>
          </section>
        </section>

        <Grid container spacing={2} className="mt-4">
          {isLoading ? (
            Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                <Card className="h-40 animate-pulse bg-gray-100" variant="outlined" />
              </Grid>
            ))
          ) : visibleTools.length > 0 ? (
            visibleTools.map((tool) => (
              <CardToolApify
                key={`${tool.id}-${updateKey}-${hasApiKey}`}
                tool={tool}
                agentId={agentId}
                onToolClick={handleToolClick}
                forceUpdate={updateKey}
              />
            ))
          ) : (
            <div className="w-full text-center py-10">
              <Typography level="body-lg">No se encontraron herramientas</Typography>
            </div>
          )}
        </Grid>
      </div>

      <ModalDetailToolApify
        open={open}
        onClose={() => setOpen(false)}
        toolDetails={toolDetails}
      />

      <ModalInputApikeyApify
        isOpen={openConfig}
        onClose={onClose}
        onSuccess={reloadData}
      />
    </>
  );
}

export default AgentToolsGlobalTab;