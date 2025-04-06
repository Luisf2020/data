import React, { useEffect, useRef, useState } from 'react'
import {
  Input,
  MenuItem,
  Chip,
  Collapse,
  Paper,
  ClickAwayListener,
  Popper
} from '@mui/material'
import Button from '@mui/joy/Button'
import Stack from '@mui/joy/Stack'
import { Close, Search, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { defaultFilters, Filters } from './ApifyTypes'



const categories = ['AI', 'Web Scraping', 'Automation', 'E-commerce', 'Social Media']

const pricingModels = [
  { value: 'FREE', label: 'Gratis' },
  { value: 'FLAT_PRICE_PER_MONTH', label: 'Precio mensual fijo' },
  { value: 'PRICE_PER_DATASET_ITEM', label: 'Precio por item' }
]

const sortByOptions = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'popularity', label: 'Popularidad' },
  { value: 'newest', label: 'Más nuevos' },
  { value: 'lastUpdate', label: 'Última actualización' }
]

interface FilterToolsApifyProps {
  filters: Filters
  setFilters: (filters: Filters) => void
}

export const FilterToolsApify = ({ filters, setFilters }: FilterToolsApifyProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [page, setPage] = useState(1)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const handleSelectChange = (event: SelectChangeEvent<string>, key: keyof Filters) => {
    handleFilterChange(key, event.target.value)
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters({ ...filters, [key]: value })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    localStorage.removeItem('toolFilters')
    setPage(1)
  }

  // Manejar clicks fuera del menú
  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setIsFilterOpen(false)
  }

  useEffect(() => {
    localStorage.setItem('toolFilters', JSON.stringify(filters))
    const count = Object.entries(filters).reduce((acc, [key, value]) => {
      if (key === 'limit' || key === 'offset') return acc
      if (value && value !== defaultFilters[key as keyof Filters]) return acc + 1
      return acc
    }, 0)
    setActiveFiltersCount(count)
  }, [filters])

  return (
    <div className="w-full max-w-4xl relative">
      {/* Search and Filter Button */}
      <Stack spacing={2} className="mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10 w-full"
              placeholder="Buscar herramientas..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <Button
            ref={anchorRef}
            variant="outlined"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="min-w-[120px] flex items-center gap-2"
            endDecorator={isFilterOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          >
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>

        {/* Active Filters Chips */}
        {activeFiltersCount > 0 && (
          <Stack direction="row" spacing={1} className="flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (
                key === 'limit' ||
                key === 'offset' ||
                !value ||
                value === defaultFilters[key as keyof Filters]
              ) return null

              return (
                <Chip
                  key={key}
                  size="small"
                  label={`${key}: ${value}`}
                  onDelete={() =>
                    handleFilterChange(
                      key as keyof Filters,
                      defaultFilters[key as keyof Filters]
                    )
                  }
                  className="bg-gray-700 text-white"
                />
              )
            })}
            <Button
              size="sm"
              variant="plain"
              color="neutral"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Floating Filter Panel */}
      <Popper
        open={isFilterOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ width: '500px', zIndex: 1300, right: 0 }}
      >
        <Paper
          className="mt-2 bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700"
          elevation={8}
          onClick={(e) => e.stopPropagation()}
        >
          <Stack spacing={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormControl variant="outlined" size="small">
                <InputLabel sx={{ color: 'rgb(156 163 175)' }}>Ordenar por</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleSelectChange(e, 'sortBy')}
                  label="Ordenar por"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(75 85 99)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(107 114 128)'
                    },
                    '.MuiSvgIcon-root': {
                      color: 'rgb(156 163 175)'
                    }
                  }}
                >
                  {sortByOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" size="small">
                <InputLabel sx={{ color: 'rgb(156 163 175)' }}>Categoría</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleSelectChange(e, 'category')}
                  label="Categoría"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(75 85 99)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(107 114 128)'
                    },
                    '.MuiSvgIcon-root': {
                      color: 'rgb(156 163 175)'
                    }
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" size="small">
                <InputLabel sx={{ color: 'rgb(156 163 175)' }}>Modelo de precio</InputLabel>
                <Select
                  value={filters.pricingModel}
                  onChange={(e) => handleSelectChange(e, 'pricingModel')}
                  label="Modelo de precio"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(75 85 99)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(107 114 128)'
                    },
                    '.MuiSvgIcon-root': {
                      color: 'rgb(156 163 175)'
                    }
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {pricingModels.map(model => (
                    <MenuItem key={model.value} value={model.value}>
                      {model.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" size="small">
                <InputLabel sx={{ color: 'rgb(156 163 175)' }}>Usuario</InputLabel>
                <Input
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  placeholder="Filtrar por usuario"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(75 85 99)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(107 114 128)'
                    }
                  }}
                />
              </FormControl>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={clearFilters}
                variant="outlined"
                color="neutral"
                size="sm"
                className="text-gray-300 border-gray-600 hover:bg-gray-800"
              >
                Limpiar
              </Button>
              <Button
                onClick={() => setIsFilterOpen(false)}
                size="sm"
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Aplicar Filtros
              </Button>
            </div>
          </Stack>
        </Paper>
      </Popper>
    </div>
  )
}