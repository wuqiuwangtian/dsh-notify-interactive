export const SETTINGS_CSS = String.raw`
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
.dni-settings-headtext { min-width: 0; }
.dni-settings-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; }
.dni-settings-description { margin: 4px 0 0; max-width: 620px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.dni-statusbar { display: flex; flex-wrap: wrap; gap: 8px; }
.dni-section { overflow: hidden; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dni-section-title { margin: 0; padding: 12px 16px 0; color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; line-height: 18px; }
.dni-section-body { display: flex; flex-direction: column; }
.dni-scenarios-master .dni-field { flex-direction: row; align-items: center; }
.dni-scenarios-master .dni-field-control { width: auto; }
.dni-scenarios-wrap { padding: 0 16px 12px; overflow-x: auto; }
.dni-scenarios { width: 100%; border-collapse: collapse; font-size: 13px; }
.dni-scenarios th, .dni-scenarios td { padding: 10px 6px; text-align: left; border-top: 1px solid var(--dsw-alias-border-l1); }
.dni-scenarios thead th { color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 500; }
.dni-scenarios tbody th { font-weight: 500; white-space: nowrap; }
.dni-scenarios .dni-select { min-width: 110px; max-width: 100%; }
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
.dni-btn:focus-visible,
.dni-switch:focus-visible,
.dni-select:focus-visible,
.dni-slider:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .dni-field { flex-direction: column; align-items: flex-start; }
  .dni-field-control { width: 100%; justify-content: flex-start; }
  .dni-slider { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .dni-btn, .dni-switch, .dni-switch-knob { transition: none; }
}
`
