import { nothing, svg } from 'lit';
import type { SVGTemplateResult } from 'lit';
import { formatNumber } from '../../logic/format';
import type { FormatLocale } from '../../logic/format';
import { fromPolar, phaseAngle, ringStep, stepDecimals, vectorLength } from '../../logic/phasor';
import type { Vector } from '../../logic/phasor';

export interface DiagramPhase {
  readonly name: string;
  readonly current: number | undefined;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

const SIZE = 200;

const CENTER = SIZE / 2;

const RADIUS = 80;

const AXIS_RADIUS = 88;

const HEAD_LENGTH = 9;

const HEAD_HALF_WIDTH = 4;

const LABEL_GAP = 11;

const MIN_LABEL_RADIUS = 30;

const RING_LABEL_ANGLE = 150;

const toPoint = (vector: Vector, scale: number): Point => ({
  x: CENTER + vector.x * scale,
  y: CENTER - vector.y * scale,
});

const along = (point: Point, unit: Point, distance: number): Point => ({
  x: point.x + unit.x * distance,
  y: point.y + unit.y * distance,
});

const coordinates = (points: readonly Point[]): string =>
  points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');

const unitOf = (vector: Vector): Point => {
  const length = vectorLength(vector);

  return { x: vector.x / length, y: -vector.y / length };
};

const arrow = (
  vector: Vector,
  scale: number,
  className: string,
): SVGTemplateResult | typeof nothing => {
  const length = vectorLength(vector) * scale;

  if (length < 0.5) return nothing;

  const unit = unitOf(vector);
  const center = { x: CENTER, y: CENTER };
  const tip = along(center, unit, length);
  const base = along(tip, unit, -Math.min(HEAD_LENGTH, length));
  const normal = { x: -unit.y, y: unit.x };
  const head = [tip, along(base, normal, HEAD_HALF_WIDTH), along(base, normal, -HEAD_HALF_WIDTH)];

  return svg`<line class="${className}-shaft" x1=${CENTER} y1=${CENTER} x2=${base.x.toFixed(2)} y2=${base.y.toFixed(2)}></line>
    <polygon class="${className}-head" points=${coordinates(head)}></polygon>`;
};

const label = (
  text: string,
  direction: Vector,
  distance: number,
  className: string,
): SVGTemplateResult => {
  const position = along({ x: CENTER, y: CENTER }, unitOf(direction), distance);

  return svg`<text class=${className} x=${position.x.toFixed(2)} y=${position.y.toFixed(2)} text-anchor="middle" dominant-baseline="central">${text}</text>`;
};

const rings = (
  step: number,
  maximum: number,
  scale: number,
  locale: FormatLocale,
): SVGTemplateResult[] => {
  const count = Math.max(1, Math.floor((maximum + step * 1e-6) / step));
  const decimals = stepDecimals(step);

  return Array.from({ length: count }, (_, index) => {
    const value = step * (index + 1);
    const radius = value * scale;

    return svg`<circle class="ring" cx=${CENTER} cy=${CENTER} r=${radius.toFixed(2)}></circle>
      ${label(`${formatNumber(value, decimals, locale)} A`, fromPolar(1, RING_LABEL_ANGLE), radius, 'ring-label')}`;
  });
};

export const phasorDiagram = (
  phases: readonly DiagramPhase[],
  neutral: Vector | undefined,
  locale: FormatLocale,
  ariaLabel: string,
): SVGTemplateResult => {
  const currents = phases.map((phase) => phase.current ?? 0);
  const maximum = Math.max(0, ...currents);
  const scaleMaximum = maximum > 0 ? maximum : 1;
  const scale = RADIUS / scaleMaximum;
  const vectors = phases.map((phase, index) => fromPolar(phase.current ?? 0, phaseAngle(index)));
  const complete = phases.every((phase) => phase.current !== undefined);
  const axes = phases.map((_, index) =>
    toPoint(fromPolar(AXIS_RADIUS / scale, phaseAngle(index)), scale),
  );

  return svg`<svg class="phasor-svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label=${ariaLabel}>
    ${rings(ringStep(scaleMaximum), scaleMaximum, scale, locale)}
    <path class="axis" d=${axes.map((point) => `M${CENTER},${CENTER} L${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')}></path>
    ${complete && maximum > 0 ? svg`<polygon class="phase-triangle" points=${coordinates(vectors.map((vector) => toPoint(vector, scale)))}></polygon>` : nothing}
    ${vectors.map((vector) => arrow(vector, scale, 'phase-arrow'))}
    ${neutral ? arrow(neutral, scale, 'neutral-arrow') : nothing}
    <circle class="hub" cx=${CENTER} cy=${CENTER} r="3"></circle>
    ${phases.map((phase, index) =>
      label(
        phase.name,
        fromPolar(1, phaseAngle(index)),
        Math.max((phase.current ?? 0) * scale + LABEL_GAP, MIN_LABEL_RADIUS),
        phase.current === undefined ? 'phase-label missing' : 'phase-label',
      ),
    )}
    ${neutral && vectorLength(neutral) * scale >= 0.5 ? label('N', neutral, vectorLength(neutral) * scale + LABEL_GAP, 'neutral-label') : nothing}
  </svg>`;
};
