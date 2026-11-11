import { contextBridge, ipcRenderer } from 'electron';
import type { BeamInputs, Calculation } from './shared/calculation';
import type { LicenseCredentials, LicenseResult } from './shared/license';

contextBridge.exposeInMainWorld('beamApp', {
  calculateAndSave: (inputs: BeamInputs): Promise<Calculation> =>
    ipcRenderer.invoke('calculation:save', inputs),
  getHistory: (): Promise<Calculation[]> => ipcRenderer.invoke('calculation:history'),
  verifyLicense: (credentials: LicenseCredentials): Promise<LicenseResult> =>
    ipcRenderer.invoke('license:verify', credentials)
});
