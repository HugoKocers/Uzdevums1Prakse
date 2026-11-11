export interface BeamInputs {
  length: number;
  width: number;
  height: number;
  strength: number;
}

export interface Calculation extends BeamInputs {
  sectionModulus: number;
  capacity: number;
  createdAt: string;
  id?: number;
}

export function calculateCapacity(inputs: BeamInputs): Omit<Calculation, 'createdAt' | 'id'> {
  const entries = Object.entries(inputs) as [keyof BeamInputs, number][];
  for (const [name, value] of entries) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a finite positive number`);
    }
  }

  const sectionModulus = (inputs.width * inputs.height ** 2) / 6;
  const capacity = (8 * inputs.strength * sectionModulus) / inputs.length ** 2;
  if (!Number.isFinite(sectionModulus) || !Number.isFinite(capacity)) {
    throw new Error('Calculation result is outside the supported numeric range');
  }

  return { ...inputs, sectionModulus, capacity };
}
