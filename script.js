document.addEventListener('DOMContentLoaded', () => {

	const productsContainer = document.querySelector('.container.text-start');
	if (!productsContainer) return;
	const productsRow = productsContainer.querySelector('.row');
	const productCols = Array.from(productsRow.querySelectorAll('.col'));

	const products = productCols.map((col, index) => {
		const card = col.querySelector('.card');
		const titleEl = card.querySelector('.card-title');
		const priceEl = card.querySelector('.btn-warning');
		const brandEl = card.querySelector('#phone-brand');
		const reviewsEl = card.querySelector('#reviews');
		const captionEl = card.querySelector('#phone-caption');
		const imgEl = card.querySelector('img');
		const viewBtn = card.querySelector('a.btn-white');
		const addBtn = card.querySelector('a.btn-dark');
		const fullDescEl = card.querySelector('[data-full-description]');

		const price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
		const reviews = reviewsEl ? parseInt((reviewsEl.textContent || '').replace(/[^0-9]/g, '')) || 0 : 0;
		const brand = brandEl ? brandEl.textContent.trim() : '';

		col.dataset.originalIndex = index;

		return {
			col,
			card,
			title: titleEl ? titleEl.textContent.trim() : '',
			price,
			brand,
			reviews,
			description: captionEl ? captionEl.textContent.trim() : '',
			fullDescription: fullDescEl ? fullDescEl.getAttribute('data-full-description') : '',
			image: imgEl ? imgEl.getAttribute('src') : '',
			viewBtn,
			addBtn,
		};
	});

	const categoryLinks = document.querySelectorAll('.container > nav .navbar-nav .nav-link');
	categoryLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const categoryText = link.textContent.trim();
			categoryLinks.forEach(l => l.classList.remove('active'));
			link.classList.add('active');
			const keyword = categoryText.split(' ')[0].toLowerCase();
			products.forEach(p => {
				const matches = p.brand.toLowerCase().includes(keyword);
				p.col.style.display = matches ? '' : 'none';
			});
		});
	});

	const sortItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
	sortItems.forEach(item => {
		item.addEventListener('click', (e) => {
			e.preventDefault();
			const option = item.textContent.trim().toLowerCase();
			let sorted = [...products];

			if (option.includes('price: low')) {
				sorted.sort((a,b) => a.price - b.price);
			} else if (option.includes('price: high')) {
				sorted.sort((a,b) => b.price - a.price);
			} else if (option.includes('most popular')) {
				sorted.sort((a,b) => b.reviews - a.reviews);
			} else {
				sorted.sort((a,b) => parseInt(a.col.dataset.originalIndex) - parseInt(b.col.dataset.originalIndex));
			}
			sorted.forEach(p => productsRow.appendChild(p.col));
		});
	});

	const OFFCANVAS_BODY = document.querySelector('#offcanvasRight .offcanvas-body');
	const CART_KEY = 'pw_cart_v1';
	let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

	function saveCart() {
		localStorage.setItem(CART_KEY, JSON.stringify(cart));
	}

	function renderCart() {
		if (!OFFCANVAS_BODY) return;
		OFFCANVAS_BODY.innerHTML = '';
		if (cart.length === 0) {
			OFFCANVAS_BODY.innerHTML = '<p>Your cart is empty.</p>';
			return;
		}
		const list = document.createElement('div');
		let total = 0;

		cart.forEach((item, idx) => {
			const row = document.createElement('div');
			row.className = 'd-flex justify-content-between align-items-center mb-2';
			row.innerHTML = `
				<div>
					<strong>${item.title}</strong>
					<div class="text-muted">${item.qty} × $${item.price.toFixed(2)}</div>
				</div>
				<div class="d-flex align-items-center gap-2">
					<strong>$${(item.qty*item.price).toFixed(2)}</strong>
					<button class="btn btn-sm btn-outline-danger remove-item" data-index="${idx}" aria-label="Remove item">Remove</button>
				</div>
			`;
			list.appendChild(row);
			total += item.qty * item.price;
		});

		list.querySelectorAll('.remove-item').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				const i = parseInt(btn.dataset.index, 10);
				if (isNaN(i)) return;
				cart.splice(i, 1);
				saveCart();
				renderCart();
				showToast('Item removed from cart');
			});
		});
		const hr = document.createElement('hr');
		const totalRow = document.createElement('div');
		totalRow.className = 'd-flex justify-content-between align-items-center';
		totalRow.innerHTML = `<strong>Total</strong><strong>$${total.toFixed(2)}</strong>`;
		OFFCANVAS_BODY.appendChild(list);
		OFFCANVAS_BODY.appendChild(hr);
		OFFCANVAS_BODY.appendChild(totalRow);
		const checkout = document.createElement('button');
		checkout.className = 'btn btn-primary w-100 mt-3';
		checkout.textContent = 'Checkout';
		OFFCANVAS_BODY.appendChild(checkout);

		checkout.addEventListener('click', (e) => {
			e.preventDefault();
			const overlay = document.createElement('div');
			overlay.id = 'checkoutOverlay';
			overlay.style.position = 'fixed';
			overlay.style.top = 0;
			overlay.style.left = 0;
			overlay.style.width = '100%';
			overlay.style.height = '100%';
			overlay.style.display = 'flex';
			overlay.style.alignItems = 'center';
			overlay.style.justifyContent = 'center';
			overlay.style.background = 'rgba(0,0,0,0.6)';
			overlay.style.zIndex = 3000;
			overlay.innerHTML = `<div class="text-center text-white"><div class="spinner-border text-light mb-3" role="status"><span class="visually-hidden">Loading...</span></div><div>Processing your order...</div></div>`;
			document.body.appendChild(overlay);

			// simulate checkout delay
			setTimeout(() => {
				cart = [];
				saveCart();
				renderCart();
				overlay.remove();
				const offcanvasEl = document.getElementById('offcanvasRight');
				if (offcanvasEl) {
					const bsOff = bootstrap.Offcanvas.getInstance(offcanvasEl);
					if (bsOff) bsOff.hide();
				}
				showToast('Order processed — cart is now empty');
			}, 1500);
		});
	}

	products.forEach(p => {
		if (p.addBtn) {
			p.addBtn.addEventListener('click', (e) => {
				e.preventDefault();
				const existing = cart.find(i => i.title === p.title);
				if (existing) {
					existing.qty += 1;
				} else {
					cart.push({ title: p.title, price: p.price, qty: 1 });
				}
				saveCart();
				renderCart();
				showToast(`${p.title} added to cart`);
			});
		}

		if (p.viewBtn) {
			p.viewBtn.addEventListener('click', (e) => {
				e.preventDefault();
				openProductModal(p);
			});
		}
	});

	function showToast(message) {
		const t = document.createElement('div');
		t.className = 'position-fixed bottom-0 end-0 p-3';
		t.style.zIndex = 2000;
		t.innerHTML = `<div class="toast show" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-body">${message}</div></div>`;
		document.body.appendChild(t);
		setTimeout(() => t.remove(), 2200);
	}

	let productModalEl = document.getElementById('productModal');
	if (!productModalEl) {
		productModalEl = document.createElement('div');
		productModalEl.id = 'productModal';
		productModalEl.className = 'modal fade';
		productModalEl.tabIndex = -1;
		productModalEl.innerHTML = `
			<div class="modal-dialog modal-lg modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="productModalLabel"></h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body d-flex gap-3">
						<img id="productModalImg" src="" alt="" style="width:40%; object-fit:cover;"/>
						<div>
							<p id="productModalDesc"></p>
							<p id="productModalPrice" class="fw-bold fs-4"></p>
							<button id="productModalAdd" class="btn btn-dark">Add to Cart</button>
						</div>
					</div>
				</div>
			</div>`;
		document.body.appendChild(productModalEl);
	}

	const bsModal = new bootstrap.Modal(productModalEl);

	function openProductModal(p) {
		const title = productModalEl.querySelector('#productModalLabel');
		const img = productModalEl.querySelector('#productModalImg');
		const desc = productModalEl.querySelector('#productModalDesc');
		const price = productModalEl.querySelector('#productModalPrice');
		const add = productModalEl.querySelector('#productModalAdd');
		title.textContent = p.title;
		img.src = p.image;
		desc.textContent = p.fullDescription || p.description;
		price.textContent = `$${p.price.toFixed(2)}`;
		add.onclick = () => {
			const existing = cart.find(i => i.title === p.title);
			if (existing) existing.qty += 1; else cart.push({ title: p.title, price: p.price, qty: 1 });
			saveCart(); renderCart(); showToast(`${p.title} added to cart`);
			bsModal.hide();
		};
		bsModal.show();
	}

	renderCart();
});
