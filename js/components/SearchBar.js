Vue.component('search-bar', {
  props: {
    value:   { type: String, default: '' },  // v-model
  },
  methods: {
    onInput(e) { this.$emit('input', e.target.value); },
    clear()    { this.$emit('input', ''); this.$refs.input.focus(); }
  },
  template: `
    <div class="relative">
      <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>

      <input
        ref="input"
        :value="value"
        @input="onInput"
        type="search"
        placeholder="Search lessons..."
        class="w-64 md:w-72 bg-white/5 border border-white/10 rounded-xl pl-7 pr-9 py-2 text-sm
               placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
               
    </div>
  `
});
