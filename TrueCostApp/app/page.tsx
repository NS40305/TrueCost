'use client';

import { useState, useMemo } from 'react';
import { useStore, QuickAddPreset, SubscriptionCycle } from '@/lib/store';
import { getTimeNeeded } from '@/lib/calculations';
import { CATEGORIES, CURRENCIES, Category } from '@/lib/constants';
import { t } from '@/lib/i18n';
import ResultCards from '@/components/ResultCards';
import QuickAddChips from '@/components/QuickAddChips';
import SubscriptionCard from '@/components/SubscriptionCard';

export default function CalculatorPage() {
  const settings = useStore((s) => s.settings);
  const addItem = useStore((s) => s.addItem);
  const language = useStore((s) => s.language);
  const subscriptions = useStore((s) => s.subscriptions);
  const addSubscription = useStore((s) => s.addSubscription);
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

  // Subscription form state
  const [subExpanded, setSubExpanded] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState('');
  const [subCategory, setSubCategory] = useState<Category>('Other');
  const [subCycle, setSubCycle] = useState<SubscriptionCycle>('monthly');
  const [subJustAdded, setSubJustAdded] = useState(false);

  const priceNum = parseFloat(price) || 0;

  const result = useMemo(() => {
    if (priceNum <= 0) return null;
    return getTimeNeeded(priceNum, settings);
  }, [priceNum, settings]);

  const handleQuickAdd = (item: QuickAddPreset) => {
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
              placeholder={T('itemPlaceholder')}
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
                <option key={c} value={c}>{T(c)}</option>
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
        <div className="space-y-4">
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

          {/* ── "Is this worth my time?" insight card ── */}
          {(() => {
            const hours = result.hours;
            const days = result.days;
            let verdict: 'yes' | 'maybe' | 'no';
            let verdictLabel: string;
            let verdictDesc: string;
            let verdictColor: string;
            let progressColor: string;
            let barWidth: number;
            let icon: React.ReactNode;

            if (hours < 1) {
              verdict = 'yes';
              verdictLabel = T('worthYes');
              verdictDesc = T('worthDescSmall');
              verdictColor = 'text-emerald-400';
              progressColor = 'bg-emerald-500';
              barWidth = Math.max(5, (hours / 1) * 100);
              icon = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              );
            } else if (hours < settings.hoursPerDay) {
              verdict = 'maybe';
              verdictLabel = T('worthMaybe');
              verdictDesc = T('worthDescMedium');
              verdictColor = 'text-amber-400';
              progressColor = 'bg-amber-500';
              barWidth = Math.min(100, (hours / settings.hoursPerDay) * 100);
              icon = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              );
            } else if (days <= 1) {
              verdict = 'no';
              verdictLabel = T('worthMaybe');
              verdictDesc = T('worthDescLarge');
              verdictColor = 'text-orange-400';
              progressColor = 'bg-orange-500';
              barWidth = Math.min(100, (days / 1) * 100);
              icon = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              );
            } else {
              verdict = 'no';
              verdictLabel = T('worthNo');
              verdictDesc = T('worthDescHuge');
              verdictColor = 'text-red-400';
              progressColor = 'bg-red-500';
              barWidth = 100;
              icon = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              );
            }

            return (
              <div className="worth-insight-card glass-card overflow-hidden">
                {/* Dark gradient header */}
                <div className={`px-5 py-3 flex items-center gap-3 ${
                  verdict === 'yes' ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5' :
                  verdict === 'maybe' ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5' :
                  'bg-gradient-to-r from-red-500/10 to-red-500/5'
                }`}>
                  {icon}
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{T('worthMyTime')}</p>
                    <p className={`text-lg font-bold ${verdictColor}`}>{verdictLabel}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                  <p className="text-sm text-muted">{verdictDesc}</p>

                  {/* Progress bar showing work time */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{T('hours')}</span>
                      <span className={`font-semibold tabular-nums ${verdictColor}`}>
                        {result.hours < 1 ? result.hours.toFixed(1) : Math.round(result.hours)} {T('hrs')}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressColor} transition-all duration-700 ease-out`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted/60">
                      <span>0</span>
                      <span>1 {T('hours')}</span>
                      <span>1 {T('days')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}


      {/* ── Subscriptions Section ── */}
      <div className="glass-card overflow-hidden">
        {/* Header — always visible */}
        <button
          onClick={() => setSubExpanded(!subExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4h-4z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">{T('subscriptions')}</p>
              <p className="text-xs text-muted">{subscriptions.length} {subscriptions.length === 1 ? T('item') : T('items')}</p>
            </div>
          </div>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-muted transition-transform duration-300 ${subExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Collapsible content */}
        {subExpanded && (
          <div>
          <div className="px-5 pb-5 space-y-3">
            <div className="h-px bg-border" />

            {/* Subscription list */}
            {subscriptions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted">{T('noSubscriptions')}</p>
                <p className="text-xs text-muted/60 mt-1">{T('noSubscriptionsDesc')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <SubscriptionCard key={sub.id} sub={sub} editable />
                ))}
              </div>
            )}

            {/* Add subscription toggler */}
            {!showSubForm ? (
              <button
                onClick={() => setShowSubForm(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent text-sm font-medium text-muted hover:text-accent transition-all flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {T('addSubscription')}
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-background border border-border">
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('subscriptionName')}</label>
                    <input
                      type="text"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder={T('subscriptionPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('itemPrice')}</label>
                    <input
                      type="number"
                      value={subPrice}
                      onChange={(e) => setSubPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('category')}</label>
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value as Category)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{T(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('billingCycle')}</label>
                    <select
                      value={subCycle}
                      onChange={(e) => setSubCycle(e.target.value as SubscriptionCycle)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      <option value="weekly">{T('weeklyCycle')}</option>
                      <option value="monthly">{T('monthlyCycle')}</option>
                      <option value="yearly">{T('yearlyCycle')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowSubForm(false); setSubName(''); setSubPrice(''); setSubCategory('Other'); setSubCycle('monthly'); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-hover text-muted hover:text-foreground transition-all"
                  >
                    {T('cancel')}
                  </button>
                  <button
                    onClick={() => {
                      const priceNum = parseFloat(subPrice) || 0;
                      if (!subName.trim() || priceNum <= 0) return;
                      addSubscription({
                        name: subName.trim(),
                        category: subCategory,
                        price: priceNum,
                        cycle: subCycle,
                        startDate: Date.now(),
                        enabled: true,
                      });
                      setSubJustAdded(true);
                      setTimeout(() => {
                        setSubName('');
                        setSubPrice('');
                        setSubCategory('Other');
                        setSubCycle('monthly');
                        setShowSubForm(false);
                        setSubJustAdded(false);
                      }, 600);
                    }}
                    disabled={!subName.trim() || (parseFloat(subPrice) || 0) <= 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
                  >
                    {subJustAdded ? T('addedToList') : T('addSubscription')}
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
