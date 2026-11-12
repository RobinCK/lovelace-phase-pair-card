import { readEntity } from '../ha/readings';
import type { Reading } from '../ha/readings';
import { phaseAppearance } from '../logic/color';
import type { PhaseAppearance } from '../logic/color';
import type { CardSettings, Side } from '../types/config';
import type { HassEntities, HomeAssistant } from '../types/ha';

export interface SideModel {
  readonly voltage: Reading;
  readonly power: Reading;
}

export interface PhaseModel {
  readonly name: string;
  readonly appearance: PhaseAppearance;
  readonly before: SideModel;
  readonly after: SideModel;
  readonly hasPower: boolean;
}

const readSide = (states: HassEntities, side: Side): SideModel => ({
  voltage: readEntity(states, side.voltage, 'voltage'),
  power: readEntity(states, side.power, 'power'),
});

export const buildPhaseModels = (settings: CardSettings, hass: HomeAssistant): PhaseModel[] => {
  const darkMode = hass.themes?.darkMode ?? false;

  return settings.phases.map((phase) => ({
    name: phase.name,
    appearance: phaseAppearance(phase.color, darkMode),
    before: readSide(hass.states, phase.before),
    after: readSide(hass.states, phase.after),
    hasPower: Boolean(phase.before.power ?? phase.after.power),
  }));
};

export const trackedEntities = (settings: CardSettings): string[] =>
  settings.phases
    .flatMap((phase) => [
      phase.before.voltage,
      phase.before.power,
      phase.after.voltage,
      phase.after.power,
    ])
    .filter((entityId): entityId is string => entityId !== undefined);

export const historyEntities = (settings: CardSettings): string[] => {
  const voltages = settings.phases.flatMap((phase) => [phase.before.voltage, phase.after.voltage]);

  return [...new Set(voltages.filter((entityId): entityId is string => entityId !== undefined))];
};
