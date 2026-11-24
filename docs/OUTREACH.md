# Outreach drafts

Short, polite emails about showtimes. **Chime sends these, not Claude.** Since D-76 (15 Nov) we read each cinema's own site and ask only where we can't: Filmhouse (section 4). Log the date sent and any reply in `docs/DECISIONS.md` (O-2) and `data/sources.json`.

Find addresses on each site's contact or privacy page. Lagocine's is linked from its privacy page. Don't guess addresses.

---

## 1. Lagocine

**Subject:** Using Lagocine's showtimes in a small open-source project?

Hi,

I'm Chimezie, a product designer in Lagos. I love Lagocine. It's the only place I've found that lists every cinema and says when each time was last read.

I'm building a small, free, open-source web app for Lagos cinema-goers. It answers one question: "what starts in the next two hours near me?" It also adds calendar reminders and whether a film has a scene after the credits. It's a portfolio project. No ads, no ticket sales, no commission.

Would you be open to me using Lagocine's showtimes as the source? I'd credit Lagocine on every showing ("From Lagocine"), link to your pages, and send all booking to the cinemas' own sites, as you do. If you have a JSON feed, I'd read it a few times a day at most. If you'd rather I didn't, that's completely fine and I'll ask the cinemas directly.

Happy to share the repo before it goes public.

Thanks,
Chimezie Ekpendu
chimexd.work

---

## 2. Cinema chains (Filmhouse, Genesis, EbonyLife, Silverbird)

**Subject:** Permission to list [Chain]'s showtimes, with links to your booking

Hi [Chain] team,

I'm Chimezie, a product designer in Lagos. I'm building a free, open-source web app that shows Lagos cinema showtimes in one place, so people can find a film starting soon near them.

I'd like to list [Chain]'s showtimes and send every visitor to your own site to book. I won't sell tickets, show ads or take any commission. Each showing would say "Read from [Chain]'s site" with the time we read it.

Could you tell me if that's OK, and how you'd prefer I get the times? A public feed would be ideal. Otherwise I'd read your public showtimes pages a few times a day, slowly, and stop at once if you ask.

Thank you,
Chimezie Ekpendu
chimexd.work

---

## 3. Syticks

**Subject:** Using the Syticks cinema API in a free Lagos showtimes app

Hi Syticks team,

I'm Chimezie, a product designer in Lagos. I saw your public docs for the cinema experiences API. I'm building a free, open-source web app that lists Lagos showtimes and links to booking.

Could I use the API for this? I'd like to know which Lagos cinemas it covers, whether it needs a key, and any terms I should follow. I'd credit Syticks and link to your booking pages.

Thanks,
Chimezie Ekpendu
chimexd.work

---

## 4. Filmhouse, FilmOne and CINEsync (15 Nov 2026, D-76)

**Sent 17 Nov 2026 (Chime: "Yes, I approve. Send the mail for me")** from ekpenduchimezie1@gmail.com, each with a link to the live site added:
- 4a to sales@filmhouseng.com, cc info@filmhouseng.com (both from filmhouseng.com/contact-us). Sent. The cc bounced (14:03, Office 365 `550 5.7.133`: info@ takes mail only from inside Filmhouse); no bounce from sales@.
- 4c to inquiries@cinesync.io (CINEsync's Trustpilot company profile; its own site shows no address). Sent.
- 4b to info@filmoneng.com (filmoneng.com/contact): sent 17 Nov 20:52 UTC on Chime's "send the FilmOne email as well", the approved text unchanged; the draft was deleted.
- **Links:** the Gmail connector stores links in what it sends as Google redirects (`google.com/url?q=https://sinima-app.vercel.app&…`), in 4a, 4b and 4c alike (a resend with plain links came out the same). They still reach the site, through Google's "you're being redirected" page once a day has passed. Follow-ups: send from Gmail itself, or check a sent copy, so the links are plain.
- LinkedIn InMail to Kene Okwuosa (Group CEO, Filmhouse Group), sent 17 Nov 15:32 from Chime's account (Chime: "send it to my LinkedIn"); 1 of 3 InMail credits.
- Instagram DM to Filmhouse: not sent; Chime: "Leave Instagram for now" (17 Nov). The draft is in this session's notes.
- Follow-up (below) on Tue 24 Nov if nobody replies. **24 Nov: no reply from any of the three** (Gmail searched). Three follow-ups saved as Gmail drafts, each a reply in its own thread, not sent: to sales@filmhouseng.com only (the info@ cc bounced), to info@filmoneng.com ("…asking who to speak to… A name or an email address is perfect.") and to inquiries@cinesync.io ("…about a showtimes feed for Filmhouse…"). No links in them, so the connector's link wrapping doesn't matter. Chime reads and sends. Lagocine replied on 11 Nov: "you can use it freely as much as you want".

Filmhouse's 7 Lagos cinemas are the only ones we can't read ourselves: its ticketing provider, CINEsync, refuses our bot. Until one of these says yes, Filmhouse's times come through Lagocine. Send all three; find each address or DM on their own contact page or official Instagram, never guessed. Checked with the voice score (100/100) and the banned list; Chime approves before sending.

### 4a. Filmhouse marketing (email or Instagram DM)

**Subject:** Listing Filmhouse's showtimes on a free Lagos and Abuja app

Hi Filmhouse team,

I'm Chimezie, a product designer in Lagos. I'm building Sinima, a free, open-source web app that shows cinema showtimes in Lagos and Abuja in one place, so people can find a film starting soon near them. It goes live in mid-December, a few days before Avengers: Doomsday.

I'd like to list Filmhouse's showtimes and send every visitor to your own site to book. I won't sell tickets, show ads or take any commission, and I won't add tracking to your links.

Your showtimes load through CINEsync, which turns automated readers away, so I'm asking first. Could I read your public showtimes a few times a day, or is there a feed I could use? I'll stop at once if you ask.

I emailed onlinesupport@filmhouseng.com on 11 November and haven't heard back.

Thank you,
Chimezie Ekpendu
https://chimexd.work

### 4b. FilmOne Entertainment (Filmhouse's parent company)

**Subject:** Who to ask about listing Filmhouse showtimes?

Hi FilmOne team,

I'm Chimezie, a product designer in Lagos. I'm building Sinima, a free, open-source web app that shows cinema showtimes in Lagos and Abuja in one place. It goes live in mid-December, a few days before Avengers: Doomsday.

I'd like to list Filmhouse's showtimes and send every visitor to Filmhouse's own site to book. I won't sell tickets, show ads or take any commission.

Who's the right person to ask about this? I emailed Filmhouse's support address on 11 November and haven't heard back.

Thank you,
Chimezie Ekpendu
https://chimexd.work

### 4c. CINEsync (Filmhouse's ticketing provider)

**Subject:** A showtimes feed for Filmhouse on a free listings app?

Hi CINEsync team,

I'm Chimezie, a product designer in Lagos. I'm building Sinima, a free, open-source web app that lists cinema showtimes in Lagos and Abuja and sends people to each cinema's own site to book.

Filmhouse's showtimes come through CINEsync, and your server turns our reader away. That's fine, and I won't try to get around it. Do you offer a feed for listings like this, or could Filmhouse approve one? I'd read it a few times a day at most.

Thanks,
Chimezie Ekpendu
https://chimexd.work

---

## Follow-up (one week later, once only)

Hi again. Just checking you saw my note below about listing your showtimes with links to your booking. A quick yes or no is perfect. Thanks, Chimezie.
