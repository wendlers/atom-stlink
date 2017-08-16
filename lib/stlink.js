'use babel';

import StlinkView from './stlink-view';
import { CompositeDisposable } from 'atom';

import fs from 'fs';
import path from 'path';
import findit from 'findit';

import StlinkSettings from './stlink-settings';
import StlinkProgrammer from './stlink-programmer';
import getCurrentProjectDir from './stlink-util';

export default {

  StlinkSettings: null,
  StlinkView: null,
  stlinkPanel: null,
  subscriptions: null,
  busyRegistry: null,

  config: {
    stlinkFlashtoolBinary: {
      title: 'st-flash binary',
      description: 'binary (with our without path) for the `st-flash` command',
      type: 'string',
      default: 'st-flash',
      order: 10
    },
    stlinkInfotoolBinary: {
      title: 'st-info binary',
      description: 'binary (with our without path) for the `st-info` command',
      type: 'string',
      default: 'st-info',
      order: 20
    },
  },

  activate(state) {

    require('atom-package-deps').install('stlink', true)
        .then(function() {
          console.log('dependencies installed for stlink');
    });

    this.StlinkSettings = new StlinkSettings();
    this.StlinkView = new StlinkView(state.StlinkViewState);

    this.StlinkSettings.read();
    this.StlinkView.fromSettings(this.StlinkSettings);

    this.StlinkView.onFlash(
        () => this.flash()
    );

    this.StlinkView.onErase(
        () => this.erase()
    );

    this.StlinkView.onClose(
        () => this.toggle()
    );

    this.stlinkModalPanel = atom.workspace.addModalPanel({
      item: this.StlinkView.getElement(),
      visible: false
    });

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'stlink:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'stlink:flash': () => this.flash()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'stlink:erase': () => this.erase()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'stlink:test': () => this.guessBinaryOutput((files) => {
          atom.notifications.addInfo('Found binary files', {detail: files})
        })
      }));
  },

  consumeBusy(registry) {
    this.busyRegistry = registry;
  },

  deactivate() {
    this.stlinkModalPanel.destroy();
    this.subscriptions.dispose();
    this.StlinkView.destroy();
  },

  serialize() {
    return {
      StlinkViewState: this.StlinkView.serialize()
    };
  },

  guessBinaryOutput(callback) {

    var prjDir = getCurrentProjectDir();
    var finder = findit(prjDir);
    var binaryFiles = [];

    finder.on('file', function (file, stat) {
        if(file.endsWith('.hex') || file.endsWith('.bin')) {
          console.log('found binary: ' + file);
          callback(file.substr(prjDir.length + 1));
          this.stop();
        }
    });

    finder.on('end', function () {
      if(callback) {
        callback(null);
      }
    });
  },

  notifySuccess(message) {

    var parts = message.split('\n');
    var header = 'stlink success!';
    var body = null;

    if(parts.length) {
      if(parts[0]) {
        header = parts[0];
      }
      if(parts.length > 1) {
        body = parts.splice(1, parts.length).join('<br/>')
      }
    }

    if(this.stlinkModalPanel.isVisible()) {
      var m = header;

      if(body) {
          m = m + '<br/><pre>' + body + '</div>'
      }
      this.StlinkView.setOutput(m);
      this.StlinkView.showOutput(true);
    }
    else {
      if(body) {
        atom.notifications.addSuccess(header, {detail: body});
      }
      else {
        atom.notifications.addSuccess(header);
      }
    }
  },

  notifyError(message) {

    var parts = message.split('\n');
    var header = 'stlink failed!';
    var body = null;

    if(parts.length) {
      if(parts[0]) {
        header = parts[0];
      }
      if(parts.length > 1) {
        body = parts.splice(1, parts.length).join('\n')
      }
    }

    if(this.stlinkModalPanel.isVisible()) {
      var m = header;

      if(body) {
        m = m + '<br/><div style="width: 450px; overflow-x: auto;""><pre>' + body + '<pre></div>'
      }

      this.StlinkView.setError(m);
      this.StlinkView.showError(true);
    }
    else {
      if(body) {
        atom.notifications.addError(header, {detail: body});
      }
      else {
        atom.notifications.addError(header);
      }
    }
  },

  showProgress(running) {
    if(this.stlinkModalPanel.isVisible()) {
      this.StlinkView.programmerRunning(running);
    }
  },

  flash() {

    var prog = new StlinkProgrammer(this.busyRegistry);

    if(this.stlinkModalPanel.isVisible()) {
      this.StlinkSettings = this.StlinkView.toSettings();
    }
    else {
      this.StlinkSettings.read();
    }

    this.StlinkSettings.dump();

    if(this.StlinkSettings.file.length == 0) {
        this.notifyError('No file to flash was given!');
        return;
    }

    this.showProgress(true);

    prog.flash(
      this.StlinkSettings,
      (message) => {
        this.showProgress(false);
        this.notifySuccess(message);
      },
      (message) => {
        this.showProgress(false);
        this.notifyError(message);
      }
    );
  },

  erase() {

    var prog = new StlinkProgrammer(this.busyRegistry);

    if(this.stlinkModalPanel.isVisible()) {
      this.StlinkSettings = this.StlinkView.toSettings();
    }
    else {
      this.StlinkSettings.read();
    }

    this.StlinkSettings.dump();

    this.StlinkView.programmerRunning(true);

    prog.erase(
      this.StlinkSettings,
      (message) => {
        this.showProgress(false);
        this.notifySuccess(message);
      },
      (message) => {
        this.showProgress(false);
        this.notifyError(message);
      }
    );
  },

  toggle() {

    var prog = new StlinkProgrammer(this.busyRegistry);

    if(prog.killRunning()) {
      if(this.stlinkModalPanel.isVisible()) {
          this.StlinkSettings = this.StlinkView.toSettings();
          this.StlinkSettings.write();
          return this.stlinkModalPanel.hide();
      }
      else {
          this.StlinkSettings = new StlinkSettings();
          this.StlinkSettings.read();

          this.guessBinaryOutput((binfile) => {
            if(this.StlinkSettings.file == '') {
              console.log('Settig file to: ' + binfile);
              this.StlinkSettings.file = binfile;
            }

            this.StlinkView.fromSettings(this.StlinkSettings);
            this.StlinkView.hideExtra();

            var prog = new StlinkProgrammer(this.busyRegistry);

            prog.list(
              this.StlinkSettings,
              (message) => {
                var bser = [];
                var lines = message.split('\n');

                var serial = null;
                var descr = null;

                for(var l in lines) {

                  var parts = lines[l].split(': ');

                  if(parts.length >= 2) {
                    if(parts[0].trim() == 'serial') {
                      serial = parts[1].trim()
                    }
                    else if(parts[0].trim() == 'descr') {
                      descr = parts[1].trim()
                    }
                    if(serial && descr) {
                      bser = bser.concat({name: descr, id: serial});
                      serial = null;
                      descr = null;
                    }
                  }
                }

                this.StlinkView.setBoardSerials(this.StlinkSettings, bser);
              },
              (message) => {
                this.notifyError(message);
              }
            );
          });

          return this.stlinkModalPanel.show();
      }
    }
  }
};
