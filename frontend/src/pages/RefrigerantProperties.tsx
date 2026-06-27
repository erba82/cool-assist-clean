import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Slider,
  FormControl, InputLabel, Select, MenuItem, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, Card, CardContent, Divider, SelectChangeEvent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { useTheme as muiUseTheme } from '@mui/material/styles';

// Define TypeScript interfaces for refrigerant data
interface PressureTemperaturePoint {
  temperature: number; // Celsius
  pressure: number;    // bar (absolute)
}

interface RefrigerantData {
  gwp: number;
  odp: number;
  criticalTemp: number;
  criticalPressure: number;
  boilingPoint: number;
  safetyClass: string;
  pressureTemperatureTable: PressureTemperaturePoint[];
}

interface RefrigerantDataMap {
  [key: string]: RefrigerantData;
}

// Styled components
const SliderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3), // کمی پدینگ افقی بیشتر
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

const RefrigerantCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  height: '100%', // برای هم ارتفاع شدن کارت ها
  // transition: 'transform 0.3s ease-in-out', // افکت هاور (اختیاری)
  // '&:hover': {
  //   transform: 'translateY(-5px)',
  //   boxShadow: theme.shadows[8],
  // },
}));

const RefrigerantProperties: React.FC = () => {
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<string>('r717'); // پیش فرض آمونیاک
  const [temperature, setTemperature] = useState<number>(25); // درجه سانتیگراد
  const [pressure, setPressure] = useState<number>(0); // bar مطلق

  const theme = useTheme();

  // Refrigerant data map
  const refrigerants: RefrigerantDataMap = {
    r22: {
      gwp: 1810, odp: 0.055, criticalTemp: 96.2, criticalPressure: 49.9, boilingPoint: -40.8, safetyClass: 'A1',
      pressureTemperatureTable: [
        { temperature: -40, pressure: 0.51 }, { temperature: -30, pressure: 0.85 }, { temperature: -20, pressure: 1.34 },
        { temperature: -10, pressure: 2.01 }, { temperature: 0, pressure: 3.00 }, { temperature: 10, pressure: 4.21 },
        { temperature: 20, pressure: 5.74 }, { temperature: 30, pressure: 7.60 }, { temperature: 40, pressure: 9.88 },
        { temperature: 50, pressure: 12.55 }
      ] // مقادیر bar مطلق (تقریبی)
    },
    r134a: {
      gwp: 1430, odp: 0, criticalTemp: 101.1, criticalPressure: 40.6, boilingPoint: -26.1, safetyClass: 'A1',
      pressureTemperatureTable: [
        { temperature: -40, pressure: 0.51 }, { temperature: -30, pressure: 0.84 }, { temperature: -20, pressure: 1.33 },
        { temperature: -10, pressure: 2.01 }, { temperature: 0, pressure: 2.93 }, { temperature: 10, pressure: 4.15 },
        { temperature: 20, pressure: 5.72 }, { temperature: 30, pressure: 7.71 }, { temperature: 40, pressure: 10.17 },
        { temperature: 50, pressure: 13.18 }
      ]
    },
    r410a: {
      gwp: 2088, odp: 0, criticalTemp: 72.8, criticalPressure: 49.0, boilingPoint: -51.6, safetyClass: 'A1',
      pressureTemperatureTable: [
        { temperature: -40, pressure: 1.77 }, { temperature: -30, pressure: 2.61 }, { temperature: -20, pressure: 3.98 },
        { temperature: -10, pressure: 5.64 }, { temperature: 0, pressure: 7.96 }, { temperature: 10, pressure: 10.83 },
        { temperature: 20, pressure: 14.34 }, { temperature: 30, pressure: 18.56 }, { temperature: 40, pressure: 23.59 },
        { temperature: 50, pressure: 29.53 }
      ]
    },
    r717: { // Ammonia - Updated Table
      gwp: 0, odp: 0, criticalTemp: 132.3, criticalPressure: 113.3, boilingPoint: -33.3, safetyClass: 'B2L',
      // --- جدول فشار-دمای به‌روز شده برای آمونیاک (R-717) ---
      pressureTemperatureTable: [
        { temperature: -40, pressure: 0.70 }, // Standard data
        { temperature: -35, pressure: 0.92 }, // Interpolated/Standard
        { temperature: -30, pressure: 1.19 }, // Standard data
        { temperature: -25, pressure: 1.54 }, // Interpolated/Standard
        { temperature: -20, pressure: 1.96 }, // Standard data
        { temperature: -15, pressure: 2.47 }, // Interpolated/Standard
        { temperature: -10, pressure: 3.09 }, // Standard data
        { temperature: -5,  pressure: 3.80 }, // Interpolated/Standard
        { temperature: 0,   pressure: 4.29 }, // Standard data (Corresponds to ~48 psig)
        { temperature: 5,   pressure: 5.17 }, // Interpolated/Standard
        { temperature: 10,  pressure: 6.17 }, // Standard data (Corresponds to ~75 psig)
        { temperature: 15,  pressure: 7.28 }, // Interpolated/Standard
        { temperature: 20,  pressure: 8.57 }, // Standard data (Corresponds to ~109 psig)
        { temperature: 25,  pressure: 10.01 },// Interpolated/Standard
        { temperature: 30,  pressure: 11.67 },// Standard data (Corresponds to ~155 psig)
        { temperature: 35,  pressure: 13.52 },// Interpolated/Standard
        { temperature: 40,  pressure: 15.55 },// Standard data (Corresponds to ~211 psig)
        { temperature: 45,  pressure: 17.81 },// Interpolated/Standard
        { temperature: 50,  pressure: 20.33 },// Standard data (Corresponds to ~280 psig)
      ]
      // ---------------------------------------------------------
    },
    r744: { // CO2
      gwp: 1, odp: 0, criticalTemp: 31.1, criticalPressure: 73.8, boilingPoint: -78.5, safetyClass: 'A1',
      pressureTemperatureTable: [
        { temperature: -40, pressure: 10.4 }, { temperature: -30, pressure: 14.5 }, { temperature: -20, pressure: 19.7 },
        { temperature: -10, pressure: 26.5 }, { temperature: 0, pressure: 34.9 }, { temperature: 10, pressure: 45.0 },
        { temperature: 20, pressure: 57.3 }, { temperature: 30, pressure: 72.1 }, { temperature: 31, pressure: 73.8 }
      ] // تا نقطه بحرانی
    },
    r290: { // Propane
      gwp: 3, odp: 0, criticalTemp: 96.7, criticalPressure: 42.5, boilingPoint: -42.1, safetyClass: 'A3',
      pressureTemperatureTable: [
        { temperature: -40, pressure: 0.78 }, { temperature: -30, pressure: 1.23 }, { temperature: -20, pressure: 1.84 },
        { temperature: -10, pressure: 2.67 }, { temperature: 0, pressure: 3.76 }, { temperature: 10, pressure: 5.16 },
        { temperature: 20, pressure: 6.92 }, { temperature: 30, pressure: 9.10 }, { temperature: 40, pressure: 11.76 },
        { temperature: 50, pressure: 14.97 }
      ]
    }
  };

  // Calculate pressure based on temperature using linear interpolation
  useEffect(() => {
    const table = refrigerants[selectedRefrigerant]?.pressureTemperatureTable;
    if (!table || table.length === 0) {
        setPressure(NaN); // یا مقدار پیش فرض دیگر
        return;
    }

    // تابع درون یابی خطی
    const interpolatePressure = (temp: number): number => {
      // پیدا کردن نقاط بالا و پایین
      let lowerPoint: PressureTemperaturePoint | null = null;
      let upperPoint: PressureTemperaturePoint | null = null;

      for (let i = 0; i < table.length; i++) {
          if (table[i].temperature <= temp) {
              lowerPoint = table[i];
          }
          if (table[i].temperature >= temp && !upperPoint) {
              upperPoint = table[i];
          }
      }

      // اگر دما خارج از محدوده جدول باشد
      if (!lowerPoint) return table[0].pressure; // کمتر از کمترین دما
      if (!upperPoint) return table[table.length - 1].pressure; // بیشتر از بیشترین دما
      if (lowerPoint.temperature === upperPoint.temperature) return lowerPoint.pressure; // دقیقا روی یک نقطه

      // درون یابی خطی
      const tempRange = upperPoint.temperature - lowerPoint.temperature;
      const pressureRange = upperPoint.pressure - lowerPoint.pressure;
      const ratio = (temp - lowerPoint.temperature) / tempRange;

      return lowerPoint.pressure + ratio * pressureRange;
    };

    const calculatedPressure = interpolatePressure(temperature);
    setPressure(parseFloat(calculatedPressure.toFixed(2))); // گرد کردن به دو رقم اعشار

  }, [temperature, selectedRefrigerant, refrigerants]);

  // Handler for refrigerant selection change
  const handleRefrigerantChange = (event: SelectChangeEvent<string>) => {
    setSelectedRefrigerant(event.target.value as string);
  };

  // Handler for temperature slider change
  const handleTemperatureChange = (_event: Event, newValue: number | number[]) => {
    setTemperature(newValue as number);
  };

  // Get current refrigerant data safely
  const currentRefrigerant = refrigerants[selectedRefrigerant] || refrigerants['r134a']; // Fallback

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AcUnitIcon sx={{ mr: 1.5, fontSize: '2.5rem', color: 'primary.main' }} /> Refrigerant Properties
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Refrigerant & Temperature
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="refrigerant-select-label">Refrigerant</InputLabel>
          <Select
            labelId="refrigerant-select-label"
            id="refrigerant-select"
            value={selectedRefrigerant}
            label="Refrigerant"
            onChange={handleRefrigerantChange}
          >
            {/* تولید آیتم ها به صورت داینامیک */}
            {Object.keys(refrigerants).map((key) => (
                 <MenuItem key={key} value={key}>
                     {key.toUpperCase()} ({key === 'r717' ? 'Ammonia' : key === 'r744' ? 'CO2' : key === 'r290' ? 'Propane' : 'Synthetic'})
                 </MenuItem>
            ))}
          </Select>
        </FormControl>

        <SliderContainer>
          <Typography id="temperature-slider" gutterBottom>
            Temperature (°C): **{temperature}**
          </Typography>
          <Slider
            aria-labelledby="temperature-slider"
            value={temperature}
            onChange={handleTemperatureChange}
            min={-40} // محدوده اسلایدر
            max={50}  // محدوده اسلایدر
            step={1}
            valueLabelDisplay="auto" // نمایش مقدار روی thumb
            marks={[ // مارک های اصلی
              { value: -40, label: '-40°C' },
              { value: 0, label: '0°C' },
              { value: 50, label: '50°C' },
            ]}
            sx={{ // استایل بهتر اسلایدر
              color: 'primary.main',
              mt: 1, // فاصله از بالا
              '& .MuiSlider-thumb': { height: 20, width: 20 },
              '& .MuiSlider-rail': { opacity: 0.4 },
              '& .MuiSlider-markLabel': { fontSize: '0.8rem' }
            }}
          />
        </SliderContainer>

        <Typography variant="h5" align="center" sx={{ mt: 3, fontWeight: 'medium' }}>
          Saturation Pressure: <Typography component="span" variant="h4" color="primary" sx={{ fontWeight: 'bold', ml: 1 }}>{isNaN(pressure) ? 'N/A' : pressure}</Typography> bar (abs)
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* کارت اطلاعات مبرد */}
        <Grid item xs={12} md={5}> {/* کمی عرض بیشتر */}
          <RefrigerantCard variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: `2px solid ${theme.palette.primary.main}`, pb: 1, mb: 2 }}>
                {selectedRefrigerant.toUpperCase()} Properties
              </Typography>
              <Typography variant="body2" paragraph><strong>GWP:</strong> {currentRefrigerant.gwp}</Typography>
              <Typography variant="body2" paragraph><strong>ODP:</strong> {currentRefrigerant.odp}</Typography>
              <Typography variant="body2" paragraph><strong>Critical Temp:</strong> {currentRefrigerant.criticalTemp} °C</Typography>
              <Typography variant="body2" paragraph><strong>Critical Pressure:</strong> {currentRefrigerant.criticalPressure} bar</Typography>
              <Typography variant="body2" paragraph><strong>Boiling Point (@ 1 atm):</strong> {currentRefrigerant.boilingPoint} °C</Typography>
              <Typography variant="body2"><strong>Safety Class:</strong> {currentRefrigerant.safetyClass}</Typography>
            </CardContent>
          </RefrigerantCard>
        </Grid>

        {/* جدول فشار-دما */}
        <Grid item xs={12} md={7}> {/* کمی عرض کمتر */}
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 450 }}> {/* ارتفاع ثابت برای اسکرول */}
            <Table stickyHeader aria-label="pressure-temperature table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Temperature (°C)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Pressure (bar abs)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentRefrigerant.pressureTemperatureTable.map((row: PressureTemperaturePoint, index: number) => (
                  <TableRow
                    key={index}
                    hover // افکت هاور
                    // هایلایت کردن ردیف نزدیک به دمای انتخاب شده
                    selected={ Math.abs(row.temperature - temperature) < 1 } // ردیف های نزدیک به دمای اسلایدر
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{row.temperature.toFixed(1)}</TableCell>
                    <TableCell>{row.pressure.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RefrigerantProperties;
function useTheme() {
  return muiUseTheme();
}
