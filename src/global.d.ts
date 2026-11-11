import type { BeamInputs, Calculation } from './shared/calculation';
import type { LicenseCredentials, LicenseResult } from './shared/license';

declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
  const MAIN_WINDOW_VITE_NAME: string;

  interface Window {
    beamApp: {
      calculateAndSave(inputs: BeamInputs): Promise<Calculation>;
      getHistory(): Promise<Calculation[]>;
      verifyLicense(credentials: LicenseCredentials): Promise<LicenseResult>;
    };
  }
}

export {};
