Vue.component('cart-list', {
  props: {
    cart: { type: Array, default: () => [] },
    spacesMap: { type: Object, default: () => ({}) } // { [id]: remainingSpaces }
  },
  methods: {
    inc(item){ if(this.spacesMap[item.id] > 0) this.$emit('increment', item.id); },
    dec(item){ this.$emit('decrement', item.id); },
    remove(item){ this.$emit('remove', item.id); }
  },
  computed: {
    hasItems(){ return this.cart && this.cart.length > 0; }
  },
  template: `
    <div class="space-y-4">
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="fa-solid fa-cart-shopping"></i> Cart Items
        </h2>

        <div v-if="hasItems" class="divide-y divide-white/10">
          <div v-for="item in cart" :key="'cart-'+item.id" class="py-3 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <img :src="item.image" class="w-14 h-14 rounded-xl object-cover" alt=""/>
              <div>
                <p class="font-semibold leading-tight">{{ item.subject }}</p>
                <p class="text-sm text-slate-400">£{{ item.price.toFixed(2) }} • Qty: {{ item.qty }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="dec(item)" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95"><i class="fa-solid fa-minus"></i></button>
              <button @click="inc(item)" :disabled="spacesMap[item.id]===0" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40"><i class="fa-solid fa-plus"></i></button>
              <button @click="remove(item)" class="px-3 py-1 rounded-lg bg-rose-500/90 text-slate-900 font-semibold hover:brightness-110 active:scale-95"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>

        <p v-else class="text-slate-400">Your cart is empty. Go add some lessons! 🛒</p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-white/5 p-4 grid sm:grid-cols-2 gap-4">
        <div>
          <p class="text-slate-300">Items</p>
          <p class="text-lg font-semibold">
            {{ cart.reduce((s,i)=>s+i.qty,0) }}
          </p>
        </div>
        <div>
          <p class="text-slate-300">Total</p>
          <p class="text-lg font-semibold">
            £{{ cart.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2) }}
          </p>
        </div>
      </div>
    </div>
  `
});
