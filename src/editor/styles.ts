import { css } from 'lit';

export const editorStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h3 {
    margin: 8px 0 0;
    font-size: 15px;
    line-height: 20px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 12px;
    line-height: 16px;
    color: var(--secondary-text-color);
  }

  .view-switch {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 3px;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
  }

  .view-switch button {
    height: 38px;
    border: 0;
    border-radius: 8px;
    background: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    cursor: pointer;
  }

  .view-switch button[aria-checked='true'] {
    background: color-mix(in srgb, var(--primary-color) 14%, transparent);
    color: var(--primary-color);
  }

  .view-switch button:focus-visible,
  .action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .phase-panel,
  .side-panel {
    display: block;
  }

  .side-panel {
    --ha-card-border-radius: 10px;
    background: color-mix(in srgb, var(--primary-text-color) 3%, transparent);
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 0 8px;
  }

  .side-content {
    padding: 0 0 8px;
  }

  .badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 22px;
    margin-right: 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
  }

  .badge.outlined {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 40%, transparent);
  }

  .legend-before {
    flex: none;
    width: 12px;
    height: 12px;
    margin-right: 10px;
    box-sizing: border-box;
    border: 2.5px solid var(--secondary-text-color);
    border-radius: 50%;
  }

  .legend-after {
    flex: none;
    width: 8px;
    height: 8px;
    margin: 2px 12px 2px 2px;
    border-radius: 50%;
    background: var(--secondary-text-color);
  }

  .side-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 18px;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .line {
    width: 14px;
    border-radius: 2px;
    background: var(--ppc-line);
  }

  .line-before {
    height: 2px;
    opacity: 0.45;
  }

  .line-after {
    height: 3px;
  }

  .hint {
    margin: -4px 0 0;
    font-size: 12px;
    line-height: 16px;
    color: var(--secondary-text-color);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
  }

  .remove {
    height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    font-size: 14px;
    color: var(--error-color);
  }

  .add {
    height: 44px;
    padding: 0 16px;
    border: 1px solid var(--primary-color);
    border-radius: 10px;
    background: none;
    font-size: 15px;
    color: var(--primary-color);
  }
`;
