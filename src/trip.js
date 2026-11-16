import MarkdownIt from 'markdown-it'
import { attractionPhotos } from './attractionPhotos.js'

export const tripYear = 2026
export const hotelIcon = '🏨'

const markdown = new MarkdownIt({ breaks: true })
const dateInJapan = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function initialTab(days, now = new Date()) {
  const today = dateInJapan.format(now)
  return days.find(day => day.isoDate === today)?.id ?? 'overview'
}

const japanClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function minutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function currentEntry(day, entries, now) {
  if (!day || dateInJapan.format(now) !== day.isoDate) return -1
  const current = minutes(japanClock.format(now))
  const ranges = entries.map(entry => (entry.time.match(/\d{1,2}:\d{2}/g) ?? []).map(minutes))
  let active = -1
  let latestStart = -1
  for (const [index, [start, explicitEnd]] of ranges.entries()) {
    const nextStart = ranges.slice(index + 1).find(([next]) => next > start)?.[0]
    const before = entries[index].time.trimEnd().endsWith('前')
    const end = explicitEnd ?? (before ? start : nextStart ?? start + 1)
    const beginning = before ? ranges[index - 1]?.at(-1) ?? start : start
    if (current >= beginning && current < end && beginning > latestStart) {
      active = index
      latestStart = beginning
    }
  }
  return active
}

function renderSection(source) {
  const tokens = markdown.parse(source, {})
  let tableHeaders = []
  markdown.renderer.rules.thead_open = () => {
    tableHeaders = []
    return '<thead>'
  }
  markdown.renderer.rules.thead_close = () => {
    return '</thead>'
  }
  markdown.renderer.rules.th_open = (tokens, index) => {
    tableHeaders.push(tokens[index + 1].content)
    return '<th scope="col">'
  }
  markdown.renderer.rules.tr_open = () => {
    column = 0
    return '<tr>'
  }
  let column = 0
  markdown.renderer.rules.td_open = () => {
    const label = markdown.utils.escapeHtml(tableHeaders[column++] ?? '')
    return `<td><span class="cell-label" aria-hidden="true">${label}</span><div>`
  }
  markdown.renderer.rules.td_close = () => '</div></td>'
  markdown.renderer.rules.table_open = () => '<div class="table-wrap"><table role="table">'
  markdown.renderer.rules.table_close = () => '</table></div>'
  return markdown.renderer.render(tokens, markdown.options, {})
}

function sections(source) {
  const [, ...parts] = source.split(/^## (.+)$/m)
  return parts.flatMap((title, index) =>
    index % 2 === 0 ? [{ title, html: renderSection(parts[index + 1]) }] : [],
  )
}

function mapLinks(source) {
  const maps = new Map()
  const inlineTokens = markdown.parse(source, {}).flatMap(token => token.children ?? [])
  for (const [index, token] of inlineTokens.entries()) {
    if (token.type !== 'link_open') continue
    const url = token.attrGet('href')
    if (!/^https:\/\/(?:maps\.app\.goo\.gl\/|www\.google\.com\/maps\/)/.test(url)) continue
    const label = inlineTokens[index + 1]?.content
    if (label) maps.set(label, url)
  }
  return maps
}

function dailySections(source, maps, matchNotes) {
  const sectionsForDay = sections(source)
  const itinerary = sectionsForDay.find(section => section.title === '行程')
  const rawItinerary = source.match(/^## 行程[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1]
  if (!itinerary || !rawItinerary) return sectionsForDay

  const schedule = rawItinerary.match(/^\s*((?:- \*\*[^\n]+\*\*[ \t]*[｜|][^\n]+\n?(?: {2,}\S[^\n]*\n?)*)+)/)
  if (!schedule) return sectionsForDay

  const references = ['景點', '美食'].flatMap(section => {
    const heading = source.indexOf('## ' + section + '\n')
    if (heading < 0) return []
    const body = source.slice(heading).split(/^## /m)[1]
    return [...body.matchAll(/^\|\s*\[([^\]]+)\]\([^\n]*?\)\s*\|([^\n]+)$/gm)].map(([, name, row]) => ({
      name,
      section,
      summary: row.split('|').slice(3).find(cell => cell.trim())?.trim(),
    }))
  })

  itinerary.entries = schedule[1].trimEnd().split(/\n(?=- \*\*)/).map(block => {
    const [line, ...detailLines] = block.split('\n')
    const detailsHtml = detailLines.length
      ? markdown.render(detailLines.map(detail => detail.slice(2)).join('\n'))
      : ''
    const [, time, description] = line.match(/^- \*\*(.+?)\*\*\s*[｜|]\s*(.+)$/)
    const [, title, rawNote = ''] = description.match(/^(.*?)(?:\s*[（(]((?:[^()（）]|（[^（）]*）|\([^()]*\))+)[）)])?$/)
    const noteParts = rawNote.split('，')
    const durationIndex = noteParts.findIndex(part =>
      /^(?:合計|共|原排)?\s*\d+\s*(?:小時(?:\s*\d+\s*分鐘)?|分鐘)$/.test(part.trim()),
    )
    const [start, end] = (time.match(/\d{1,2}:\d{2}/g) ?? []).map(minutes)
    const span = end - start
    const hours = Math.floor(span / 60)
    const duration = durationIndex >= 0
      ? noteParts.splice(durationIndex, 1)[0].trim().replace(/\s/g, '')
      : span > 0 ? [hours && hours + '小時', span % 60 && span % 60 + '分鐘'].filter(Boolean).join('') : ''
    const note = noteParts.join('，')
    const flight = /JX\d+/.test(title)
    const meal = /早餐|午餐|晚餐|吃早餐|買麵包/.test(title)
    const transit = title.startsWith('晨間散步')
      || (!flight && !meal && !/看晨霧|入住|抵達飯店|接康氏家庭/.test(title)
        && /^(出發|出門|開車|前往|從.+前往|搭公車|回|抵達高千穗|取行李)|→/.test(title))
    const shopping = /^(逛|繼續逛|買)/.test(title)
    const kind = flight ? 'flight' : meal ? 'meal' : transit ? 'transit' : shopping ? 'shopping' : 'visit'
    const hotel = /飯店|Vessel Hotel Kumamoto|南阿蘇サウナ5GAKU/i.test(title)
    const icons = { flight: '✈️', meal: '🍴', transit: '🚏', shopping: '🛍️', visit: '📍' }
    let icon = icons[kind]
    if (hotel) icon = hotelIcon
    if (title.includes('上色見熊野座神社')) icon = '⛩️'
    if (title.startsWith('搭由布院之森')) icon = '🚆'
    if (title.includes('耶誕城')) icon = '🎄'
    const placeReferences = references.filter(({ name }) => {
      const names = name.split(/[／（]/).map(part => part.trim()).filter(part => part.length >= 3)
      return names.some(part => title.includes(part) || (matchNotes && note.includes(part))
        || (part.startsWith('寶滿宮 ') && title.replace(/^參拜/, '').startsWith(part.slice('寶滿宮 '.length))))
    })
    const matchedNames = new Set(placeReferences.map(item => item.name))
    // The accommodation table can include a room number after the property name.
    const lodgingName = title.match(/南阿蘇サウナ5GAKU/i)?.[0].toLowerCase()
    const links = [...maps]
      .filter(([name]) => title.includes(name) || matchedNames.has(name)
        || (lodgingName && name.toLowerCase().replace(/\s+g\d+$/, '') === lodgingName))
      .map(([name, url]) => ({ name, url }))
      .filter(link => !(title.startsWith('晨間散步') && link.name === '金鱗湖'))
    const summaries = placeReferences.filter(item => item.summary
      && title !== '太宰府 → 博多 → 大濠公園'
      && !(title.startsWith('道の駅 あそ望の郷くぎの、') && item.name === 'Montbell 南阿蘇店'),
    ).map(item => ({
      name: item.name,
      lines: item.summary.split(' • ').map(line => markdown.renderInline(line)),
    }))
    const detailSections = [...new Set(placeReferences.map(item => item.section))]
    const visibleNote = title === '逛天神商圈' && note === '大丸福岡天神店、Mina 天神、Alpen FUKUOKA'
      ? ''
      : note
    const hotelArrivalWithMap = /^(抵達|回)飯店/.test(title) && links.length > 0
    const photos = attractionPhotos[title] ?? []
    const expandable = Boolean(visibleNote || summaries.length || detailsHtml || hotelArrivalWithMap || photos.length)
    return { time, duration, title: markdown.renderInline(title), note: visibleNote, kind, icon, links, summaries, expandable, detailSections, detailsHtml, photos }
  })
  itinerary.html = renderSection(rawItinerary.slice(schedule[0].length))
  return sectionsForDay
}

export function parseTrip(source) {
  const normalizedSource = source.replace(/\r\n?/g, '\n')
  const maps = mapLinks(normalizedSource)
  const [, ...parts] = normalizedSource.split(/^# (.+)$/m)
  const days = []
  const overview = []
  for (let index = 0; index < parts.length; index += 2) {
    const [title, body] = parts.slice(index, index + 2)
    const match = title.match(/^(D\d+)｜(\d+)\/(\d+)（(.)）(.+)$/)
    if (match) {
      const [, day, month, date, weekday, place] = match
      const isoDate = `${tripYear}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`
      days.push({
        id: day.toLowerCase(), day, date: `${month}/${date}`, weekday,
        isoDate, place, sections: dailySections(body.replace(/\n---\s*$/, ''), maps, day === 'D5' || day === 'D6'),
      })
    } else if (title === '總覽') {
      overview.push(...sections(body))
    } else if (body.trim()) {
      overview.push({ title, html: renderSection(body) })
    }
  }
  return { days, overview }
}
