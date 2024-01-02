import { safeHtml } from 'common-tags';

export default function field(name, label, { required = false, type = 'text' } = {}) {
  return safeHtml`
    <fieldset class="sa-fieldset">
      <label for="${name}" class="sa-label">
        ${label}
      </label>
      <input class="sa-field" name="${name}" type="${type}" ${required ? 'required' : ''} />
    </fieldset>
  `;
}
