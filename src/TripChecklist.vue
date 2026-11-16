<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ html: { type: String, default: '' } })
const storageKey = 'kyushu-family-2026:preparation'
const checked = ref({})

try {
  const saved = JSON.parse(localStorage.getItem(storageKey))
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    const previousMoneyCheck = saved['日圓現金、信用卡與零錢包']
    if (previousMoneyCheck === true) {
      saved['日圓現金'] ??= true
      saved['信用卡與零錢包'] ??= true
    }
    checked.value = saved
  }
} catch {
  // The checklist still works for this visit when browser storage is unavailable.
}

const groups = computed(() => {
  const document = new DOMParser().parseFromString(props.html, 'text/html')
  const groups = []
  let group
  let list

  for (const element of document.body.children) {
    if (element.tagName === 'H2') {
      group = { title: element.textContent, lists: [] }
      groups.push(group)
      list = undefined
    } else if (element.tagName === 'H3' && group) {
      list = { title: element.textContent, items: [] }
      group.lists.push(list)
    } else if (element.tagName === 'UL' && group) {
      if (!list) {
        list = { title: '', items: [] }
        group.lists.push(list)
      }
      list.items.push(...[...element.children].map(item => ({
        html: item.innerHTML,
        title: item.querySelector('strong')?.textContent ?? item.textContent,
      })))
    }
  }

  return groups
})

function updateItem(title, complete) {
  checked.value[title] = complete
  try {
    localStorage.setItem(storageKey, JSON.stringify(checked.value))
  } catch {
    // Keep the current selection available until the page is closed.
  }
}
</script>

<template>
  <section v-for="(group, groupIndex) in groups" :id="'checklist-group-' + groupIndex"
    :key="group.title" class="content-card" :aria-labelledby="'checklist-heading-' + groupIndex">
    <h2 :id="'checklist-heading-' + groupIndex">{{ group.title }}</h2>
    <div v-for="(list, listIndex) in group.lists" :key="listIndex" class="checklist-group">
      <h3 v-if="list.title" :id="`checklist-category-${groupIndex}-${listIndex}`">{{ list.title }}</h3>
      <ul class="checklist" :aria-labelledby="list.title ? `checklist-category-${groupIndex}-${listIndex}` : undefined">
        <li v-for="(item, itemIndex) in list.items" :key="item.title">
          <input :id="`checklist-${groupIndex}-${listIndex}-${itemIndex}`" type="checkbox"
            :checked="checked[item.title] === true"
            @change="updateItem(item.title, $event.target.checked)">
          <label :for="`checklist-${groupIndex}-${listIndex}-${itemIndex}`" v-html="item.html"></label>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.checklist-group + .checklist-group { margin-top: 18px; }
.checklist-group h3 {
  margin: 0 0 4px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--section-tint);
  color: var(--section-ink);
  font-size: 1rem;
}
.checklist { list-style: none; margin: 0; padding: 0; }
.checklist li { display: flex; align-items: flex-start; gap: 10px; }
.checklist li + li { border-top: 1px solid var(--border); }
.checklist input { flex: none; width: 20px; height: 20px; margin: 12px 0 0; accent-color: var(--brown); }
.checklist label { flex: 1; min-height: 44px; padding: 8px 0; cursor: pointer; overflow-wrap: anywhere; }
</style>
