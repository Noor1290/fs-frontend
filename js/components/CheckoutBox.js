Vue.component('checkout-box', {
  props: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    hasItems: { type: Boolean, default: false },
    submitted: { type: Boolean, default: false },
    total: { type: Number, default: 0 }
  },
  computed: {
    isNameValid(){ return /^[A-Za-z\s]+$/.test(this.name) && this.name.trim().length > 1; },
    isPhoneValid(){ return /^\d+$/.test(this.phone) && this.phone.length >= 7; },
    canCheckout(){ return this.hasItems && this.isNameValid && this.isPhoneValid; }
  },
  methods: {
    submit(){ if(this.canCheckout) this.$emit('checkout'); }
  },
  template: `
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sticky top-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <i class="fa-solid fa-credit-card"></i> Checkout
      </h2>

      <label class="block text-sm mb-1 text-slate-300">Name (letters only)</label>
      <input :value="name" @input="$emit('update:name', $event.target.value)" type="text" placeholder="Jane Doe"
             class="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-indigo-400"
             :class="{'ring-2 ring-rose-400/70': name && !isNameValid}"/>

      <label class="block text-sm mb-1 text-slate-300">Phone (numbers only)</label>
      <input :value="phone" @input="$emit('update:phone', $event.target.value)" type="tel" placeholder="52520000"
             class="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-indigo-400"
             :class="{'ring-2 ring-rose-400/70': phone && !isPhoneValid}"/>

      <button @click="submit" :disabled="!canCheckout"
              class="w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 text-slate-900 font-semibold rounded-xl px-4 py-2 shadow-glow hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
        Place Order (Total £{{ total.toFixed(2) }})
      </button>

      <p v-if="submitted" class="mt-3 text-emerald-300 font-semibold">✔️ Order submitted</p>

      <ul class="mt-3 text-xs text-slate-400 space-y-1">
        <li>• Checkout appears on the cart page</li>
        <li>• Name letters only, Phone numbers only</li>
        <li>• Button enabled only when inputs are valid</li>
      </ul>
    </div>
  `
});
