import React, { useEffect, useRef, useState } from 'react'
import {
  Input,
  MenuItem,
  Chip,
  Paper,
  Popper
} from '@mui/material'
import Button from '@mui/joy/Button'
import Stack from '@mui/joy/Stack'
import { Search, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

const categories = ['CRM', 'Marketing']

interface FilterToolsProps {
  filters: { search: string; category: string }
  setFilters: (filters: { search: string; category: string }) => void
}

export const FilterTools = ({ filters, setFilters }: FilterToolsProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const handleSelectChange = (event: SelectChangeEvent<string>, key: 'category') => {
    handleFilterChange(key, event.target.value)
  }

  const handleFilterChange = (key: 'search' | 'category', value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({ search: '', category: '' })
    localStorage.removeItem('toolFilters')
  }

  useEffect(() => {
    localStorage.setItem('toolFilters', JSON.stringify(filters))
    const count = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) return acc + 1
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

        {activeFiltersCount > 0 && (
          <Stack direction="row" spacing={1} className="flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null

              return (
                <Chip
                  key={key}
                  size="small"
                  label={`${key}: ${value}`}
                  onDelete={() =>
                    handleFilterChange(
                      key as 'search' | 'category',
                      ''
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

      <Popper
        open={isFilterOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ width: '360px', zIndex: 1300 }}
      >
        <Paper
          className="mt-2 bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700"
          elevation={8}
          onClick={(e) => e.stopPropagation()}
        >
          <Stack spacing={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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