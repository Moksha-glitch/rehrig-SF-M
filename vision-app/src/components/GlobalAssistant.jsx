import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Drawer } from './UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { MODULE_LABELS } from './navConfig.js';
import {
  filterAssistantContent,
  getPersonaAssistantContent,
  resolveIntent,
  runAssistantAction,
} from '../data/assistantIntents.js';

export default function GlobalAssistant({ onOnboard }) {
  const { state, persona, navigate, assistantOpen, closeAssistant, canAccessModule, canTab } =
    useStore();
  const content = useMemo(
    () =>
      filterAssistantContent(getPersonaAssistantContent(persona), {
        canAccessModule,
        canTab,
      }),
    [persona, canAccessModule, canTab]
  );
  const firstName =
    state.currentUser?.firstName || state.currentUser?.name?.split(/\s+/)[0] || 'there';
  const pageLabel = MODULE_LABELS[state.nav.module] || 'Home';
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const messageId = useRef(0);
  const logRef = useRef(null);

  useEffect(() => {
    if (!assistantOpen) return undefined;
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(focusTimer);
  }, [assistantOpen]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  const runAction = (action) => {
    const handled = runAssistantAction(action, {
      navigate,
      onOnboard,
      canAccessModule,
      canTab,
    });
    if (handled) closeAssistant();
  };

  const send = (rawPrompt) => {
    const prompt = String(rawPrompt || '').trim();
    if (!prompt || busy) return;
    messageId.current += 1;
    setMessages((current) => [...current, { id: messageId.current, role: 'user', text: prompt }]);
    setDraft('');
    setBusy(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const result = resolveIntent(content, prompt);
      messageId.current += 1;
      setMessages((current) => [
        ...current,
        {
          id: messageId.current,
          role: 'assistant',
          text: result.reply,
          action: result.action,
        },
      ]);
      setBusy(false);
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    }, 450);
  };

  const reset = () => {
    window.clearTimeout(timerRef.current);
    setMessages([]);
    setBusy(false);
    setDraft('');
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const quickCards = useMemo(() => content.cards.slice(0, 3), [content.cards]);

  return (
    <Drawer
      open={assistantOpen}
      onClose={closeAssistant}
      title={content.drawerTitle || 'AI Assistant'}
      description={
        content.drawerDescription ||
        `Hi ${firstName}. Ask a question or jump to a common workflow.`
      }
      className="assistant-drawer"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-line bg-elevated/50 px-6 py-3">
          <p className="type-overline">Current page</p>
          <p className="mt-0.5 truncate text-sm font-medium text-ink">{pageLabel}</p>
        </div>

        <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scroll-thin">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-ink-muted">
                Hi {firstName}. {content.intro}
              </p>
              <div className="space-y-2">
                {quickCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-panel border border-line bg-surface p-3.5"
                  >
                    <div className="text-sm font-semibold text-ink">{card.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{card.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => runAction(card.action)}
                        className="btn-secondary !border-brand/45 !px-3 !py-1.5 text-xs !text-brand"
                      >
                        {card.action.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => send(card.prompt)}
                        className="px-2 py-1 text-xs font-medium text-ink-muted interactive hover:text-brand"
                      >
                        Ask AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3" role="log" aria-live="polite" aria-relevant="additions">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-panel px-3.5 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-brand text-white'
                        : 'border border-line bg-elevated/60 text-ink-soft'
                    }`}
                  >
                    {message.text}
                    {message.action && (
                      <button
                        type="button"
                        onClick={() => runAction(message.action)}
                        className={`mt-2 flex items-center gap-1 text-xs font-semibold hover:underline ${
                          message.role === 'user' ? 'text-white' : 'text-brand'
                        }`}
                      >
                        {message.action.label} <Icon name="arrowRight" size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start" role="status" aria-label="Assistant is responding">
                  <div className="rounded-panel border border-line bg-surface px-3.5 py-3">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-surface px-6 py-4">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {content.chips.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={busy}
                onClick={() => send(prompt)}
                className="rounded-control border border-line bg-elevated/50 px-2.5 py-1.5 text-[11px] font-medium text-ink-muted interactive hover:border-brand/45 hover:text-brand disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2"
          >
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Ask the Vision assistant</span>
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={busy}
                placeholder="Ask anything…"
                className="field-input h-11 w-full rounded-panel border-line bg-elevated/60 pl-4 pr-3"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="btn-brand h-11 w-11 shrink-0 !px-0 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send question"
            >
              <Icon name="send" size={16} />
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="h-11 shrink-0 rounded-control border border-line px-3 text-xs font-medium text-ink-muted interactive hover:bg-elevated"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>
    </Drawer>
  );
}
