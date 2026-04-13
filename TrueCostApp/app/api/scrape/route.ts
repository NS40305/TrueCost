import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const AMAZON_HOST = /^(www\.)?amazon\.(com|co\.uk|ca|de|fr|it|es|co\.jp|com\.au|in|com\.br|com\.mx|nl|sg|ae|sa|pl|se|com\.be|com\.tr|eg)$/;
const SHORT_HOSTS  = /^(a\.co|amzn\.to)$/;
const ALLOWED_HOSTS = [AMAZON_HOST, SHORT_HOSTS];

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_REDIRECTS = 5;

export async function POST(req: Request) {
    try {
        const { url: rawUrl } = await req.json();

        if (!rawUrl || typeof rawUrl !== 'string') {
            return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
        }

        let parsed: URL;
        try {
            parsed = new URL(rawUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 });
        }

        if (!ALLOWED_HOSTS.some(re => re.test(parsed.hostname))) {
            return NextResponse.json({ error: 'Only Amazon URLs are supported' }, { status: 400 });
        }

        const browserHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/',
            'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'cross-site',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
        };

        // Resolve short URLs (a.co / amzn.to) by following redirects manually
        let targetUrl = parsed.href;
        if (SHORT_HOSTS.test(parsed.hostname)) {
            let location = parsed.href;
            for (let i = 0; i < MAX_REDIRECTS; i++) {
                const rRes = await fetch(location, { redirect: 'manual', headers: browserHeaders });
                const loc = rRes.headers.get('location');
                if (!loc || rRes.status < 300 || rRes.status >= 400) break;
                location = loc.startsWith('/') ? `${new URL(location).origin}${loc}` : loc;
            }
            const finalUrl = new URL(location);
            if (!AMAZON_HOST.test(finalUrl.hostname)) {
                return NextResponse.json({ error: 'Short URL did not resolve to Amazon' }, { status: 400 });
            }
            targetUrl = finalUrl.href;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            redirect: 'follow',
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: browserHeaders,
        });

        clearTimeout(timer);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_BODY_BYTES) {
            return NextResponse.json({ error: 'Response too large' }, { status: 413 });
        }

        const html = await response.text();

        if (html.length > MAX_BODY_BYTES) {
            return NextResponse.json({ error: 'Response too large' }, { status: 413 });
        }

        // Check if we hit a captcha
        if (html.includes('api-services-support@amazon.com') || html.includes('Enter the characters you see below')) {
            console.warn('Amazon Capcha encountered');
            return NextResponse.json({
                error: 'CAPTCHA_BLOCKED',
                message: 'Amazon blocked the request. Please enter the price manually for now.'
            }, { status: 403 });
        }

        const $ = cheerio.load(html);

        let title = '';
        let price = 0;

        // ── Strategy 1: JSON-LD structured data (most reliable) ──
        $('script[type="application/ld+json"]').each((_, el) => {
            if (price > 0) return;
            try {
                const ld = JSON.parse($(el).text());
                const items = Array.isArray(ld) ? ld : [ld];
                for (const item of items) {
                    const node = item['@type'] === 'Product' ? item : item.mainEntity;
                    if (!node || node['@type'] !== 'Product') continue;
                    if (!title && node.name) title = node.name;
                    const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
                    if (offer?.price != null) {
                        price = parseFloat(String(offer.price));
                    } else if (offer?.lowPrice != null) {
                        price = parseFloat(String(offer.lowPrice));
                    }
                }
            } catch { /* ignore malformed JSON-LD */ }
        });

        // ── Strategy 2: Meta tags ──
        if (!price) {
            const metaPrice = $('meta[name="product:price:amount"]').attr('content')
                || $('meta[property="product:price:amount"]').attr('content')
                || $('meta[name="og:price:amount"]').attr('content')
                || $('meta[property="og:price:amount"]').attr('content')
                || $('input#attach-base-product-price').attr('value')
                || $('input#priceValue').attr('value');
            if (metaPrice) price = parseFloat(metaPrice.replace(/,/g, '')) || 0;
        }
        if (!title) {
            title = $('meta[name="title"]').attr('content')
                || $('meta[property="og:title"]').attr('content') || '';
            title = title.replace(/^Amazon\.[a-z.]+:\s*/i, '').trim();
        }

        // ── Strategy 3: DOM selectors ──
        if (!title) title = $('#productTitle').text().trim();

        if (!price) {
            const priceSelectors = [
                'span.a-price .a-offscreen',
                '.priceToPay span.a-offscreen',
                '#corePriceDisplay_desktop_feature_div .a-offscreen',
                '#corePrice_desktop .a-offscreen',
                '#price .a-offscreen',
                '#priceblock_ourprice',
                '#priceblock_dealprice',
                '#priceblock_saleprice',
                '#newBuyBoxPrice',
                '#price_inside_buybox',
                '.offer-price',
                '#tp_price_block_total_price_ww .a-offscreen',
            ];

            for (const sel of priceSelectors) {
                const txt = $(sel).first().text().trim();
                if (txt) {
                    const m = txt.replace(/,/g, '').match(/[\d]+(?:\.[\d]+)?/);
                    if (m) { price = parseFloat(m[0]); break; }
                }
            }
        }

        // Fallback: whole + fraction
        if (!price) {
            const whole = $('span.a-price-whole').first().text().trim().replace(/[.,]$/, '');
            if (whole) {
                const frac = $('span.a-price-fraction').first().text().trim() || '00';
                price = parseFloat(`${whole.replace(/,/g, '')}.${frac}`) || 0;
            }
        }

        return NextResponse.json({
            title: (title || 'Unknown Product').substring(0, 200),
            price: price || 0,
            success: true
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json(
            { error: 'Failed to scrape product data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
