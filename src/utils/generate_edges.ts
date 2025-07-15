import { Edge } from '../../src/engine/items/ttr_defs';
import { Bucket } from './bucket';

// Helper function to generate a random hexadecimal address
const generateRandomAddress = (): string => {
    return '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

// Helper function to generate a random hash
const generateRandomHash = (): string => {
    return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

const event_type = "0x3::module::transfer";

// Array of common cryptocurrency symbols
const cryptoSymbols: string[] = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'SHIB', 'DOT'];

function generateRandomEdges(source: string, addresses: Bucket<string>, amount: number = 100): Edge[] {
    let edges: Edge[] = [];
    for (let i = 0; i < amount; i++) {
        const fromAddress = source;
        const toAddress = addresses.getRandomItem();
        const symbol = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
        const value = parseFloat((Math.random() * 10000).toFixed(2)); // Random value up to 10000 with 2 decimal places
        const hash = generateRandomHash();
        const timestamp = Math.floor(Date.now()) - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000); // Random timestamp within the last year

        edges.push({
            from: fromAddress,
            to: toAddress,
            symbol: symbol,
            value: value,
            type: event_type,
            hash: hash,
            timestamp: timestamp,
        });
    }
    return edges;
}

export {
    generateRandomEdges,
    generateRandomAddress,
    generateRandomHash,
}