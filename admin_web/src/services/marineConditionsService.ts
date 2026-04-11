import { getMockMarineConditionsPayload, defaultMarineScopeId } from '../pages/MarineConditions/mocks/marineData';
import type { MarineConditionsPayload } from '../pages/MarineConditions/types/marine.types';

export interface MarineConditionsResponse {
  payload: MarineConditionsPayload;
  source: 'mock';
}

export const marineConditionsService = {
  async getMarineConditions(scopeId = defaultMarineScopeId): Promise<MarineConditionsResponse> {
    // Backend integration will replace this service boundary. The page should
    // continue consuming the normalized payload shape below.
    return {
      payload: getMockMarineConditionsPayload(scopeId),
      source: 'mock',
    };
  },
};
