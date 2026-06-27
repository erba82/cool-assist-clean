/*
 * EnhancedSymbolLibrary.tsx
 * Comprehensive HVACR symbol library with categories and search functionality
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\EnhancedSymbolLibrary.tsx
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Star as FavoriteIcon,
  StarBorder as NotFavoriteIcon
} from '@mui/icons-material';

// Enhanced symbol definitions with more components
export interface Symbol {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  svgPath: string;
  width: number;
  height: number;
  connectionPoints: Array<{
    id: string;
    x: number;
    y: number;
    type: 'inlet' | 'outlet' | 'control' | 'drain';
  }>;
  properties?: Record<string, any>;
  tags: string[];
  isFavorite?: boolean;
}

const symbolCategories = {
  compressors: {
    name: 'Compressors',
    icon: '🔧',
    symbols: [
      {
        id: 'reciprocating-compressor',
        name: 'Reciprocating Compressor',
        subcategory: 'positive-displacement',
        description: 'Positive displacement compressor with pistons',
        svgPath: 'M25,25 C25,11 39,11 39,25 C39,39 25,39 25,25 M10,25 L25,25 M39,25 L54,25 M25,10 L39,40 M39,10 L25,40',
        width: 64,
        height: 50,
        connectionPoints: [
          { id: 'suction', x: 10, y: 25, type: 'inlet' },
          { id: 'discharge', x: 54, y: 25, type: 'outlet' }
        ],
        tags: ['compressor', 'positive displacement', 'piston', 'reciprocating']
      },
      {
        id: 'screw-compressor',
        name: 'Screw Compressor',
        subcategory: 'positive-displacement',
        description: 'Twin screw positive displacement compressor',
        svgPath: 'M10,10 L50,10 L50,40 L10,40 Z M20,10 Q25,25 20,40 M30,10 Q35,25 30,40 M40,10 Q45,25 40,40',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'suction', x: 5, y: 25, type: 'inlet' },
          { id: 'discharge', x: 55, y: 25, type: 'outlet' },
          { id: 'oil-injection', x: 30, y: 5, type: 'inlet' }
        ],
        tags: ['compressor', 'screw', 'twin screw', 'positive displacement']
      },
      {
        id: 'scroll-compressor',
        name: 'Scroll Compressor',
        subcategory: 'positive-displacement',
        description: 'Scroll type positive displacement compressor',
        svgPath: 'M25,25 C25,11 39,11 39,25 C39,39 25,39 25,25 M30,25 A5,5 0 0,1 35,20 A10,10 0 0,0 30,30',
        width: 64,
        height: 50,
        connectionPoints: [
          { id: 'suction', x: 10, y: 25, type: 'inlet' },
          { id: 'discharge', x: 54, y: 25, type: 'outlet' }
        ],
        tags: ['compressor', 'scroll', 'positive displacement', 'hermetic']
      },
      {
        id: 'centrifugal-compressor',
        name: 'Centrifugal Compressor',
        subcategory: 'dynamic',
        description: 'Centrifugal dynamic compressor',
        svgPath: 'M30,15 C20,15 20,35 30,35 C40,35 40,15 30,15 M15,25 L20,25 M40,25 L45,25 M25,20 L35,30 M35,20 L25,30',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'suction', x: 10, y: 25, type: 'inlet' },
          { id: 'discharge', x: 50, y: 25, type: 'outlet' }
        ],
        tags: ['compressor', 'centrifugal', 'dynamic', 'turbo']
      }
    ]
  },
  heat_exchangers: {
    name: 'Heat Exchangers',
    icon: '🔄',
    symbols: [
      {
        id: 'shell-tube-hx',
        name: 'Shell & Tube Heat Exchanger',
        subcategory: 'liquid-liquid',
        description: 'Shell and tube heat exchanger for liquid-to-liquid heat transfer',
        svgPath: 'M10,10 L50,10 L50,40 L10,40 Z M15,15 L45,15 M15,20 L45,20 M15,25 L45,25 M15,30 L45,30 M15,35 L45,35',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'shell-inlet', x: 5, y: 15, type: 'inlet' },
          { id: 'shell-outlet', x: 55, y: 35, type: 'outlet' },
          { id: 'tube-inlet', x: 30, y: 5, type: 'inlet' },
          { id: 'tube-outlet', x: 30, y: 45, type: 'outlet' }
        ],
        tags: ['heat exchanger', 'shell tube', 'liquid', 'thermal']
      },
      {
        id: 'plate-hx',
        name: 'Plate Heat Exchanger',
        subcategory: 'liquid-liquid',
        description: 'Plate type heat exchanger with corrugated plates',
        svgPath: 'M15,10 L45,10 L45,40 L15,40 Z M20,10 L20,40 M25,10 L25,40 M30,10 L30,40 M35,10 L35,40 M40,10 L40,40',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'hot-inlet', x: 10, y: 15, type: 'inlet' },
          { id: 'hot-outlet', x: 50, y: 15, type: 'outlet' },
          { id: 'cold-inlet', x: 10, y: 35, type: 'inlet' },
          { id: 'cold-outlet', x: 50, y: 35, type: 'outlet' }
        ],
        tags: ['heat exchanger', 'plate', 'compact', 'liquid']
      },
      {
        id: 'air-cooled-condenser',
        name: 'Air Cooled Condenser',
        subcategory: 'air-cooled',
        description: 'Air cooled condenser with fans',
        svgPath: 'M10,15 L50,15 L50,25 L10,25 Z M15,15 L15,25 M20,15 L20,25 M25,15 L25,25 M30,15 L30,25 M35,15 L35,25 M40,15 L40,25 M45,15 L45,25 M20,35 C20,30 25,30 25,35 C25,40 20,40 20,35 M35,35 C35,30 40,30 40,35 C40,40 35,40 35,35',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'refrigerant-inlet', x: 5, y: 20, type: 'inlet' },
          { id: 'refrigerant-outlet', x: 55, y: 20, type: 'outlet' }
        ],
        tags: ['condenser', 'air cooled', 'fan', 'refrigerant']
      },
      {
        id: 'cooling-tower',
        name: 'Cooling Tower',
        subcategory: 'evaporative',
        description: 'Evaporative cooling tower',
        svgPath: 'M20,40 L20,15 L40,15 L40,40 M15,15 L45,15 M30,5 C25,5 25,15 30,15 C35,15 35,5 30,5 M25,25 Q30,30 35,25 M22,30 Q30,35 38,30',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'hot-water-inlet', x: 25, y: 45, type: 'inlet' },
          { id: 'cold-water-outlet', x: 35, y: 45, type: 'outlet' },
          { id: 'makeup-water', x: 30, y: 0, type: 'inlet' }
        ],
        tags: ['cooling tower', 'evaporative', 'water cooling', 'HVAC']
      }
    ]
  },
  valves: {
    name: 'Valves',
    icon: '🚰',
    symbols: [
      {
        id: 'ball-valve',
        name: 'Ball Valve',
        subcategory: 'shutoff',
        description: 'Quarter-turn ball valve for on/off control',
        svgPath: 'M15,15 L35,15 L35,35 L15,35 Z M15,25 L35,25 M10,25 L15,25 M35,25 L40,25 M20,20 L30,30',
        width: 50,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 5, y: 25, type: 'inlet' },
          { id: 'outlet', x: 45, y: 25, type: 'outlet' }
        ],
        tags: ['valve', 'ball', 'shutoff', 'quarter turn']
      },
      {
        id: 'gate-valve',
        name: 'Gate Valve',
        subcategory: 'shutoff',
        description: 'Gate valve for full flow control',
        svgPath: 'M15,15 L35,15 L35,35 L15,35 Z M25,15 L25,35 M10,25 L15,25 M35,25 L40,25 M20,10 L30,10 L30,15',
        width: 50,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 5, y: 25, type: 'inlet' },
          { id: 'outlet', x: 45, y: 25, type: 'outlet' }
        ],
        tags: ['valve', 'gate', 'shutoff', 'linear']
      },
      {
        id: 'check-valve',
        name: 'Check Valve',
        subcategory: 'non-return',
        description: 'One-way check valve preventing backflow',
        svgPath: 'M15,15 L35,25 L15,35 Z M35,15 L35,35 M10,25 L15,25 M35,25 L40,25',
        width: 50,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 5, y: 25, type: 'inlet' },
          { id: 'outlet', x: 45, y: 25, type: 'outlet' }
        ],
        tags: ['valve', 'check', 'non-return', 'one way']
      },
      {
        id: 'expansion-valve',
        name: 'Thermal Expansion Valve',
        subcategory: 'control',
        description: 'Thermostatic expansion valve for refrigerant control',
        svgPath: 'M15,15 L35,15 L35,35 L15,35 Z M20,20 L30,30 M10,25 L15,25 M35,25 L40,25 M30,5 C32,5 32,15 30,15 M30,15 Q35,10 35,5',
        width: 50,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 5, y: 25, type: 'inlet' },
          { id: 'outlet', x: 45, y: 25, type: 'outlet' },
          { id: 'sensing-bulb', x: 30, y: 0, type: 'control' }
        ],
        tags: ['valve', 'expansion', 'thermostatic', 'refrigerant', 'TXV']
      },
      {
        id: 'solenoid-valve',
        name: 'Solenoid Valve',
        subcategory: 'control',
        description: 'Electrically operated solenoid valve',
        svgPath: 'M15,15 L35,15 L35,35 L15,35 Z M25,15 L25,35 M10,25 L15,25 M35,25 L40,25 M20,5 L30,5 L30,15 M22,7 L28,7 M22,10 L28,10',
        width: 50,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 5, y: 25, type: 'inlet' },
          { id: 'outlet', x: 45, y: 25, type: 'outlet' },
          { id: 'electrical', x: 25, y: 0, type: 'control' }
        ],
        tags: ['valve', 'solenoid', 'electric', 'control', 'automated']
      }
    ]
  },
  pumps: {
    name: 'Pumps',
    icon: '💧',
    symbols: [
      {
        id: 'centrifugal-pump',
        name: 'Centrifugal Pump',
        subcategory: 'dynamic',
        description: 'Centrifugal pump for liquid circulation',
        svgPath: 'M25,25 C25,15 35,15 35,25 C35,35 25,35 25,25 M15,25 L25,25 M35,25 L45,25 M30,20 L30,30 M27,23 L33,27 M33,23 L27,27',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'suction', x: 10, y: 25, type: 'inlet' },
          { id: 'discharge', x: 50, y: 25, type: 'outlet' }
        ],
        tags: ['pump', 'centrifugal', 'liquid', 'circulation']
      },
      {
        id: 'positive-displacement-pump',
        name: 'Positive Displacement Pump',
        subcategory: 'positive-displacement',
        description: 'Positive displacement pump for precise flow',
        svgPath: 'M20,10 L40,10 L40,40 L20,40 Z M15,25 L20,25 M40,25 L45,25 M25,15 L25,35 M30,15 L30,35 M35,15 L35,35',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'suction', x: 10, y: 25, type: 'inlet' },
          { id: 'discharge', x: 50, y: 25, type: 'outlet' }
        ],
        tags: ['pump', 'positive displacement', 'precise', 'variable flow']
      }
    ]
  },
  vessels: {
    name: 'Vessels & Tanks',
    icon: '🛢️',
    symbols: [
      {
        id: 'pressure-vessel',
        name: 'Pressure Vessel',
        subcategory: 'storage',
        description: 'Pressure vessel for gas or liquid storage',
        svgPath: 'M20,10 C15,10 15,40 20,40 L40,40 C45,40 45,10 40,10 Z M15,25 L20,25 M40,25 L45,25 M30,5 L30,10',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 10, y: 25, type: 'inlet' },
          { id: 'outlet', x: 50, y: 25, type: 'outlet' },
          { id: 'vent', x: 30, y: 0, type: 'outlet' }
        ],
        tags: ['vessel', 'pressure', 'storage', 'tank']
      },
      {
        id: 'separator',
        name: 'Separator',
        subcategory: 'separation',
        description: 'Phase separator for gas-liquid separation',
        svgPath: 'M20,10 C15,10 15,40 20,40 L40,40 C45,40 45,10 40,10 Z M15,20 L45,20 M20,25 Q30,30 40,25 M15,15 L20,15 M40,35 L45,35',
        width: 60,
        height: 50,
        connectionPoints: [
          { id: 'inlet', x: 10, y: 15, type: 'inlet' },
          { id: 'gas-outlet', x: 30, y: 5, type: 'outlet' },
          { id: 'liquid-outlet', x: 50, y: 35, type: 'outlet' }
        ],
        tags: ['separator', 'phase', 'gas', 'liquid', 'knockout']
      }
    ]
  },
  instruments: {
    name: 'Instruments',
    icon: '📊',
    symbols: [
      {
        id: 'temperature-indicator',
        name: 'Temperature Indicator',
        subcategory: 'measurement',
        description: 'Temperature measurement instrument',
        svgPath: 'M25,25 C25,15 35,15 35,25 C35,35 25,35 25,25 M30,20 L30,30 M27,25 L33,25 M30,10 L30,15',
        width: 40,
        height: 40,
        connectionPoints: [
          { id: 'sensing', x: 30, y: 5, type: 'control' }
        ],
        tags: ['instrument', 'temperature', 'measurement', 'TI']
      },
      {
        id: 'pressure-indicator',
        name: 'Pressure Indicator',
        subcategory: 'measurement',
        description: 'Pressure measurement instrument',
        svgPath: 'M25,25 C25,15 35,15 35,25 C35,35 25,35 25,25 M30,20 L30,25 L33,28 M30,40 L30,35',
        width: 40,
        height: 40,
        connectionPoints: [
          { id: 'sensing', x: 30, y: 45, type: 'control' }
        ],
        tags: ['instrument', 'pressure', 'measurement', 'PI']
      },
      {
        id: 'flow-indicator',
        name: 'Flow Indicator',
        subcategory: 'measurement',
        description: 'Flow measurement instrument',
        svgPath: 'M25,25 C25,15 35,15 35,25 C35,35 25,35 25,25 M28,23 L32,25 L28,27 M15,25 L25,25 M35,25 L45,25',
        width: 60,
        height: 40,
        connectionPoints: [
          { id: 'inlet', x: 10, y: 25, type: 'inlet' },
          { id: 'outlet', x: 50, y: 25, type: 'outlet' }
        ],
        tags: ['instrument', 'flow', 'measurement', 'FI']
      }
    ]
  }
};

interface SymbolLibraryProps {
  onSymbolSelect: (symbol: Symbol) => void;
  visible?: boolean;
}

const EnhancedSymbolLibrary: React.FC<SymbolLibraryProps> = ({
  onSymbolSelect,
  visible = true
}) => {
  const [activeCategory, setActiveCategory] = useState('compressors');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customSymbolDialog, setCustomSymbolDialog] = useState(false);

  // Flatten all symbols for search
  const allSymbols = useMemo(() => {
    const symbols: Symbol[] = [];
    Object.entries(symbolCategories).forEach(([categoryKey, category]) => {
      category.symbols.forEach(symbol => {
        symbols.push({
          ...symbol,
          category: categoryKey,
          subcategory: symbol.subcategory || '',
          isFavorite: favorites.includes(symbol.id)
        } as Symbol);
      });
    });
    return symbols;
  }, [favorites]);

  // Filter symbols based on search and category
  const filteredSymbols = useMemo(() => {
    let symbols: Symbol[] = activeCategory === 'favorites' 
      ? allSymbols.filter(s => favorites.includes(s.id))
      : (symbolCategories[activeCategory as keyof typeof symbolCategories]?.symbols.map(symbol => ({
          ...symbol,
          category: activeCategory,
          subcategory: symbol.subcategory || '',
          isFavorite: favorites.includes(symbol.id)
        } as Symbol)) || []);

    if (searchTerm) {
      symbols = symbols.filter(symbol =>
        symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symbol.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symbol.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return symbols;
  }, [activeCategory, searchTerm, allSymbols, favorites]);

  const handleToggleFavorite = (symbolId: string) => {
    setFavorites(prev => 
      prev.includes(symbolId) 
        ? prev.filter(id => id !== symbolId)
        : [...prev, symbolId]
    );
  };

  const renderSymbol = (symbol: Symbol) => (
    <Card 
      key={symbol.id}
      sx={{ 
        height: 120,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
      onClick={() => onSymbolSelect(symbol)}
    >
      <CardContent sx={{ p: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <svg width={symbol.width} height={symbol.height} viewBox={`0 0 ${symbol.width} ${symbol.height}`}>
            <path d={symbol.svgPath} stroke="#333" strokeWidth="1.5" fill="none" />
          </svg>
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
          {symbol.name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(symbol.id);
            }}
          >
            {favorites.includes(symbol.id) ? <FavoriteIcon fontSize="small" color="warning" /> : <NotFavoriteIcon fontSize="small" />}
          </IconButton>
          <Chip label={symbol.subcategory || symbol.category} size="small" variant="outlined" />
        </Box>
      </CardContent>
    </Card>
  );

  if (!visible) return null;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed',
        bottom: 40,
        left: 20,
        right: 20,
        height: 300,
        zIndex: 1000,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">
            Symbol Library
          </Typography>
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setCustomSymbolDialog(true)}
          >
            Custom
          </Button>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Search symbols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Categories */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(_, value) => setActiveCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40 }}
        >
          <Tab 
            label={`⭐ Favorites (${favorites.length})`} 
            value="favorites" 
            sx={{ minHeight: 40, py: 1 }}
          />
          {Object.entries(symbolCategories).map(([key, category]) => (
            <Tab 
              key={key}
              label={`${category.icon} ${category.name}`}
              value={key}
              sx={{ minHeight: 40, py: 1 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Symbol Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={1}>
          {filteredSymbols.map(symbol => (
            <Grid item xs={2} sm={1.5} md={1.2} lg={1} key={symbol.id}>
              {renderSymbol(symbol)}
            </Grid>
          ))}
        </Grid>
        
        {filteredSymbols.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No symbols found matching your search.' : 'No symbols in this category.'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Custom Symbol Dialog */}
      <Dialog 
        open={customSymbolDialog} 
        onClose={() => setCustomSymbolDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Symbol</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Custom symbol creation will be available in the next update. 
            You can currently use the drawing tools to create custom shapes and group them as symbols.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomSymbolDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EnhancedSymbolLibrary;