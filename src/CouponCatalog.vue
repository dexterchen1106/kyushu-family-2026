<script setup>
const coupons = [
  {
    id: 'donki',
    name: '唐吉訶德（Don Quijote）',
    expires: '官方券頁未標截止日；以即時頁面為準',
    offer: '含稅消費滿 ¥11,000 折 5%，滿 ¥33,000 折 7%。',
    note: '請在結帳時開啟券頁出示動態條碼；截圖不可使用。免稅退稅可併用。',
    url: 'https://livejapan.com/public/operation/coupon/donki/ja.html',
    source: 'LIVE JAPAN 唐吉訶德優惠券',
  },
  {
    id: 'bic-camera',
    name: 'BicCamera',
    expires: '2027/04/30',
    offer: '依商品類別享最高 7% OFF；適用商品與條件請查看券頁。',
    note: '限符合免稅購物資格的旅客，優惠後消費需滿 ¥5,000；部分商品不適用。',
    url: 'https://livejapan.com/public/operation/coupon/biccamera/ja.html',
    source: 'LIVE JAPAN BicCamera 優惠券',
  },
  {
    id: 'drug-eleven',
    name: 'Drug Eleven',
    expires: '2027/02/28',
    offer: '含稅消費滿 ¥10,000 折 3%，滿 ¥30,000 折 5%，滿 ¥50,000 折 7%。',
    note: '僅限指定免稅店，福岡適用店鋪及使用條件請查看券頁。',
    url: 'https://www.callingtaiwan.com.tw/drug_eleven/',
    source: 'CallingTaiwan Drug Eleven 優惠券',
  },
  {
    id: 'tsuruha',
    name: '鶴羽藥妝（TSURUHA）',
    expires: '2027/12/31',
    offer: '含稅消費滿 ¥10,000 折 3%，滿 ¥30,000 折 5%，滿 ¥50,000 折 7%。',
    note: '券頁上的條碼是結帳用折扣券條碼，請於付款前開啟即時頁面給店員掃描；免稅／退稅依資格與店鋪辦理，不可與其他優惠合併。',
    url: 'https://livejapan.com/public/operation/coupon/tsuruhadrug/ja.html',
    source: 'LIVE JAPAN 鶴羽藥妝優惠券（更新日：2026/09/02）；CUBE 官方活動頁列示效期至 2027/12/31',
  },
  {
    id: 'matsukiyo',
    name: '松本清（マツキヨ）',
    expires: '2027/03/31',
    offer: '店內消費滿 ¥10,000 折 3%，滿 ¥30,000 折 5%，滿 ¥50,000 折 7%。',
    note: '請於付款前出示官方頁面；截圖或列印無效，且部分商品與店鋪不適用。',
    url: 'https://en.matsumotokiyoshi.net/coupon',
    source: '松本清官方優惠券頁',
  },
  {
    id: 'montbell',
    name: 'mont-bell',
    expires: '無相關優惠券',
    offer: '無相關優惠券',
    url: null,
    source: null,
  },
  {
    id: 'daimaru',
    name: '大丸百貨福岡天神店',
    expires: '2026/10/01 起，官方未公告截止日',
    offer: '訪日外國旅客於特選品牌、化妝品及腕錶賣場，出示護照享 5% 折扣。',
    note: '部分品牌、特價品及服務費等不適用；請以官方公告及現場說明為準。',
    url: 'https://www.daimaru-fukuoka.jp/info/detail/?cd=001997',
    source: '大丸福岡天神店官方優惠公告',
  },
  {
    id: 'cube',
    name: 'CUBE 卡專屬優惠',
    expires: '各店優惠期限不同；「秋日遊」回饋至 2026/11/30',
    offer: 'CUBE 卡日本指定店家優惠；切換「秋日遊」權益，活動期間日本實體消費另享最高 3.5% 小樹點回饋。',
    note: '各店折扣、適用門市與期限請以官方活動頁為準；大丸松坂屋百貨指定門市優惠不適用大丸福岡天神店。',
    stores: [
      'BicCamera 集團',
      'COSMOS 指定門市',
      '成田機場指定免稅店、福岡機場免稅店',
      '愛電王實體門市、近鐵百貨指定門市',
      'Snow Peak 指定門市、Victoria 戶外用品店',
      '大賀藥局指定門市、阪急阪神百貨店',
      '鶴羽藥妝、日本樂天免稅店（東京銀座店）、日本札幌藥妝免稅店',
      'SUNDRUG 尚都樂客藥妝、京王百貨新宿店、永旺九州指定商場',
      '多慶屋、Mitsui Shopping Park LaLaport 指定商場、COREDO 室町指定商場',
      'ORIHICA 休閒西裝、AOKI 青木西服',
      'DRUG ELEVEN 指定免稅門市、大丸松坂屋百貨指定門市',
    ],
    url: 'https://www.cathay-cube.com.tw/cathaybk/personal/event/overview/credit-card/travel/202501/JP_DiscountPocket',
    source: '國泰世華 CUBE 旅日優惠活動頁',
  },
]
</script>

<template>
  <section class="coupon-list" aria-label="店家優惠券">
    <details v-for="coupon in coupons" :id="'coupon-' + coupon.id" :key="coupon.id" class="coupon-card">
      <summary class="coupon-summary">
        <span class="coupon-shop">{{ coupon.name }}</span>
        <span class="coupon-expiry">效期：{{ coupon.expires }}</span>
        <span class="coupon-toggle" aria-hidden="true">
          <span class="coupon-expand-label">展開　＋</span>
          <span class="coupon-collapse-label">收合　−</span>
        </span>
      </summary>
      <div class="coupon-expanded">
        <p class="coupon-offer">{{ coupon.offer }}</p>
        <p v-if="coupon.note" class="coupon-note">{{ coupon.note }}</p>
        <ul v-if="coupon.stores" class="coupon-store-list" aria-label="活動合作店家">
          <li v-for="store in coupon.stores" :key="store">{{ store }}</li>
        </ul>
        <p v-else-if="coupon.url" class="coupon-note">未找到可確認於旅程期間使用的優惠券。</p>
        <p class="coupon-expiry coupon-expiry-expanded">效期：{{ coupon.expires }}</p>
        <a v-if="coupon.url" class="coupon-source" :href="coupon.url" target="_blank" rel="noopener noreferrer">
          開啟優惠券／官方資訊頁
          <span aria-hidden="true">↗</span>
        </a>
        <p v-if="coupon.source" class="coupon-source-name">資料來源：{{ coupon.source }}</p>
      </div>
    </details>
  </section>
</template>
