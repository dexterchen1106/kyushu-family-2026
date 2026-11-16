<script setup>
import { computed, nextTick, ref } from 'vue'
import catalog from '../伴手禮.md?raw'

const photoImports = import.meta.glob('../docs/伴手禮/*.{png,jpg,webp}', {
  eager: true, import: 'default', query: '?url',
})
// macOS and Git can store the same Japanese filename with different Unicode forms.
const photos = new Map(Object.entries(photoImports).map(([path, url]) => [path.normalize('NFC'), url]))

function storeGroup(store) {
  if (store.startsWith('JR博多站')) return 'JR博多站'
  return store.split('（')[0].replace(/ B?\d+F$/, '').replace(/限定$/, '')
}

function productLinks(markdown = '') {
  return Array.from(markdown.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g), ([, label, url]) => ({ label, url }))
}

const products = catalog.split('\n')
  .filter(line => line.startsWith('|') && !/^\| (名稱 |---)/.test(line))
  .map(line => {
    const [name, category, prices, regions, stores, description, photoLink, official, social] =
      line.slice(1, -1).split('|').map(cell => cell.trim())
    const [title, subtitle] = name.split('<br>')
    const imagePath = decodeURIComponent(photoLink.slice(photoLink.indexOf('(') + 1, -1))
    return {
      title, subtitle, category, description,
      prices: prices.split('<br>'),
      regions: regions === '—' ? [] : regions.split('、'),
      stores: stores.split('、'),
      photo: photos.get(('../' + imagePath).normalize('NFC')),
      links: [...productLinks(official), ...productLinks(social)],
    }
  })

const region = ref('')
const store = ref('')
const category = ref('')
const regions = ['福岡', '阿蘇', '由布院', '熊本']
const storeOptions = [...new Set(products.flatMap(product => product.stores.map(storeGroup)))]
const categoryOptions = [...new Set(products.map(product => product.category))]
function categoryTargetId(category) {
  return `shopping-category-${categoryOptions.indexOf(category)}`
}

async function jumpToCategory(selectedCategory) {
  region.value = ''
  store.value = ''
  category.value = selectedCategory
  await nextTick()
  document.getElementById(categoryTargetId(selectedCategory))?.scrollIntoView({ block: 'start' })
}

const results = computed(() => products.filter(product =>
  (!category.value || product.category === category.value) &&
  (!region.value || product.regions.includes(region.value)) &&
  (!store.value || product.stores.some(location => {
    if (storeGroup(location) !== store.value) return false
    const storeRegion = regions.find(area => location.startsWith(area + '的'))
    return !region.value || !storeRegion || region.value === storeRegion
  })),
))

function clearFilters() {
  region.value = ''
  store.value = ''
  category.value = ''
}
</script>

<template>
  <section class="catalog" aria-label="伴手禮商品">
    <div class="filters">
      <label>
        區域
        <select v-model="region">
          <option value="">全部區域</option>
          <option v-for="area in regions" :key="area">{{ area }}</option>
        </select>
      </label>
      <label>
        店鋪
        <select v-model="store">
          <option value="">全部店鋪</option>
          <option v-for="shop in storeOptions" :key="shop">{{ shop }}</option>
        </select>
      </label>
      <label>
        類型
        <select v-model="category">
          <option value="">全部類型</option>
          <option v-for="option in categoryOptions" :key="option">{{ option }}</option>
        </select>
      </label>
      <button type="button" :disabled="!region && !store && !category" @click="clearFilters">清除篩選</button>
    </div>
    <nav class="section-links" aria-label="跳到商品類型">
      <a v-for="category in categoryOptions" :key="category" :href="'#' + categoryTargetId(category)"
        @click.prevent="jumpToCategory(category)">
        {{ category }}
      </a>
    </nav>
    <p class="result-count" role="status">共 {{ results.length }} 項商品</p>
    <p v-if="!results.length" class="empty">沒有符合篩選條件的商品。</p>
    <ul v-else class="product-grid" role="list">
      <li v-for="(product, index) in results" :id="results.findIndex(item => item.category === product.category) === index
        ? categoryTargetId(product.category) : undefined" :key="product.title" class="product">
        <div v-if="product.photo" class="product-photo">
          <img :src="product.photo" :alt="product.title + '商品照'" loading="lazy" decoding="async">
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span>{{ product.category }}</span>
            <span>{{ product.regions.join('、') || '販售區域待確認' }}</span>
          </div>
          <h2>{{ product.title }}</h2>
          <p v-if="product.subtitle" class="subtitle">{{ product.subtitle }}</p>
          <ul class="prices" aria-label="日圓參考價">
            <li v-for="price in product.prices" :key="price">{{ price }}</li>
          </ul>
          <p class="description">{{ product.description }}</p>
          <div class="availability">
            <h3>哪裡買</h3>
            <ul>
              <li v-for="location in product.stores" :key="location">{{ location }}</li>
            </ul>
          </div>
          <div v-if="product.links.length" class="product-links">
            <a v-for="link in product.links" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer">
              {{ link.label }}
            </a>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.catalog { margin-bottom: 24px; }
.catalog > .section-links { margin: 0 0 16px; }
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  margin-bottom: 16px;
  background: var(--paper);
}
.filters label {
  display: grid;
  flex: 1 1 145px;
  min-width: 0;
  gap: 4px;
  color: var(--brown);
  font-size: .86rem;
  font-weight: 700;
}
.filters select, .filters button {
  min-height: 44px;
  border: 1px solid #c8b9a4;
  border-radius: 8px;
  padding: 6px 12px;
  background: #fff;
  color: #3a3028;
  font: inherit;
}
.filters select { width: 100%; }
.filters button { background: #f3ede3; cursor: pointer; font-size: .86rem; }
.filters button:not(:disabled) { transition: background-color 160ms ease; }
.filters button:hover:not(:disabled) { background-color: #e8dfd0; }
.filters button:disabled { opacity: .55; cursor: default; }
.result-count { margin: 12px 0; color: var(--muted); font-size: .9rem; }
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 265px), 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.product {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--paper);
  scroll-margin-top: 92px;
}
.product-photo {
  height: 215px;
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.product-photo img { display: block; width: 100%; height: 100%; object-fit: contain; }
.product-body { display: flex; flex: 1; flex-direction: column; padding: 16px; }
.product-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; color: var(--muted); font-size: .77rem; }
.product-meta span:first-child { padding: 1px 8px; border-radius: 6px; background: #f3ede3; font-weight: 700; }
.product h2 { margin: 8px 0 0; font-size: 1.1rem; line-height: 1.4; overflow-wrap: anywhere; }
.subtitle { margin: 4px 0 0; color: var(--muted); font-size: .82rem; }
.prices { display: flex; flex-wrap: wrap; gap: 4px 12px; list-style: none; margin: 10px 0 0; padding: 0; color: #8a411e; font-size: .9rem; font-weight: 800; }
.description { margin: 10px 0 14px; font-size: .9rem; }
.availability { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); }
.availability h3 { margin: 0; font-size: .86rem; }
.availability ul { margin: 4px 0 0; padding-left: 1.15em; color: var(--muted); font-size: .82rem; }
.product-links { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px; font-size: .82rem; }
.empty { padding: 16px; border: 1px solid var(--border); border-radius: 12px; background: var(--paper); }
</style>
