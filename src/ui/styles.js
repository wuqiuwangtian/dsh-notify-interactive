/**
 * Minimal shared stylesheet for the settings page and the interactive popup.
 * Only DSH theme tokens are used; the popup copies their resolved values from
 * the main document before mounting.
 */

export const POPUP_CSS = String.raw`
.dni-card {
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.dni-card-head { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px 8px; }
.dni-card-headtext { flex: 1; min-width: 0; }
.dni-card-titleline { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dni-card-title { font-size: 14px; font-weight: 600; line-height: 20px; }
.dni-demo {
  padding: 1px 5px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font-size: 10px;
  line-height: 14px;
}
.dni-card-subtitle {
  margin-top: 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.dni-card-session { margin-top: 2px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); font-size: 11px; }
.dni-session-link {
  display: inline-block;
  margin-top: 3px;
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.dni-session-link:hover { color: var(--dsw-alias-brand-primary); text-decoration: underline; }
.dni-card-body { padding: 0 14px 4px; }
.dni-card-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 8px 14px 12px; }
.dni-card-actions-row { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex: 1; }
.dni-card-actions-wrap { flex-wrap: wrap; }
.dni-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.dni-btn:disabled { opacity: 0.5; cursor: default; }
.dni-btn-sm { padding: 6px 10px; border-radius: 7px; font-size: 12px; }
.dni-btn-primary {
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-label-primary));
}
.dni-btn-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-brand-primary));
}
.dni-btn-outline {
  background: transparent;
  border-color: var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  color: var(--dsw-alias-label-primary);
}
.dni-btn-outline:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); }
.dni-btn-ghost { background: transparent; color: var(--dsw-alias-label-secondary); }
.dni-btn-ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); }
.dni-btn-danger {
  background: transparent;
  border-color: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-state-error-primary);
}
.dni-btn-danger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-danger, transparent); }
.dni-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.dni-badge-success {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.dni-badge-warn {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.dni-badge-danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dni-question-body { display: flex; flex-direction: column; gap: 12px; max-height: 44vh; overflow-y: auto; }
.dni-question { display: flex; flex-direction: column; gap: 6px; }
.dni-question-header { color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); font-size: 11px; line-height: 16px; }
.dni-question-text { font-size: 13px; font-weight: 500; line-height: 20px; overflow-wrap: anywhere; }
.dni-question-multi { color: var(--dsw-alias-label-secondary); font-weight: 400; font-size: 11px; }
.dni-question-detail { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; white-space: pre-wrap; overflow-wrap: anywhere; }
.dni-options { display: flex; flex-direction: column; gap: 6px; }
.dni-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.dni-option:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dni-option.is-selected {
  border-color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
}
.dni-option-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 4px;
  font-size: 10px;
  line-height: 1;
}
.dni-option.is-selected .dni-option-mark {
  border-color: transparent;
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base));
}
.dni-option-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dni-option-label { font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.dni-option-description { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 16px; overflow-wrap: anywhere; }
.dni-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
}
.dni-input:focus {
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, transparent);
  outline-offset: 1px;
  border-color: var(--dsw-alias-brand-primary);
}
.dni-question-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.dni-question-skipped { color: var(--dsw-alias-label-secondary); font-size: 11px; }
.dni-link-button {
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dni-link-button:hover:not(:disabled) { color: var(--dsw-alias-brand-primary); text-decoration: underline; }
.dni-link-button:disabled { opacity: 0.55; cursor: default; }
.dni-countdown { margin-right: auto; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.dni-plan {
  margin: 0;
  padding: 10px 12px;
  max-height: 36vh;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-family: var(--ds-font-family-code, ui-monospace, monospace);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
.dni-error {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
}
.dni-success {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
  font-size: 12px;
  line-height: 18px;
}
.dni-warning {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary);
  font-size: 12px;
  line-height: 18px;
}
.dni-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.dni-settings { display: flex; flex-direction: column; gap: 16px; max-width: 760px; padding: 4px 0 40px; color: var(--dsw-alias-label-primary); }
.dni-settings-head { display: flex; align-items: flex-start; gap: 12px; }
.dni-settings-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-settings-headtext { min-width: 0; }
.dni-settings-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; }
.dni-settings-description { margin: 4px 0 0; max-width: 620px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.dni-statusbar { display: flex; flex-wrap: wrap; gap: 8px; }
.dni-section { overflow: hidden; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dni-section-title { margin: 0; padding: 12px 16px 0; color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; line-height: 18px; }
.dni-section-body { display: flex; flex-direction: column; }
.dni-field { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; border-top: 1px solid var(--dsw-alias-border-l1); }
.dni-section-title + .dni-section-body .dni-field:first-child { border-top: none; }
.dni-field-text { min-width: 0; }
.dni-field-label { font-size: 13px; font-weight: 500; line-height: 20px; }
.dni-field-hint { margin-top: 2px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); font-size: 12px; line-height: 18px; }
.dni-field-control { display: flex; align-items: center; gap: 8px; flex: none; }
.dni-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dni-switch { position: relative; width: 40px; height: 22px; padding: 0; border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1)); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); cursor: pointer; flex: none; }
.dni-switch.is-on { border-color: transparent; background: var(--dsw-alias-brand-primary); }
.dni-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-secondary); transition: transform 140ms ease; }
.dni-switch.is-on .dni-switch-knob { transform: translateX(18px); background: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base)); }
.dni-select { padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1)); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
.dni-slider { width: 140px; accent-color: var(--dsw-alias-brand-primary); }
.dni-test-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px 0; }
.dni-section-body > .dni-hint { padding: 8px 16px 12px; }
.dni-settings .dni-section-body > .dni-inline { padding: 12px 16px; }
.dni-settings .dni-section-body > .dni-inline + .dni-hint { padding-top: 0; }
.dni-settings .dni-section-body > .dni-field + .dni-hint { padding: 0 16px 12px; }
.dni-popup-body { margin: 0; height: 100%; overflow: hidden; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-family: var(--ds-font-family, inherit); font-size: 13px; }
.dni-popup-root { height: 100%; }
.dni-popup { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
.dni-popup-list { display: flex; flex: 1; flex-direction: column; gap: 8px; overflow-y: auto; padding: 8px; scrollbar-width: thin; }
.dni-empty { margin: auto; padding: 24px 12px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; text-align: center; }
.dni-btn:focus-visible,
.dni-switch:focus-visible,
.dni-option:focus-visible,
.dni-input:focus-visible,
.dni-link-button:focus-visible,
.dni-select:focus-visible,
.dni-slider:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .dni-field { flex-direction: column; align-items: flex-start; }
  .dni-field-control { width: 100%; justify-content: flex-start; }
  .dni-slider { width: 100%; }
  .dni-question-body { max-height: 40vh; }
}
@media (prefers-reduced-motion: reduce) {
  .dni-btn, .dni-option, .dni-switch, .dni-switch-knob { transition: none; }
}
`
