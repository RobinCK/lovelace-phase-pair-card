export const openMoreInfo = (node: HTMLElement, entityId: string): void => {
  node.dispatchEvent(
    new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }),
  );
};
