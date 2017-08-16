'use babel';

import { BufferedProcess } from 'atom';

import path from 'path';
import getCurrentProjectDir from './stlink-util';

// only one instance of a st-flash process is allowed here ..
var stlink_proc = null;

export default class StlinkProgrammer {

  constructor(busyRegistry) {
      this.busyRegistry = busyRegistry;
  }

  exec(command, args, callbackSuccess, callbackFail) {

    console.log(command + ": " + args);

    if(!this.killRunning()) {
        return;
    }

    var log = '';

    var notify = (data) => {
        log += data;
    }

    const stdout = (output) => notify(output);

    if(this.busyRegistry) {
        this.busyRegistry.begin('stlink.exec', command);
    }

    stlink_proc = new BufferedProcess({
        command: command,
        args: args,
        stdout: stdout,
        stderr: stdout,
        exit: (code) => {
            if(code) {
              callbackFail(log);
            }
            else {
              callbackSuccess(log);
            }
            if(this.busyRegistry) {
                this.busyRegistry.end('stlink.exec');
            }
            stlink_proc = null;
        }
    });

    stlink_proc.onWillThrowError((err) => {
      err.handle();

      if(this.busyRegistry) {
          this.busyRegistry.end('stlink.exec');
      }
      stlink_proc = null;

      if(err.error.message.endsWith('ENOENT')) {
        callbackFail('stlink binaries not found in your PATH');
      }
      else {
        callbackFail(err.error.message);
      }
    });
  }

  flashtool(args, callbackSuccess, callbackFail) {
    this.exec(atom.config.get("stlink.stlinkFlashtoolBinary"), args, callbackSuccess, callbackFail);
  }

  infotool(args, callbackSuccess, callbackFail) {

    /*
    var fake = '    Found 1 stlink programmers\n' +
               ' serial: 303030303030303030303031\n' +
               'openocd: "\x30\x30\x30\x30\x30\x30\x30\x30\x30\x30\x30\x31"\n' +
               '  flash: 0 (pagesize: 2048)\n' +
               '   sram: 65536\n' +
               ' chipid: 0x0414\n' +
               '  descr: F1 High-density device\n';

    callbackSuccess(fake);
    */

    this.exec(atom.config.get("stlink.stlinkInfotoolBinary"), args, callbackSuccess, callbackFail);
  }

  expandPath(input) {

      var p = input.replace('{PRJDIR}', getCurrentProjectDir());

      if(!p.startsWith(path.sep)) {
          p = path.join(getCurrentProjectDir(), p);
      }

      console.log("expanded " + input + " to " + p);

      return p;
  }

  makeCommonArgs(settings) {
      var args = [];

      if(settings.serial != 'autodetect' ) {
          args = args.concat(['--serial', settings.serial])
      }

      return args;
  }

  list(settings, callbackSuccess, callbackFail) {
      this.infotool(['--probe'], callbackSuccess, callbackFail);
  }

  flash(settings, callbackSuccess, callbackFail) {

      var args = this.makeCommonArgs(settings);

      if(settings.reset) {
        args = args.concat('--reset');
      }

      if(settings.file.endsWith('.hex')) {
        args = args.concat('--format', 'ihex');
      }
      else if(settings.file.endsWith('.bin')) {
        args = args.concat('--format', 'binary');
      }

      args = args.concat(['write', this.expandPath(settings.file)]);

      if(settings.file.endsWith('.bin')) {
        args = args.concat(settings.address);
      }

      this.flashtool(args, callbackSuccess, callbackFail);
  }

  erase(settings, callbackSuccess, callbackFail) {

      var args = this.makeCommonArgs(settings);

      args = args.concat('erase');

      this.flashtool(args, callbackSuccess, callbackFail);
  }

  killRunning() {

    if(stlink_proc != null) {
      var choice = atom.confirm(
        {
          message: "A stlink instance is already running!",
          detailedMessage: "Terminate running instance?",
          buttons: ['No', 'Yes']
        }
      );

      if(choice == 1) {
        if(stlink_proc != null) {
          stlink_proc.kill();

          if(this.busyRegistry) {
              this.busyRegistry.end('stlink.exec');
          }
          stlink_proc = null;
        }
      }
      else {
        return false;
      }
    }

    return true;
  }
}
