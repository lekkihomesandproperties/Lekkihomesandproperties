(function () {
  const API_BASE = 'https://lekkihomesandproperties.com/api';

  const money = value =>
    '₦' + Number(value || 0).toLocaleString('en-NG');

  const escapeHtml = value =>
    String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  // Rental payment calculation.
  function calculatePayment(property) {
    const annualRent = Number(property.price || 0);

    const isRental = ['For Rent', 'For Lease'].includes(
      String(property.type)
    );

    const commission = isRental
      ? Math.round(annualRent * 0.10)
      : 0;

    const agentCommission = commission;
    const legalCommission = commission;
    const cautionCommission = commission;
    const cautionFeeCommission = commission;

    const totalPayout =
      annualRent +
      agentCommission +
      legalCommission +
      cautionCommission +
      cautionFeeCommission;

    return {
      isRental,
      annualRent,
      agentCommission,
      legalCommission,
      cautionCommission,
      cautionFeeCommission,
      totalPayout
    };
  }

  function ensurePaymentStyles() {
    if (document.getElementById('lhp-payment-styles')) return;

    const style = document.createElement('style');
    style.id = 'lhp-payment-styles';

    style.textContent = `
      .lhp-pay-backdrop {
        position:fixed;
        inset:0;
        z-index:10020;
        background:rgba(0,0,0,.68);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        overflow:auto
      }

      .lhp-pay-panel {
        background:#fff;
        color:#24332b;
        width:min(100%,560px);
        max-height:92vh;
        overflow:auto;
        border-radius:16px;
        padding:24px;
        box-shadow:0 20px 70px rgba(0,0,0,.3);
        position:relative
      }

      .lhp-pay-close {
        position:absolute;
        right:14px;
        top:10px;
        border:0;
        background:transparent;
        font-size:28px;
        cursor:pointer;
        color:#345
      }

      .lhp-pay-panel h2 {
        color:#06452e;
        margin:0 35px 8px 0
      }

      .lhp-pay-panel p {line-height:1.55}

      .lhp-pay-field {margin:14px 0}

      .lhp-pay-field label {
        display:block;
        font-weight:600;
        margin-bottom:6px
      }

      .lhp-pay-field input,
      .lhp-pay-field select {
        width:100%;
        box-sizing:border-box;
        padding:12px;
        border:1px solid #cbd5ce;
        border-radius:8px;
        font:inherit
      }

      .lhp-pay-options {
        display:grid;
        gap:10px;
        margin:16px 0
      }

      .lhp-pay-option {
        display:flex;
        gap:10px;
        align-items:flex-start;
        border:1px solid #dce5de;
        border-radius:10px;
        padding:12px;
        cursor:pointer
      }

      .lhp-pay-option input {margin-top:4px}

      .lhp-pay-option strong {
        display:block;
        color:#06452e
      }

      .lhp-pay-note {
        font-size:.88rem;
        color:#58665d
      }

      .lhp-pay-breakdown {
        border:1px solid #dce5de;
        background:#f8faf8;
        padding:16px;
        border-radius:12px;
        margin:18px 0
      }

      .lhp-pay-breakdown h3 {
        color:#06452e;
        margin:0 0 12px;
        font-size:1.05rem
      }

      .lhp-pay-breakdown-row {
        display:flex;
        justify-content:space-between;
        gap:12px;
        padding:7px 0;
        font-size:.94rem
      }

      .lhp-pay-breakdown-total {
        border-top:2px solid #06452e;
        margin-top:8px;
        padding-top:13px;
        font-weight:800;
        color:#06452e;
        font-size:1.08rem
      }

      .lhp-pay-submit {
        width:100%;
        border:0;
        border-radius:9px;
        padding:14px;
        background:#b18a25;
        color:#fff;
        font-weight:700;
        font-size:1rem;
        cursor:pointer
      }

      .lhp-pay-submit:disabled {
        opacity:.6;
        cursor:wait
      }

      .lhp-pay-error {
        color:#a12626;
        margin:10px 0;
        min-height:1.2em
      }
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

    const property = properties.find(
      p => String(p._id) === String(propertyId)
    );

    if (!property) {
      alert('Property details could not be loaded. Please refresh and try again.');
      return;
    }

    const settings = property.paymentSettings || {};

    if (!settings.enabled) {
      alert('Online payment is not enabled for this property. Please contact our team.');
      return;
    }

    const breakdown = calculatePayment(property);

    const {
      isRental,
      annualRent,
      agentCommission,
      legalCommission,
      cautionCommission,
      cautionFeeCommission,
      totalPayout
    } = breakdown;

    ensurePaymentStyles();
    closePaymentModal();

    // Available payment options.
    const options = [];

    if (settings.allowFullPayment) {
      options.push({
        value: 'full',
        title: 'Pay in full',
        description: money(totalPayout)
      });
    }

    if (settings.allowDeposit) {
      options.push({
        value: 'deposit',
        title: 'Pay fixed deposit',
        description: money(settings.depositAmount)
      });
    }

    if (settings.allowMonthlyInstallments) {
      const first =
        settings.allowDeposit && Number(settings.depositAmount) > 0
          ? settings.depositAmount
          : settings.monthlyAmount;

      options.push({
        value: 'monthly',
        title: 'Monthly installment plan',
        description:
          `${money(first)} initial payment, then ` +
          `${money(settings.monthlyAmount)} monthly for up to ` +
          `${settings.monthlyMonths} months`
      });
    }

    if (settings.allowCustomInstallments) {
      options.push({
        value: 'custom',
        title: 'Choose my payment amount',
        description:
          'Choose an amount to pay now against your outstanding balance.'
      });
    }

    if (!options.length) {
      alert('No online payment options are currently available for this property.');
      return;
    }

    // Build the rental payment breakdown.
    const breakdownHtml = isRental
      ? `
        <div class="lhp-pay-breakdown" id="lhpPaymentBreakdown">
          <h3>Rental Payment Breakdown</h3>

          <div class="lhp-pay-breakdown-row">
            <span>Annual Rent (100%)</span>
            <strong>${money(annualRent)}</strong>
          </div>

          <div class="lhp-pay-breakdown-row">
            <span>Agent Commission (10%)</span>
            <strong>${money(agentCommission)}</strong>
          </div>

          <div class="lhp-pay-breakdown-row">
            <span>Legal Commission (10%)</span>
            <strong>${money(legalCommission)}</strong>
          </div>

          <div class="lhp-pay-breakdown-row">
            <span>Caution Commission (10%)</span>
            <strong>${money(cautionCommission)}</strong>
          </div>

          <div class="lhp-pay-breakdown-row">
            <span>Caution Fee Commission (10%)</span>
            <strong>${money(cautionFeeCommission)}</strong>
          </div>

          <div class="lhp-pay-breakdown-row lhp-pay-breakdown-total">
            <span>TOTAL PAYOUT</span>
            <strong>${money(totalPayout)}</strong>
          </div>
        </div>
      `
      : `
        <div class="lhp-pay-breakdown" id="lhpPaymentBreakdown">
          <h3>Property Payment Breakdown</h3>
          <div class="lhp-pay-breakdown-row">
            <span>Property Price</span>
            <strong>${money(totalPayout)}</strong>
          </div>
          <div class="lhp-pay-breakdown-row lhp-pay-breakdown-total">
            <span>TOTAL PAYOUT</span>
            <strong>${money(totalPayout)}</strong>
          </div>
        </div>
      `;

    const backdrop = document.createElement('div');

    backdrop.id = 'lhpPaymentBackdrop';
    backdrop.className = 'lhp-pay-backdrop';

    backdrop.innerHTML = `
      <section class="lhp-pay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lhpPayTitle">

        <button class="lhp-pay-close"
          type="button"
          aria-label="Close">&times;</button>

        <h2 id="lhpPayTitle">Make a property payment</h2>

        <p>
          <strong>${escapeHtml(property.title)}</strong><br>
          ${escapeHtml(property.location)}
        </p>

        ${breakdownHtml}

        <form id="lhpPaymentForm">

          <div class="lhp-pay-field">
            <label for="lhpPayEmail">Email address</label>
            <input id="lhpPayEmail"
              type="email"
              required
              autocomplete="email"
              placeholder="you@example.com">
          </div>

          <div class="lhp-pay-options">
            ${options.map((option, index) => `
              <label class="lhp-pay-option">
                <input type="radio"
                  name="paymentType"
                  value="${option.value}"
                  ${index === 0 ? 'checked' : ''}>

                <span>
                  <strong>${option.title}</strong>
                  <span class="lhp-pay-note">
                    ${option.description}
                  </span>
                </span>
              </label>
            `).join('')}
          </div>

          <div class="lhp-pay-field"
            id="lhpCustomAmountWrap"
            hidden>

            <label for="lhpCustomAmount">
              Amount to pay now (NGN)
            </label>

            <input id="lhpCustomAmount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount">

            <span class="lhp-pay-note">
              Enter the amount you want to pay towards your outstanding balance.
            </span>
          </div>

          <div class="lhp-pay-field">
            <label for="lhpExistingToken">
              Continue an existing payment plan (optional)
            </label>

            <input id="lhpExistingToken"
              type="text"
              placeholder="Paste your payment plan reference">
          </div>

          <p class="lhp-pay-note">
            Payments are processed securely by Paystack.
            Your payment balance is updated only after server-side verification.
          </p>

          <div class="lhp-pay-error"
            id="lhpPayError"
            role="alert"></div>

          <button class="lhp-pay-submit"
            id="lhpPaySubmit"
            type="submit">
            Continue to secure payment
          </button>

        </form>
      </section>
    `;

    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closePaymentModal();
    });

    backdrop.querySelector('.lhp-pay-close')
      .addEventListener('click', closePaymentModal);

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    const form = document.getElementById('lhpPaymentForm');
    const customWrap = document.getElementById('lhpCustomAmountWrap');
    const radios = [
      ...form.querySelectorAll('input[name="paymentType"]')
    ];

    const updateAmountVisibility = () => {
      const selected = form.querySelector(
        'input[name="paymentType"]:checked'
      )?.value;

      customWrap.hidden = selected !== 'custom';
    };

    radios.forEach(radio =>
      radio.addEventListener('change', updateAmountVisibility)
    );

    updateAmountVisibility();

    const emailInput = document.getElementById('lhpPayEmail');
    const tokenInput = document.getElementById('lhpExistingToken');

    emailInput.addEventListener('change', () => {
      const saved = localStorage.getItem(
        `lhp_payment_plan_${propertyId}_${emailInput.value.trim().toLowerCase()}`
      );

      if (saved && !tokenInput.value) {
        tokenInput.value = saved;
        customWrap.hidden = false;
      }
    });

    tokenInput.addEventListener('input', event => {
      const hasToken = Boolean(event.target.value.trim());

      customWrap.hidden = hasToken
        ? false
        : form.querySelector('input[name="paymentType"]:checked')?.value !== 'custom';

      // An existing plan uses its saved agreement, not a new preview.
      const preview = document.getElementById('lhpPaymentBreakdown');

      if (preview) {
        preview.hidden = hasToken;
      }
    });

    // Initialize payment securely.
    form.addEventListener('submit', async event => {
      event.preventDefault();

      const submit = document.getElementById('lhpPaySubmit');
      const errorBox = document.getElementById('lhpPayError');

      const email = emailInput.value.trim().toLowerCase();
      const token = tokenInput.value.trim();

      const paymentType = form.querySelector(
        'input[name="paymentType"]:checked'
      )?.value;

      const amount = Number(
        document.getElementById('lhpCustomAmount').value
      );

      if (
        !token &&
        paymentType === 'custom' &&
        (!Number.isSafeInteger(amount) || amount <= 0)
      ) {
        errorBox.textContent = 'Enter a valid payment amount.';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Preparing secure payment...';
      errorBox.textContent = '';

      try {
        const response = await fetch(
          API_BASE + '/payments/initialize',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              propertyId,
              email,

              paymentType: token
                ? 'custom'
                : paymentType,

              amount:
                Number.isSafeInteger(amount) && amount > 0
                  ? amount
                  : undefined,

              agreementToken: token || undefined
            })
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.authorization_url) {
          throw new Error(
            data.message || 'Could not start payment.'
          );
        }

        if (data.agreementToken) {
          localStorage.setItem(
            `lhp_payment_plan_${propertyId}_${email}`,
            data.agreementToken
          );
        }

        window.location.href = data.authorization_url;

      } catch (error) {
        errorBox.textContent =
          error.message ||
          'Payment could not be started. Please try again.';

        submit.disabled = false;
        submit.textContent = 'Continue to secure payment';
      }
    });
  };
})();