'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';

export default function InstallPrompt() {
    const [isStandalone, setIsStandalone] = useState(true); // default true to prevent flash
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    // Track if user dismissed it in this session to prevent annoyance
    const [dismissed, setDismissed] = useState(false);

    // We can use the store language to localize standard texts if we want,
    // but here we just safely fall back to english or minimal text.
    // For now, let's just use simple English or localized text if we had the keys.
    const language = useStore((s) => s.language);

    // Polyfill simple translations since we might not have all these keys in i18n
    const T = (zh: string, en: string) => {
        if (language === 'zh-TW') return zh;
        if (language === 'zh-CN') return zh;
        return en;
    };

    useEffect(() => {
        if (dismissed) return;

        // Detect if the app is standalone
        const isStandaloneMatchMedia = window.matchMedia('(display-mode: standalone)').matches;
        const isFullscreenMatchMedia = window.matchMedia('(display-mode: fullscreen)').matches;
        const isIOSStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;

        const standalone = isStandaloneMatchMedia || isFullscreenMatchMedia || isIOSStandalone;
        setIsStandalone(standalone);

        if (!standalone) {
            // Small delay so it's not jarring
            const timer = setTimeout(() => setShowPrompt(true), 1500);
            const userAgent = window.navigator.userAgent.toLowerCase();
            setIsIOS(/iphone|ipad|ipod/.test(userAgent));

            return () => clearTimeout(timer);
        }
    }, [dismissed]);

    if (isStandalone || !showPrompt || dismissed) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur-xl border-t border-border z-[100] flex flex-col gap-2 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <h3 className="font-bold text-foreground text-sm tracking-wide">
                        {T('安裝 TrueCost 應用程式', 'Install TrueCost App')}
                    </h3>
                    <p className="text-xs text-muted mt-0.5 max-w-[90%]">
                        {T('加入主畫面以獲得全螢幕的最佳體驗。', 'Add to your home screen for the best full-screen experience.')}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowPrompt(false);
                        setDismissed(true);
                    }}
                    className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-full transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            {isIOS ? (
                <div className="text-xs text-muted bg-surface-hover p-2.5 rounded-lg flex items-center gap-3 mt-1 border border-border/50">
                    <div className="bg-surface p-1 rounded-md shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    </div>
                    <span>{T('點擊「分享」圖示，然後選擇', 'Tap the Share icon, then select')} <b>{T('「加入主畫面」', '"Add to Home Screen"')}</b></span>
                </div>
            ) : (
                <div className="text-xs text-muted bg-surface-hover p-2.5 rounded-lg flex items-center gap-3 mt-1 border border-border/50">
                    <div className="bg-surface p-1 rounded-md shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                    </div>
                    <span>{T('進入瀏覽器選單，選擇', 'Open browser menu and select')} <b>{T('「加到主畫面」', '"Add to Home screen"')}</b> {T('或', 'or')} <b>{T('「安裝應用程式」', '"Install app"')}</b></span>
                </div>
            )}
        </div>
    );
}
