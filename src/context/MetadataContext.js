import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMetadata } from '../data/data';

const MetadataContext = createContext();

export const MetadataProvider = ({ children }) => {
    const [metadata, setMetadata] = useState({
        allWeeks: [],
        allYears: [],
        allNames: [],
        yearsToWeeks: {},
        latestYear: '',
        latestWeek: '',
        loading: true
    });

    useEffect(() => {
        getMetadata().then(meta => {
            setMetadata({
                allWeeks: meta.weeks || [],
                allYears: meta.years || [],
                allNames: meta.names || [],
                yearsToWeeks: meta.yearsToWeeks || {},
                latestYear: meta.latestYear || '',
                latestWeek: meta.latestWeek || '',
                loading: false
            });
        }).catch(err => {
            console.error("Failed to fetch metadata:", err);
            setMetadata(prev => ({ ...prev, loading: false }));
        });
    }, []);

    return (
        <MetadataContext.Provider value={metadata}>
            {children}
        </MetadataContext.Provider>
    );
};

export const useMetadata = () => {
    const context = useContext(MetadataContext);
    if (context === undefined) {
        throw new Error('useMetadata must be used within a MetadataProvider');
    }
    return context;
};
