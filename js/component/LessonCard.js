Vue.component('lesson-card', {
  props: {
    lesson: { type: Object, required: true },
    showId: { type: Boolean, default: false }
  },
  computed: {
    shortId() {
      return String(this.lesson.id || this.lesson._id || '').slice(-6);
    },
    spacesLabel() {
      const n = Number(this.lesson.spaces || 0);
      return n > 0 ? `${n} ${n === 1 ? 'space' : 'spaces'}` : 'Sold Out';
    },
    priceText() {
      const p = Number(this.lesson.price || 0);
      return `£${isFinite(p) ? p.toFixed(2) : '0.00'}`;
    }
  },
  methods: {
    add() {
      if ((this.lesson.spaces || 0) > 0) this.$emit('add', this.lesson);
    },
    onImgErr(e) {
      e.target.src = 'https://picsum.photos/seed/lesson/640/360';
    }
  },
  template: `
    <article
      class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition">

      <div class="relative">
        <img :src="lesson.image"
             :alt="lesson.subject"
             @error="onImgErr"
             class="w-full h-44 object-cover object-center opacity-95 group-hover:opacity-100 transition"
             loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-tr from-slate-900/30 via-transparent to-transparent"></div>

        <span class="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
              :class="(lesson.spaces||0)>0 ? 'bg-emerald-400/90 text-slate-900' : 'bg-rose-400/90 text-slate-900'">
          {{ spacesLabel }}
        </span>
      </div>

      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg font-semibold leading-tight">{{ lesson.subject }}</h3>
          <div class="text-right">
            <p class="text-sm text-slate-300">{{ lesson.location }}</p>
            <p class="text-base font-bold">{{ priceText }}</p>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-300 text-sm">
            <i class="fa-solid fa-chalkboard-user"></i>
            <span v-if="showId">ID #{{ shortId }}</span>
            <span v-else>Lesson</span>
          </div>

          <button @click="add"
                  :disabled="(lesson.spaces||0)===0"
                  class="px-3 py-2 rounded-lg text-sm font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="(lesson.spaces||0)>0
                    ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-slate-900 hover:brightness-110 shadow-glow'
                    : 'bg-slate-700 text-slate-300'">
            <i class="fa-solid fa-plus mr-1"></i> Add
          </button>
        </div>
      </div>
    </article>
  `
});
