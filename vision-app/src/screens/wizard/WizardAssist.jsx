import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../components/Icon.jsx';
import { extractWizardAccountFromContract } from '@backend/assistant.js';

const MAX_CONTRACT_BYTES = 20 * 1024 * 1024;

/** Fields the assistant can fill on wizard Step 1 (Account Information). */
export const WIZARD_CHAT_FIELDS = [
  {
    key: 'accountName',
    label: 'Account Name',
    required: true,
    question: 'What is the account name?',
    placeholder: 'Type the account name…',
    hint: 'Type just the value — no need to restate the question.',
  },
  {
    key: 'uid',
    label: 'Service Provider UID',
    required: true,
    question: 'What is the Service Provider UID?',
    placeholder: 'Type the UID…',
    hint: 'Type just the UID value.',
  },
  {
    key: 'phone',
    label: 'Phone',
    required: true,
    question: 'What phone number should we use?',
    placeholder: 'Type the phone number…',
    hint: 'Type just the number.',
  },
  {
    key: 'supportEmail',
    label: 'Support Email',
    required: false,
    question: 'What is the support email?',
    placeholder: 'Type the email…',
  },
  {
    key: 'website',
    label: 'Website',
    required: false,
    question: 'What is the website?',
    placeholder: 'Type the website…',
  },
  {
    key: 'industry',
    label: 'Industry',
    required: false,
    question: 'Which industry fits this account?',
    placeholder: 'Type the industry…',
  },
];

export function getMissingWizardFields(f) {
  return WIZARD_CHAT_FIELDS.filter((field) => {
    if (!field.required) return false;
    const v = f[field.key];
    if (field.key === 'accountName') return !v || String(v).trim().length <= 2;
    if (field.key === 'uid') return !v || String(v).trim().length < 3;
    return v === null || v === undefined || String(v).trim() === '';
  });
}

/** Options are always the missing field labels. */
export function missingFieldOptions(missingFields = []) {
  return missingFields.map((f) => f.label);
}

/**
 * Ask for a focused missing field. Options = remaining missing fields (to switch).
 */
export function buildFieldQuestion(field, { intro, missingFields = [] } = {}) {
  const options = missingFieldOptions(missingFields);
  if (!field) {
    return {
      text: intro || 'Pick a field below, then type just the value.',
      options,
    };
  }
  // Keep chat copy short — question lives in the header too.
  return {
    text: intro ? `${intro}\n${field.question}` : field.question || `What is the **${field.label}**?`,
    options,
  };
}

function normalizeWizardValue(key, raw) {
  let value = String(raw).trim().replace(/[.,;]+$/, '');
  if (key === 'uid') value = value.toUpperCase().replace(/\s+/g, '').slice(0, 10);
  if (key === 'phone') value = value.replace(/\s{2,}/g, ' ').trim();
  if (key === 'supportEmail') value = value.toLowerCase();
  return value;
}

function matchMissingField(text, missingFields) {
  const t = text.trim().toLowerCase();
  return missingFields.find(
    (f) => f.label.toLowerCase() === t || f.key.toLowerCase() === t || `now: ${f.label}`.toLowerCase() === t
  );
}

/** Contract → wizard account fields. Backed by @backend (demo local / API upload). */
export async function extractContractFile(file) {
  return extractWizardAccountFromContract(file);
}

/** @deprecated use extractContractFile */
export function mockExtractContract(fileName) {
  const blob = new Blob([`Company: ${fileName}`], { type: 'text/plain' });
  const file = new File([blob], fileName || 'contract.txt', { type: 'text/plain' });
  return extractContractFile(file);
}

/**
 * @param {string} text
 * @param {object[]} missingFields
 * @param {string|null} focusedKey - field currently being answered
 */
export function mockParseWizardChat(text, missingFields, focusedKey = null) {
  return new Promise((resolve) => {
      const t = text.trim();
      const options = missingFieldOptions(missingFields);

      if (!t) {
        resolve({ field: null, value: null, selectField: null, reply: 'Please enter a value.', options });
        return;
      }

      if (!missingFields.length) {
        resolve({
          field: null,
          value: null,
          selectField: null,
          reply: 'All mandatory account fields look complete. Continue with Next when you are ready.',
          options: [],
        });
        return;
      }

      // Clicking/typing a missing field label → switch focus (not a value).
      const picked = matchMissingField(t, missingFields);
      if (picked) {
        resolve({
          field: null,
          value: null,
          selectField: picked.key,
          reply: picked.question,
          options,
        });
        return;
      }

      const active =
        missingFields.find((f) => f.key === focusedKey) || missingFields[0];
      const stripped =
        t.match(
          new RegExp(
            `^(?:the\\s+)?(?:${active.label.replace(/\s+/g, '\\s+')}|${active.key})\\s*(?:is|:)?\\s*(.+)$`,
            'i'
          )
        )?.[1] || t;
      const value = normalizeWizardValue(active.key, stripped);
      const next = missingFields.filter((f) => f.key !== active.key);
      resolve({
        field: active.key,
        value,
        selectField: null,
        reply: next[0]
          ? `Saved **${active.label}**. Next: ${next[0].question}`
          : `Saved **${active.label}**. All required fields are filled.`,
        options: missingFieldOptions(next),
      });
  });
}

export function validateContractFile(file) {
  if (!file) return 'Choose a PDF or TXT contract.';
  const validType =
    file.type === 'application/pdf' ||
    file.type === 'text/plain' ||
    /\.(pdf|txt)$/i.test(file.name);
  if (!validType) return 'Upload a PDF or TXT contract.';
  if (file.size > MAX_CONTRACT_BYTES) return 'The contract must be 20 MB or smaller.';
  return '';
}

function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Confirm selected file before ingest. Change file / Cancel / Confirm & ingest.
 */
export function FileConfirm({ file, onConfirm, onChangeFile, onCancel, busy = false }) {
  const inputRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const ext = (file?.name?.split('.').pop() || 'file').toUpperCase();

  const accept = (next) => {
    if (!next || busy) return;
    const error = validateContractFile(next);
    setFileError(error);
    if (error) return;
    onChangeFile(next);
  };

  if (!file) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-8 scroll-thin">
      <div className="mx-auto w-full max-w-lg animate-fade-up">
        <p className="type-overline">Confirm upload</p>
        <h2 className="font-display mt-2 text-title-lg text-ink">Review your file</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Confirm this contract before we extract data. You can change the file or cancel.
        </p>
        <div className="hairline-rule mt-5 animate-rule-draw" />

        <div className="mt-6 border border-line bg-surface p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-line bg-elevated font-display text-xs font-semibold text-ink">
              {ext}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink" title={file.name}>
                {file.name}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="type-overline !normal-case !tracking-normal">Size</dt>
                  <dd className="mono mt-0.5 text-ink-soft">{formatBytes(file.size)}</dd>
                </div>
                <div>
                  <dt className="type-overline !normal-case !tracking-normal">Type</dt>
                  <dd className="mt-0.5 text-ink-soft">{file.type || `${ext} document`}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="type-overline !normal-case !tracking-normal">Last modified</dt>
                  <dd className="mt-0.5 text-ink-soft">
                    {file.lastModified
                      ? new Date(file.lastModified).toLocaleString()
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {fileError && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {fileError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="text-sm font-medium text-ink-muted interactive hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="btn-secondary"
            >
              <Icon name="download" size={15} /> Change file
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="btn-primary"
            >
              {busy ? (
                <>
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                  Starting…
                </>
              ) : (
                <>
                  Confirm &amp; ingest
                  <Icon name="arrowRight" size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EntryChoice({
  onSelectFile,
  onManual,
  extracting,
  fileName,
  onCancelExtraction,
  extractionError = '',
  onRetry,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef(null);

  const accept = (file) => {
    if (!file || extracting) return;
    const error = validateContractFile(file);
    setFileError(error);
    if (error) return;
    onSelectFile(file);
  };

  if (extracting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10">
        {extractionError ? (
          <>
            <Icon name="alert" size={28} className="text-danger" />
            <p className="mt-4 text-sm font-semibold text-ink">Contract extraction failed</p>
            <p className="mt-1 max-w-md text-center text-xs text-danger" role="alert">
              {extractionError}
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onCancelExtraction} className="btn-secondary">
                Choose another file
              </button>
              <button type="button" onClick={onRetry} className="btn-primary">
                Retry extraction
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
            <p className="mt-4 text-sm font-semibold text-ink" role="status">Ingesting contract…</p>
            <p className="mt-1 text-xs text-ink-muted">
              Extracting account fields from <span className="font-medium">{fileName}</span>
            </p>
            {onCancelExtraction && (
              <button type="button" onClick={onCancelExtraction} className="mt-5 text-sm font-medium text-ink-muted hover:text-ink">
                Cancel extraction
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 scroll-thin">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <p className="type-overline">New service provider</p>
          <h2 className="font-display mt-2 text-title-lg text-ink">Start onboarding</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            Upload a service contract for AI extraction, or enter details manually. Both options are
            available here.
          </p>
        </div>

        {/* Upload path */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload contract. PDF or TXT, maximum 20 megabytes"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-panel border-2 border-dashed px-6 py-12 sm:py-14 interactive ${
            dragOver
              ? 'border-brand bg-brand-soft'
              : 'border-line-strong bg-elevated hover:border-brand hover:bg-surface'
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-control bg-brand-soft text-brand">
            <Icon name="download" size={24} />
          </span>
          <p className="mt-4 text-base font-semibold text-ink">Upload contract</p>
          <p className="mt-1 text-sm text-ink-muted">
            Drop a PDF or TXT here, or click to browse — AI fills Account Information
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => accept(e.target.files?.[0])}
          />
        </div>
        {fileError && (
          <p className="mt-3 text-center text-sm text-danger" role="alert">
            {fileError}
          </p>
        )}

        <div className="type-overline my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          or
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Manual path */}
        <button
          onClick={onManual}
          className="group flex w-full items-center gap-4 rounded-panel border border-line bg-surface px-5 py-4 text-left interactive hover:border-line-strong hover:bg-elevated"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-elevated text-ink-muted group-hover:border-ink group-hover:bg-ink group-hover:text-white">
            <Icon name="edit" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-ink">Fill manually</span>
            <span className="block text-sm text-ink-muted">
              Skip upload and walk through all 8 onboarding steps yourself
            </span>
          </span>
          <Icon name="chevronRight" size={18} className="shrink-0 text-ink-faint" />
        </button>
      </div>
    </div>
  );
}

export function ContractUpload({ onFile, onBack, extracting, fileName }) {
  // Kept for compatibility — entry screen now embeds upload directly.
  return (
    <EntryChoice
      onSelectFile={onFile}
      onManual={onBack}
      extracting={extracting}
      fileName={fileName}
    />
  );
}

function RichText({ text, light = false }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className={light ? 'text-white' : 'text-ink'}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * Calm AI assistant — one focus at a time; missing fields as compact chips.
 * @param {'rail'|'card'} variant - rail for wizard sidebar, card for page embed
 */
export function WizardChatbot({
  missingFields,
  messages,
  onSend,
  onClose,
  busy,
  focusedKey = null,
  variant = 'rail',
  totalRequired = null,
}) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const active =
    missingFields.find((f) => f.key === focusedKey) || missingFields[0] || null;
  const remaining = missingFields.length;
  const total = totalRequired ?? Math.max(remaining, 1);
  const doneCount = Math.max(0, total - remaining);
  const complete = remaining === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy || !active) return;
    setDraft('');
    onSend(text);
  };

  const pickField = (label) => {
    if (busy) return;
    setDraft('');
    onSend(label);
  };

  const shell =
    variant === 'rail'
      ? 'flex h-full min-h-0 w-full shrink-0 flex-col border-l border-line bg-surface md:w-[19.5rem]'
      : 'flex h-full min-h-[420px] flex-col overflow-hidden rounded-panel border border-line bg-surface';

  return (
    <aside className={shell} aria-label="AI Assistant">
      {/* Slim header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="font-display text-title-sm text-ink">Assistant</h3>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {complete
              ? 'All set — review the form'
              : active
                ? active.question
                : 'Choose a field to fill'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`mono rounded-control px-2 py-1 text-[11px] font-semibold tabular-nums ${
              complete ? 'bg-success-soft text-success' : 'bg-elevated text-ink-soft'
            }`}
          >
            {complete ? 'Done' : `${doneCount}/${total}`}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-control p-1.5 text-ink-faint interactive hover:bg-elevated hover:text-ink"
              aria-label="Close assistant and edit form"
              title="Edit form manually"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Transcript — primary surface */}
      <div
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 scroll-thin"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && !complete && (
          <p className="my-auto px-1 text-center text-sm leading-relaxed text-ink-muted">
            Pick a field below, then type just the value.
          </p>
        )}

        {complete && messages.length === 0 && (
          <div className="my-auto flex flex-col items-center px-2 text-center">
            <Icon name="checkCircle" size={22} className="text-success" />
            <p className="mt-2 text-sm font-medium text-ink">Required fields complete</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`assistant-msg-enter flex ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[90%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'rounded-panel rounded-br-sm bg-ink text-white'
                  : 'rounded-panel rounded-bl-sm bg-elevated text-ink'
              }`}
            >
              <RichText text={m.text} light={m.role === 'user'} />
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start" role="status" aria-label="Assistant is responding">
            <div className="rounded-panel bg-elevated px-3 py-2.5">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Options + composer */}
      <div className="border-t border-line px-3 py-3">
        {remaining > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {missingFields.map((f) => {
              const isActive = active?.key === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  disabled={busy}
                  onClick={() => pickField(f.label)}
                  className={`rounded-control border px-2.5 py-1 text-xs font-medium interactive disabled:opacity-50 ${
                    isActive
                      ? 'border-brand/30 bg-brand-soft text-brand-ink'
                      : 'border-line bg-elevated/60 text-ink-muted hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                complete
                  ? 'Nothing left to fill'
                  : active
                    ? active.placeholder || `Enter ${active.label.toLowerCase()}…`
                    : 'Select a field first…'
              }
              disabled={busy || !active}
              className="field-input min-h-0 min-w-0 flex-1 !py-2 text-sm"
              aria-label={active ? `Value for ${active.label}` : 'Assistant reply'}
            />
            <button
              type="submit"
              disabled={busy || !draft.trim() || !active}
              className="btn-primary h-10 shrink-0 px-3"
              aria-label="Send answer"
            >
              <Icon name="send" size={15} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
