Vue.component('sort-controls', {
  props: {
    sortKey:   { type: String, default: 'subject' },
    sortOrder: { type: Number, default: 1 } // 1 asc, -1 desc
  },
  data() {
    return {
      options: [
        { key: 'subject',  label: 'Subject',  icon: 'fa-book' },
        { key: 'location', label: 'Location', icon: 'fa-location-dot' },
        { key: 'price',    label: 'Price',    icon: 'fa-tags' },
        { key: 'spaces',   label: 'Spaces',   icon: 'fa-users' },
      ]
    };
  },
  methods: {
    setKey(k){ this.$emit('update:sortKey', k); },
    toggle(){ this.$emit('update:sortOrder', this.sortOrder === 1 ? -1 : 1); }
  },
  template: `
    <div class="hidden md:flex items-center">
      <!-- gradient border wrapper -->
      <div class="p-[1.5px] rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 shadow-glow">
        <!-- inner glass panel -->
        <div class="flex items-center gap-3 bg-slate-900/70 backdrop-blur rounded-2xl px-3 py-2 border border-white/10">
          <!-- label -->
          <div class="flex items-center gap-2 text-slate-300 text-sm">
            <i class="fa-solid fa-arrow-up-wide-short text-indigo-300"></i>
            <span class="font-medium">Sort</span>
          </div>

          <div class="h-6 w-px bg-white/10"></div>

          <!-- pill buttons -->
          <div class="flex items-center gap-2">
            <button
              v-for="o in options" :key="o.key"
              @click="setKey(o.key)"
              :aria-pressed="sortKey===o.key"
              class="px-3 py-1.5 rounded-lg text-sm transition border active:scale-95"
              :class="sortKey===o.key
                ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-slate-900 font-semibold border-transparent shadow-glow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 border-white/10'">
              <i :class="['fa-solid', o.icon, 'mr-1.5', sortKey===o.key ? 'text-slate-900' : 'text-slate-400']"></i>
              {{ o.label }}
            </button>
          </div>

          <div class="h-6 w-px bg-white/10"></div>

          <!-- asc/desc toggle -->
          <button
            @click="toggle"
            :title="sortOrder===1 ? 'Ascending' : 'Descending'"
            class="group relative px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 transition">
            <div class="flex items-center gap-2 text-sm">
              <i class="fa-solid fa-arrow-down-short-wide transition-transform"
                 :class="sortOrder===1 ? 'rotate-0 text-indigo-300' : 'rotate-180 text-fuchsia-300'"></i>
              <span class="text-slate-200">{{ sortOrder===1 ? 'Asc' : 'Desc' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  `
});
