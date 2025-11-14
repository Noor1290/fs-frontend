// ===========================
// 🌐 API CONFIG
// ===========================
const BACKEND_ORIGIN = "https://fs-backend-6isw.onrender.com";   // backend host
const API_BASE       = `${BACKEND_ORIGIN}/api`;                  

new Vue({
  el: '#app',

  data: () => ({
    // UI state
    showCart: false,
    search: '',
    searching: false,          // show/hide loading state
    _searchTimer: null,        // debounce handle
    _searchDelayMs: 300,       // debounce delay (ms)

    // sorting / checkout state
    sortKey: 'subject',        // subject | location | price | spaces
    sortOrder: 1,
    name: '',
    phone: '',
    submitted: false,

    // data collections
    lessons: [],               // normalized lessons from backend
    cart: []                   // items: { id, subject, price, image, qty }
  }),

  computed: {
    // sort in-memory list (server already filters via search)
    sortedLessons() {
      const key = this.sortKey, order = this.sortOrder;
      return [...this.lessons].sort((a, b) => {
        let A = a[key], B = b[key];
        if (typeof A === 'string') { A = A.toLowerCase(); B = B.toLowerCase(); }
        return (A < B ? -1 : A > B ? 1 : 0) * order;
      });
    },
    cartCount() { return this.cart.reduce((s, i) => s + i.qty, 0); },           // total items
    cartTotal() { return this.cart.reduce((s, i) => s + i.price * i.qty, 0); }, // £ total
    spacesMap() {
      // quick lookup: lessonId -> remaining spaces
      const m = {}; this.lessons.forEach(l => m[l.id] = l.spaces); return m;
    }
  },

  watch: {
    // Debounced backend search whenever 'search' changes
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
    // map backend documents to UI-friendly shape
    normalize(rows) {
      return rows.map(l => {
        const path = String(l.image || '').replace(/^\/?/, '');
        // use absolute URL if provided, else prefix with backend origin
        const full = /^https?:\/\//.test(path)
          ? path
          : `${BACKEND_ORIGIN}/${path}`;
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

    // fetch all lessons or perform search (backend filters)
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

    // toggle between lessons and cart (block if cart empty)
    toggleCart() {
      if (!this.showCart && this.cartCount === 0) return;
      this.showCart = !this.showCart;
    },

    // 🛒 Add to cart and decrement available spaces (reactive)
    addToCart(lesson) {
      if (!lesson || lesson.spaces === 0) return;

      // decrement spaces on the corresponding lesson
      const idx = this.lessons.findIndex(l => l.id === lesson.id);
      if (idx !== -1) {
        const updated = { ...this.lessons[idx], spaces: this.lessons[idx].spaces - 1 };
        this.$set(this.lessons, idx, updated);
      }

      // add/increment in cart
      const found = this.cart.find(i => i.id === lesson.id);
      if (found) found.qty += 1;
      else this.cart.push({
        id: lesson.id, subject: lesson.subject, price: lesson.price, image: lesson.image, qty: 1
      });
    },

    // increase cart qty if spaces remain
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

    // decrease cart qty; restore spaces; remove if qty hits 0
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

    // remove from cart completely; return all reserved spaces
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

    // 💳 POST order; then clear UI and optionally reload
    async checkout() {
      const isName  = /^[A-Za-z\s]+$/.test(this.name) && this.name.trim().length > 1;
      const isPhone = /^\d+$/.test(this.phone) && this.phone.length >= 7;

      if (!(this.cart.length > 0 && isName && isPhone)) {
        alert("⚠️ Please enter valid name, phone, and at least one item.");
        return;
      }

      try {
        // 1️⃣ Submit order (POST)
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

        // 2️⃣ Update lesson spaces in database (PUT)
        for (const item of this.cart) {
          const lesson = this.lessons.find(l => l.id === item.id);
          if (!lesson) continue;

          await fetch(`${API_BASE}/lessons/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              space: lesson.spaces   // send updated space value
            })
          });
        }

        // 3️⃣ Refresh local lessons from backend
        await this.loadLessons();

        // 4️⃣ Clear cart
        alert("✅ Order placed successfully!");
        this.cart = [];
        this.name = '';
        this.phone = '';
        this.submitted = true;

      } catch (err) {
        console.error("Checkout error:", err);
        alert("❌ Server error during checkout.");
      }
    }
  },

  mounted() {
    // initial fetch (no query)
    this.loadLessons();
  }
});
