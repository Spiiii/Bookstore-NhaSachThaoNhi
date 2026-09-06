import { generateContracts } from './generate-contracts.mjs';
import { checkContractBoundaries } from './check-contract-boundaries.mjs';
await checkContractBoundaries();
await generateContracts({ check: true });
