import React, { useState, useMemo, useEffect } from 'react';
import { AccordionDetails, Stack, Input } from '@mui/joy';
import { Search } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ActionCard } from './ActionCard';

interface ModalActionsFilterProps {
  connection: {
    actions: {
      displayName: string;
      description: string;
      tags: string[];
      name?: string;
    }[];
    triggers?: {
      displayName: string;
      description: string;
      tags: string[];
      name?: string;
    }[];
  };
  tools: any;
  handleActionClick: (item: any, connection: any) => void;
}

export const ModalActionsFilter: React.FC<ModalActionsFilterProps> = ({
  connection,
  tools,
  handleActionClick,
}) => {
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para seleccionar la categoría ("actions" o "triggers")
  const [selectedCategory, setSelectedCategory] = useState<"actions" | "triggers">("actions");
  // Estado para los items (acciones o triggers) seleccionados
  const [selectedActions, setSelectedActions] = useState<any[]>([]);

  // Al cambiar de categoría, reiniciamos la búsqueda y la selección
  useEffect(() => {
    setSearchTerm('');
    setSelectedActions([]);
  }, [selectedCategory]);

  // Filtrado de items según el término de búsqueda y la categoría seleccionada
  const filteredItems = useMemo(() => {
    if (selectedCategory === "triggers") {
      return connection?.triggers?.map(trigger => ({ ...trigger, method: 'trigger' })) || []
    } else {
      return connection?.actions?.map(trigger => ({ ...trigger, method: 'action' })) || [];
    }

  }, [searchTerm, connection, selectedCategory]);

  // Cálculo de "matching" en función de la categoría (compara cada item con alguna herramienta)
  const matchingItems = useMemo(() => {
    const items = selectedCategory === "triggers" ? connection.triggers : connection.actions;
    return items?.map((item: any) => {
      const matchedTool = tools?.find((tool: any) =>
        tool?.config?.actionId?.toLowerCase() === item?.name?.toLowerCase()
      );
      return matchedTool ? { ...item, matched: true } : { ...item, matched: false };
    }) || [];
  }, [tools, connection, selectedCategory]);

  const handleSelectAction = (item: any, matched: boolean) => {
    handleActionClick(item, connection);
  };

  return (
    <AccordionDetails>
      <Stack spacing={2}>
        {/* Contenedor para búsqueda y toggle */}
        <div className="flex flex-col gap-4">
          <Input
            endDecorator={<Search className="text-black dark:text-white" />}
            className="pl-10 w-full"
            placeholder="Buscar herramientas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ToggleButtonGroup
            value={selectedCategory}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setSelectedCategory(newValue);
              }
            }}
          >
            <ToggleButton value="actions">Actions</ToggleButton>
            <ToggleButton value="triggers">Triggers</ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* Se renderizan los items filtrados de la propiedad correspondiente */}
        {filteredItems.map((item, index) => {
          const matched = matchingItems.find(mItem => mItem.displayName === item.displayName)?.matched || false;
          return (
            <ActionCard
              key={index}
              action={item}
              actionIndex={index}
              selectedActions={selectedActions}
              handleActionSave={handleSelectAction}
              connection={connection}
              matched={matched}
            />
          );
        })}
      </Stack>
    </AccordionDetails>
  );
};
