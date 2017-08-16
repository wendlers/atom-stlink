'use babel';

import fs from 'fs';
import path from 'path';
import {Emitter} from 'atom';

import StlinkSettings from './stlink-settings';


export default class StlinkView {

  constructor(serializedState) {

    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('stlink');

    this.element.innerHTML = fs.readFileSync(path.join(__dirname, './stlink-view.html'));

    this.flashButton = this.element.querySelector('#stlink-flash');
    this.flashButton.addEventListener('click', () => {
        this.emitter.emit('flash');
    });

    this.eraseButton = this.element.querySelector('#stlink-flasherase');
    this.eraseButton.addEventListener('click', () => {
        this.emitter.emit('erase');
    });

    this.closeButton = this.element.querySelector('#stlink-close');
    this.closeButton.addEventListener('click', () => {
        this.emitter.emit('close');
    });

    this.settingsPanel = this.element.querySelector('#stlink-settings-panel');
    this.settingsPanel.style.display = 'block';

    this.progressPanel = this.element.querySelector('#stlink-progress-panel');
    this.progressPanel.style.display = 'none';
    this.message = this.element.querySelector('#stlink-message');

    this.errorPanel = this.element.querySelector('#stlink-error-panel');
    this.errorPanel.style.display = 'none';
    this.error = this.element.querySelector('#stlink-error');

    this.outputPanel = this.element.querySelector('#stlink-output-panel');
    this.outputPanel.style.display = 'none';
    this.output = this.element.querySelector('#stlink-output');

    this.reset = this.element.querySelector('#stlink-reset');

    this.serial = this.element.querySelector('#stlink-serial');
    this.file = this.element.querySelector('#stlink-file');
    this.address = this.element.querySelector('#stlink-address');
  }

  serialize() {}

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  onClose(callback) {
    this.emitter.on('close', callback);
  }

  onFlash(callback) {
    this.emitter.on('flash', callback);
  }

  onErase(callback) {
    this.emitter.on('erase', callback);
  }

  onReset(callback) {
    this.emitter.on('reset', callback);
  }

  setBoardSerials(settings, serials) {

    var html = '<option value="autodetect">-autodetect-</option>';

    for(var b in serials) {

      var selected = '';

      if(settings.serial == serials[b].id) {
        selected = ' selected'
      }

      html = html + '<option value="' + serials[b].id + '"'+ selected
        + '>' + serials[b].id + ' (' + serials[b].name + ')</option>';
    }
    this.serial.innerHTML = html;
  }

  fromSettings(settings) {

    this.serial.value = settings.serial;
    this.file.value = settings.file;
    this.address.value = settings.address;

    this.reset.checked = settings.reset;

    this.hideExtra();
    this.programmerRunning(false);
  }

  toSettings() {

    var settings = new StlinkSettings();

    settings.serial = this.serial.value;
    settings.file = this.file.value;
    settings.address = this.address.value;

    settings.reset = this.reset.checked;

    return settings;
  }

  programmerRunning(running) {
    if(running) {
      this.progressPanel.style.display = 'block';
      this.settingsPanel.style.display = 'none';
      this.errorPanel.style.display = 'none';
      this.outputPanel.style.display = 'none';

      this.flashButton.disabled = true;
      this.eraseButton.disabled = true;
      this.closeButton.innerHTML = 'cancel';
    }
    else {
      this.settingsPanel.style.display = 'block';
      this.progressPanel.style.display = 'none';

      this.flashButton.disabled = false;
      this.eraseButton.disabled = false;
      this.closeButton.innerHTML = 'close';
    }
  }

  setError(message) {
    this.error.innerHTML = '<div>' + message + '</div>';
  }

  showError() {
    this.errorPanel.style.display = 'block';
  }

  hideError() {
    this.errorPanel.style.display = 'none';
  }

  setOutput(message) {
    this.output.innerHTML = '<div>' + message + '</div>';
  }

  showOutput() {
    this.outputPanel.style.display = 'block';
  }

  hideOutput() {
    this.outputPanel.style.display = 'none';
  }

  hideExtra() {
    this.hideError();
    this.hideOutput();
  }
}
