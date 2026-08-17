import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { MODULE_LABELS } from './navConfig.js';
import {
  filterAssistantContent,
  getPersonaAssistantContent,
  resolveIntent,
  runAssistantAction,
} from '../data/assistantIntents.js';

const HISTORY_KEY = 'vision.ui.chatHistory';
const FAVS_KEY = 'vision.ui.chatFavorites';

const PAGE_PROMPTS = {
  apiIntegrations: {
    question: 'How can I help with API integrations today?',
    hint: 'Ask about endpoint status, call volume, or errors.',
    chips: [
      'Salesforce Sync Errors',
      'Endpoint Call Volume',
      'Deprecated API Usage',
      'BDP Route Status',
    ],
  },
  accounts: {
    question: 'How can I help with service providers today?',
    hint: 'Ask about registry status, onboarding, or account details.',
    chips: ['Show inactive providers', 'Pending onboarding', 'Open Contract Onboarding'],
  },
  setup: {
    question: 'How can I help with workspace setup today?',
    hint: 'Ask about users, profiles, or permissions.',
    chips: ['Open Profile Management', 'Create a new user', 'Review permission profiles'],
  },
  workOrders: {
    question: 'How can I help with work orders today?',
    hint: 'Ask about open tickets, hot tickets, or dispatch status.',
    chips: ['Open work orders', 'Hot tickets', 'Create a work order'],
  },
  mapCenter: {
    question: 'How can I help with Map Center today?',
    hint: 'Ask about routes, trucks, or live dispatch locations.',
    chips: ['Active dispatches', 'Find a location', 'Route progress'],
  },
};

function readHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(threads) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(threads.slice(0, 12)));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function readFavorites() {
  try {
    const raw = window.localStorage.getItem(FAVS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(threads) {
  try {
    window.localStorage.setItem(FAVS_KEY, JSON.stringify(threads.slice(0, 12)));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function titleFromMessages(messages) {
  const first = messages.find((message) => message.role === 'user');
  return first?.text?.slice(0, 42) || 'New chat';
}

export default function VisionChat({ onOnboard, onClose }) {
  const { state, persona, navigate, canAccessModule, canTab } = useStore();
  const content = useMemo(
    () =>
      filterAssistantContent(getPersonaAssistantContent(persona), {
        canAccessModule,
        canTab,
      }),
    [persona, canAccessModule, canTab]
  );
  const pageLabel = MODULE_LABELS[state.nav.module] || 'Home';
  const pageHelp = PAGE_PROMPTS[state.nav.module];
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [favorites, setFavorites] = useState(readFavorites);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const messageId = useRef(0);
  const logRef = useRef(null);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  const chips = pageHelp?.chips || content.chips;
  const question =
    pageHelp?.question || `How can I help with ${pageLabel.toLowerCase()} today?`;
  const hint = pageHelp?.hint || content.intro;
  const searchQuery = useSearch(draft);
  const searchResults = useMemo(
    () =>
      (searchQuery.data || []).map((item) => ({
        ...item,
        label: item.title || item.label,
      })),
    [searchQuery.data]
  );
  const showSearch = draft.trim().length >= 2 && searchResults.length > 0;

  const runAction = (action) => {
    runAssistantAction(action, {
      navigate,
      onOnboard,
      canAccessModule,
      canTab,
    });
  };

  const persistCurrent = (nextMessages) => {
    if (!nextMessages.length) return;
    const thread = {
      id: `chat-${Date.now().toString(36)}`,
      title: titleFromMessages(nextMessages),
      messages: nextMessages,
      page: pageLabel,
    };
    setHistory((prev) => {
      const next = [thread, ...prev.filter((item) => item.title !== thread.title)].slice(0, 12);
      writeHistory(next);
      return next;
    });
  };

  const send = (rawPrompt) => {
    const prompt = String(rawPrompt || '').trim();
    if (!prompt || busy) return;
    messageId.current += 1;
    const nextMessages = [...messages, { id: messageId.current, role: 'user', text: prompt }];
    setMessages(nextMessages);
    setDraft('');
    setBusy(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const result = resolveIntent(content, prompt);
      messageId.current += 1;
      const withReply = [
        ...nextMessages,
        {
          id: messageId.current,
          role: 'assistant',
          text: result.reply,
          action: result.action,
        },
      ];
      setMessages(withReply);
      persistCurrent(withReply);
      setBusy(false);
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    }, 450);
  };

  const currentTitle = titleFromMessages(messages);
  const currentIsFavorite = messages.length > 0 && favorites.some((item) => item.title === currentTitle);

  const toggleFavorite = (thread) => {
    if (!thread?.title) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.title === thread.title);
      const next = exists
        ? prev.filter((item) => item.title !== thread.title)
        : [{ ...thread, id: thread.id || `fav-${Date.now().toString(36)}` }, ...prev].slice(0, 12);
      writeFavorites(next);
      return next;
    });
  };

  const newChat = () => {
    window.clearTimeout(timerRef.current);
    setMessages([]);
    setBusy(false);
    setDraft('');
    setHistoryOpen(false);
    setFavsOpen(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const openThread = (thread) => {
    setMessages(thread.messages || []);
    setHistoryOpen(false);
    setFavsOpen(false);
  };

  return (
    <aside
      className="fixed inset-0 z-40 flex h-full min-h-0 w-full flex-col border-r border-line bg-surface lg:static lg:z-auto lg:w-[30rem] lg:shrink-0"
      aria-label="Vision AI"
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
            V
          </span>
          <div className="truncate font-display text-sm font-semibold text-ink">Vision AI</div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={newChat}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-ink"
            aria-label="New chat"
            title="New chat"
          >
            <Icon name="plus" size={16} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setHistoryOpen(false);
                setFavsOpen((open) => !open);
              }}
              className={`relative rounded-lg p-1.5 hover:bg-elevated ${
                favsOpen || currentIsFavorite ? 'text-brand' : 'text-ink-muted hover:text-ink'
              }`}
              aria-label="Favorite chats"
              aria-expanded={favsOpen}
              title="Favorites"
            >
              <Icon name="star" size={16} />
              {favorites.length > 0 && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand" />
              )}
            </button>
            {favsOpen && (
              <div className="absolute right-0 z-20 mt-1 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float">
                <div className="px-2.5 pb-1 pt-1.5 type-overline">Favorites</div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      toggleFavorite({
                        id: `fav-${Date.now().toString(36)}`,
                        title: currentTitle,
                        messages,
                        page: pageLabel,
                      })
                    }
                    className="mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-elevated"
                  >
                    <Icon
                      name="star"
                      size={13}
                      className={currentIsFavorite ? 'text-brand' : 'text-ink-faint'}
                    />
                    <span className="text-xs font-medium text-ink">
                      {currentIsFavorite ? 'Remove current chat' : 'Save current chat'}
                    </span>
                  </button>
                )}
                {favorites.length ? (
                  favorites.map((thread) => (
                    <div key={thread.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openThread(thread)}
                        className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left hover:bg-elevated"
                      >
                        <div className="truncate text-xs font-medium text-ink">{thread.title}</div>
                        <div className="truncate text-[10px] text-ink-faint">{thread.page}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(thread)}
                        className="rounded-lg p-1.5 text-brand hover:bg-elevated"
                        aria-label={`Remove ${thread.title} from favorites`}
                        title="Remove"
                      >
                        <Icon name="star" size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-2.5 py-3 text-xs text-ink-muted">
                    No favorite chats yet. Save one from this menu.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFavsOpen(false);
                setHistoryOpen((open) => !open);
              }}
              className="relative rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-ink"
              aria-label="Chat history"
              aria-expanded={historyOpen}
              title="History"
            >
              <Icon name="clock" size={16} />
              {history.length > 0 && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand" />
              )}
            </button>
            {historyOpen && (
              <div className="absolute right-0 z-20 mt-1 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float">
                {history.length ? (
                  history.map((thread) => (
                    <div key={thread.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openThread(thread)}
                        className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left hover:bg-elevated"
                      >
                        <div className="truncate text-xs font-medium text-ink">{thread.title}</div>
                        <div className="truncate text-[10px] text-ink-faint">{thread.page}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(thread)}
                        className={`rounded-lg p-1.5 hover:bg-elevated ${
                          favorites.some((item) => item.title === thread.title)
                            ? 'text-brand'
                            : 'text-ink-faint'
                        }`}
                        aria-label={`Favorite ${thread.title}`}
                        title="Favorite"
                      >
                        <Icon name="star" size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-2.5 py-3 text-xs text-ink-muted">No earlier chats yet.</div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-ink"
            aria-label="Close Vision AI"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scroll-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="font-display text-[1.05rem] font-semibold text-ink">{question}</h2>
            <p className="mt-2 max-w-[16rem] text-[12.5px] leading-relaxed text-ink-muted">{hint}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {chips.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={busy}
                  onClick={() => send(prompt)}
                  className="rounded-full border border-line bg-elevated/50 px-2.5 py-1 text-[11px] font-medium text-ink-muted interactive hover:border-brand/40 hover:text-brand disabled:opacity-50"
                >
                  {prompt}
                </button>
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
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
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
              <div className="flex justify-start" role="status" aria-label="Vision AI is responding">
                <div className="rounded-2xl border border-line bg-surface px-3.5 py-3">
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

      <div className="relative shrink-0 border-t border-line p-3">
        {showSearch && (
          <div className="absolute inset-x-3 bottom-full z-20 mb-2 max-h-64 overflow-y-auto rounded-panel border border-line bg-surface p-1.5 shadow-float scroll-thin">
            <div className="px-3 pb-1 pt-1.5 type-overline">Jump to</div>
            {searchResults.slice(0, 8).map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  navigate(result.module, result.params);
                  setDraft('');
                }}
                className="block w-full rounded-control px-3 py-2 text-left hover:bg-elevated"
              >
                <span className="block truncate text-sm font-medium text-ink">
                  {result.label}
                </span>
                {(result.meta || result.category) && (
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">
                    {result.meta || result.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="flex items-end gap-2 rounded-[1.75rem] border border-line bg-elevated px-3 py-2 shadow-raise"
        >
          <button
            type="button"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface hover:text-ink"
            aria-label="Add context"
            title="Add context"
          >
            <Icon name="plus" size={16} />
          </button>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Message Vision AI</span>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              disabled={busy}
              rows={1}
              placeholder="How can I help you today?"
              className="max-h-28 w-full resize-none bg-transparent py-1.5 text-sm leading-6 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:shadow-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
            aria-label="Send message"
          >
            <Icon name="send" size={14} />
          </button>
        </form>
      </div>
    </aside>
  );
}
