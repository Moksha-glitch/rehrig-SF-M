import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Icon from '../components/Icon.jsx';
import { Page, PageHeader, Button, ConfirmDialog } from '../components/UI.jsx';
import { FileConfirm, WizardChatbot, validateContractFile } from './wizard/WizardAssist.jsx';
import { extractContractFile } from '@backend/assistant.js';

/**
 * Contract Onboarding — upload → AI ingest → form + reactive chatbot.
 *
 * State architecture (shared parent):
 *   ContractOnboarding (parent)
 *     ├─ form / setForm          ← single source of truth for field values
 *     ├─ missingFields (derived) ← drives warning banner + chat context
 *     ├─ handleFieldChange       ← form edits
 *     └─ handleChatUpdate        ← chatbot writes into the same form state
 *          → Form re-renders immediately (two-way binding)
 *          → when missingFields.length === 0, warning clears & Complete enables
 */

const MANDATORY_FIELDS = [
  {
    key: 'companyName',
    label: 'Company Name',
    question: 'What is the company name?',
    placeholder: 'Type the company name…',
    hint: 'Type just the value — or pick another missing field below.',
  },
  {
    key: 'registrationNumber',
    label: 'Registration Number',
    question: 'What is the registration number?',
    placeholder: 'Type the registration number…',
    hint: 'Type just the value — or pick another missing field below.',
  },
  {
    key: 'contractValue',
    label: 'Contract Value',
    question: 'What is the contract value?',
    placeholder: 'Type the contract value…',
    hint: 'Type just the amount — or pick another missing field below.',
  },
  {
    key: 'startDate',
    label: 'Start Date',
    question: 'What is the contract start date?',
    placeholder: 'Type the start date (YYYY-MM-DD)…',
    hint: 'Type just the date — or pick another missing field below.',
  },
  {
    key: 'signatoryName',
    label: 'Signatory Name',
    question: 'Who is the signatory?',
    placeholder: 'Type the signatory name…',
    hint: 'Type just the name — or pick another missing field below.',
  },
];

const OPTIONAL_FIELDS = [
  { key: 'endDate', label: 'End Date', question: 'What is the end date?', placeholder: 'Type the end date…' },
  {
    key: 'signatoryEmail',
    label: 'Signatory Email',
    question: 'What is the signatory email?',
    placeholder: 'Type the email…',
  },
  {
    key: 'serviceTypes',
    label: 'Service Types',
    question: 'Which service types apply?',
    placeholder: 'Type the service types…',
  },
];

function missingFieldOptions(missingFields = []) {
  return missingFields.map((f) => f.label);
}

function matchMissingField(text, missingFields) {
  const t = text.trim().toLowerCase();
  return missingFields.find(
    (f) => f.label.toLowerCase() === t || f.key.toLowerCase() === t
  );
}

const EMPTY_FORM = {
  companyName: '',
  registrationNumber: '',
  contractValue: '',
  startDate: '',
  endDate: '',
  signatoryName: '',
  signatoryEmail: '',
  serviceTypes: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTRATION_RE = /^[A-Z0-9][A-Z0-9 ./-]{2,29}$/i;

function validateContract(form) {
  const errors = {};
  MANDATORY_FIELDS.forEach((field) => {
    if (!String(form[field.key] ?? '').trim()) errors[field.key] = `${field.label} is required.`;
  });
  if (form.registrationNumber && !REGISTRATION_RE.test(form.registrationNumber.trim())) {
    errors.registrationNumber = 'Use 3–30 letters, numbers, spaces, periods, slashes, or hyphens.';
  }
  const amount = Number(String(form.contractValue).replace(/[$,\s]/g, ''));
  if (form.contractValue && (!Number.isFinite(amount) || amount <= 0)) {
    errors.contractValue = 'Enter an amount greater than 0.';
  }
  const validDate = (value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`)));
  if (!validDate(form.startDate)) errors.startDate = 'Enter a valid start date.';
  if (!validDate(form.endDate)) errors.endDate = 'Enter a valid end date.';
  if (validDate(form.startDate) && validDate(form.endDate) && form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date cannot be before the start date.';
  }
  if (form.signatoryEmail && !EMAIL_RE.test(form.signatoryEmail.trim())) {
    errors.signatoryEmail = 'Enter a valid email address.';
  }
  return errors;
}

// Intentionally leaves some fields blank so the chatbot path can be exercised.
async function mockExtractContract(fileOrName) {
  const file =
    typeof fileOrName === 'string'
      ? new File([`Company: ${fileOrName}`], fileOrName, { type: 'text/plain' })
      : fileOrName;
  const data = await extractContractFile(file);
  return {
    companyName: data.companyName,
    registrationNumber: '', // missing — chat will fill
    contractValue: '', // missing
    startDate: data.startDate || '2026-08-01',
    endDate: data.endDate || '2029-07-31',
    signatoryName: '', // missing
    signatoryEmail: data.signatoryEmail || 'contracts@example.com',
    serviceTypes: data.serviceTypes || 'Residential, Commercial',
  };
}

/**
 * Pick a missing field by label, or map a bare answer to the focused field.
 */
function mockParseChat(text, missingFields, focusedKey = null) {
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
        reply: 'All mandatory fields look complete. You can finish onboarding now.',
        options: [],
      });
      return;
    }

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

    const active = missingFields.find((f) => f.key === focusedKey) || missingFields[0];
    const stripped =
      t.match(
        new RegExp(
          `^(?:the\\s+)?(?:${active.label.replace(/\s+/g, '\\s+')}|${active.key})\\s*(?:is|:)?\\s*(.+)$`,
          'i'
        )
      )?.[1] || t;
    let value = stripped.trim().replace(/[.,;]+$/, '');
    if (active.key === 'contractValue') value = value.replace(/^\$/, '').replace(/,/g, '');
    if (active.key === 'registrationNumber') value = value.toUpperCase();
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

// ---------- Upload zone ----------
function UploadZone({ onFile, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef(null);

  const accept = (file) => {
    if (!file) return;
    const error = validateContractFile(file);
    setFileError(error);
    if (error) return;
    onFile(file);
  };

  return (
    <>
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
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
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-panel border-2 border-dashed px-6 py-16 interactive ${
        dragOver
          ? 'border-brand bg-brand-soft'
          : 'border-line-strong bg-surface hover:border-brand hover:bg-elevated'
      } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-control bg-brand-soft text-brand">
        <Icon name="download" size={24} />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">
        Drop your contract here, or click to browse
      </p>
      <p className="mt-1 text-sm text-ink-muted">PDF or TXT · max 20 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </div>
    {fileError && <p className="mt-3 text-sm text-danger" role="alert">{fileError}</p>}
    </>
  );
}

// ---------- Form ----------
function ContractForm({ form, errors, onChange, disabled }) {
  const fieldClass = (key) => {
    return errors[key]
      ? 'field-input border-danger/50 bg-danger-soft focus:border-danger'
      : 'field-input';
  };

  const renderField = (f) => (
    <div key={f.key} className="min-w-0">
      <label className="type-overline mb-2 flex min-h-[1rem] flex-wrap items-center gap-1.5">
        <span>{f.label}</span>
        {MANDATORY_FIELDS.some((m) => m.key === f.key) && (
          <span className="text-danger">*</span>
        )}
        {errors[f.key] && (
          <span className="rounded-control border border-line bg-danger-soft px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-danger">
            Required
          </span>
        )}
      </label>
      <input
        type={f.key.includes('Date') ? 'date' : f.key === 'contractValue' ? 'text' : 'text'}
        value={form[f.key] || ''}
        disabled={disabled}
        placeholder={
          f.key === 'contractValue'
            ? 'e.g. 250000'
            : f.key === 'registrationNumber'
            ? 'e.g. AB-778821'
            : ''
        }
        onChange={(e) => onChange(f.key, e.target.value)}
        className={fieldClass(f.key)}
        aria-invalid={!!errors[f.key]}
      />
      {errors[f.key] && <p className="mt-1 text-xs text-danger" role="alert">{errors[f.key]}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="type-overline mb-4 text-brand">Mandatory</div>
        <div className="grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2">
          {MANDATORY_FIELDS.map(renderField)}
        </div>
      </div>
      <div className="border-t border-line pt-7">
        <div className="type-overline mb-4">Optional</div>
        <div className="grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2">
          {OPTIONAL_FIELDS.map(renderField)}
        </div>
      </div>
    </div>
  );
}

// ---------- Parent (shared state) ----------
export default function ContractOnboarding({ onComplete }) {
  const [phase, setPhase] = useState('upload'); // upload | confirm | extracting | form
  const [pendingFile, setPendingFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [messages, setMessages] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatFocusKey, setChatFocusKey] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [extractionError, setExtractionError] = useState('');
  const [chatError, setChatError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const extractionRun = useRef(0);
  const chatRun = useRef(0);
  const submitRun = useRef(0);
  const extractionFile = useRef(null);
  const lastChatAnswer = useRef('');
  const mounted = useRef(true);
  const msgId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      extractionRun.current += 1;
      chatRun.current += 1;
      submitRun.current += 1;
    };
  }, []);

  const validationErrors = useMemo(() => validateContract(form), [form]);
  const missingFields = useMemo(() => MANDATORY_FIELDS.filter((field) => validationErrors[field.key]), [validationErrors]);
  const isComplete = Object.keys(validationErrors).length === 0;

  const pushMessage = useCallback((role, text, options = []) => {
    msgId.current += 1;
    setMessages((prev) => [...prev, { id: msgId.current, role, text, options }]);
  }, []);

  // Form → state
  const handleFieldChange = useCallback((field, value) => {
    chatRun.current += 1;
    setChatBusy(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Chatbot → same state (two-way binding)
  const handleChatUpdate = useCallback((field, value) => {
    if (!field) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectFile = (file) => {
    extractionFile.current = file;
    setExtractionError('');
    setPendingFile(file);
    setFileName(file.name);
    setPhase('confirm');
  };

  const cancelPendingFile = () => {
    extractionRun.current += 1;
    setPendingFile(null);
    setFileName('');
    setPhase('upload');
  };

  const changePendingFile = (file) => {
    extractionFile.current = file;
    setExtractionError('');
    setPendingFile(file);
    setFileName(file.name);
  };

  const handleFile = async (file) => {
    if (!file) return;
    const run = ++extractionRun.current;
    extractionFile.current = file;
    setExtractionError('');
    setPendingFile(null);
    setFileName(file.name);
    setPhase('extracting');
    setDone(false);
    setMessages([]);
    try {
    const extracted = await mockExtractContract(file);
    if (!mounted.current || run !== extractionRun.current) return;
    setForm(extracted);
    setPhase('form');

    const stillMissing = MANDATORY_FIELDS.filter(
      (f) => !extracted[f.key] || String(extracted[f.key]).trim() === ''
    );
    if (stillMissing.length) {
      setChatFocusKey(stillMissing[0].key);
      pushMessage(
        'assistant',
        `Extracted from **${file.name}**. ${stillMissing[0].question}`,
        stillMissing.map((f) => f.label)
      );
    } else {
      setChatFocusKey(null);
      pushMessage('assistant', 'Extraction complete. Review the form, then finish onboarding.');
    }
    } catch (error) {
      if (!mounted.current || run !== extractionRun.current) return;
      setExtractionError(error?.message || 'We could not extract this contract. Try again.');
    }
  };

  const handleChatSend = async (text) => {
    const answer = text.trim();
    if (!answer || chatBusy) return;
    pushMessage('user', answer);
    lastChatAnswer.current = answer;
    setChatBusy(true);
    setChatError('');
    const run = ++chatRun.current;
    try {
      const result = await mockParseChat(answer, missingFields, chatFocusKey);
      if (!mounted.current || run !== chatRun.current) return;

      if (result.selectField) {
        setChatFocusKey(result.selectField);
        pushMessage('assistant', result.reply);
        return;
      }

      let nextMissing = missingFields;
      if (result.field && result.value != null) {
        handleChatUpdate(result.field, result.value);
        nextMissing = missingFields.filter((f) => f.key !== result.field);
      }

      if (result.field && nextMissing.length > 0) {
        setChatFocusKey(nextMissing[0].key);
        pushMessage('assistant', result.reply);
      } else if (result.field && nextMissing.length === 0) {
        setChatFocusKey(null);
        pushMessage('assistant', result.reply);
      } else {
        pushMessage('assistant', result.reply);
      }
    } catch (error) {
      if (!mounted.current || run !== chatRun.current) return;
      setChatError(error?.message || 'The assistant could not process that response. Please retry.');
    } finally {
      if (mounted.current && run === chatRun.current) setChatBusy(false);
    }
  };

  const reset = () => {
    extractionRun.current += 1;
    chatRun.current += 1;
    submitRun.current += 1;
    setPhase('upload');
    setPendingFile(null);
    setFileName('');
    setForm(EMPTY_FORM);
    setMessages([]);
    setChatFocusKey(null);
    setDone(false);
    setSubmitting(false);
    setSubmitError('');
    setExtractionError('');
    setChatError('');
    setResetOpen(false);
  };

  const completeOnboarding = async () => {
    if (!isComplete || done || submitting) return;
    const run = ++submitRun.current;
    setSubmitting(true);
    setSubmitError('');
    try {
      await Promise.resolve(onComplete?.({ ...form, contractValue: Number(String(form.contractValue).replace(/[$,\s]/g, '')) }));
      if (!mounted.current || run !== submitRun.current) return;
      setDone(true);
      pushMessage('assistant', `Onboarding complete for **${form.companyName || 'this account'}**.`);
    } catch (error) {
      if (!mounted.current || run !== submitRun.current) return;
      setSubmitError(error?.message || 'Onboarding could not be completed. Please retry.');
    } finally {
      if (mounted.current && run === submitRun.current) setSubmitting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Onboarding · Contract ingest"
        title="Contract Onboarding"
        description="Upload a contract. AI extracts fields into the form; fill any gaps manually or via the assistant."
        actions={
          phase !== 'upload' && phase !== 'confirm' ? (
            <Button variant="secondary" onClick={() => setResetOpen(true)}>
              Start over
            </Button>
          ) : null
        }
      />

      {phase === 'upload' && <UploadZone onFile={selectFile} />}

      {phase === 'confirm' && (
        <div className="surface-panel">
          <FileConfirm
            file={pendingFile}
            onConfirm={() => handleFile(pendingFile)}
            onChangeFile={changePendingFile}
            onCancel={cancelPendingFile}
          />
        </div>
      )}

      {phase === 'extracting' && (
        <div className="surface-panel flex flex-col items-center justify-center px-6 py-20">
          {extractionError ? (
            <>
              <Icon name="alert" size={28} className="text-danger" />
              <p className="mt-4 text-sm font-semibold text-ink">Contract extraction failed</p>
              <p className="mt-1 text-sm text-danger" role="alert">{extractionError}</p>
              <div className="mt-5 flex gap-2">
                <button type="button" className="btn-secondary" onClick={reset}>Choose another file</button>
                <button type="button" className="btn-primary" onClick={() => handleFile(extractionFile.current)}>Retry extraction</button>
              </div>
            </>
          ) : (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
              <p className="mt-4 text-sm font-semibold text-ink" role="status">Ingesting contract…</p>
              <p className="mt-1 text-xs text-ink-muted">
                Extracting entities from <span className="font-medium">{fileName}</span>
              </p>
              <button type="button" onClick={reset} className="mt-5 text-sm font-medium text-ink-muted hover:text-ink">Cancel extraction</button>
            </>
          )}
        </div>
      )}

      {phase === 'form' && (
        <>
          {/* Warning banner — non-blocking */}
          {!isComplete && (
            <div className="mb-4 flex items-start gap-3 rounded-panel border border-line bg-warn-soft px-4 py-3">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-warn" />
              <div>
                <div className="text-sm font-semibold text-ink-soft">
                  Resolve the highlighted fields before completing onboarding.
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {Object.values(validationErrors).join(' ')}
                </div>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mb-4 flex items-start gap-3 rounded-panel border border-line bg-success-soft px-4 py-3">
              <Icon name="checkCircle" size={18} className="mt-0.5 shrink-0 text-success" />
              <div className="text-sm font-semibold text-ink-soft">
                All mandatory fields are complete.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5">
            {/* Form — 3 cols */}
            <div className="surface-panel p-6 sm:p-7 lg:col-span-3">
              <div className="mb-6">
                <div className="font-display text-title-sm text-ink">Extracted contract data</div>
                <div className="mt-1 text-sm text-ink-muted">Source · {fileName}</div>
              </div>
              <ContractForm
                form={form}
                errors={validationErrors}
                onChange={handleFieldChange}
                disabled={done}
              />
              <div className="mt-8 flex justify-end border-t border-line pt-5">
                <button
                  disabled={!isComplete || done || submitting}
                  onClick={completeOnboarding}
                  className="btn-brand disabled:cursor-not-allowed"
                >
                  <Icon name="check" size={16} />
                  {done ? 'Onboarding complete' : submitting ? 'Completing…' : 'Complete Onboarding'}
                </button>
              </div>
              {submitError && <p className="mt-3 text-right text-sm text-danger" role="alert">{submitError}</p>}
            </div>

            {/* Chat — 2 cols */}
            <div className="lg:col-span-2">
              <WizardChatbot
                variant="card"
                missingFields={missingFields}
                focusedKey={chatFocusKey}
                messages={messages}
                onSend={handleChatSend}
                busy={chatBusy}
                totalRequired={MANDATORY_FIELDS.length}
              />
              {chatError && (
                <div className="mt-2 flex items-center justify-between gap-3 text-sm text-danger" role="alert">
                  <span>{chatError}</span>
                  <button type="button" className="font-semibold underline" onClick={() => handleChatSend(lastChatAnswer.current)}>Retry</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {resetOpen && (
        <ConfirmDialog
          open={resetOpen}
          title="Discard extracted data?"
          description="This clears the current contract, form edits, and assistant conversation."
          confirmLabel="Start over"
          cancelLabel="Keep editing"
          severity="danger"
          onCancel={() => setResetOpen(false)}
          onConfirm={reset}
        />
      )}
    </Page>
  );
}
