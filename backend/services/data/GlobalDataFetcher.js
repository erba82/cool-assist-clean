/**
 * Global Data Fetcher Service
 * Fetches regional climate and energy cost data for any location
 * Falls back to database, uses intelligent matching
 */

const GlobalRegionalData = require('../../data/regional/GlobalRegionalData');

class GlobalDataFetcher {
    constructor() {
        this.database = GlobalRegionalData;
        this.lastFetchDate = new Date();
    }

    /**
     * Fetch all regional data for a location
     * @param {string|object} location - City name or {city, country} object
     * @returns {object} Regional data with climate, energy costs, incentives
     */
    async fetchRegionalData(location) {
        try {
            // Normalize location
            const locationKey = this._normalizeLocation(location);

            // Try exact match first
            if (this.database[locationKey]) {
                console.log(`✅ Found exact match for: ${locationKey}`);
                return {
                    ...this.database[locationKey],
                    location: locationKey,
                    dataDate: this.lastFetchDate,
                    dataSource: 'database'
                };
            }

            // Try fuzzy match
            const fuzzyMatch = this._findFuzzyMatch(locationKey);
            if (fuzzyMatch) {
                console.log(`✅ Found fuzzy match: ${locationKey} → ${fuzzyMatch}`);
                return {
                    ...this.database[fuzzyMatch],
                    location: fuzzyMatch,
                    originalLocation: locationKey,
                    dataDate: this.lastFetchDate,
                    dataSource: 'database (fuzzy match)'
                };
            }

            // Fallback to default
            console.log(`⚠️ No match for ${locationKey}, using default data`);
            return {
                ...this.database['_default'],
                location: locationKey,
                dataDate: this.lastFetchDate,
                dataSource: 'default (no match found)'
            };

        } catch (error) {
            console.error('Error fetching regional data:', error);
            return {
                ...this.database['_default'],
                location: 'Unknown',
                dataDate: this.lastFetchDate,
                dataSource: 'default (error)',
                error: error.message
            };
        }
    }

    /**
     * Normalize location string for matching
     */
    _normalizeLocation(location) {
        if (typeof location === 'string') {
            return location.trim();
        }

        if (typeof location === 'object') {
            if (location.city && location.country) {
                return `${location.city}, ${location.country}`;
            }
            if (location.city) {
                return location.city;
            }
        }

        return 'Unknown';
    }

    /**
     * Find fuzzy match for location
     * Tries: city only, country only, partial matches
     */
    _findFuzzyMatch(locationKey) {
        const locations = Object.keys(this.database).filter(k => k !== '_default');

        // Extract city from "City, Country" format
        const cityPart = locationKey.split(',')[0].trim().toLowerCase();

        // Try city-only match
        for (const key of locations) {
            const dbCity = key.split(',')[0].trim().toLowerCase();
            if (dbCity === cityPart) {
                return key;
            }
        }

        // Try partial match (e.g., "LA" matches "Los Angeles")
        for (const key of locations) {
            const dbCity = key.split(',')[0].trim().toLowerCase();
            if (dbCity.includes(cityPart) || cityPart.includes(dbCity)) {
                return key;
            }
        }

        // Try country match (return capital or major city)
        const countryPart = locationKey.includes(',')
            ? locationKey.split(',')[1].trim().toLowerCase()
            : locationKey.toLowerCase();

        for (const key of locations) {
            if (key.toLowerCase().includes(countryPart)) {
                return key;
            }
        }

        return null;
    }

    /**
     * Get list of all available locations
     */
    getAvailableLocations() {
        return Object.keys(this.database)
            .filter(k => k !== '_default')
            .sort();
    }

    /**
     * Get climate zone description
     */
    getClimateZoneDescription(zone) {
        const descriptions = {
            '1A': 'Very Hot - Humid (Miami, Singapore)',
            '2A': 'Hot - Humid (Houston, Hong Kong)',
            '2B': 'Hot - Dry (Phoenix, Riyadh)',
            '3A': 'Warm - Humid (Atlanta, Shanghai)',
            '3B': 'Warm - Dry (Las Vegas, Tehran)',
            '3C': 'Warm - Marine (San Francisco)',
            '4A': 'Mixed - Humid (New York, Paris)',
            '4B': 'Mixed - Dry (Albuquerque)',
            '4C': 'Mixed - Marine (Seattle, London)',
            '5A': 'Cool - Humid (Chicago, Berlin)',
            '5B': 'Cool - Dry (Denver)',
            '6A': 'Cold - Humid (Toronto, Moscow)',
            '6B': 'Cold - Dry (Helena)',
            '7': 'Very Cold (Duluth, Oslo)',
            '8': 'Subarctic (Fairbanks, Siberia)'
        };
        return descriptions[zone] || 'Unknown climate zone';
    }

    /**
     * Calculate cooling load impact from climate
     * Returns multiplier for base cooling load
     */
    getCoolingLoadMultiplier(regionalData) {
        const cdd = regionalData.climate.coolingDegreeDays;

        // Baseline: 1000 CDD
        if (cdd < 500) return 0.6;
        if (cdd < 1000) return 0.8;
        if (cdd < 2000) return 1.0;
        if (cdd < 3000) return 1.2;
        if (cdd < 4000) return 1.4;
        return 1.6;
    }

    /**
     * Recommend strategies based on climate
     */
    getClimateBasedRecommendations(regionalData) {
        const recommendations = [];
        const climate = regionalData.climate;
        const energy = regionalData.energy;

        // Heat recovery in cold climates
        if (climate.heatingDegreeDays > 2000) {
            recommendations.push({
                strategy: 'heatRecovery',
                reason: 'High heating demand makes heat recovery very valuable',
                priority: 'high'
            });
        }

        // Evaporative cooling in dry climates
        if (climate.summerDesign.rh < 35) {
            recommendations.push({
                strategy: 'evaporativeCooling',
                reason: 'Low humidity allows effective evaporative pre-cooling',
                priority: 'high'
            });
        }

        // Peak shaving in high-cost regions
        if (energy.peakRatePremium > 2.0) {
            recommendations.push({
                strategy: 'peakShaving',
                reason: 'High peak rates make thermal storage very beneficial',
                priority: 'high'
            });
        }

        // Solar in high-solar regions
        if (climate.coolingDegreeDays > 2000 && energy.electricityCost > 0.15) {
            recommendations.push({
                strategy: 'solar',
                reason: 'High cooling demand + high energy costs favor solar',
                priority: 'medium'
            });
        }

        // Demand response if available
        if (regionalData.incentives.demandResponse) {
            recommendations.push({
                strategy: 'demandResponse',
                reason: 'Utility offers demand response incentives',
                priority: 'medium'
            });
        }

        return recommendations;
    }
}

module.exports = new GlobalDataFetcher();
