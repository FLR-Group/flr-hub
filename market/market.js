/* ============================================================================
   FLR Hub: Market Watch (Hub tile 'market').

   What's happening in FLR's market, refreshed without anyone doing anything:
     - every weekday morning: local news sorted into leads and LinkedIn post ideas
       (Firecrawl reads each new story and says why it matters), and public tenders
       that mention flooring;
     - every Monday: what people search for (Google Trends, UK), and contractor
       wins: main contractors that have won Midlands jobs FLR could floor;
     - on the 3rd of each month: what five rival contractors' homepages claim.
   Website visits (Similarweb) are switched off to save Firecrawl credits (the
   user's choice, 2 Nov 2026): the Traffic tab keeps the last figures fetched.

   Data: public.market_board() (Estimator repo; app check 'market'), filled by the
   flr-market Edge Function. Until that function is in the database the page shows
   the findings of 2 November 2026 as SAMPLE data, labelled on the page.

   Shape of market_board():
     { readAt: { daily, weekly, monthly }, failing: { daily, weekly, monthly }, credits: { month, used },
       items:       [{ id, kind: lead|post|tender, url, title, source, published, summary, why,
                       buyer, area, value, closes, local, firstSeen }],
       competitors: [{ name, url, area, us, headline, claims[], sectors[], services[], work[], brands[] }],
       trends:      { terms[], england[], related: [{ query, score, rise }] },
       traffic:     { month, sites: [{ name, domain, us, visits }] } }
   firstSeen is when Market Watch first found the item: "New" marks the last 24 hours.
   A contractor win is a lead with a buyer (the contractor that won the job); news
   leads never have one.

   The page's CSP allows no inline styles: everything is built as elements, and bar
   widths are set through the CSSOM (allowed under style-src 'self').
   ========================================================================== */
(function () {
  'use strict';
  const cfg = window.FLR_CONFIG || {};
  const AUTH_KEY = 'flr-estimator-auth';
  const SIGN_IN = '../?next=market';
  const TILE = 'market';
  const PANE_KEY = 'flr-market-pane';
  const $ = s => document.querySelector(s);

  /* ---------------------------------------------------------------- building the page (text only) */
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, String(v));
    }
    for (const k of kids.flat(Infinity)) if (k != null && k !== false && k !== '') n.append(k instanceof Node ? k : String(k));
    return n;
  }
  // Only http(s) links leave the page; anything else becomes plain text.
  const safeUrl = u => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '');
  const link = (url, text, cls) => safeUrl(url) ? h('a', { class: cls, href: safeUrl(url), target: '_blank', rel: 'noopener' }, text) : h('span', { class: cls }, text);

  /* ---------------------------------------------------------------- dates (UK time) */
  const TZ = 'Europe/London';
  const fmtAgo = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fmtDay = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const nf = new Intl.NumberFormat('en-GB');
  const isNew = it => it.firstSeen && (Date.now() - new Date(it.firstSeen)) < 24 * 3600e3;
  function closesSoon(s) { const t = Date.parse(s); return !isNaN(t) && t - Date.now() < 14 * 24 * 3600e3 && t > Date.now() - 24 * 3600e3; }
  function closesText(s) { const t = Date.parse(s); return isNaN(t) ? String(s || '') : fmtDay.format(new Date(t)); }
  // How late each refresh may be before the page says so.
  const LATE = { daily: 4 * 24 * 3600e3, weekly: 8 * 24 * 3600e3, monthly: 33 * 24 * 3600e3 };   // daily runs on weekdays only
  function when(part, label) {
    const at = DATA.readAt && DATA.readAt[part] ? new Date(DATA.readAt[part]) : null;
    const late = !DATA.sample && (!at || (DATA.failing && DATA.failing[part]) || (Date.now() - at) > LATE[part]);
    const text = DATA.sample ? `Sample from ${label}` : at ? `Updated ${fmtAgo.format(at)}${late ? ' (late: the last refresh didn’t work)' : ''}` : 'Not refreshed yet';
    return h('span', { class: 'when' + (late ? ' late' : '') }, text);
  }

  /* ---------------------------------------------------------------- sample data: the findings of 2 Nov 2026 */
  function sample() {
    const d = '2026-11-02T08:00:00Z';
    const it = (o) => Object.assign({ firstSeen: d }, o);
    return {
      sample: true, readAt: { daily: d, weekly: d, monthly: d }, failing: {}, credits: { month: '2026-11', used: 640 },
      items: [
        it({ id: 's1', kind: 'tender', url: 'https://www.find-tender.service.gov.uk/procurement/ocds-h6vhtk-0782b9', title: 'Interim Capital Programme', buyer: 'Sandwell Metropolitan Borough Council', area: 'West Midlands', value: '£9.6m a year for 2 years', closes: '2026-11-13T15:00:00Z', local: true, summary: 'Component replacement works on council properties, including flooring renewals. No separate flooring lot.', why: 'Approach the main contractors bidding for it about the flooring package.' }),
        it({ id: 's2', kind: 'tender', url: 'https://www.architectsjournal.co.uk/competitions/coventry-schools-expansion-framework-2027-31', title: 'Coventry schools expansion framework 2027–31', buyer: 'Coventry City Council', area: 'West Midlands', value: '£5m', closes: '2026-11-16T12:00:00Z', local: true, summary: 'Framework for school expansion and capital projects.', why: 'Listed under architects’ competitions, so check it covers contractors.' }),
        it({ id: 's3', image: 'https://www.placemidlands.co.uk/wp-content/uploads/centrecity-estilo-p-estilo-e1791800780926.jpeg', kind: 'lead', url: 'https://www.placemidlands.co.uk/bruntwood-scitech-picks-estilo-for-1-5m-office-fit-out/', title: 'Bruntwood SciTech picks Estilo for £1.5m Centre City fit-out', source: 'Place Midlands', published: '2026-10-12T10:28:15+00:00', summary: 'About 30,000 sq ft of Cat A+ and Cat B fit-out on floors 5, 12 and 20 near New Street.', why: 'Approach Estilo Interiors about the flooring package.' }),
        it({ id: 's8', kind: 'lead', url: 'https://www.derbyshiretimes.co.uk/your-world/derbyshires-g-f-tomlinson-appointed-to-new-constructing-west-midlands-framework-9288701', title: 'G F Tomlinson appointed to the new Constructing West Midlands framework', source: 'Derbyshire Times', published: '2026-10-17T09:15:00+01:00', buyer: 'G F Tomlinson', area: 'West Midlands', value: '£2m to £15m jobs', local: true, summary: 'For Constructing West Midlands. One of six partners on the CWM3 Medium Works lot (schools, council buildings, courts).', why: 'Ask G F Tomlinson to add FLR to its flooring supply chain for CWM3 jobs.' }),
        it({ id: 's4', image: 'https://www.thebusinessdesk.com/_files/images/oct_26/kinspace-Stephen-Parsons-10.26.jpg', kind: 'lead', url: 'https://www.thebusinessdesk.com/westmidlands/news/2117736-office-principles-north-rebrands-as-kinspace', title: 'Office Principles North rebrands as kinspace', source: 'TheBusinessDesk', published: '2026-10-06T11:26:38+00:00', summary: 'A Midlands workplace design and fit-out firm with a big-name client list.', why: 'A possible regular flooring partner.' }),
        it({ id: 's5', image: 'https://www.greaterbirminghamchambers.com/static/95758424-cc66-4f41-95fdea0aa9866956/opengraphimage_83f4e8796336604b59d7216d0ecd81a5_4a7c7e45a350/Friars-Gate-Solihull.jpg', kind: 'lead', url: 'https://www.greaterbirminghamchambers.com/resource/property-consultancy-secures-new-office-letting-at-friars-gate.html', title: 'CIPP takes new office space at Friars Gate', source: 'Greater Birmingham Chambers', published: '1 week ago', summary: 'A new letting, so a fit-out is likely.', why: 'Find out who is delivering the fit-out.' }),
        it({ id: 's6', image: 'https://hermes.media.static.aol.com/media/2026/10/21/c8c3813b-797b-3052-8674-ded33ab51ff2/d5a4b786-2fcd-49d6-8c5f-dd92f84dfbd7.jpg', kind: 'lead', url: 'https://www.aol.com/articles/grand-theatre-set-8-5m-162725000.html', title: 'Wolverhampton Grand Theatre: £8.5m repair work', source: 'AOL', published: '2 weeks ago', summary: 'Repair and maintenance work agreed by the city council.', why: 'Our Hippodrome track record is the way in.' }),
        it({ id: 's7', image: 'https://www.insidermedia.com/uploads/news/images/Pegasus_Care_Chesters.jpg', kind: 'lead', url: 'https://www.insidermedia.com/news/midlands/pegasus-care-makes-north-east-buy-in-first-expansion-outside-of-the-west-midlands', title: 'Pegasus Care expands beyond the West Midlands', source: 'Insider Media', published: '2 weeks ago', summary: 'A growing West Midlands care group.', why: 'A prospect for care-home refurbishments.' }),
        it({ id: 's8', image: 'https://www.birmingham-now.co.uk/resources/images/21543799.jpg?type=og-image', kind: 'post', url: 'https://www.birmingham-now.co.uk/news/26611278.birmingham-one-uks-highest-office-rent-prices/', title: 'Birmingham is the 3rd most expensive office city outside London', source: 'Birmingham Now', published: '2026-10-11T12:00:00Z', summary: '£24.84 per sq ft on average.', why: 'At that rent, every square foot should work hard.' }),
        it({ id: 's9', image: 'https://media.deloitte.com/is/image/deloitte/deloitte-new-birmingham-headquarters-banner:1200-x-627', kind: 'post', url: 'https://www.deloitte.com/uk/en/about/press-room/deloitte-makes-long-term-investment-in-midlands-with-move-to-new-birmingham-headquarters.html', title: 'Deloitte opens its new HQ at One Centenary Way', source: 'Deloitte', published: '2 weeks ago', summary: 'A major firm moves into new Birmingham offices.', why: 'A post on the fit-out quality big firms now expect.' }),
        it({ id: 's10', image: 'https://assets.publishing.service.gov.uk/media/6ad5d9a3dfa45fcb6753cb8c/s960_busy_nhs_ward_blurred.jpg', kind: 'post', url: 'https://www.gov.uk/government/news/140-million-boost-to-urgent-care-to-ease-winter-pressures-on-nhs', title: '£140m for NHS urgent care, including Midlands sites', source: 'GOV.UK', published: '2026-10-17T23:23:00Z', summary: 'New urgent treatment centres at the QE Birmingham and Royal Stoke.', why: 'A healthcare-flooring post, and a pointer to future NHS work.' }),
      ],
      competitors: [
        { name: 'FLR Group', url: 'https://www.flr.co.uk/', area: 'Solihull', us: true, headline: 'Commercial Flooring Contractors', claims: ['Projects in 2025, miles covered and "Established since" counters', 'm² and happy customers counters show 0+'], sectors: ['Schools', 'Leisure & hospitality', 'Offices', 'Healthcare', 'Retail'], services: ['Carpet tiles', 'Carpets', 'Safety flooring', 'Installation', 'Loose lay'], work: ['Feal Pilates', 'Perspective Opticians', 'Prince & Bates Opticians'], brands: [] },
        { name: 'Newlay Floors', url: 'https://www.newlayfloors.co.uk/', area: 'Birmingham', headline: 'Leading flooring contractors in Birmingham', claims: ['Over 30 years’ experience'], sectors: ['Healthcare', 'Education', 'Public', 'Retail'], services: ['Safety flooring', 'Vinyl', 'Lino', 'Carpet tiles', 'LVT'], work: ['NHS', 'TK Maxx', 'Barclays', 'NatWest', 'West Midlands Police', 'HM Prison Service'], brands: ['Altro', 'Amtico', 'Interface', 'Forbo', 'Mapei', 'Karndean'] },
        { name: 'Pinnacle Flooring', url: 'https://pinnacleflooring.co.uk/', area: 'Birmingham', headline: 'Accredited flooring Birmingham specialist', claims: ['Acclaim accreditation', 'Contract Flooring Association members', 'CSCS fitters', '30+ years’ management experience'], sectors: ['Education', 'Commercial', 'Sports', 'Healthcare', 'Retail'], services: ['Floor prep', 'Safety vinyl', 'LVT', 'Sports', 'Carpet tiles', 'Wall cladding'], work: ['Birmingham Council House', 'Cinnamon Care Home'], brands: [] },
        { name: 'Stebro Flooring', url: 'https://stebro-flooring.co.uk/', area: 'Birmingham', headline: 'The UK’s leading commercial flooring contractor', claims: ['Over 50 years', '1000s of floors across the UK and Europe'], sectors: ['Offices', 'Schools', 'Warehouses', 'Restaurants', 'Retail'], services: ['Contract flooring installation', 'Product advice'], work: [], brands: [] },
        { name: 'The Commercial Flooring Company', url: 'https://www.commercialflooring.uk.net/', area: 'UK-wide', headline: 'A commercial flooring contractor you can trust', claims: ['Over a decade of expertise'], sectors: [], services: ['Commercial and multi-room flooring'], work: ['BT Birmingham', 'HSBC Sheffield', 'Science Museum'], brands: [] },
        { name: 'Solihull Flooring', url: 'https://www.solihullflooring.co.uk/commercial-flooring/', area: 'Solihull', headline: 'Reliable flooring contractors', claims: ['Over 20 years', 'Free site survey'], sectors: ['Commercial', 'Industrial'], services: ['Supply and install all flooring types'], work: [], brands: ['Altro', 'Amtico', 'Forbo', 'Karndean', 'Polyflor', 'Tarkett'] },
      ],
      trends: {
        terms: ['LVT flooring', 'Carpet tiles', 'Commercial flooring', 'Office flooring', 'Safety flooring'], england: [64, 22, 7, 4, 3],
        related: [{ query: 'commercial flooring vinyl', score: 100 }, { query: 'commercial flooring uk', score: 71, rise: '+100%' }, { query: 'commercial flooring near me', score: 30 },
          { query: 'commercial flooring company', score: 24, rise: '+60%' }, { query: 'commercial flooring contractors', score: 19, rise: '+40%' }, { query: 'commercial flooring services', score: 19, rise: '+60%' },
          { query: 'commercial flooring installation', score: 16, rise: '+40%' }, { query: 'commercial flooring service', score: 13, rise: '+250%' }],
      },
      traffic: { month: '2026-09', sites: [{ name: 'FLR Group', domain: 'flr.co.uk', us: true, visits: 1901 }, { name: 'Solihull Flooring', domain: 'solihullflooring.co.uk', visits: 1206 }, { name: 'Stebro', domain: 'stebro-flooring.co.uk', visits: 1147 }, { name: 'The Commercial Flooring Company', domain: 'commercialflooring.uk.net', visits: 317 }, { name: 'Newlay', domain: 'newlayfloors.co.uk', visits: 215 }, { name: 'Pinnacle', domain: 'pinnacleflooring.co.uk', visits: null }] },
    };
  }

  /* ---------------------------------------------------------------- the panes */
  let DATA = null;
  let pane = 'today';
  let newsFilter = 'all';
  try { pane = localStorage.getItem(PANE_KEY) || 'today'; } catch (e) { /* private window */ }
  const items = k => (DATA.items || []).filter(i => i.kind === k);

  function bars(rows, label) {   // rows: [{ name, value, us }] drawn to one scale
    const max = Math.max(1, ...rows.map(r => r.value || 0));
    return h('div', { class: 'bars', role: 'img', 'aria-label': label + ': ' + rows.map(r => `${r.name} ${r.value == null ? 'no figure' : nf.format(r.value)}`).join(', ') },
      rows.map(r => {
        const f = h('span', { class: 'fill' + (r.us === false ? ' dim' : '') });
        f.style.width = r.value ? (100 * r.value / max).toFixed(1) + '%' : '0';
        return h('div', { class: 'bar' }, h('span', {}, r.us ? h('strong', {}, r.name) : r.name), h('span', { class: 'track' }, f), h('span', { class: 'v' }, r.value == null ? '–' : nf.format(r.value)));
      }));
  }
  function itemRow(i) {
    const tag = i.kind === 'tender' ? 'Tender' : i.kind === 'lead' ? 'Lead' : 'Post';
    const meta = i.kind === 'tender'
      ? [i.buyer, i.area, i.value].filter(Boolean).join(' · ')
      : [i.source, i.published].filter(Boolean).join(' · ');
    return h('li', { class: 'item' },
      h('span', { class: 'tag ' + i.kind, text: tag }),
      h('div', {}, link(i.url, i.title || i.url, 't'), isNew(i) ? h('span', { class: 'new', text: 'New' }) : null),
      i.summary ? h('p', { text: i.summary }) : null,
      i.why ? h('p', {}, h('strong', { text: i.kind === 'post' ? 'Post idea: ' : 'Next step: ' }), i.why) : null,
      h('p', { class: 'meta' }, meta, i.closes ? [' · Closes ', h('span', { class: 'closes' + (closesSoon(i.closes) ? ' soon' : ''), text: closesText(i.closes) })] : null));
  }
  function list(rows, empty) { return h('ul', { class: 'list' }, rows.length ? rows.map(itemRow) : h('li', { class: 'empty', text: empty })); }

  /* ---------------------------------------------------------------- news cards: the story's own picture, headline, what it means for FLR, and the link */
  const fmtPub = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' });
  const pubText = v => { const t = /^\d{4}-\d{2}-\d{2}/.test(String(v || '')) ? Date.parse(v) : NaN; return isNaN(t) ? String(v || '') : fmtPub.format(new Date(t)); };
  const siteOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  // No picture, or it won't load: a panel in the story's colour with the publisher's initials.
  const isWin = i => i.kind === 'lead' && !!i.buyer;
  function noPicture(i) {
    const who = i.source || siteOf(i.url) || '?';
    return h('div', { class: 'pic none ' + i.kind, 'aria-hidden': 'true' }, h('span', { text: who.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') }));
  }
  function picture(i) {
    if (!/^https:\/\//.test(String(i.image || ''))) return noPicture(i);
    const img = h('img', { src: i.image, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => img.parentNode && img.parentNode.replaceWith(noPicture(i)), { once: true });
    return h('div', { class: 'pic' }, img);
  }
  function card(i, size) {   // size: 'hero' | 'std' | 'mini'
    const tag = isWin(i) ? 'Contractor win' : i.kind === 'lead' ? 'Lead' : 'Post idea';
    const where = i.source || siteOf(i.url);
    const href = safeUrl(i.url);
    return h('article', { class: 'story ' + size + ' ' + i.kind },
      href ? h('a', { class: 'pic-link', href, target: '_blank', rel: 'noopener', tabindex: '-1', 'aria-hidden': 'true' }, picture(i)) : picture(i),
      h('div', { class: 'body' },
        h('p', { class: 'kicker' }, h('span', { class: 'tag ' + i.kind + (isWin(i) ? ' win' : ''), text: tag }), isNew(i) ? h('span', { class: 'new', text: 'New' }) : null,
          h('span', { class: 'src', text: [where, pubText(i.published)].filter(Boolean).join(' · ') })),
        h('h3', { class: 'headline' }, link(i.url, i.title || i.url)),
        isWin(i) ? h('p', { class: 'won' }, h('strong', { text: i.buyer }), [i.area, i.value].filter(Boolean).map(x => ' · ' + x).join('')) : null,
        size !== 'mini' && i.summary ? h('p', { class: 'standfirst', text: i.summary }) : null,
        i.why ? h('p', { class: 'why' }, h('strong', { text: i.kind === 'post' ? 'Post idea' : 'Next step' }), ' ', i.why) : null,
        href ? h('a', { class: 'read', href, target: '_blank', rel: 'noopener' }, 'Read on ' + (where || 'the website'), h('span', { 'aria-hidden': 'true', text: '↗' })) : null));
  }
  function front(rows, empty) {   // the first story large, the rest in a grid
    if (!rows.length) return h('p', { class: 'empty card', text: empty });
    return h('div', { class: 'front' }, card(rows[0], 'hero'), rows.length > 1 ? h('div', { class: 'stories' }, rows.slice(1).map(r => card(r, 'std'))) : null);
  }
  const leadsFirst = rows => rows.slice().sort((a, b) => (a.kind === 'lead' ? 0 : 1) - (b.kind === 'lead' ? 0 : 1) || (Date.parse(b.firstSeen) || 0) - (Date.parse(a.firstSeen) || 0));

  const PANES = {
    today: {
      label: 'Today', count: () => (DATA.items || []).filter(isNew).length,
      render() {
        const fresh = (DATA.items || []).filter(isNew);
        const freshNews = fresh.filter(i => i.kind !== 'tender'), freshTenders = fresh.filter(i => i.kind === 'tender');
        const soon = items('tender').filter(t => closesSoon(t.closes));
        const stat = (n, text, go, alert) => h('button', { class: 'stat' + (alert && n ? ' alert' : ''), type: 'button', onclick: () => pick(go) }, h('b', { text: String(n) }), h('span', { text }));
        return [
          h('h2', { text: 'Since yesterday' }), when('daily', '2 November 2026'),
          h('div', { class: 'stats' },
            stat(items('lead').length, 'possible leads', 'news'),
            stat(items('tender').length, 'open tenders', 'tenders'),
            stat(soon.length, 'tenders closing within 2 weeks', 'tenders', true)),
          freshNews.length ? h('h3', { class: 'section', text: 'New stories' }) : null,
          freshNews.length ? front(leadsFirst(freshNews).slice(0, 7), '') : null,
          freshTenders.length ? h('h3', { class: 'section', text: 'New tenders' }) : null,
          freshTenders.length ? list(freshTenders, '') : null,
          fresh.length ? null : h('p', { class: 'note', text: 'Market Watch didn’t find new stories or tenders this morning. The lists keep the last 30 days.' }),
        ];
      },
    },
    news: {
      label: 'Leads & posts', count: () => items('lead').concat(items('post')).filter(isNew).length,
      render() {
        const rows = (DATA.items || []).filter(i => i.kind !== 'tender' && (newsFilter === 'all' || (newsFilter === 'win' ? isWin(i) : i.kind === newsFilter)));
        const chip = (k, text) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(newsFilter === k), onclick: () => { newsFilter = k; render(); } }, text);
        return [
          h('h2', { text: 'Leads and post ideas' }), when('daily', '2 November 2026'),
          h('p', { class: 'note', text: 'Midlands office, school, healthcare and care-home stories from the last month. Firecrawl reads each new story and says whether it could be work for FLR or a LinkedIn post. Every Monday it also looks for main contractors that have won Midlands jobs: their flooring package comes months later, so these are the firms to approach now.' }),
          h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' }, chip('all', 'All'), chip('lead', 'Leads'), chip('win', 'Contractor wins'), chip('post', 'Post ideas')),
          front(leadsFirst(rows), 'No stories in the last 30 days.'),
        ];
      },
    },
    tenders: {
      label: 'Tenders', count: () => items('tender').filter(isNew).length,
      render() {
        const rows = items('tender').slice().sort((a, b) => (b.local ? 1 : 0) - (a.local ? 1 : 0) || (Date.parse(a.closes) || 9e15) - (Date.parse(b.closes) || 9e15));
        return [
          h('h2', { text: 'Public tenders' }), when('daily', '2 November 2026'),
          h('p', { class: 'note', text: 'Open Find a Tender notices that mention flooring. Firecrawl reads each new one and keeps it only if FLR could bid for it or win its flooring. Local ones first, then soonest closing. Contracts Finder can’t be read from the FLR server, so its notices come by its own email alert.' }),
          list(rows, 'No open tenders mention flooring right now.'),
        ];
      },
    },
    competitors: {
      label: 'Competitors',
      render() {
        const rows = DATA.competitors || [];
        const cell = a => (a && a.length) ? a.join(', ') : h('span', { class: 'when', text: 'None on homepage' });
        return [
          h('h2', { text: 'What rivals’ homepages say' }), when('monthly', '2 November 2026'),
          h('p', { class: 'note', text: 'Read on the 3rd of each month from each homepage, in their own words. Inner pages may say more.' }),
          h('div', { class: 'scroll' }, h('table', { class: 'comp' },
            h('thead', {}, h('tr', {}, ['Contractor', 'Headline & claims', 'Sectors', 'Services', 'Named work', 'Brands shown'].map(t => h('th', { text: t })))),
            h('tbody', {}, rows.map(c => h('tr', { class: c.us ? 'us' : null },
              h('td', {}, link(c.url, c.name), h('small', { text: c.area || '' })),
              h('td', {}, c.headline ? h('strong', { text: '“' + c.headline + '”' }) : null, (c.claims || []).length ? h('small', { text: c.claims.join(' · ') }) : null),
              h('td', {}, cell(c.sectors)), h('td', {}, cell(c.services)), h('td', {}, cell(c.work)), h('td', {}, cell(c.brands))))))),
        ];
      },
    },
    search: {
      label: 'Search',
      render() {
        const t = DATA.trends || {};
        const rows = (t.terms || []).map((n, i) => ({ name: n, value: (t.england || [])[i] }));
        return [
          h('h2', { text: 'What people search for' }), when('weekly', '2 November 2026'),
          h('p', { class: 'note', text: 'Google Trends, UK, the last 12 months. Scores are relative: 100 is the most-searched phrase in each set, not a count.' }),
          h('div', { class: 'grid' },
            h('div', { class: 'card' }, h('h3', { text: 'Share of searches, England' }), bars(rows, 'Share of searches in England')),
            h('div', { class: 'card' }, h('h3', { text: 'Searched alongside “commercial flooring”' }),
              h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', { text: 'Phrase' }), h('th', { class: 'num', text: 'Score' }), h('th', { class: 'num', text: 'Rising' }))),
                h('tbody', {}, (t.related || []).map(r => h('tr', {}, h('td', { text: r.query }), h('td', { class: 'num', text: r.score == null ? '' : String(r.score) }), h('td', { class: 'num' }, r.rise ? h('span', { class: 'up', text: r.rise }) : '')))))))),
        ];
      },
    },
    traffic: {
      label: 'Traffic',
      render() {
        const tr = DATA.traffic || { sites: [] };
        const rows = (tr.sites || []).filter(s => s.visits != null).sort((a, b) => b.visits - a.visits).map(s => ({ name: s.name, value: Math.round(s.visits / 10) * 10, us: !!s.us }));
        const missing = (tr.sites || []).filter(s => s.visits == null).map(s => s.name);
        const month = tr.month ? fmtMonth.format(new Date(tr.month + '-01T00:00:00Z')) : '';
        return [
          h('h2', { text: 'Estimated website visits' + (month ? ', ' + month : '') }),
          h('p', { class: 'note', text: 'Similarweb estimates, worldwide, all devices, rounded to the nearest 10. For sites this small they’re rough, so compare them with flr.co.uk’s own analytics. Refreshing them is switched off for now to save Firecrawl credits (about 660 a month), so these are the last figures fetched.' }),
          h('div', { class: 'card' }, rows.length ? bars(rows, 'Estimated visits') : h('p', { class: 'when', text: 'No visit figures yet.' }), missing.length ? h('p', { class: 'when', text: 'No figure this month: ' + missing.join(', ') + '.' }) : null),
          DATA.credits && DATA.credits.used != null ? h('p', { class: 'when', text: `Firecrawl credits used by Market Watch in ${DATA.credits.month ? fmtMonth.format(new Date(DATA.credits.month + '-01T00:00:00Z')) : 'this month'}: ${nf.format(DATA.credits.used)}.` }) : null,
        ];
      },
    },
  };

  function pick(k) {
    if (!PANES[k]) return;
    pane = k;
    try { localStorage.setItem(PANE_KEY, k); } catch (e) { /* private window */ }
    render();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function render() {
    if (!PANES[pane]) pane = 'today';
    $('#sampleLabel').hidden = !DATA.sample;
    const anyLate = !DATA.sample && DATA.failing && Object.values(DATA.failing).some(Boolean);
    $('#readAt').className = anyLate ? 'late' : '';
    $('#readAt').textContent = anyLate ? 'The last refresh didn’t work; what’s shown may be out of date.' : '';
    $('#tabs').replaceChildren(...Object.entries(PANES).map(([k, p]) => {
      const n = p.count ? p.count() : 0;
      return h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(k === pane), 'aria-controls': 'pane-' + k, onclick: () => pick(k) }, p.label, n ? h('span', { class: 'n', text: String(n) }) : null);
    }));
    $('#panes').replaceChildren(h('section', { class: 'pane', id: 'pane-' + pane, role: 'tabpanel' }, PANES[pane].render()));
  }

  /* ================================================================ the Hub: signed in, and the app is theirs */
  function gate(title, text, o = {}) {
    document.body.dataset.view = 'gate';
    $('#view').hidden = true; $('#gate-message').hidden = false;
    $('#gate-title').textContent = title; $('#gate-text').textContent = text;
    $('#gate-retry').hidden = !o.retry;
  }
  let sb = null;
  const client = () => {
    if (sb) return sb;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_KEY },
    });
    return sb;
  };
  const flrCode = e => { const m = /FLR_[A-Z_]+/.exec(e ? `${e.message || ''} ${e.details || ''}` : ''); return m ? m[0] : ''; };
  const missingFunction = e => !!e && (e.code === 'PGRST202' || e.code === '42883' || /could not find the function/i.test(e.message || ''));
  const offline = e => !!e && /Failed to fetch|NetworkError|Load failed|fetch failed/i.test(e.message || '');
  const expired = e => !!e && (e.code === 'PGRST301' || e.code === 'PGRST303' || /JWT expired|invalid JWT/i.test(e.message || ''));
  function failGate(e) {
    const code = flrCode(e);
    if (expired(e) || code === 'FLR_SIGN_IN_REQUIRED') return location.replace(SIGN_IN);
    if (code === 'FLR_ACCOUNT_DISABLED') return gate('Your account is switched off', 'Ask an FLR Super Admin to switch it back on.');
    if (code === 'FLR_NO_PROFILE') return gate('No FLR profile yet', 'You’re signed in, but this account has no FLR profile. Ask an FLR Super Admin.');
    if (code === 'FLR_FORBIDDEN') return gate('You don’t have access to Market Watch', 'If you think you should have it, ask an FLR Super Admin.');
    if (missingFunction(e)) return gate('Market Watch isn’t ready yet', 'The FLR database doesn’t have the Hub’s apps yet.');
    if (offline(e)) return gate('Can’t reach the FLR database', 'Check your connection and try again.', { retry: true });
    return gate('Market Watch didn’t load', 'Something went wrong. Try again in a moment.', { retry: true });
  }
  async function load() {
    const { data, error } = await client().rpc('market_board');
    if (error && missingFunction(error)) return sample();   // the database doesn't have the app's data yet
    if (error) throw error;
    return data;
  }
  async function show() {
    DATA = await load();
    render();
    document.body.dataset.view = 'ready';
    $('#view').hidden = false;
  }
  async function check() {
    try {
      const { data, error } = await client().rpc('hub_home');
      if (error) return failGate(error);
      if (data && data.waiting) return gate('Your account is waiting for a Super Admin', 'An FLR Super Admin needs to check who you are before you can use the Hub’s apps.');
      const tiles = (data && Array.isArray(data.tiles)) ? data.tiles : [];
      if (!tiles.some(t => t && t.id === TILE)) return gate('You don’t have access to Market Watch', 'It’s switched on for the FLR staff who need it. If you think you should have it, ask an FLR Super Admin.');
      await show();
    } catch (e) { failGate(e); }
  }
  $('#gate-retry').addEventListener('click', () => { document.body.dataset.view = 'loading'; $('#gate-message').hidden = true; check(); });
  // Read again every 15 minutes while open (the function runs once a morning, so this only catches a run that lands while the page is open).
  setInterval(async () => {
    if (document.hidden || document.body.dataset.view !== 'ready' || (DATA && DATA.sample)) return;
    try { const d = await load(); if (d) { DATA = d; render(); } } catch (e) { /* keep what's shown */ }
  }, 15 * 60e3);

  async function boot() {
    const c = client();
    if (!c) return gate('Market Watch isn’t set up here', 'This copy of the Hub has no FLR sign-in settings.');
    let session = null;
    try { session = (await c.auth.getSession()).data.session; } catch (e) { /* signed out */ }
    if (!session) return location.replace(SIGN_IN);
    await check();
  }
  boot();
})();
