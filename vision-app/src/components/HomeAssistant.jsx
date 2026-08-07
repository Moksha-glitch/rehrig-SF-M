import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import {
  filterAssistantContent,
  getPersonaAssistantContent,
  resolveIntent,
  runAssistantAction,
} from '../data/assistantIntents.js';

export default function HomeAssistant({ onOnboard }) {
  const { state, persona, navigate, canAccessModule, canTab } = useStore();
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
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const messageId = useRef(0);

  const latestAction = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant')?.action || null,
    [messages]
  );

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const runAction = (action) => {
    runAssistantAction(action, { navigate, onOnboard, canAccessModule, canTab });
  };

  const send = (rawPrompt) => {
    const prompt = String(rawPrompt || '').trim();
    if (!prompt || busy) return;
    messageId.current += 1;
    const userMessage = { id: messageId.current, role: 'user', text: prompt };
    setMessages((current) => [...current, userMessage]);
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

  return (
    <section
      className="mb-10 overflow-hidden rounded-sheet border border-brand/30 bg-surface shadow-soft"
      aria-labelledby="home-assistant-title"
    >
      <div className="border-b border-brand/20 bg-brand-soft/70 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
          <span className="flex h-7 w-7 items-center justify-center rounded-control bg-brand text-white">
            <Icon name="star" size={13} />
          </span>
          {content.eyebrow}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="text-center">
          <h1 id="home-assistant-title" className="font-display text-title-lg text-ink">
            {content.heading.replace('Welcome back!', `Welcome back, ${firstName}!`)}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {content.intro}
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
            {content.cards.map((card) => (
              <article
                key={card.title}
                className="flex min-h-44 flex-col rounded-panel border border-line bg-surface p-4 shadow-raise"
              >
                <h2 className="text-sm font-semibold text-ink">{card.title}</h2>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-muted">
                  {card.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => runAction(card.action)}
                    className="btn-secondary !border-brand/45 !px-3 !py-2 text-xs !text-brand"
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
              </article>
            ))}
          </div>
        ) : (
          <div
            className="mx-auto mt-7 max-h-72 max-w-3xl space-y-3 overflow-y-auto rounded-panel border border-line bg-elevated/45 p-4 scroll-thin"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-panel px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-brand text-white'
                      : 'border border-line bg-surface text-ink-soft'
                  }`}
                >
                  {message.text}
                  {message.action && (
                    <button
                      type="button"
                      onClick={() => runAction(message.action)}
                      className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
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

        <div className="mx-auto mt-5 max-w-3xl">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {content.chips.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={busy}
                onClick={() => send(prompt)}
                className="rounded-control border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-muted interactive hover:border-brand/45 hover:text-brand disabled:opacity-50"
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
                className="field-input h-12 w-full rounded-panel border-line bg-elevated/60 pl-4 pr-3"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="btn-brand h-12 w-12 shrink-0 !px-0 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send question"
            >
              <Icon name="send" size={16} />
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="h-12 shrink-0 rounded-control border border-line px-3 text-xs font-medium text-ink-muted interactive hover:bg-elevated"
              >
                Clear
              </button>
            )}
          </form>
          {latestAction && (
            <p className="mt-2 text-center text-[11px] text-ink-faint">
              Use the action in the latest response to continue.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
