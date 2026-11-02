(function () {
  const API_BASE = 'https://lekkihomesandproperties.com/api';
  const money = value => '₦' + Number(value || 0).toLocaleString('en-NG');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function ensurePaymentStyles() {
    if (document.getElementById('lhp-payment-styles')) return;
    const style = document.createElement('style');
    style.id = 'lhp-payment-styles';
    style.textContent = `
      .lhp-pay-backdrop{position:fixed;inset:0;z-index:10020;background:rgba(0,0,0,.68);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
      .lhp-pay-panel{background:#fff;color:#24332b;width:min(100%,560px);max-height:92vh;overflow:auto;border-radius:16px;padding:24px;box-shadow:0 20px 70px rgba(0,0,0,.3);position:relative}
      .lhp-pay-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:28px;cursor:pointer;color:#345}
      .lhp-pay-panel h2{color:#06452e;margin:0 35px 8px 0}.lhp-pay-panel p{line-height:1.55}
      .lhp-pay-field{margin:14px 0}.lhp-pay-field label{display:block;font-weight:600;margin-bottom:6px}
      .lhp-pay-field input,.lhp-pay-field select{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5ce;border-radius:8px;font:inherit}
      .lhp-pay-options{display:grid;gap:10px;margin:16px 0}.lhp-pay-option{display:flex;gap:10px;align-items:flex-start;border:1px solid #dce5de;border-radius:10px;padding:12px;cursor:pointer}
      .lhp-pay-option input{margin-top:4px}.lhp-pay-option strong{display:block;color:#06452e}.lhp-pay-note{font-size:.88rem;color:#58665d}
      .lhp-pay-submit{width:100%;border:0;border-radius:9px;padding:14px;background:#b18a25;color:#fff;font-weight:700;font-size:1rem;cursor:pointer}
      .lhp-pay-submit:disabled{opacity:.6;cursor:wait}.lhp-pay-error{color:#a12626;margin:10px 0;min-height:1.2em}
    `;
    document.head.appendChild(style);
  }

  function closePaymentModal() {
    document.getElementById('lhpPaymentBackdrop')?.remove();
    document.body.style.overflow = '';
  }

  window.startPayment = async function (propertyId) {
    let properties = [];
    try {
      properties = await window.getProperties();
    } catch (_) {}
    const property = properties.find(p => String(p._id) === String(propertyId));
    if (!property) {
      alert('Property details could not be loaded. Please refresh and try again.');
      return;
    }
    const settings = property.paymentSettings || {};
    if (!settings.enabled) {
      alert('Online payment is not enabled for this property. Please contact our team.');
      return;
    }

    ensurePaymentStyles();
    closePaymentModal();
    const options = [];
    if (settings.allowFullPayment) options.push({ value: 'full', title: 'Pay in full', description: money(property.price) });
    if (settings.allowDeposit) options.push({ value: 'deposit', title: 'Pay fixed deposit', description: money(settings.depositAmount) });
    if (settings.allowMonthlyInstallments) {
      const first = settings.allowDeposit && Number(settings.depositAmount) > 0 ? settings.depositAmount : settings.monthlyAmount;
      options.push({ value: 'monthly', title: 'Monthly installment plan', description: `${money(first)} initial payment, then ${money(settings.monthlyAmount)} monthly for up to ${settings.monthlyMonths} months` });
    }
    if (settings.allowCustomInstallments) options.push({ value: 'custom', title: 'Choose my payment amount', description: 'Enter the amount you want to pay now. You can make further payments against the outstanding balance.' });
    if (!options.length) {
      alert('No online payment options are currently available for this property.');
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'lhpPaymentBackdrop';
    backdrop.className = 'lhp-pay-backdrop';
    backdrop.innerHTML = `
      <section class="lhp-pay-panel" role="dialog" aria-modal="true" aria-labelledby="lhpPayTitle">
        <button class="lhp-pay-close" type="button" aria-label="Close">&times;</button>
        <h2 id="lhpPayTitle">Make a property payment</h2>
        <p><strong>${escapeHtml(property.title)}</strong><br>${escapeHtml(property.location)}</p>
        <p>Property price: <strong>${money(property.price)}</strong></p>
        <form id="lhpPaymentForm">
          <div class="lhp-pay-field"><label for="lhpPayEmail">Email address</label><input id="lhpPayEmail" type="email" required autocomplete="email" placeholder="you@example.com"></div>
          <div class="lhp-pay-options">${options.map((option, index) => `
            <label class="lhp-pay-option"><input type="radio" name="paymentType" value="${option.value}" ${index === 0 ? 'checked' : ''}>
              <span><strong>${option.title}</strong><span class="lhp-pay-note">${option.description}</span></span></label>`).join('')}
          </div>
          <div class="lhp-pay-field" id="lhpCustomAmountWrap" hidden><label for="lhpCustomAmount">Amount to pay now (NGN)</label><input id="lhpCustomAmount" type="number" min="1" step="1" placeholder="Enter amount"><span class="lhp-pay-note">For a custom plan, enter your chosen amount. A monthly plan will use its agreed monthly amount.</span></div>
          <div class="lhp-pay-field"><label for="lhpExistingToken">Continue an existing payment plan (optional)</label><input id="lhpExistingToken" type="text" placeholder="Paste your payment plan reference"></div>
          <p class="lhp-pay-note">Payments are processed securely by Paystack. Your balance is updated only after server-side verification.</p>
          <div class="lhp-pay-error" id="lhpPayError" role="alert"></div>
          <button class="lhp-pay-submit" id="lhpPaySubmit" type="submit">Continue to secure payment</button>
        </form>
      </section>`;
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closePaymentModal(); });
    backdrop.querySelector('.lhp-pay-close').addEventListener('click', closePaymentModal);
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    const form = document.getElementById('lhpPaymentForm');
    const customWrap = document.getElementById('lhpCustomAmountWrap');
    const radios = [...form.querySelectorAll('input[name="paymentType"]')];
    const updateAmountVisibility = () => {
      const selected = form.querySelector('input[name="paymentType"]:checked')?.value;
      customWrap.hidden = selected !== 'custom';
    };
    radios.forEach(radio => radio.addEventListener('change', updateAmountVisibility));
    updateAmountVisibility();

    const emailInput = document.getElementById('lhpPayEmail');
    emailInput.addEventListener('change', () => {
      const saved = localStorage.getItem(`lhp_payment_plan_${propertyId}_${emailInput.value.trim().toLowerCase()}`);
      if (saved && !document.getElementById('lhpExistingToken').value) {
        document.getElementById('lhpExistingToken').value = saved;
        customWrap.hidden = false;
      }
    });
    document.getElementById('lhpExistingToken').addEventListener('input', event => {
      if (event.target.value.trim()) customWrap.hidden = false;
      else updateAmountVisibility();
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = document.getElementById('lhpPaySubmit');
      const errorBox = document.getElementById('lhpPayError');
      const email = emailInput.value.trim().toLowerCase();
      const token = document.getElementById('lhpExistingToken').value.trim();
      const paymentType = form.querySelector('input[name="paymentType"]:checked')?.value;
      const amount = Number(document.getElementById('lhpCustomAmount').value);
      if (!token && paymentType === 'custom' && (!Number.isFinite(amount) || amount <= 0)) {
        errorBox.textContent = 'Enter a valid payment amount.';
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Preparing secure payment...';
      errorBox.textContent = '';
      try {
        const response = await fetch(API_BASE + '/payments/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            email,
            paymentType: token ? 'custom' : paymentType,
            amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
            agreementToken: token || undefined
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.authorization_url) throw new Error(data.message || 'Could not start payment.');
        localStorage.setItem(`lhp_payment_plan_${propertyId}_${email}`, data.agreementToken);
        location.href = data.authorization_url;
      } catch (error) {
        errorBox.textContent = error.message || 'Payment could not be started. Please try again.';
        submit.disabled = false;
        submit.textContent = 'Continue to secure payment';
      }
    });
  };
})();
