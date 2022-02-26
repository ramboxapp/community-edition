const { ipcRenderer } = require('electron');

let sourceList, contentList, typeButtons, shareButton, cancelButton, activeItem, activeTab = 'screen';

const getItemDOM = item => {
  const li = document.createElement('li');
  li.setAttribute('data-id', item.id);
  li.innerHTML = `<div class="content"><div class="img-wrapper"><img src="${item.thumbnail}" /></div><span>${item.name}</span></div>`;
  li.addEventListener('click', onItemClick, false);
  return li;
};

const updateTab = () => {
  const sources = sourceList.filter(it => it.id.indexOf(activeTab) === 0);
  contentList.innerHTML = '';
  sources.forEach(source => contentList.appendChild(getItemDOM(source)));
};

const bindTypeClick = () => {
  typeButtons.forEach(it => it.addEventListener('click', onChangeType, false));
};

const bindActionsClick = () => {
  shareButton.addEventListener('click', onShareClick, false);
  cancelButton.addEventListener('click', onCancelClick, false);
};

const onChangeType = event => {
  event.preventDefault();
  if (!event.target.classList.contains('active')) {
    activeTab = event.target.dataset.type;
    typeButtons.forEach(it => it.classList.remove('active'));
    event.target.classList.add('active');
    updateTab();
  }
};

const onItemClick = event => {
  event.preventDefault();
  if (!event.currentTarget.classList.contains('active')) {
    activeItem = event.currentTarget.dataset.id;
    document.querySelectorAll('.preview li').forEach(it => it.classList.remove('active'));
    event.currentTarget.classList.add('active');
    changeShareState();
  }
};

const onCancelClick = event => {
  event.preventDefault();
  ipcRenderer.send('screenShare:cancelSelection');
};

const onShareClick = event => {
  event.preventDefault();
  if (activeItem) {
    ipcRenderer.send('screenShare:selectScreen', activeItem);
  }
};

const changeShareState = () => {
  if (shareButton.getAttribute('disabled') !== null) {
    shareButton.removeAttribute('disabled');
  }
};

window.addEventListener('load', async () => {
  sourceList = await ipcRenderer.invoke('screenShare:getSources');

  contentList = document.querySelector('.preview');
  typeButtons = document.querySelectorAll('.type li');
  shareButton = document.querySelector('#share');
  cancelButton = document.querySelector('#cancel');

  bindTypeClick();
  bindActionsClick();
  updateTab();
}, false);
