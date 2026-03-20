import { getState } from './state.js';

export function renderBoard() {
  const board = document.getElementById('board');
  if (!board) return;

  // Ticket 2 rule: always rebuild from state on each call.
  board.innerHTML = '';

  const { columns } = getState();

  function createCard(card, isFirst, isLast) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.id = card.id;

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = card.title;

    const descEl = document.createElement('div');
    descEl.className = 'card-desc';
    descEl.textContent = card.description || '';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';

    const moveLeftBtn = document.createElement('button');
    moveLeftBtn.className = 'move-left';
    moveLeftBtn.type = 'button';
    moveLeftBtn.textContent = '←';
    if (isFirst) moveLeftBtn.disabled = true;

    const moveRightBtn = document.createElement('button');
    moveRightBtn.className = 'move-right';
    moveRightBtn.type = 'button';
    moveRightBtn.textContent = '→';
    if (isLast) moveRightBtn.disabled = true;

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(deleteBtn);
    actionsEl.appendChild(moveLeftBtn);
    actionsEl.appendChild(moveRightBtn);

    cardEl.appendChild(titleEl);
    cardEl.appendChild(descEl);
    cardEl.appendChild(actionsEl);

    return cardEl;
  }

  function createColumn(column, isFirst, isLast) {
    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.dataset.id = column.id;

    const headerEl = document.createElement('div');
    headerEl.className = 'column-header';

    const h2 = document.createElement('h2');
    h2.textContent = column.title;

    const renameBtn = document.createElement('button');
    renameBtn.className = 'rename-btn';
    renameBtn.type = 'button';
    renameBtn.textContent = '✏';

    const deleteColBtn = document.createElement('button');
    deleteColBtn.className = 'delete-col-btn';
    deleteColBtn.type = 'button';
    deleteColBtn.textContent = '✕';

    headerEl.appendChild(h2);
    headerEl.appendChild(renameBtn);
    headerEl.appendChild(deleteColBtn);

    const cardListEl = document.createElement('div');
    cardListEl.className = 'card-list';

    if (!column.cards || column.cards.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-placeholder';
      empty.textContent = 'No cards yet';
      cardListEl.appendChild(empty);
    } else {
      for (const card of column.cards) {
        cardListEl.appendChild(createCard(card, isFirst, isLast));
      }
    }

    const footerEl = document.createElement('div');
    footerEl.className = 'column-footer';

    const addCardBtn = document.createElement('button');
    addCardBtn.className = 'add-card-btn';
    addCardBtn.type = 'button';
    addCardBtn.textContent = 'Add card';

    footerEl.appendChild(addCardBtn);

    colEl.appendChild(headerEl);
    colEl.appendChild(cardListEl);
    colEl.appendChild(footerEl);

    return colEl;
  }

  const lastIdx = columns.length - 1;
  columns.forEach((column, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === lastIdx;
    board.appendChild(createColumn(column, isFirst, isLast));
  });

  const addColBtn = document.createElement('button');
  addColBtn.id = 'add-column-btn';
  addColBtn.type = 'button';
  addColBtn.textContent = 'Add column';
  board.appendChild(addColBtn);
}

