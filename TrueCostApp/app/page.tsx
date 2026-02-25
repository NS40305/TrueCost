'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { getTimeNeeded } from '@/lib/calculations';
import { CATEGORIES, CURRENCIES, Category, QuickAddItem } from '@/lib/constants';
import { t } from '@/lib/i18n';
import ResultCards from '@/components/ResultCards';
import QuickAddChips from '@/components/QuickAddChips';

export default function CalculatorPage() {
  const settings = useStore((s) => s.settings);
  const addItem = useStore((s) => s.addItem);
  const language = useStore((s) => s.language);
  const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

  const T = (key: string) => t(language, key);

  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const priceNum = parseFloat(price) || 0;

  const result = useMemo(() => {
    if (priceNum <= 0) return null;
    return getTimeNeeded(priceNum, settings);
  }, [priceNum, settings]);

  const handleQuickAdd = (item: QuickAddItem) => {
    setPrice(item.price.toString());
    setName(item.name);
    setCategory(item.category);
    setShowResult(true);
  };

  const handleCalculate = () => {
    if (priceNum > 0) setShowResult(true);
  };

  const handleAddToList = () => {
    if (!name.trim() || priceNum <= 0) return;
    addItem({
      name: name.trim(),
      category,
      price: priceNum,
      url: url.trim() || undefined,
    });
    setJustAdded(true);
    setTimeout(() => {
      setPrice('');
      setName('');
      setCategory('Other');
      setUrl('');
      setShowUrl(false);
      setShowResult(false);
      setJustAdded(false);
    }, 800);
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (newUrl.includes('amazon.') || newUrl.includes('a.co') || newUrl.includes('amzn.to')) {
      setIsScraping(true);
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newUrl }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.title) setName(data.title.substring(0, 100)); // limit length
            if (data.price > 0) {
              setPrice(data.price.toString());
              setShowResult(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to scrape URL:', error);
      } finally {
        setIsScraping(false);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">{T('calculator')}</h2>
        <p className="text-sm text-muted">{T('enterPrice')}</p>
      </div>

      {/* Price input */}
      <div className="glass-card p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
            {T('itemPrice')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setShowResult(true); }}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 pr-16 rounded-xl bg-background border border-border text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
              {settings.currency}
            </span>
          </div>
        </div>

        {/* Name & Category row */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
              {T('itemName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New headphones"
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
              {T('category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* URL toggle row */}
        <div className="flex items-center">
          <button
            onClick={() => setShowUrl(!showUrl)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showUrl ? 'bg-accent/15 text-accent' : 'bg-surface-hover text-muted hover:text-foreground'
              }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            URL
          </button>
        </div>

        {/* URL input (conditional) */}
        {showUrl && (
          <div className="relative mt-3">
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all pr-10"
              disabled={isScraping}
            />
            {isScraping && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick add chips */}
      <QuickAddChips onSelect={handleQuickAdd} />

      {/* Result */}
      {showResult && result && (
        <div className="glass-card p-5 space-y-4">
          <ResultCards itemName={name} result={result} />

          {/* Add to list button */}
          <button
            onClick={handleAddToList}
            disabled={!name.trim() || priceNum <= 0}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
          >
            {justAdded ? T('addedToList') : T('addToList')}
          </button>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
