import { css } from 'lit';

export const cardStyles = css`
  :host {
    --ppc-card: var(--ha-card-background, var(--card-background-color));
    --ppc-surface: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
    --ppc-track: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    --ppc-outline: color-mix(in srgb, var(--primary-text-color) 40%, transparent);
    --ppc-normal: color-mix(in srgb, var(--success-color) 75%, var(--primary-text-color));
    --ppc-warning: color-mix(in srgb, var(--warning-color) 75%, var(--primary-text-color));
    --ppc-critical: color-mix(in srgb, var(--error-color) 75%, var(--primary-text-color));
    --ppc-band: color-mix(in srgb, var(--success-color) 45%, var(--ppc-card));
    display: block;
  }

  ha-card {
    overflow: hidden;
    height: 100%;
    box-sizing: border-box;
  }

  ha-card.bare {
    overflow: visible;
    border: none;
    background: none;
    box-shadow: none;
  }

  .view-all {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    color: var(--primary-text-color);
  }

  .view-single {
    display: flex;
    flex-direction: column;
    gap: 8px;
    container-type: inline-size;
  }

  .view-single .title {
    padding: 4px 4px 0;
  }

  .panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 8px;
  }

  .tone-normal {
    --ppc-tone: var(--ppc-normal);
  }

  .tone-warning {
    --ppc-tone: var(--ppc-warning);
  }

  .tone-critical {
    --ppc-tone: var(--ppc-critical);
  }

  .tone-plain {
    --ppc-tone: var(--primary-text-color);
  }

  .tone-muted {
    --ppc-tone: var(--secondary-text-color);
  }

  .ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--ppc-surface);
  }

  .tile-label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 13px;
    line-height: 18px;
    color: var(--secondary-text-color);
  }

  .legend-before {
    flex: none;
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border: 2.5px solid var(--secondary-text-color);
    border-radius: 50%;
  }

  .legend-after {
    flex: none;
    width: 8px;
    height: 8px;
    margin: 2px;
    border-radius: 50%;
    background: var(--secondary-text-color);
  }

  .tile-imbalance {
    font-size: 13px;
    line-height: 22px;
    color: var(--secondary-text-color);
  }

  .tile-value {
    font-size: 16px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .badge {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .badge.outlined {
    box-shadow: inset 0 0 0 1px var(--ppc-outline);
  }

  .badge-regular {
    width: 40px;
    height: 28px;
    border-radius: 8px;
    font-size: 13px;
  }

  .badge-small {
    width: 34px;
    height: 24px;
    border-radius: 7px;
    font-size: 12px;
  }

  .row-body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .row-values {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 8px;
  }

  .pair {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .value {
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: none;
    font-family: inherit;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--ppc-tone, var(--primary-text-color));
    cursor: pointer;
  }

  .value:hover:not(:disabled) {
    background: var(--ppc-surface);
  }

  .value:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .value.issue {
    color: var(--secondary-text-color);
  }

  .value:disabled {
    cursor: default;
  }

  .value.issue-missing,
  .value.issue-unset {
    text-decoration: underline dotted;
  }

  .voltage {
    font-size: 20px;
    line-height: 28px;
    font-weight: 500;
  }

  .unit {
    margin-left: 3px;
    font-size: 13px;
    font-weight: 400;
  }

  .arrow {
    color: var(--disabled-text-color);
  }

  .arrow-large {
    font-size: 16px;
  }

  .pill {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--ppc-surface);
    font-size: 13px;
    line-height: 18px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
  }

  .pill-small {
    padding: 0 7px;
    font-size: 11px;
    line-height: 16px;
  }

  .scale {
    position: relative;
    height: 16px;
  }

  .scale > span {
    position: absolute;
  }

  .scale-track {
    top: 5px;
    left: 0;
    right: 0;
    height: 6px;
    border-radius: 3px;
    background: var(--ppc-track);
  }

  .scale-band {
    top: 5px;
    height: 6px;
    border-radius: 3px;
    background: var(--ppc-band);
  }

  .scale-nominal {
    top: 2px;
    width: 2px;
    height: 12px;
    margin-left: -1px;
    border-radius: 1px;
    background: var(--secondary-text-color);
  }

  .marker-before {
    top: 1px;
    width: 14px;
    height: 14px;
    margin-left: -7px;
    box-sizing: border-box;
    border: 2.5px solid var(--ppc-tone);
    border-radius: 50%;
    background: var(--ppc-card);
  }

  .marker-after {
    top: 4px;
    width: 8px;
    height: 8px;
    margin-left: -4px;
    border-radius: 50%;
    background: var(--ppc-tone);
    box-shadow: 0 0 0 2px var(--ppc-card);
  }

  .power {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 13px;
    line-height: 18px;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }

  .icon {
    flex: none;
  }

  .power-value {
    font-size: inherit;
    line-height: inherit;
  }

  .power-value .unit {
    font-size: inherit;
  }

  .panel {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    container-type: inline-size;
    overflow: hidden;
    box-sizing: border-box;
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color));
    border-radius: var(--ha-card-border-radius, 12px);
    background: var(--ppc-card);
    box-shadow: var(--ha-card-box-shadow, none);
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 12px 8px;
  }

  .panel-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .head-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .voltage-large {
    font-size: 28px;
    line-height: 32px;
    font-weight: 300;
    color: var(--primary-text-color);
  }

  .voltage-large .unit {
    font-size: 15px;
    color: var(--secondary-text-color);
  }

  .status-pill {
    flex: none;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px 2px 6px;
    border-radius: 999px;
    background: var(--ppc-surface);
    font-size: 11px;
    line-height: 16px;
    color: var(--primary-text-color);
  }

  .dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ppc-tone);
  }

  .head-side {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    margin-left: auto;
  }

  .before-value {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    line-height: 18px;
    color: var(--secondary-text-color);
  }

  .panel-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 8px;
    font-size: 12px;
    line-height: 18px;
    color: var(--secondary-text-color);
  }

  .view-single .power {
    font-size: 12px;
  }

  .view-single .power-before {
    color: var(--secondary-text-color);
  }

  .view-single .power-after {
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .view-single .power-value.issue {
    color: var(--secondary-text-color);
  }

  .legend {
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    font-size: 11px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .legend-line {
    width: 12px;
    border-radius: 2px;
    background: var(--ppc-line);
  }

  .legend-line-before {
    height: 2px;
    opacity: 0.45;
  }

  .legend-line-after {
    height: 3px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    font-variant-numeric: tabular-nums;
  }

  .stat {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .stat:nth-child(2) {
    align-items: center;
  }

  .stat:nth-child(3) {
    align-items: flex-end;
  }

  .stat-label {
    font-size: 11px;
    line-height: 16px;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }

  .stat-name {
    font-weight: 500;
  }

  .stat-value {
    font-size: 13px;
    line-height: 18px;
    white-space: nowrap;
  }

  .stat-value > span:first-child {
    color: var(--ppc-tone);
  }

  .stat-before {
    margin-left: 5px;
    font-size: 11px;
    color: var(--secondary-text-color);
  }

  @container (min-width: 608px) and (max-width: 915.98px) {
    .panel:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }

  @container (max-width: 349.98px) {
    .panel-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .head-side {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      margin-left: 0;
    }

    .voltage-large {
      font-size: 24px;
      line-height: 28px;
    }

    .panel-meta {
      flex-direction: column;
      align-items: flex-start;
    }

    .legend {
      margin-left: 0;
    }
  }

  @media (max-width: 420px) {
    .view-all {
      padding: 12px;
    }

    .row {
      gap: 10px;
    }
  }
`;
