import { PhasePairChart } from './card/phase-chart';
import { PhasePairCard } from './card/phase-pair-card';
import {
  CARD_DESCRIPTION,
  CARD_NAME,
  CARD_TYPE,
  CARD_VERSION,
  CHART_TYPE,
  EDITOR_TYPE,
  REPOSITORY_URL,
} from './const';
import { PhasePairCardEditor } from './editor/phase-pair-card-editor';

const define = (tag: string, element: CustomElementConstructor): void => {
  if (customElements.get(tag)) return;

  customElements.define(tag, element);
};

define(CHART_TYPE, PhasePairChart);
define(EDITOR_TYPE, PhasePairCardEditor);
define(CARD_TYPE, PhasePairCard);

window.customCards ??= [];

if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: CARD_NAME,
    description: CARD_DESCRIPTION,
    preview: true,
    documentationURL: REPOSITORY_URL,
  });
}

console.info(
  `%c PHASE-PAIR-CARD %c v${CARD_VERSION} `,
  'color: #ffffff; background: #d32f2f; font-weight: 700;',
  'color: #d32f2f; background: #ffffff; font-weight: 700;',
);
