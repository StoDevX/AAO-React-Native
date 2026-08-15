# Recurrence corpus

These 70 `.ics` files are the `Ical.Net.Tests/Calendars/Recurrence` test
suite from [`ical-org/ical.net`](https://github.com/ical-org/ical.net),
fetched at commit `367af698816947830ca8a09e8397ec32d5393da6` (2026-08-09).
The upstream directory holds 71 entries; `RecurrenceTestCases.txt` is not an
`.ics` file and is excluded, and `Bug2966236.ics` is excluded here because
it is already committed byte-for-byte as `../ical-microsoft-outlook.ics` and
covered by `ical.test.ts`.

`Bug2912657.ics` is re-encoded from UTF-16LE (its upstream encoding) to
UTF-8, and its line endings normalised from CRLF to LF (this repository's
`.gitattributes` enforces `eol=lf` on every text file). Every RRULE, date,
and other property value is unchanged -- only the byte encoding and line
endings were normalised, since `parseIcalEvents` and this project's fixture
loader (`readFileSync(path, 'utf8')`) both expect UTF-8. Every other file is
unmodified from what `gh api` returned for its `download_url`.

Used by `ical-equivalence.test.ts` to compare `parseIcalEvents` against a
naive reference walk over a broad, real-world set of recurrence shapes
(every `RRULE` frequency, and the rule parts -- `BYDAY`, `BYMONTH`,
`INTERVAL`, `COUNT`, `BYMONTHDAY`, `WKST`, `UNTIL`, `BYHOUR`, `BYWEEKNO`,
`BYSETPOS`, `BYMINUTE`, `BYYEARDAY` -- that matter to it).

## Licence

MIT. `https://raw.githubusercontent.com/ical-org/ical.net/main/license.md`
(the API reports `NOASSERTION` only because that file is lowercase with a
BOM, which GitHub's license detector doesn't recognise):

> The MIT License (MIT)
>
> Copyright © Douglas Day, Rian Stockbower, ical-org Project
>
> Permission is hereby granted, free of charge, to any person obtaining a
> copy of this software and associated documentation files (the
> "Software"), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit
> persons to whom the Software is furnished to do so, subject to the
> following conditions:
>
> The above copyright notice and this permission notice shall be included
> in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
> THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
> FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
> DEALINGS IN THE SOFTWARE.
