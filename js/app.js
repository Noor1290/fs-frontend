// ===========================
// 🌐 API CONFIG
// ===========================
const BACKEND_ORIGIN = "https://fs-backend-6isw.onrender.com";   // backend host
const API_BASE       = `${BACKEND_ORIGIN}/api`;

new Vue({
  el: '#app',

  data: () => ({
    showCart: false,
    search: '',
    searching: false,          // shows spinner in SearchBar
    _searchTimer: null,        // debounce handle
    _searchDelayMs: 300,

    sortKey: 'subject',        // subject | location | price | spaces
    sortOrder: 1,
    name: '',
    phone: '',
    submitted: false,

    lessons: [],               // normalized list
    cart: []                   // { id, subject, price, image, qty }
  }),

  computed: {
    // We now rely on BACKEND search; no client-side filtering
    sortedLessons() {
      const key = this.sortKey, order = this.sortOrder;
      return [...this.lessons].sort((a, b) => {
        let A = a[key], B = b[key];
        if (typeof A === 'string') { A = A.toLowerCase(); B = B.toLowerCase(); }
        return (A < B ? -1 : A > B ? 1 : 0) * order;
      });
    },
    cartCount() { return this.cart.reduce((s, i) => s + i.qty, 0); },
    cartTotal() { return this.cart.reduce((s, i) => s + i.price * i.qty, 0); },
    spacesMap() {
      const m = {}; this.lessons.forEach(l => m[l.id] = l.spaces); return m;
    }
  },

  watch: {
    // Debounced backend search
    search: {
      immediate: false,
      handler(q) {
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
          this.loadLessons(q.trim());
        }, this._searchDelayMs);
      }
    }
  },

  methods: {
    normalize(rows) {
  return rows.map(l => {
    const path = String(l.image || '').replace(/^\/?/, '');
    // ✅ prepend '/images/' if not already an absolute URL
    const full = /^https?:\/\//.test(path)
      ? path
      : `${BACKEND_ORIGIN}/images/${path}`;
    return {
      id: l._id,
      subject: l.topic,
      location: l.location,
      price: l.price,
      spaces: l.space,
      image: full
    };
  });
},


    async loadLessons(q = '') {
      try {
        this.searching = true;
        const url = q ? `${API_BASE}/search?q=${encodeURIComponent(q)}` : `${API_BASE}/lessons`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        this.lessons = this.normalize(rows);
      } catch (err) {
        console.error("❌ Failed to load lessons:", err);
        alert("Could not load lessons. Check backend & CORS.");
      } finally {
        this.searching = false;
      }
    },

    toggleCart() {
      if (!this.showCart && this.cartCount === 0) return;
      this.showCart = !this.showCart;
    },

    // 🛒 Add to cart + decrement spaces (reactively)
    addToCart(lesson) {
      if (!lesson || lesson.spaces === 0) return;

      const idx = this.lessons.findIndex(l => l.id === lesson.id);
      if (idx !== -1) {
        const updated = { ...this.lessons[idx], spaces: this.lessons[idx].spaces - 1 };
        this.$set(this.lessons, idx, updated);
      }

      const found = this.cart.find(i => i.id === lesson.id);
      if (found) found.qty += 1;
      else this.cart.push({
        id: lesson.id, subject: lesson.subject, price: lesson.price, image: lesson.image, qty: 1
      });
    },

    increment(id) {
      const li = this.lessons.findIndex(x => x.id === id);
      const c  = this.cart.find(x => x.id === id);
      if (li === -1 || !c) return;
      const l = this.lessons[li];
      if (l.spaces > 0) {
        this.$set(this.lessons, li, { ...l, spaces: l.spaces - 1 });
        c.qty += 1;
      }
    },

    decrement(id) {
      const li = this.lessons.findIndex(x => x.id === id);
      const ci = this.cart.findIndex(x => x.id === id);
      if (ci === -1) return;
      const c = this.cart[ci];
      if (c.qty > 1) {
        if (li !== -1) {
          const l = this.lessons[li];
          this.$set(this.lessons, li, { ...l, spaces: l.spaces + 1 });
        }
        c.qty -= 1;
      } else {
        this.removeById(id);
      }
    },

    removeById(id) {
      const li = this.lessons.findIndex(x => x.id === id);
      const ci = this.cart.findIndex(x => x.id === id);
      if (li !== -1 && ci !== -1) {
        const l = this.lessons[li];
        const qty = this.cart[ci].qty;
        this.$set(this.lessons, li, { ...l, spaces: l.spaces + qty });
      }
      this.cart = this.cart.filter(i => i.id !== id);
    },

    // 💳 Checkout (POST /orders). If your backend also updates space, you can reload afterward.
    async checkout() {
      const isName  = /^[A-Za-z\s]+$/.test(this.name) && this.name.trim().length > 1;
      const isPhone = /^\d+$/.test(this.phone) && this.phone.length >= 7;
      if (!(this.cart.length > 0 && isName && isPhone)) {
        alert("⚠️ Please enter valid name, phone, and at least one item.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.name,
            phone: this.phone,
            items: this.cart.map(c => ({ lesson: c.id, spaces: c.qty }))
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        alert("✅ Order placed successfully!");
        this.cart = [];
        this.name = '';
        this.phone = '';
        this.submitted = true;

        // Optionally reload from DB:
        // await this.loadLessons(this.search.trim());
      } catch (err) {
        console.error("Checkout error:", err);
        alert("❌ Server error during checkout. See console.");
      }
    }
  },

  mounted() {
    // initial load (no query)
    this.loadLessons();
  }
});
