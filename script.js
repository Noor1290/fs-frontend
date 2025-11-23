const BACKEND_ORIGIN = "https://fs-backend-6isw.onrender.com";
const API_BASE = `${BACKEND_ORIGIN}/api`;

new Vue({
  el: "#app",

  data: {
    showCart: false,
    searchInput: "",
    searching: false,
    _searchTimer: null,

    sortKey: "subject",
    sortOrder: 1,

    name: "",
    phone: "",
    submitted: false,

    lessons: [],
    cart: []
  },

  computed: {
    sortedLessons() {
      return [...this.lessons].sort((a, b) => {
        let A = a[this.sortKey], B = b[this.sortKey];
        if (typeof A === "string") { A = A.toLowerCase(); B = B.toLowerCase(); }
        return (A < B ? -1 : A > B ? 1 : 0) * this.sortOrder;
      });
    },
    cartCount() { return this.cart.reduce((s, i) => s + i.qty, 0); },
    cartTotal() { return this.cart.reduce((s, i) => s + i.qty * i.price, 0); },
    spacesMap() {
      const map = {};
      this.lessons.forEach(l => map[l.id] = l.spaces);
      return map;
    },
    validCheckout() {
      return /^[A-Za-z\s]+$/.test(this.name.trim()) &&
            /^\d+$/.test(this.phone.trim()) &&
            this.cart.length > 0;
    }
      },
  

  methods: {
    runSearch() {
      clearTimeout(this._searchTimer);

      this._searchTimer = setTimeout(() => {
        this.loadLessons(this.searchInput.trim());
      }, 300);
    },


    normalize(rows) {
      return rows.map(l => {
        const path = String(l.image || "").replace(/^\/?/, "");
        const full = /^https?:\/\//.test(path) ? path : `${BACKEND_ORIGIN}/${path}`;
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

    async loadLessons(q = "") {
      try {
        this.searching = true;
        const url = q ? `${API_BASE}/search?q=${encodeURIComponent(q)}` 
                      : `${API_BASE}/lessons`;

        const res = await fetch(url);
        const rows = await res.json();
        this.lessons = this.normalize(rows);
      } catch {
        alert("Could not load lessons.");
      } finally {
        this.searching = false;
      }
    },

    toggleCart() {
      if (!this.showCart && this.cartCount === 0) return;
      this.showCart = !this.showCart;
    },

    addToCart(lesson) {
      if (!lesson || lesson.spaces === 0) return;

      const idx = this.lessons.findIndex(l => l.id === lesson.id);
      if (idx !== -1) this.lessons[idx].spaces--;

      const found = this.cart.find(i => i.id === lesson.id);
      if (found) found.qty++;
      else this.cart.push({ ...lesson, qty: 1 });
    },

    increment(id) {
      const lesson = this.lessons.find(l => l.id === id);
      const cartItem = this.cart.find(c => c.id === id);
      if (!lesson || !cartItem) return;

      if (lesson.spaces > 0) {
        lesson.spaces--;
        cartItem.qty++;
      }
    },

    decrement(id) {
      const lesson = this.lessons.find(l => l.id === id);
      const cartItem = this.cart.find(c => c.id === id);
      if (!cartItem) return;

      if (cartItem.qty > 1) {
        cartItem.qty--;
        lesson.spaces++;
      } else {
        this.removeById(id);
      }
    },

    removeById(id) {
      const lesson = this.lessons.find(l => l.id === id);
      const item = this.cart.find(c => c.id === id);

      if (lesson && item) lesson.spaces += item.qty;

      this.cart = this.cart.filter(i => i.id !== id);
    },

    async checkout() {
      const validName = /^[A-Za-z\s]+$/.test(this.name.trim());
      const validPhone = /^\d+$/.test(this.phone.trim());

      if (!validName || !validPhone || this.cart.length === 0) {
        alert("Enter valid details and add items.");
        return;
      }

      try {
        // POST order
        const res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            name: this.name,
            phone: this.phone,
            items: this.cart.map(i => ({ lesson: i.id, spaces: i.qty }))
          })
        });

        if (!res.ok) throw new Error();

        // UPDATE lesson spaces
        for (const item of this.cart) {
          const lesson = this.lessons.find(l => l.id === item.id);
          if (!lesson) continue;

          await fetch(`${API_BASE}/lessons/${item.id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              space: lesson.spaces - item.qty   // 👈 correct subtraction
            })
          });

        }

        alert("Order placed!");

        // RESET
        this.cart = [];
        this.name = "";
        this.phone = "";

        // Reload lessons
        this.loadLessons();

      } catch {
        alert("Checkout failed.");
      }
    }
  },
  

  mounted() {
    this.loadLessons();
  }
});
