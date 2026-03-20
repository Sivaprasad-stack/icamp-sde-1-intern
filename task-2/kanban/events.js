import {
  addColumn,
  removeColumn,
  renameColumn,
  addCard,
  updateCard,
  removeCard,
  moveCard,
} from './state.js';

let openForm = null;
let cachedRenderBoard = null;

async function callRenderBoard() {
  if (cachedRenderBoard) {
    cachedRenderBoard();
    return;
  }
  const mod = await import('./board.js');
  cachedRenderBoard = mod.renderBoard;
  cachedRenderBoard();
}

function closeOpenForms() {
  if (!openForm) return;
  const { containerEl, previousHTML } = openForm;
  if (containerEl && typeof containerEl.innerHTML === 'string') {
    containerEl.innerHTML = previousHTML;
  }
  openForm = null;
}

function getColumnId(el) {
  return el.closest('.column')?.dataset.id;
}

function getCardId(el) {
  return el.closest('.card')?.dataset.id;
}

function openAddCardForm(columnEl) {
  const columnId = getColumnId(columnEl);
  if (!columnId) return;

  const footerEl = columnEl.querySelector('.column-footer');
  if (!footerEl) return;

  closeOpenForms();
  openForm = { containerEl: footerEl, previousHTML: footerEl.innerHTML };

  footerEl.innerHTML = `
    <form class="inline-card-form" data-mode="add" data-column-id="${columnId}">
      <div class="inline-error" style="color:#b00020; display:none;"></div>
      <input class="inline-title-input" type="text" placeholder="Title" />
      <textarea class="inline-desc-input" placeholder="Description"></textarea>
      <div class="inline-actions">
        <button type="button" class="inline-form-save">Save</button>
        <button type="button" class="inline-form-cancel">Cancel</button>
      </div>
    </form>
  `;
}

function openEditCardForm(cardEl) {
  const cardId = getCardId(cardEl);
  if (!cardId) return;

  const titleText = cardEl.querySelector('.card-title')?.textContent || '';
  const descText = cardEl.querySelector('.card-desc')?.textContent || '';

  closeOpenForms();
  openForm = { containerEl: cardEl, previousHTML: cardEl.innerHTML };

  cardEl.innerHTML = `
    <form class="inline-card-form" data-mode="edit" data-card-id="${cardId}">
      <div class="inline-error" style="color:#b00020; display:none;"></div>
      <input class="inline-title-input" type="text" value="${escapeAttr(titleText)}" />
      <textarea class="inline-desc-input">${escapeText(descText)}</textarea>
      <div class="inline-actions">
        <button type="button" class="inline-form-save">Save</button>
        <button type="button" class="inline-form-cancel">Cancel</button>
      </div>
    </form>
  `;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeText(value) {
  return String(value).replaceAll('<', '&lt;');
}

function setInlineError(formEl, message) {
  const errEl = formEl.querySelector('.inline-error');
  if (!errEl) return;
  errEl.textContent = message;
  errEl.style.display = 'block';
}

function clearInlineError(formEl) {
  const errEl = formEl.querySelector('.inline-error');
  if (!errEl) return;
  errEl.textContent = '';
  errEl.style.display = 'none';
}

function readFormValues(formEl) {
  const title = formEl.querySelector('.inline-title-input')?.value ?? '';
  const description = formEl.querySelector('.inline-desc-input')?.value ?? '';
  return { title, description };
}

export function initEvents() {
  const board = document.getElementById('board');
  if (!board) return;

  const searchEl = document.getElementById('search');
  if (searchEl) searchEl.addEventListener('input', applyFilter);

  board.addEventListener('click', async (e) => {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;

    // Inline form buttons first (so Save/Cancel doesn't fall through).
    if (target.classList.contains('inline-form-cancel')) {
      e.preventDefault();
      closeOpenForms();
      return;
    }

    if (target.classList.contains('inline-form-save')) {
      e.preventDefault();
      const formEl = target.closest('.inline-card-form');
      if (!formEl) return;

      const mode = formEl.dataset.mode;
      const { title, description } = readFormValues(formEl);
      const trimmedTitle = String(title).trim();

      if (!trimmedTitle) {
        setInlineError(formEl, 'Title cannot be empty');
        return;
      }
      clearInlineError(formEl);

      try {
        if (mode === 'add') {
          const columnId = formEl.dataset.columnId;
          addCard(columnId, trimmedTitle, String(description));
          await callRenderBoard();
          closeOpenForms();
          return;
        }

        if (mode === 'edit') {
          const cardId = formEl.dataset.cardId;
          updateCard(cardId, trimmedTitle, String(description));
          await callRenderBoard();
          closeOpenForms();
          return;
        }
      } catch (err) {
        // For safety: state functions can throw on empty title; treat as inline error.
        setInlineError(formEl, err instanceof Error ? err.message : String(err));
      }

      return;
    }

    // Column controls.
    if (target.id === 'add-column-btn') {
      const title = window.prompt('Column title');
      if (title === null) return;
      try {
        addColumn(title);
        await callRenderBoard();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    const columnEl = target.closest('.column') || null;
    const columnId = columnEl?.dataset?.id;

    if (target.classList.contains('rename-btn') && columnId) {
      const currentTitle = columnEl.querySelector('.column-header h2')?.textContent || '';
      const newTitle = window.prompt('Rename column', currentTitle);
      if (newTitle === null) return;
      try {
        renameColumn(columnId, newTitle);
        await callRenderBoard();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    if (target.classList.contains('delete-col-btn') && columnId) {
      const hasCards = columnEl.querySelectorAll('.card').length > 0;
      if (hasCards) {
        const ok = window.confirm(`Delete column "${columnEl.querySelector('h2')?.textContent || ''}"?`);
        if (!ok) return;
      }
      removeColumn(columnId);
      await callRenderBoard();
      return;
    }

    // Add card triggers the inline form.
    if (target.classList.contains('add-card-btn') && columnEl) {
      openAddCardForm(columnEl);
      return;
    }

    // Card controls.
    if (target.classList.contains('edit-btn')) {
      const cardEl = target.closest('.card');
      if (!cardEl) return;
      openEditCardForm(cardEl);
      return;
    }

    const cardEl = target.closest('.card') || null;
    const cardId = cardEl?.dataset?.id;

    if (target.classList.contains('delete-btn') && cardId) {
      const ok = window.confirm('Delete this card?');
      if (!ok) return;
      removeCard(cardId);
      await callRenderBoard();
      return;
    }

    if (target.classList.contains('move-left') && cardId) {
      moveCard(cardId, 'left');
      await callRenderBoard();
      return;
    }

    if (target.classList.contains('move-right') && cardId) {
      moveCard(cardId, 'right');
      await callRenderBoard();
      return;
    }
  });
}

export function applyFilter() {
  const searchInput = document.getElementById('search');
  const query = (searchInput?.value ?? '').toLowerCase();
  const columns = document.querySelectorAll('.column');

  columns.forEach((col) => {
    const cards = col.querySelectorAll('.card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const titleEl = card.querySelector('.card-title');
      const title = (titleEl?.textContent ?? '').toLowerCase();
      const matches = !query || title.includes(query);

      if (matches) {
        card.style.display = '';
        visibleCount += 1;
      } else {
        card.style.display = 'none';
      }
    });

    // Columns with no visible cards are dimmed.
    col.style.opacity = visibleCount === 0 ? '0.4' : '1';

    // Empty placeholder always visible (it's not a `.card`, so we don't hide it).
    const placeholder = col.querySelector('.empty-placeholder');
    if (placeholder) placeholder.style.display = '';
  });
}

