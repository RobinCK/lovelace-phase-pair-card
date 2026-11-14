import { readEntity } from '../ha/readings';
import type { Reading } from '../ha/readings';
import { phaseAppearance } from '../logic/color';
import type { PhaseAppearance } from '../logic/color';
import type { CardSettings, Side } from '../types/config';
import type { HassEntities, HomeAssistant } from '../types/ha';

export interface SideModel {
  readonly voltage: Reading;
  readonly power: Reading;
  readonly current: Reading;
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
  current: readEntity(states, side.current, 'current'),
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

export const definedIds = (entityIds: readonly (string | undefined)[]): string[] => [
  ...new Set(entityIds.filter((entityId): entityId is string => entityId !== undefined)),
];

export const trackedEntities = (settings: CardSettings): string[] =>
  definedIds(
    settings.phases.flatMap((phase) =>
      [phase.before, phase.after].flatMap((side) => [side.voltage, side.power, side.current]),
    ),
  );
