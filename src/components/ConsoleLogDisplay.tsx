import React, { useState, useEffect } from 'react';

interface ConsoleLogDisplayProps {
    logs: any[];
}

// Custom hook to capture console.log messages
export const useConsoleLog = () => {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        // Store the native log function
        const nativeLog = console.log;
        
        // Create a new function that preserves the native behavior
        function newLog(...args: any[]) {
            // Call the native log with the console context
            nativeLog.apply(console, args);
            
            // Update our state
            setLogs(prevLogs => [...prevLogs, args]);
        }

        // Override console.log
        console.log = newLog;

        // Cleanup
        return () => {
            console.log = nativeLog;
        };
    }, []);

    return logs;
};

const MAX_DEPTH = 1; // Maximum depth for object traversal

const LogEntry: React.FC<{ value: any, depth?: number, seenObjects?: WeakSet<any> }> = ({ value, depth = 0, seenObjects = new WeakSet() }) => {
    const getValueColor = (val: any) => {
        if (val === null) return '#808080';  // gray for null
        switch (typeof val) {
            case 'number': return '#b5cea8';  // green for numbers
            case 'boolean': return '#569cd6'; // blue for booleans
            case 'string': return '#ce9178';  // orange for strings
            default: return '#d4d4d4';        // light gray for others
        }
    };

    // Handle primitive types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
        const color = getValueColor(value);
        const quote = typeof value === 'string' ? '"' : '';
        return <span style={{ color }}>{quote}{String(value)}{quote}</span>;
    }

    // Check for circular references and max depth
    if (depth >= MAX_DEPTH) {
        return <span style={{ color: '#808080' }}>[Max depth reached]</span>;
    }

    if (typeof value === 'object' && value !== null) {
        if (seenObjects.has(value)) {
            return <span style={{ color: '#808080' }}>[Circular]</span>;
        }
        seenObjects.add(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return <span>[]</span>;
        return (
            <div style={{ marginLeft: `${depth * 20}px` }}>
                <span>Array({value.length}) [</span>
                {value.map((item, index) => (
                    <div key={index} style={{ marginLeft: '20px' }}>
                        <LogEntry value={item} depth={depth + 1} seenObjects={seenObjects} />
                        {index < value.length - 1 && <span style={{ color: '#d4d4d4' }}>,</span>}
                    </div>
                ))}
                <span>]</span>
            </div>
        );
    }

    // Handle objects
    if (typeof value === 'object') {
        try {
            const entries = Object.entries(value);
            if (entries.length === 0) return <span>{'{}'}</span>;
            return (
                <div style={{ marginLeft: `${depth * 20}px` }}>
                    <span>{'{'}</span>
                    {entries.map(([key, val], index) => (
                        <div key={key} style={{ marginLeft: '20px' }}>
                            <span style={{ color: '#9cdcfe' }}>{key}</span>
                            <span style={{ color: '#d4d4d4' }}>: </span>
                            <LogEntry value={val} depth={depth + 1} seenObjects={seenObjects} />
                            {index < entries.length - 1 && <span style={{ color: '#d4d4d4' }}>,</span>}
                        </div>
                    ))}
                    <span>{'}'}</span>
                </div>
            );
        } catch (error) {
            return <span style={{ color: '#808080' }}>[Unable to display object]</span>;
        }
    }

    return <span>{String(value)}</span>;
};

// Component to display console logs
export const ConsoleLogDisplay: React.FC<ConsoleLogDisplayProps> = ({ logs }) => {
    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '30vh',
            overflowY: 'auto',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '10px',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            zIndex: 9999,
            borderTop: '1px solid #333'
        }}>
            {logs.map((logArgs, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                    {logArgs.map((arg: any, argIndex: number) => (
                        <div key={argIndex} style={{ marginLeft: argIndex > 0 ? '20px' : '0' }}>
                            <LogEntry value={arg} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
