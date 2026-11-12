import { LitElement, html, nothing } from 'lit';
import type { PropertyDeclarations, PropertyValues, TemplateResult } from 'lit';
import { createStubConfig } from '../config/defaults';
import { normalizeConfig } from '../config/validate';
import { EDITOR_TYPE } from '../const';
import { fetchVoltageHistory } from '../ha/history';
import { openMoreInfo } from '../ha/more-info';
import { toFormatLocale } from '../logic/format';
import type { CardSettings, PhasePairCardConfig } from '../types/config';
import type { HomeAssistant, LovelaceGridOptions } from '../types/ha';
import { createSnapshot } from './history-snapshot';
import type { HistorySnapshot } from './history-snapshot';
import { buildPhaseModels, historyEntities, trackedEntities } from './model';
import { cardStyles } from './styles';
import { VIEWS } from './views/registry';

const HOUR = 3_600_000;

const REFRESH_INTERVAL = 5 * 60_000;

const historyKey = (settings: CardSettings): string =>
  JSON.stringify([settings.hoursToShow, historyEntities(settings)]);

const hassChanged = (
  previous: HomeAssistant | undefined,
  current: HomeAssistant | undefined,
  entityIds: readonly string[],
): boolean => {
  if (!previous || !current) return true;
  if (previous.locale !== current.locale) return true;
  if (previous.themes?.darkMode !== current.themes?.darkMode) return true;

  return entityIds.some((entityId) => previous.states[entityId] !== current.states[entityId]);
};

export class PhasePairCard extends LitElement {
  static override properties: PropertyDeclarations = {
    hass: { attribute: false },
    _settings: { state: true },
    _history: { state: true },
  };

  static override styles = cardStyles;

  declare hass: HomeAssistant | undefined;
  declare _settings: CardSettings | undefined;
  declare _history: HistorySnapshot | undefined;

  private _historyKey: string | undefined;

  private _historyRequested = false;

  private _timer: number | undefined;

  static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TYPE);
  }

  static getStubConfig(): PhasePairCardConfig {
    return createStubConfig();
  }

  setConfig(config: PhasePairCardConfig): void {
    const settings = normalizeConfig(config);
    const key = historyKey(settings);

    if (key !== this._historyKey) {
      this._historyKey = key;
      this._history = undefined;
      this._historyRequested = false;
    }

    this._settings = settings;
  }

  getCardSize(): number {
    if (!this._settings) return 3;

    return VIEWS[this._settings.view].cardSize(this._settings);
  }

  getGridOptions(): LovelaceGridOptions {
    return { columns: 12, rows: 'auto', min_columns: 6 };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => {
      void this._loadHistory();
    }, REFRESH_INTERVAL);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
    this._timer = undefined;
    this._historyRequested = false;
  }

  protected override shouldUpdate(changed: PropertyValues<this>): boolean {
    if (!this._settings) return false;
    if (changed.size !== 1 || !changed.has('hass')) return true;

    return hassChanged(changed.get('hass'), this.hass, trackedEntities(this._settings));
  }

  protected override willUpdate(): void {
    if (this._historyRequested || !this.hass || !this._usesHistory()) return;

    this._historyRequested = true;
    void this._loadHistory();
  }

  protected override render(): TemplateResult | typeof nothing {
    const settings = this._settings;
    const hass = this.hass;

    if (!settings || !hass) return nothing;

    const view = VIEWS[settings.view];

    return html`<ha-card>
      ${view.render({
        settings,
        phases: buildPhaseModels(settings, hass),
        locale: toFormatLocale(hass.locale),
        history: this._history,
        openMoreInfo: (entityId) => {
          openMoreInfo(this, entityId);
        },
      })}
    </ha-card>`;
  }

  private _usesHistory(): boolean {
    return this._settings ? VIEWS[this._settings.view].usesHistory : false;
  }

  private async _loadHistory(): Promise<void> {
    const settings = this._settings;
    const hass = this.hass;

    if (!settings || !hass || !this._usesHistory()) return;

    const key = this._historyKey;
    const end = Date.now();
    const start = end - settings.hoursToShow * HOUR;

    try {
      const samples = await fetchVoltageHistory(hass, historyEntities(settings), start, end);

      if (key !== this._historyKey) return;

      this._history = createSnapshot(samples, [start, end]);
    } catch (error) {
      console.warn('phase-pair-card: unable to load voltage history', error);
    }
  }
}
