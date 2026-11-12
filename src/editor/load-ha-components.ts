type ConfigurableCard = CustomElementConstructor & {
  getConfigElement?: () => Promise<HTMLElement>;
};

const COMPONENT_SOURCES: Readonly<Record<string, string>> = {
  'ha-form': 'hui-button-card',
  'ha-entity-picker': 'hui-entities-card',
  'ha-expansion-panel': 'hui-tile-card',
};

const loadEditorOf = async (cardTag: string): Promise<void> => {
  const card: ConfigurableCard | undefined = customElements.get(cardTag);

  await card?.getConfigElement?.();
};

export const loadHaComponents = async (): Promise<void> => {
  const cards = Object.entries(COMPONENT_SOURCES)
    .filter(([tag]) => !customElements.get(tag))
    .map(([, cardTag]) => cardTag);

  await Promise.all(cards.map(loadEditorOf));
};
