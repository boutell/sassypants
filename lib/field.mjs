import { template, html } from './strings.mjs';

export const input = template(({ name, label, required = false, type = 'text' } = {}) => {
  if (!name) {
    throw new Error('input invoked with no name');
  }
  if (!label) {
    throw new Error('input invoked with no label');
  }
  return html`
    <fieldset class="sa-fieldset">
      <label for="${name}" class="sa-label">
        ${label}
      </label>
      <input class="sa-field" name="${name}" type="${type}" ${required ? 'required' : ''} />
    </fieldset>
  `;
});

