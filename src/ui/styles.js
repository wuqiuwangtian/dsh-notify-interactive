/**
 * One stylesheet for both the DSH page overlay and the detached popup.
 * Colors and surfaces use live DSH theme tokens; the popup copies the resolved
 * values from the main document before it mounts.
 */

export const POPUP_CSS = String.raw`
.dni-overlay {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  pointer-events: none;
  font-family: var(--ds-font-family, inherit);
  color: var(--dsw-alias-label-primary);
  scrollbar-width: thin;
}
.dni-overlay > * { pointer-events: auto; }
.dni-card-list { display: flex; flex-direction: column; gap: 10px; }
.dni-card {
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));
  box-shadow: var(--dsw-shadow-lv2, 0 12px 40px rgba(0, 0, 0, 0.24));
  color: var(--dsw-alias-label-primary);
}
.dni-card-warn { border-color: var(--dsw-alias-state-warn-secondary, var(--dsw-alias-state-warn-primary)); }
.dni-card-success { border-color: var(--dsw-alias-state-success-primary); }
.dni-card-info { border-color: var(--dsw-alias-border-l1); }
.dni-card-head { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px 10px; }
.dni-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-card-warn .dni-card-icon {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.dni-card-success .dni-card-icon {
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.dni-card-headtext { flex: 1; min-width: 0; }
.dni-card-titleline { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dni-card-title { font-size: 14px; font-weight: 600; line-height: 20px; }
.dni-card-subtitle {
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.dni-card-session {
  margin-top: 2px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
}
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
.dni-card-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 10px 14px 14px; }
.dni-card-actions-row { display: flex; gap: 8px; align-items: center; justify-content: flex-end; flex: 1; }
.dni-card-actions-wrap { flex-wrap: wrap; }
.dni-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.dni-btn:disabled { opacity: 0.5; cursor: default; }
.dni-btn-sm { padding: 6px 10px; font-size: 12px; border-radius: 8px; }
.dni-btn-md { padding: 8px 12px; font-size: 13px; }
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
.dni-btn-ghost:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-label-primary);
}
.dni-btn-danger {
  background: transparent;
  border-color: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-state-error-primary);
}
.dni-btn-danger:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-danger, transparent);
}
.dni-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dni-icon-button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
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
.dni-badge-neutral { }
.dni-badge-warn {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.dni-badge-info {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-badge-success {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.dni-badge-danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dni-more {
  align-self: flex-end;
  padding: 4px 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
}
.dni-overlay-foot { display: flex; justify-content: flex-end; pointer-events: auto; }
.dni-question-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 44vh;
  overflow-y: auto;
  padding: 0 14px 4px;
}
.dni-question { display: flex; flex-direction: column; gap: 6px; }
.dni-question-header {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
}
.dni-question-text { font-size: 13px; font-weight: 500; line-height: 20px; overflow-wrap: anywhere; }
.dni-question-detail {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.dni-question-hint { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dni-options { display: flex; flex-direction: column; gap: 6px; }
.dni-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
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
.dni-option-description {
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.dni-custom-row { display: flex; flex-direction: column; gap: 4px; }
.dni-custom-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dni-custom-row.is-active .dni-custom-label { color: var(--dsw-alias-brand-primary); }
.dni-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 9px;
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
.dni-question-skipped { font-size: 11px; color: var(--dsw-alias-label-secondary); }
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
.dni-countdown { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-right: auto; }
.dni-plan {
  margin: 0;
  padding: 10px 12px;
  max-height: 36vh;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-family: var(--ds-font-family-code, ui-monospace, monospace);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
.dni-error {
  margin: 0 14px 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
}
.dni-success {
  margin: 0 14px 12px;
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
.dni-hint { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.dni-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
  padding: 4px 0 40px;
  color: var(--dsw-alias-label-primary);
}
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
.dni-settings-description {
  margin: 4px 0 0;
  max-width: 620px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.dni-statusbar { display: flex; flex-wrap: wrap; gap: 8px; }
.dni-section {
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1);
}
.dni-section-title {
  margin: 0;
  padding: 12px 16px 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}
.dni-section-body { display: flex; flex-direction: column; }
.dni-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dni-section-title + .dni-section-body .dni-field:first-child { border-top: none; }
.dni-field-text { min-width: 0; }
.dni-field-label { font-size: 13px; font-weight: 500; line-height: 20px; }
.dni-field-hint {
  margin-top: 2px;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font-size: 12px;
  line-height: 18px;
}
.dni-field-control { display: flex; align-items: center; gap: 8px; flex: none; }
.dni-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dni-value { min-width: 30px; color: var(--dsw-alias-label-secondary); font-size: 12px; text-align: right; }
.dni-switch {
  position: relative;
  width: 40px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease;
  flex: none;
}
.dni-switch.is-on { border-color: transparent; background: var(--dsw-alias-brand-primary); }
.dni-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
  transition: transform 140ms ease, background-color 140ms ease;
}
.dni-switch.is-on .dni-switch-knob {
  transform: translateX(18px);
  background: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base));
}
.dni-select {
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
}
.dni-slider { width: 140px; accent-color: var(--dsw-alias-brand-primary); }
.dni-test-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px 0; }
.dni-section-body > .dni-hint { padding: 8px 16px 12px; }
.dni-settings .dni-section-body > .dni-inline { padding: 12px 16px; }
.dni-settings .dni-section-body > .dni-inline + .dni-hint { padding-top: 0; }
.dni-divider { height: 1px; background: var(--dsw-alias-border-l1); }
.dni-popup-body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: var(--ds-font-family, inherit);
  font-size: 13px;
}
.dni-popup-root { height: 100%; }
.dni-popup { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
.dni-popup-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dni-popup-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-popup-headtext { flex: 1; min-width: 0; }
.dni-popup-title { font-size: 14px; font-weight: 600; line-height: 20px; }
.dni-popup-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
}
.dni-popup-backend { color: var(--dsw-alias-brand-primary); }
.dni-popup-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 14px;
  scrollbar-width: thin;
}
.dni-popup-list .dni-card { box-shadow: none; }
.dni-popup-foot {
  padding: 10px 14px;
  border-top: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font-size: 11px;
  line-height: 16px;
}
.dni-empty { margin: auto; padding: 24px 12px; text-align: center; }
.dni-empty-title { font-size: 14px; font-weight: 500; }
.dni-empty-hint {
  margin-top: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.dni-btn:focus-visible,
.dni-switch:focus-visible,
.dni-option:focus-visible,
.dni-input:focus-visible,
.dni-link-button:focus-visible,
.dni-icon-button:focus-visible,
.dni-select:focus-visible,
.dni-slider:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .dni-overlay { right: 10px; left: 10px; bottom: 10px; width: auto; }
  .dni-field { flex-direction: column; align-items: flex-start; }
  .dni-field-control { width: 100%; justify-content: flex-start; }
  .dni-slider { width: 100%; }
  .dni-question-body { max-height: 40vh; }
}
@media (prefers-reduced-motion: reduce) {
  .dni-btn, .dni-option, .dni-switch, .dni-switch-knob { transition: none; }
}
`
