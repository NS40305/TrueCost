import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const ALLOWED_HOSTS = [
    /^(www\.)?amazon\.(com|co\.uk|ca|de|fr|it|es|co\.jp|com\.au|in|com\.br|com\.mx|nl|sg|ae|sa|pl|se|com\.be|com\.tr|eg)$/,
    /^a\.co$/,
    /^amzn\.to$/,
];

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

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

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(parsed.href, {
            signal: controller.signal,
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: {
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
            }
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

        // 1. Extract Title
        let title = $('#productTitle').text().trim();
        if (!title) {
            title = $('meta[name="title"]').attr('content') || '';
            title = title.replace(/^Amazon\.[a-z.]+:\s*/i, '').trim();
        }

        // 2. Extract Price
        let priceStr = '';

        // Try various common Amazon price selectors, prioritizing the main buybox
        const priceSelectors = [
            'div#corePriceDisplay_desktop_feature_div .priceToPay',
            'div#corePrice_desktop .priceToPay',
            'div#price .priceToPay',
            'div#corePriceDisplay_desktop_feature_div .priceToPay span.a-offscreen',
            'div#corePrice_desktop .priceToPay span.a-offscreen',
            'div#price .priceToPay span.a-offscreen',
            'span#priceblock_ourprice',
            'span#priceblock_dealprice',
            'div#corePriceDisplay_desktop_feature_div span.a-price-whole',
            'span.a-color-price'
        ];

        for (const selector of priceSelectors) {
            const el = $(selector).first();
            if (el.length) {
                // if we hit '.a-price-whole', we also need to find the fraction
                if (selector.includes('a-price-whole')) {
                    const fraction = el.next('.a-price-fraction').text().trim() || '00';
                    priceStr = el.text().trim() + '.' + fraction;
                } else {
                    priceStr = el.text().trim();
                }
                if (priceStr) break;
            }
        }

        // Fallback: If buybox price fails, grab the first general price that looks legitimate
        if (!priceStr) {
            const fallback = $('.priceToPay span.a-offscreen').first().text().trim();
            if (fallback) priceStr = fallback;
        }

        // Clean up price string (e.g., "$1,299.99" -> 1299.99)
        let price = 0;
        if (priceStr) {
            const match = priceStr.replace(/,/g, '').match(/\d+(\.\d+)?/);
            if (match) {
                price = parseFloat(match[0]);
            }
        }

        return NextResponse.json({
            title: title || 'Unknown Product',
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
