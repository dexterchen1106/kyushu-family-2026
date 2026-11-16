<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import source from '../行程.md?raw'
import DayWeather from './DayWeather.vue'
import OverviewWeather from './OverviewWeather.vue'
import TripChecklist from './TripChecklist.vue'
import ShoppingCatalog from './ShoppingCatalog.vue'
import CouponCatalog from './CouponCatalog.vue'
import { currentEntry, hotelIcon, initialTab, parseTrip, tripYear } from './trip'

const { days, overview } = parseTrip(source)
const overviewIcons = {
  航班資訊: '✈️',
  住宿資訊: hotelIcon,
  每日行程: '📅',
  六天天氣預報: '⛅',
}
const dailySchedule = { title: '每日行程' }
const weatherOverview = { title: '六天天氣預報' }
const guides = [
  { id: 'shopping', title: '可買什麼', icon: '🛍️', sourceTitle: '可買什麼' },
  { id: 'before-trip', title: '行前準備', icon: '📌', sourceTitle: '行前準備' },
  { id: 'tax-refund', title: '退稅指南', icon: '🧾', sourceTitle: '退稅' },
  { id: 'coupons', title: '優惠券', icon: '🎟️' },
]
const menuLinks = [{ id: 'overview', title: '行程總覽', icon: '📋' }, ...guides]
const overviewSections = [
  ...overview.filter(section => !guides.some(guide => guide.sourceTitle === section.title)),
  weatherOverview,
  dailySchedule,
]
const tabs = days
function pageFromHash() {
  return menuLinks.find(item => location.hash === '#' + item.id)?.id
}
const selected = ref(pageFromHash() ?? initialTab(days))
const menu = ref(null)
const menuButton = ref(null)
const menuOpen = ref(false)
const day = computed(() => days.find(item => item.id === selected.value))
const guide = computed(() => guides.find(item => item.id === selected.value))
const guideSection = computed(() => overview.find(section => section.title === guide.value?.sourceTitle))
const guideContent = computed(() => guideSection.value?.html)
const sections = computed(() => day.value?.sections ?? (guide.value ? [] : overviewSections))
const pageSectionLinks = computed(() => {
  if (!guide.value) {
    return sections.value.map((section, index) => ({ id: `section-${index}`, title: section.title }))
  }
  if (guide.value.id === 'before-trip') {
    return [...(guideContent.value ?? '').matchAll(/<h2>(.*?)<\/h2>/g)].map(([, title], index) => ({
      id: `checklist-group-${index}`,
      title: title.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&'),
    }))
  }
  if (guide.value.id === 'tax-refund' && guideContent.value) {
    return [{ id: 'guide-content-card', title: guide.value.title }]
  }
  if (guide.value.id === 'coupons') {
    return [
      { id: 'coupon-donki', title: '唐吉訶德' },
      { id: 'coupon-bic-camera', title: 'BicCamera' },
      { id: 'coupon-drug-eleven', title: 'Drug Eleven' },
      { id: 'coupon-tsuruha', title: '鶴羽藥妝' },
      { id: 'coupon-matsukiyo', title: '松本清' },
      { id: 'coupon-montbell', title: 'mont-bell' },
      { id: 'coupon-daimaru', title: '大丸福岡天神店' },
      { id: 'coupon-cube', title: 'CUBE 卡專屬優惠' },
    ]
  }
  return []
})
const now = ref(new Date())
const openedEntries = ref({})
const showBackToTop = ref(false)
const photoBase = import.meta.env.BASE_URL + 'photos/'
const activeEntry = computed(() => currentEntry(
  day.value,
  sections.value.find(section => section.entries)?.entries ?? [],
  now.value,
))
let clockTimer
function updateClock() {
  now.value = new Date()
}
function updateBackToTopVisibility() {
  showBackToTop.value = window.scrollY > 300
}
function syncPage() {
  if (location.hash.startsWith('#section-')
    || location.hash.startsWith('#checklist-group-')
    || location.hash.startsWith('#shopping-category-')
    || location.hash.startsWith('#coupon-')
    || location.hash === '#guide-content-card') return
  openDay(pageFromHash() ?? initialTab(days))
}
onMounted(() => {
  document.addEventListener('click', dismissMenuOutside, true)
  clockTimer = window.setInterval(updateClock, 1000)
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
  updateBackToTopVisibility()
  document.addEventListener('visibilitychange', updateClock)
  window.addEventListener('hashchange', syncPage)
})
onUnmounted(() => {
  document.removeEventListener('click', dismissMenuOutside, true)
  window.clearInterval(clockTimer)
  window.removeEventListener('scroll', updateBackToTopVisibility)
  document.removeEventListener('visibilitychange', updateClock)
  window.removeEventListener('hashchange', syncPage)
})

function selectTab(id) {
  menuOpen.value = false
  if (days.some(item => item.id === id) && pageFromHash()) {
    history.replaceState(null, '', location.pathname + location.search)
  }
  if (selected.value !== id) openedEntries.value = {}
  selected.value = id
  window.scrollTo(0, 0)
}

function followMenuLink(id) {
  if (location.hash !== '#' + id) history.pushState(null, '', '#' + id)
  openDay(id)
}

function backToTop() {
  window.scrollTo(0, 0)
  showBackToTop.value = false
}

function dismissMenuOutside(event) {
  if (menuOpen.value && !menu.value?.contains(event.target)) menuOpen.value = false
}

function dismissMenuOnBlur(event) {
  if (event.relatedTarget && !menu.value?.contains(event.relatedTarget)) menuOpen.value = false
}

function closeMenu() {
  if (!menuOpen.value) return
  menuOpen.value = false
  menuButton.value?.focus()
}

async function openDay(id) {
  selectTab(id)
  await nextTick()
  document.getElementById('trip-panel')?.focus({ preventScroll: true })
}

function navigateTabs(event, index) {
  const target = {
    ArrowLeft: (index - 1 + tabs.length) % tabs.length,
    ArrowRight: (index + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  }[event.key]
  if (target === undefined) return
  event.preventDefault()
  selectTab(tabs[target].id)
  nextTick(() => document.getElementById('tab-' + tabs[target].id)?.focus())
}
</script>

<template>
  <header class="masthead">
    <div class="shell masthead-inner">
      <span class="brand">九州孝親旅行</span>
      <span class="trip-dates">{{ tripYear }} · {{ days[0].date }}–{{ days.at(-1).date }}</span>
    </div>
  </header>

  <nav class="navigation" aria-label="旅程導覽">
    <div class="shell date-navigation">
      <div ref="menu" class="trip-menu" @focusout="dismissMenuOnBlur" @keydown.esc="closeMenu">
        <button ref="menuButton" type="button" aria-label="旅程選單" aria-controls="trip-menu-links"
          :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <span aria-hidden="true">☰</span>
        </button>
        <ul v-show="menuOpen" id="trip-menu-links">
          <li v-for="item in menuLinks" :key="item.id">
            <a :href="'#' + item.id" :aria-current="selected === item.id ? 'page' : undefined"
              @click.prevent="followMenuLink(item.id)">
              <span aria-hidden="true">{{ item.icon }}</span> {{ item.title }}
            </a>
          </li>
        </ul>
      </div>
      <div class="tabs" role="tablist" aria-label="選擇日期">
      <button
        v-for="(tab, index) in tabs"
        :id="'tab-' + tab.id"
        :key="tab.id"
        type="button"
        role="tab"
        aria-controls="trip-panel"
        :aria-selected="tab.id === selected"
        :tabindex="tab.id === selected || (!day && index === 0) ? 0 : -1"
        @click="selectTab(tab.id)"
        @keydown="navigateTabs($event, index)"
      >
        <span>{{ tab.day }}</span>
        <span v-if="tab.date" class="tab-date">{{ tab.date }}</span>
      </button>
      </div>
    </div>
  </nav>

  <main
    id="trip-panel"
    class="shell"
    :class="{ 'guide-shopping': guide?.id === 'shopping', 'guide-before-trip': guide?.id === 'before-trip' }"
    :role="day ? 'tabpanel' : undefined"
    :aria-labelledby="day ? 'tab-' + selected : undefined"
    tabindex="0"
  >
    <header v-if="day" class="day-heading">
      <span class="day-number">{{ day.day }}</span>
      <div>
        <h1>{{ day.isoDate.replaceAll('-', '.') }}（{{ day.weekday }}）</h1>
        <p class="page-date">{{ day.place }}</p>
        <nav class="section-links" aria-label="跳到段落">
          <a v-for="(section, index) in sections" :key="section.title" :href="'#section-' + index">
            {{ section.title }}
          </a>
        </nav>
      </div>
      <DayWeather :day="day" />
    </header>
    <header v-else class="page-heading">
      <h1>{{ guide?.title ?? '旅程總覽' }}</h1>
      <nav v-if="pageSectionLinks.length" class="section-links" aria-label="跳到段落">
        <a v-for="section in pageSectionLinks" :key="section.id" :href="'#' + section.id">
          {{ section.title }}
        </a>
      </nav>
    </header>
    <TripChecklist v-if="guide?.id === 'before-trip'" :html="guideContent" />
    <CouponCatalog v-else-if="guide?.id === 'coupons'" />
    <template v-else-if="guide?.id === 'shopping'">
      <ShoppingCatalog />
      <div v-if="guideContent" class="content-card markdown" v-html="guideContent"></div>
    </template>
    <div v-else-if="guideContent" id="guide-content-card" class="content-card markdown" v-html="guideContent"></div>

    <section
      v-for="(section, index) in sections"
      :id="'section-' + index"
      :key="selected + section.title"
      :aria-labelledby="'heading-' + index"
      class="content-card"
      :data-section="section.title"
      :class="{ itinerary: section.title === '行程' }"
    >
      <h2 :id="'heading-' + index">
        <span v-if="!day && overviewIcons[section.title]" aria-hidden="true">{{ overviewIcons[section.title] }}</span>
        {{ section.title }}
      </h2>
      <ul v-if="section === dailySchedule" class="daily-links">
        <li v-for="item in days" :key="item.id">
          <button type="button" @click="openDay(item.id)">
            <span class="daily-date">{{ item.day }} · {{ item.date }}（{{ item.weekday }}）</span>
            <span>{{ item.place }}</span>
            <span class="daily-arrow" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
      <OverviewWeather v-else-if="section === weatherOverview" :days="days" />
      <template v-else>
        <ol v-if="section.entries" class="timeline" role="list">
          <li v-for="(entry, entryIndex) in section.entries" :key="entryIndex" :class="entry.kind">
            <component :is="entry.expandable ? 'details' : 'div'" class="timeline-event"
              :aria-current="activeEntry === entryIndex ? 'step' : undefined"
              @toggle="openedEntries[entryIndex] = $event.target.open">
              <component :is="entry.expandable ? 'summary' : 'div'" class="timeline-heading">
                <span class="timeline-time">{{ entry.time }}<template v-if="entry.duration"> / {{ entry.duration }}</template></span>
                <span v-if="activeEntry === entryIndex" class="timeline-current">進行中</span>
                <span class="timeline-title">
                  <span aria-hidden="true">{{ entry.icon }}</span>
                  <span v-html="entry.title"></span>
                </span>
              </component>
              <div v-if="entry.expandable || entry.links.length || entry.detailSections.length" class="timeline-details">
                <p v-if="entry.note" class="timeline-note">{{ entry.note }}</p>
                <div v-if="entry.detailsHtml" class="timeline-note markdown" v-html="entry.detailsHtml"></div>
                <div v-for="item in entry.summaries" :key="item.name" class="timeline-note">
                  <strong v-if="entry.summaries.length > 1">{{ item.name }}　</strong>
                  <ul v-if="item.lines.length > 1" class="timeline-note-list">
                    <li v-for="line in item.lines" :key="line" v-html="line"></li>
                  </ul>
                  <span v-else v-html="item.lines[0]"></span>
                </div>
                <div v-if="entry.links.length || entry.detailSections.length" class="timeline-maps">
                  <a v-for="link in entry.links" :key="link.name" :href="link.url">
                    🗺️ {{ entry.links.length === 1 ? '地圖' : link.name }}
                  </a>
                  <a v-for="title in entry.detailSections" :key="title" :href="'#section-' + sections.findIndex(item => item.title === title)">
                    查看{{ title }}詳情
                  </a>
                </div>
                <div v-if="openedEntries[entryIndex] && entry.photos.length" class="attraction-photos"
                  :class="{ 'equal-height-photos': ['takachiho-boating', 'takachiho-train-bridge'].includes(entry.photos[0].id) }">
                  <figure v-for="photo in entry.photos" :key="photo.id">
                    <img :src="photoBase + photo.id + '.' + (photo.extension ?? 'jpg')" :alt="photo.label" decoding="async">
                    <figcaption>
                      {{ photo.label }}<template v-if="photo.source">
                        · <a :href="photo.source">{{ photo.author }}</a>
                        · <a :href="photo.licenseUrl">{{ photo.license }}</a>（縮圖）
                      </template>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </component>
          </li>
        </ol>
        <div v-if="section.html" class="markdown" v-html="section.html"></div>
      </template>
    </section>
    <nav v-if="selected === 'overview'" class="guide-cards" aria-label="旅行指南">
      <a v-for="item in guides" :key="item.id" :href="'#' + item.id"
        @click.prevent="followMenuLink(item.id)">
        <span aria-hidden="true">{{ item.icon }}</span>
        {{ item.title }}
        <span class="guide-arrow" aria-hidden="true">›</span>
      </a>
    </nav>
    <p v-if="selected === 'overview'" class="site-updated">網站更新時間 2026/11/16 17:15</p>
  </main>
  <button v-if="showBackToTop" type="button" class="back-to-top" aria-label="回到最上方" @click="backToTop">
    <span aria-hidden="true">↑</span>
    回到最上方
  </button>
</template>
