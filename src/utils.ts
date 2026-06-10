import { RdoRecord } from './types';

/**
 * Calculates a stable chronological sequence number for an RDO within its contract.
 * Returns a formatted code like "RDO-01", "RDO-02", etc.
 */
export function getRdoSequentialCode(rdo: RdoRecord | undefined, allRdos: RdoRecord[]): string {
  if (!rdo || !allRdos || allRdos.length === 0) return 'RDO-01';
  
  // Filter RDOs belonging to the same contract
  const contractRdos = allRdos
    .filter(r => r.contractId === rdo.contractId)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.id.localeCompare(b.id);
    });
  
  const index = contractRdos.findIndex(r => r.id === rdo.id);
  const sequenceNum = index !== -1 ? index + 1 : 1;
  
  return `RDO-${sequenceNum.toString().padStart(2, '0')}`;
}
