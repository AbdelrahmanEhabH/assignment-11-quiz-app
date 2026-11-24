
function initCustomSelects() {
  document.querySelectorAll('.qm-select').forEach(select => {
    const trigger = select.querySelector('.qm-select-trigger');
    const options = select.querySelectorAll('.qm-select-option');
    const hiddenInput = select.parentElement.querySelector('input[type="hidden"]');
    const textSpan = trigger.querySelector('.qm-select-text');
    const iconSpan = trigger.querySelector('.qm-select-icon');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.qm-select.qm-open').forEach(s => {
        if (s !== select) s.classList.remove('qm-open');
      });
      select.classList.toggle('qm-open');
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        const icon = option.querySelector('i').outerHTML;
        const text = option.textContent.trim();

        select.dataset.value = value;
        if (hiddenInput) hiddenInput.value = value;
        textSpan.textContent = text;
        iconSpan.innerHTML = icon;

        options.forEach(o => o.classList.remove('qm-selected'));
        option.classList.add('qm-selected');
        select.classList.remove('qm-open');
      });
    });
  });
}


function initNumberInputs() {
  document.querySelectorAll('.qm-number-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.qm-number-wrapper');
      const input = wrapper.querySelector('input[type="number"]');
      const min = parseInt(input.min) || 1;
      const max = parseInt(input.max) || 50;
      let value = parseInt(input.value) || min;

      if (btn.dataset.action === 'increment' && value < max) {
        input.value = value + 1;
      } else if (btn.dataset.action === 'decrement' && value > min) {
        input.value = value - 1;
      }
    });
  });
}


function initClickOutside() {
  document.addEventListener('click', () => {
    document.querySelectorAll('.qm-select.qm-open').forEach(s => s.classList.remove('qm-open'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCustomSelects();
  initNumberInputs();
  initClickOutside();
});
