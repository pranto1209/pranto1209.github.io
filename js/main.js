(function () {
	'use strict';

	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var hasObserver = 'IntersectionObserver' in window;

	/* ----------------------------------------------------------------------
	   Header: scrolled state, mobile menu, active section
	   ---------------------------------------------------------------------- */
	var header = document.getElementById('site-header');
	var toggle = document.getElementById('nav-toggle');
	var nav = document.getElementById('primary-nav');
	var bars = toggle.querySelector('.bars');
	var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));

	function onScroll() {
		header.classList.toggle('is-scrolled', window.scrollY > 40);
	}
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	function setMenu(open) {
		nav.classList.toggle('is-open', open);
		bars.classList.toggle('is-open', open);
		toggle.setAttribute('aria-expanded', String(open));
	}

	toggle.addEventListener('click', function () {
		setMenu(!nav.classList.contains('is-open'));
	});

	navLinks.concat(document.querySelector('.brand')).forEach(function (link) {
		link.addEventListener('click', function () { setMenu(false); });
	});

	if (hasObserver) {
		var ratios = {};
		var spy = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				ratios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
			});

			var active = '';
			var best = 0;
			Object.keys(ratios).forEach(function (id) {
				if (ratios[id] > best) {
					best = ratios[id];
					active = id;
				}
			});
			if (!active) return;

			navLinks.forEach(function (link) {
				link.classList.toggle('is-active', link.getAttribute('href') === '#' + active);
			});
		}, { threshold: [0, .15, .3, .5, .75, 1], rootMargin: '-68px 0px 0px 0px' });

		navLinks.forEach(function (link) {
			var section = document.querySelector(link.getAttribute('href'));
			if (section) spy.observe(section);
		});
	}

	/* ----------------------------------------------------------------------
	   Reveal on scroll
	   ---------------------------------------------------------------------- */
	var revealEls = document.querySelectorAll('.reveal');

	if (reducedMotion || !hasObserver) {
		Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-visible'); });
	} else {
		var revealer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var el = entry.target;
				el.style.transitionDelay = (el.getAttribute('data-reveal-delay') || 0) + 'ms';
				el.classList.add('is-visible');
				// Drop the stagger once revealed so hover transitions stay snappy.
				el.addEventListener('transitionend', function () { el.style.transitionDelay = ''; }, { once: true });
				revealer.unobserve(el);
			});
		}, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

		Array.prototype.forEach.call(revealEls, function (el) { revealer.observe(el); });
	}

	/* ----------------------------------------------------------------------
	   Typewriter
	   ---------------------------------------------------------------------- */
	Array.prototype.forEach.call(document.querySelectorAll('.typewriter'), function (el) {
		var phrases = JSON.parse(el.getAttribute('data-phrases') || '[]');
		var output = el.querySelector('.typed');
		if (!phrases.length || reducedMotion) return;

		var index = 0;
		var deleting = false;
		output.textContent = '';

		function tick() {
			var phrase = phrases[index % phrases.length];
			var current = output.textContent;
			var next = deleting ? phrase.slice(0, current.length - 1) : phrase.slice(0, current.length + 1);
			var delay = deleting ? 50 : 100;

			output.textContent = next;

			if (!deleting && next === phrase) {
				delay = 2000;
				deleting = true;
			} else if (deleting && next === '') {
				deleting = false;
				index++;
				delay = 400;
			}
			setTimeout(tick, delay);
		}
		tick();
	});

	/* ----------------------------------------------------------------------
	   Particle field (hero background)
	   ---------------------------------------------------------------------- */
	(function () {
		var canvas = document.getElementById('particle-field');
		if (!canvas || reducedMotion) return;
		var ctx = canvas.getContext('2d');
		if (!ctx) return;

		var COLOR = '255, 172, 0';
		var LINK_DISTANCE = 150;
		var POINTER_DISTANCE = 160;
		var DENSITY = 1 / 26000;

		var particles = [];
		var pointer = null;
		var width = 0;
		var height = 0;

		function seed() {
			var count = Math.max(12, Math.min(70, Math.round(width * height * DENSITY)));
			particles = [];
			for (var i = 0; i < count; i++) {
				particles.push({
					x: Math.random() * width,
					y: Math.random() * height,
					vx: (Math.random() - .5) * .45,
					vy: (Math.random() - .5) * .45,
					r: Math.random() * 2 + 1
				});
			}
		}

		function resize() {
			var ratio = Math.min(window.devicePixelRatio || 1, 2);
			var rect = canvas.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
			ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
			seed();
		}

		function draw() {
			ctx.clearRect(0, 0, width, height);
			ctx.lineWidth = 1;

			for (var i = 0; i < particles.length; i++) {
				var p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				if (p.x < -p.r) p.x = width + p.r;
				if (p.x > width + p.r) p.x = -p.r;
				if (p.y < -p.r) p.y = height + p.r;
				if (p.y > height + p.r) p.y = -p.r;

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(' + COLOR + ', 0.55)';
				ctx.fill();
			}

			for (var a = 0; a < particles.length; a++) {
				var p1 = particles[a];
				for (var b = a + 1; b < particles.length; b++) {
					var p2 = particles[b];
					var d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
					if (d > LINK_DISTANCE) continue;
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.strokeStyle = 'rgba(' + COLOR + ', ' + (.35 * (1 - d / LINK_DISTANCE)) + ')';
					ctx.stroke();
				}

				if (!pointer) continue;
				var dp = Math.hypot(p1.x - pointer.x, p1.y - pointer.y);
				if (dp < POINTER_DISTANCE) {
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(pointer.x, pointer.y);
					ctx.strokeStyle = 'rgba(' + COLOR + ', ' + (.6 * (1 - dp / POINTER_DISTANCE)) + ')';
					ctx.stroke();
				}
			}
		}

		var frame = 0;
		var running = false;

		function loop() {
			draw();
			frame = requestAnimationFrame(loop);
		}

		function start() {
			if (running) return;
			running = true;
			frame = requestAnimationFrame(loop);
		}

		function stop() {
			running = false;
			cancelAnimationFrame(frame);
		}

		resize();
		window.addEventListener('resize', resize, { passive: true });

		window.addEventListener('pointermove', function (e) {
			var rect = canvas.getBoundingClientRect();
			var inside = e.clientX >= rect.left && e.clientX <= rect.right &&
				e.clientY >= rect.top && e.clientY <= rect.bottom;
			pointer = inside ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
		}, { passive: true });
		document.addEventListener('pointerleave', function () { pointer = null; });

		// Pause the animation while the hero is off screen.
		if (hasObserver) {
			new IntersectionObserver(function (entries) {
				entries[0].isIntersecting ? start() : stop();
			}).observe(canvas);
		} else {
			start();
		}
	})();

	/* ----------------------------------------------------------------------
	   Project "Read more" toggles (one expanded at a time)
	   ---------------------------------------------------------------------- */
	var moreButtons = Array.prototype.slice.call(document.querySelectorAll('.project .more'));

	moreButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			var expand = button.getAttribute('aria-expanded') !== 'true';

			moreButtons.forEach(function (other) {
				var target = document.getElementById(other.getAttribute('aria-controls'));
				var open = expand && other === button;
				target.classList.toggle('is-expanded', open);
				other.setAttribute('aria-expanded', String(open));
				other.textContent = open ? 'Show less' : 'Read more';
			});
		});
	});

	/* ----------------------------------------------------------------------
	   Footer year
	   ---------------------------------------------------------------------- */
	var year = document.getElementById('year');
	if (year) year.textContent = new Date().getFullYear();
})();
