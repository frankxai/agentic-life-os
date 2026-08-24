# Dashboard deployment requirements

The dashboard is a read-only publication candidate, not an operational control surface. Before any public hosting, configure and verify these HTTP response headers at the host or edge. A meta policy cannot enforce anti-framing.

```text
Content-Security-Policy: default-src 'none'; style-src 'sha256-tmNRhQE79vLzoa0ypKaSxV3bG23HZ7QAEXyaJ88BC6A='; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; connect-src 'none'; script-src 'none'; object-src 'none'
X-Frame-Options: DENY
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
```

The host must also be audited for injected analytics, cookies, scripts, transforms, and headers. Confirm the rendered response in desktop and mobile browsers, with keyboard-only navigation, forced colors, increased text size, reduced motion, and a screen reader. Keep the page `noindex,nofollow` until the repository projection and release governance are approved.
