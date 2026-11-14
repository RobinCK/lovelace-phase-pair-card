import { LitElement, html, nothing, svg } from 'lit';
import type { PropertyDeclarations, SVGTemplateResult, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DEFAULT_LABELS, phaseColor, phaseName } from '../config/defaults';
import { hexToRgb, isHexColor, phaseAppearance, rgbToHex } from '../logic/color';
import type { Rgb } from '../logic/color';
import { measuresQuantity } from '../ha/readings';
import type { Quantity } from '../ha/readings';
import { DEFAULT_SIDE } from '../config/defaults';
import type {
  PhaseConfig,
  PhasePairCardConfig,
  SideKey,
  SideLabels,
  ViewMode,
} from '../types/config';
import type { HassEntity, HomeAssistant } from '../types/ha';
import {
  addPhase,
  applySettingsFields,
  phasesOf,
  removePhase,
  sensorCount,
  toSettingsFields,
  updatePhase,
  updateSensor,
  viewOf,
  withView,
} from './config-mapping';
import type { SettingsFields } from './config-mapping';
import { loadHaComponents } from './load-ha-components';
import {
  ALL_OPTIONS_SCHEMA,
  BALANCE_GENERAL_SCHEMA,
  CHART_SCHEMA,
  GENERAL_SCHEMA,
  PHASE_SCHEMA,
  SENSOR_LABELS,
  SINGLE_THRESHOLDS_SCHEMA,
  balanceSchema,
  fieldLabel,
  settingsLabeller,
} from './schema';
import type { FormField, SensorLayout } from './schema';
import { editorStyles } from './styles';

interface FormValue<T> {
  readonly value: T;
}

interface PhaseFields {
  readonly name?: string;
  readonly color?: Rgb;
}

interface ViewOption {
  readonly value: ViewMode;
  readonly label: string;
}

const VIEW_OPTIONS: readonly ViewOption[] = [
  { value: 'all', label: 'All phases' },
  { value: 'single', label: 'Single phase' },
  { value: 'balance', label: 'Phase balance' },
];

const VIEW_SENSORS: Readonly<Record<ViewMode, readonly Quantity[]>> = {
  all: ['voltage', 'power'],
  single: ['voltage', 'power'],
  balance: ['current', 'power'],
};

const BALANCE_HINT =
  'Neutral current is estimated as the vector sum of the phase currents, assuming the phases are 120° apart. Imbalance is the largest deviation of a phase current from the average.';

const THRESHOLDS_HINT =
  'Outside normal is a warning; below the min or above the max threshold is critical. On the chart, normal is the green band and thresholds are red dashes.';

const plusIcon: SVGTemplateResult = svg`<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`;

const trashIcon: SVGTemplateResult = svg`<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

const sensorsText = (count: number): string => `${count} sensor${count === 1 ? '' : 's'}`;

const SENSOR_FILTERS: Readonly<Record<Quantity, (entity: HassEntity) => boolean>> = {
  voltage: (entity) => measuresQuantity(entity, 'voltage'),
  power: (entity) => measuresQuantity(entity, 'power'),
  current: (entity) => measuresQuantity(entity, 'current'),
};

const SENSOR_DOMAINS: readonly string[] = ['sensor'];

const colorOf = (phase: PhaseConfig, index: number): string =>
  phase.color && isHexColor(phase.color) ? phase.color : phaseColor(index);

export class PhasePairCardEditor extends LitElement {
  static override properties: PropertyDeclarations = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static override styles = editorStyles;

  declare hass: HomeAssistant | undefined;
  declare _config: PhasePairCardConfig | undefined;

  setConfig(config: PhasePairCardConfig): void {
    this._config = config;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    void loadHaComponents();
  }

  protected override render(): TemplateResult | typeof nothing {
    const config = this._config;

    if (!this.hass || !config) return nothing;

    const view = viewOf(config);

    return html`
      ${this._renderViewSwitch(view)}
      ${this._settingsForm(view === 'balance' ? BALANCE_GENERAL_SCHEMA : GENERAL_SCHEMA)}
      ${this._sections[view](config)}
    `;
  }

  private readonly _sections: Readonly<
    Record<ViewMode, (config: PhasePairCardConfig) => TemplateResult>
  > = {
    all: (config) => this._renderAll(config),
    single: (config) => this._renderSingle(config),
    balance: (config) => this._renderBalance(config),
  };

  private _renderViewSwitch(view: ViewMode): TemplateResult {
    return html`<div class="field">
      <span class="field-label" id="view-label">View</span>
      <div class="view-switch" role="radiogroup" aria-labelledby="view-label">
        ${VIEW_OPTIONS.map(
          (option) =>
            html`<button
              type="button"
              role="radio"
              aria-checked=${option.value === view ? 'true' : 'false'}
              @click=${() => {
                this._setView(option.value);
              }}
            >
              ${option.label}
            </button>`,
        )}
      </div>
    </div>`;
  }

  private _renderAll(config: PhasePairCardConfig): TemplateResult {
    return html`
      ${this._settingsForm(ALL_OPTIONS_SCHEMA)}
      <h3>Phases</h3>
      ${this._renderPhasePanels(config)}
      <button type="button" class="action add" @click=${this._addPhase}>
        ${plusIcon} Add phase
      </button>
    `;
  }

  private _renderBalance(config: PhasePairCardConfig): TemplateResult {
    return html`
      ${this._settingsForm(balanceSchema(this._labels()))}
      <p class="hint">${BALANCE_HINT}</p>
      <h3>Phases</h3>
      ${this._renderPhasePanels(config)}
      <button type="button" class="action add" @click=${this._addPhase}>
        ${plusIcon} Add phase
      </button>
    `;
  }

  private _renderSingle(config: PhasePairCardConfig): TemplateResult {
    const phases = phasesOf(config);

    return html`
      ${
        phases.length === 1
          ? this._renderSinglePhase(phases[0])
          : html`<h3>Phases</h3>
              ${this._renderPhasePanels(config)}`
      }
      <h3>Voltage thresholds</h3>
      ${this._settingsForm(SINGLE_THRESHOLDS_SCHEMA)}
      <p class="hint">${THRESHOLDS_HINT}</p>
      <h3>Chart</h3>
      ${this._settingsForm(CHART_SCHEMA)}
    `;
  }

  private _renderSinglePhase(phase: PhaseConfig): TemplateResult {
    const labels = this._labels();
    const line = phaseAppearance(colorOf(phase, 0), this.hass?.themes?.darkMode ?? false).line;

    return html`
      ${this._phaseForm(phase, 0)}
      <h3>Sensors</h3>
      <div class="side-title" style=${styleMap({ '--ppc-line': line })}>
        <span class="line line-before" aria-hidden="true"></span>${labels.before}
      </div>
      ${this._sensorPickers(phase, 0, 'before', 'grid', VIEW_SENSORS.single)}
      <div class="side-title" style=${styleMap({ '--ppc-line': line })}>
        <span class="line line-after" aria-hidden="true"></span>${labels.after}
      </div>
      ${this._sensorPickers(phase, 0, 'after', 'grid', VIEW_SENSORS.single)}
    `;
  }

  private _renderPhasePanels(config: PhasePairCardConfig): TemplateResult[] {
    const phases = phasesOf(config);

    return phases.map((phase, index) => this._renderPhasePanel(phase, index, phases.length));
  }

  private _renderPhasePanel(phase: PhaseConfig, index: number, total: number): TemplateResult {
    const labels = this._labels();
    const name = phase.name ?? phaseName(index);
    const appearance = phaseAppearance(colorOf(phase, index), false);

    return html`<ha-expansion-panel
      outlined
      class="phase-panel"
      .header=${name}
      .secondary=${sensorsText(sensorCount(phase))}
      .expanded=${index === 0}
    >
      <span
        slot="leading-icon"
        class=${classMap({ badge: true, outlined: appearance.outlined })}
        style=${styleMap({ background: appearance.background, color: appearance.foreground })}
        >${name}</span
      >
      <div class="panel-content">
        ${this._phaseForm(phase, index)}
        ${
          this._config?.view === 'balance'
            ? this._sensorPickers(
                phase,
                index,
                this._config.side ?? DEFAULT_SIDE,
                'stacked',
                VIEW_SENSORS.balance,
              )
            : html`${this._renderSidePanel(phase, index, 'before', labels.before)}
              ${this._renderSidePanel(phase, index, 'after', labels.after)}`
        }
        ${
          total > 1
            ? html`<div class="actions">
                <button
                  type="button"
                  class="action remove"
                  @click=${() => {
                    this._removePhase(index);
                  }}
                >
                  ${trashIcon} Remove phase
                </button>
              </div>`
            : nothing
        }
      </div>
    </ha-expansion-panel>`;
  }

  private _renderSidePanel(
    phase: PhaseConfig,
    index: number,
    side: SideKey,
    label: string,
  ): TemplateResult {
    const entities = phase[side] ?? {};
    const count = [entities.voltage, entities.power].filter(Boolean).length;

    return html`<ha-expansion-panel
      outlined
      class="side-panel"
      .header=${label}
      .secondary=${sensorsText(count)}
      .expanded=${side === 'before'}
    >
      <span slot="leading-icon" class="legend-${side}" aria-hidden="true"></span>
      <div class="side-content">
        ${this._sensorPickers(phase, index, side, 'stacked', VIEW_SENSORS.all)}
      </div>
    </ha-expansion-panel>`;
  }

  private _settingsForm(schema: readonly FormField[]): TemplateResult {
    const config = this._config;

    if (!config) return html``;

    return html`<ha-form
      .hass=${this.hass}
      .data=${toSettingsFields(config)}
      .schema=${schema}
      .computeLabel=${settingsLabeller(this._labels())}
      @value-changed=${this._settingsChanged}
    ></ha-form>`;
  }

  private _phaseForm(phase: PhaseConfig, index: number): TemplateResult {
    const data: PhaseFields = {
      name: phase.name ?? phaseName(index),
      color: hexToRgb(colorOf(phase, index)),
    };

    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${PHASE_SCHEMA}
      .computeLabel=${fieldLabel}
      @value-changed=${(event: CustomEvent<FormValue<PhaseFields>>) => {
        this._phaseChanged(index, event);
      }}
    ></ha-form>`;
  }

  private _sensorPickers(
    phase: PhaseConfig,
    index: number,
    side: SideKey,
    layout: SensorLayout,
    quantities: readonly Quantity[],
  ): TemplateResult {
    const entities = phase[side] ?? {};

    return html`<div class="sensors sensors-${layout}">
      ${quantities.map(
        (quantity) =>
          html`<ha-entity-picker
            .hass=${this.hass}
            .value=${entities[quantity] ?? ''}
            .label=${SENSOR_LABELS[quantity][layout]}
            .helper=${entities[quantity]}
            .includeDomains=${SENSOR_DOMAINS}
            .entityFilter=${SENSOR_FILTERS[quantity]}
            .showEntityId=${true}
            @value-changed=${(event: CustomEvent<FormValue<string | undefined>>) => {
              this._sensorChanged(index, side, quantity, event);
            }}
          ></ha-entity-picker>`,
      )}
    </div>`;
  }

  private _labels(): SideLabels {
    return {
      before: this._config?.before_label ?? DEFAULT_LABELS.before,
      after: this._config?.after_label ?? DEFAULT_LABELS.after,
    };
  }

  private readonly _settingsChanged = (event: CustomEvent<FormValue<SettingsFields>>): void => {
    event.stopPropagation();

    if (!this._config) return;

    this._commit(applySettingsFields(this._config, event.detail.value));
  };

  private _phaseChanged(index: number, event: CustomEvent<FormValue<PhaseFields>>): void {
    event.stopPropagation();

    if (!this._config) return;

    const { name, color } = event.detail.value;

    this._commit(
      updatePhase(this._config, index, {
        name: name ?? '',
        ...(color ? { color: rgbToHex(color) } : {}),
      }),
    );
  }

  private _sensorChanged(
    index: number,
    side: SideKey,
    quantity: Quantity,
    event: CustomEvent<FormValue<string | undefined>>,
  ): void {
    event.stopPropagation();

    if (!this._config) return;

    this._commit(updateSensor(this._config, index, side, quantity, event.detail.value));
  }

  private _setView(view: ViewMode): void {
    if (!this._config) return;

    this._commit(withView(this._config, view));
  }

  private readonly _addPhase = (): void => {
    if (!this._config) return;

    this._commit(addPhase(this._config));
  };

  private _removePhase(index: number): void {
    if (!this._config) return;

    this._commit(removePhase(this._config, index));
  }

  private _commit(config: PhasePairCardConfig): void {
    this._config = config;
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }),
    );
  }
}
