'use babel';

import fs from 'fs';
import path from 'path';

import getCurrentProjectDir from './stlink-util';


export default class StlinkSettings {

    constructor() {

      this.reset = false;

      this.address = '0x8000000';
      this.serial = '';
      this.file = '';
    }

    getSettingsFileName() {

      var p = getCurrentProjectDir();

      if(p) {
          return path.join(p, "stlink_settings.json");
      }

      return null;
    }

    read() {

      var fname = this.getSettingsFileName();

      if(fname && fs.existsSync(fname)) {

        console.log('reading settings from: ' + fname);

        var json = JSON.parse(fs.readFileSync(fname));

        this.reset = json.reset;

        this.address = json.address;
        this.serial = json.serial;
        this.file = json.file;
      }
    }

    write() {

        var fname = this.getSettingsFileName();

        if(fname) {
          console.log('writing settings to: ' + fname);
          fs.writeFileSync(fname, JSON.stringify(this));
        }
        else {
          /* this is OK since it only menas that there is no active project */
          console.log('failed to save settings for stlink (no active project?)');
        }
    }

    dump() {

        console.log(
            ';reset=' + this.reset +
            ';address=' + this.address +
            ';serial=' + this.serial +
            ';file=' + this.file
        );
    }
}
