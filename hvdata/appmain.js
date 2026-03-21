"use strict";
const DEBUG_MODE_RENDERER = DEBUG_MODE;
const LOG_MINIMIZE_OBJECT = true;
const LOG_MINIMIZE_DATE_ISO = false;

const $ = (name) => document.getElementById(name);
const $O = (selector, parent = document) => parent?.querySelector(selector);
const $A = (selector, parent = document) => parent?.querySelectorAll(selector);

function toFilteredUTFText(s) {
  if (!s) return s
  return safeFilteredText(s.normalize('NFKC').replace(/[\u200B-\u200C\u200E-\u200F\uFEFF\u2060-\u206F\uE000-\uF8FF\u007F-\u009F\u2028\u2029\uFE00–\uFE0D\u202A-\u202E\u2066-\u2069\u00AD\u034F\u180E\u202F\u0080-\u009F\u115F\u1160\u17B4\uFDD0-\uFDEF\u0300-\u036F]/g, ''));
  // \u200D - kept for unicode character joining
  // \u0000-\u001F (C0), \u007F-\u009F (C1)
  // \u2028 - line sep, \u2029 - par sep.
  // \u0000-\u001F ... kept unsolved because of browser loading stooped due to this!
  // \uFE00–\uFE0F - think about this - fall unicode icons to no color forms, but improves security
}

function safeFilteredText(s) {
  if (!s) return s;
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);

    // skip: SMP variation selectors
    if (cp >= 0xE0100 && cp <= 0xE01EF) continue;

    // keep: TAB (9), LF (10), CR (13), 32 and higher
    if (cp >= 32 || cp === 9 || cp === 10 || cp === 13) {
      out += ch;
    }
  }
  return out;
}

function newUID(length = 8) {
  var str = '';

  while (str.length <= length)
    str += Math.random().toString(36).slice(2);

  str = str.slice(0, length);
  //log(`newUID of length ${length} emitted: ${str}`);

  return str;
}

const log = !DEBUG_MODE ? 
function log() {} : 
function log(msg, ...dataI) {
  if (!msg) return;

  var severity = msg[0];
  const hasSeverity = msg[1] == ' ';

  if (hasSeverity) {
    msg = msg.substring(2);
  } else {
    severity = undefined;
  }

  const data = [msg];

  if (LOG_MINIMIZE_OBJECT && severity?.toUpperCase() != 'E') {
    dataI.forEach((x, i) => {
      if (typeof x === 'object') {
        //dataI[i] = JSON.parse(JSON.stringify(x)); // unfortunately skips undefined members!
        const clean = Object.create(null);
        Object.assign(clean, dataI[i]);
        clean['__className'] = x.constructor.name;
        dataI[i] = clean;
        for (const [key, value] of Object.entries(dataI[i])) {
          if (value instanceof Date) {
            clean[key] = LOG_MINIMIZE_DATE_ISO ? value.toISOString() : value.toString();
          } else {
            clean[key] = value;
          }
        }
      }
    });
  }

  if (dataI.length > 0)
    data.push(...dataI);

  switch (severity?.toUpperCase()) {
    case 'W':
      console.warn(...data);
      break;

    case 'E':
      console.error(...data);
      break;
  
    default:
      if (hasSeverity) {
        msg = `${severity} ${msg}`;
        data[0] = msg;
      }
      console.log(...data);
      break;
  }
}

const PAR_NAME_DOC = 'd'; // Help file path

const id_JSAppRun = 'appRun';
const FILENAME_ZIP_ON_USER_INPUT = '!.zip';
const FILENAME_DIR_LISTING = '__dir.lst';

function _T(id) {
  return id;
}

const FormFieldType = {
  TEXT: 'text',
  CHECKBOX: 'checkbox',
  FILE: 'file',
};

function appendField(target, id, defaultV = '', type = FormFieldType.TEXT) {
  if (defaultV && type == FormFieldType.CHECKBOX)
    defaultV = `checked`;
  else if (defaultV)
    defaultV = `value="${defaultV}"`;
  else
    defaultV = '';

  target.insertAdjacentHTML('beforeend',
  `<div class="form-row">
      <label for="${id}" id="${id}-label">${_T(id)}</label>
      <input type="${type}" id="${id}" ${defaultV} />
  </div>`);
}

function appendFieldComboBox(target, id) {
  target.insertAdjacentHTML('beforeend',
  `<div class="form-row">
      <label for="${id}" id="${id}-label">${_T(id)}</label>
      <select id="${id}" />
  </div>`);
}

function appendComboBoxItems(combobox, items, defaultV) {
  if (!combobox) return;
  items?.forEach((txt, i) => {
    let opt = new Option(txt, i);
    if (defaultV == txt || defaultV == i)
      opt.selected = true;
    combobox.add(opt);
  });
}

function formCorsHelpFilesUpload(fieldHelpLangTitle = 'Help-(language).zip', fieldHvDataTitle = 'data.zip', formName = 'form', formInName = 'formIn')
{
  const formO = $(formInName);
  const fieldHvData = fieldHvDataTitle;
  const fieldHelpLang = fieldHelpLangTitle;
  //const fieldHelpBase = 'Help-.zip';
  const typeFile = FormFieldType.FILE;

  appendField(formO, fieldHvData, '', typeFile);
  appendField(formO, fieldHelpLang, '', typeFile);
  //appendField(formO, fieldHelpBase, '', typeFile);
  
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Send";
  formO.appendChild(button);

  const formM = $(formName);
  formM.addEventListener("submit", function(e) {
    e.preventDefault();

    const hvData = $(fieldHvData);
    const helpLang = $(fieldHelpLang);

    if (!hvData?.files?.length || !helpLang?.files?.length)
      return;

    const fileHvData = hvData.files[0];
    const fileHelpLang = helpLang.files[0];

    // var fileHelpBase = $(fieldHelpBase);

    // if (fileHelpBase?.files?.length)
    //   fileHelpBase = fileHelpBase[0];
    // else
    //   fileHelpBase = null;

    $(id_JSAppRun)?.remove();
    var st = _Storage.add(STO_HELP, FILENAME_ZIP_ON_USER_INPUT, fileHelpLang).then(obsah => {
      main(fileHvData);
      const url = new URL(window.location.href);
      url.searchParams.set(PAR_NAME_DOC, FILENAME_ZIP_ON_USER_INPUT);
      window.history.pushState({}, "", url);
    });

  })
}

const STO_DATA = 'STO_DATA';
const STO_HELP = 'STO_HELP';
const STOF_TEXT = 'text';
const STOF_B64 = 'base64';

const DATA_FILE_PATH_BASE = 'hvdata/data';

const STORAGE_ENGINES = {
  '.zip': async (path) => await new StorageZip().init(path),
  '/': async (path) => await new StorageDir().init(path),
};

var _Storage = (() => {
  var storagesC = new Map();

  async function add(key, path, data = null) {
    for (const keyC in STORAGE_ENGINES) {
      if (path.endsWith(keyC)) {
        const eng = await STORAGE_ENGINES[keyC](data || path);
        storagesC.set(key, eng);
        return true;
      }
    }
    return null;
  }

  async function search(key, filePath, format = STOF_TEXT) {
    if (!storagesC.has(key))
      return null;

    let reply = await storagesC.get(key).search(filePath, format);

    if (format == STOF_TEXT)
      reply = toFilteredUTFText(reply);
    
    return reply;
  }

  async function getSubdirs(key, parentPath) {
    if (!storagesC.has(key))
      return [];

    return await storagesC.get(key).getSubdirs(parentPath);
  }

  async function searchImage(key, filePath) {
    if (!storagesC.has(key))
      return null;

    let rawData = await storagesC.get(key).searchImage(filePath);
    rawData = await doSteganographyCorrectionForImage(rawData || filePath);
    return rawData;
  }

  function getKey(key) {
    if (!storagesC.has(key))
      return null;

    return storagesC.get(key);
  }

  return {
    add,
    search,
    getSubdirs,
    searchImage,
    getKey
  };
})();

async function doSteganographyCorrectionForImage(data) {
  const img = new Image();
  if (data.startsWith('data:image/'))
    img.src = data;
  else {
    const response = await fetchDataOrZero(data);
    if (response.byteLength == 0)
      return null;

    const content = btoa(String.fromCharCode(...new Uint8Array(response)));
    img.src = `data:image/${data.split('.').pop().toLowerCase()};base64,${content}`;
  }

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (canvas.width > 16 || canvas.height > 16) {
    // exception : prevent blur of edges and lines in image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = Math.ceil(img.width * 1.005);
    tempCanvas.height = Math.ceil(img.height * 1.005);
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0);
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = (pixels[i] & ~1) | (Math.random() < 0.5 ? 1 : 0);
    pixels[i+1] = (pixels[i+1] & ~1) | (Math.random() < 0.5 ? 1 : 0);
    pixels[i+2] = (pixels[i+2] & ~1) | (Math.random() < 0.5 ? 1 : 0);
    pixels[i+3] = (pixels[i+3] & ~1) | (Math.random() < 0.5 ? 1 : 0);
  }
  ctx.putImageData(imageData, 0, 0);

  const canvasReply = canvas.toDataURL('image/png');
  return canvasReply;
}

/**
 * @interface
 */
class IStorage {
  async init(path) {}
  async search(filePath, format) {}
  async getSubdirs(parentPath) {}
  async searchImage(filePath) {}
}

class StorageZip extends IStorage {
  #storageO;

  constructor() {
    super();
    this.#storageO = null;
  }
  
  async init(path) {
    this.#storageO = await ZIPHelpers.loadZipFromUrl(path);
    let hasSlip = false;
    const paths = Object.keys(this.#storageO.files);
    for (const path of paths) {
      if (path.includes('..')) {
        delete this.#storageO.files[path];
        hasSlip = true;
        log('E Zip Slip:', path);
      }
    }
    if (hasSlip) {
      const msg = `Invalid paths found in given archive <b>${path}</b>. Loading stopped for ensuring security.`;
      log(`E ${msg}`);
      let pane = $O('#cors-error') || $O('#content') || document.body;
      pane.innerHTML = `⚠ ${msg}`;
      throw new Error(msg);
    }
    Object.freeze(this.#storageO.files);
    return this;
  }

  async search(filePath, format = STOF_TEXT) {
    return await ZIPHelpers.searchArchiveForFile(filePath, this.#storageO, format);
  }

  async getSubdirs(parentPath) {
    const subdirs = new Set();

    this.#storageO?.forEach((relativePath, file) => {
      if (relativePath.startsWith(parentPath) && relativePath !== parentPath) 
      {
        const subPath = relativePath.slice(parentPath.length);
        const parts = subPath.split("/");
    
        if (parts.length > 1) {
          subdirs.add(parts[0]);
        } else if (file.dir) {
          subdirs.add(parts[0]);
        }
      }
    });
    
    return [...subdirs];
  }

  async searchImage(filePath) {
    const content = await this.search(filePath, STOF_B64);
    if (!content) return null;
    var mimeType = 'image/' + filePath.split('.').pop().toLowerCase();
    return `data:${mimeType};base64,${content}`;
  }
}

function toText(ab) {
  if (!ab) return '';
  if (typeof ab === 'string') return ab;
  if (ab instanceof String) return ab.valueOf();
  
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(ab);
  return text;
}

class StorageDir extends IStorage {
  constructor() {
    super();
    this.storageO = null;
  }
  
  async init(path) {
    this.storageO = path.replace(/\/$/, '');
    return this;
  }

  async search(filePath, format = STOF_TEXT) {
    var fpath = `${this.storageO}/${filePath}`;
    const doubleSlash = '//';
    const doubleSlashIndexLast = fpath.lastIndexOf(doubleSlash);
    const doubleSlashIndex = fpath.indexOf(doubleSlash);

    if (doubleSlashIndexLast != doubleSlashIndex && doubleSlashIndex >= 0 && doubleSlashIndexLast >= 0) {
      var replacement = '/_base/';
      if (fpath.startsWith('http') || fpath.startsWith('ftp'))
        replacement = '/';

      fpath = fpath.slice(0, doubleSlashIndexLast) + replacement + fpath.slice(doubleSlashIndexLast + 2);
    } else {
      if (!fpath.startsWith('http') && !fpath.startsWith('ftp'))
        fpath = fpath.replace(doubleSlash, '/');
    }

    const response = await this.fetchDataOrEmpty(fpath);

    switch (format) {
      case STOF_B64:
        const zip = new JSZip();
        const fname = "a.txt";
        zip.file(fname, response, { compression: "STORE" });
        const base64zip = await zip.generateAsync({ type: STOF_B64 });
        await zip.loadAsync(base64zip, { base64: true });
        const file = zip.file(fname);
        const b64Data = await file.async(STOF_B64);
        return b64Data;
      case STOF_TEXT:
      default:
        return toText(response);
    }
  }

  async getSubdirs(parentPath) {
    const list = await this.search(`${parentPath}/${FILENAME_DIR_LISTING}`, STOF_TEXT);
    var text = toText(list);
    text = rowsToArray(text.trim());

    const subdirs = new Set();
    text?.forEach((line, index) => {
      subdirs.add(line);
    });

    return [...subdirs];
  }

  async fetchDataOrEmpty(url) {
    return fetchDataOrZero(url);
  }

  async searchImage(filePath) {
    const fpath = `${this.storageO}/${filePath}`;
    const response = await this.fetchDataOrEmpty(fpath);
    if (response.byteLength == 0)
      return null;
    return fpath;
  }
}

async function main(baseDataStream = null) {
  var st = null;
  if (!baseDataStream) {
    try {
      st = await _Storage.add(STO_DATA, `${DATA_FILE_PATH_BASE}.zip`);
    } catch (error) {
      st = await _Storage.add(STO_DATA, `${DATA_FILE_PATH_BASE}/`);
    }  
  } else {
    st = await _Storage.add(STO_DATA, `${DATA_FILE_PATH_BASE}.zip`, baseDataStream);
  }
  const srcT = await _Storage.search(STO_DATA, 'base/appmainRun.js');
  appendJavaScript(id_JSAppRun, srcT, document.body);
  runApp();
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    throw error;
  }
}

async function fetchDataOrZero(url) {
  try {
    const response = await fetchData(url);
    return response;
  } catch (error) {
    return new ArrayBuffer(0);
  }
}

const ZIPHelpers = (() => {
  async function loadZipFromUrl(url) {
    try {
      var arrayBuffer = null;
      if (typeof url === "string") {
        arrayBuffer = await fetchData(url);
      } else {
        arrayBuffer = await url.arrayBuffer();
      }
      const arch = await JSZip.loadAsync(arrayBuffer);
      return arch;
    } catch (error) {
      throw error;
    }
  }
  
  async function searchArchiveForFile(fileName, arch, format = STOF_TEXT) {
    try {
      const fileContent = await arch.file(fileName)?.async(format);
      return fileContent ?? "";
    } catch (error) {
      return "";
    }
  }

  return {
    loadZipFromUrl,
    searchArchiveForFile
  };
})();

function appendCSS(id, content) {
  //if ($(id)) return;
  const style = document.createElement('style');
  style.textContent = content;
  style.id = id;
  document.head.appendChild(style);
}

function appendJavaScript(id, content, parentO) {
  if ($(id)) return;
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.textContent = content;
  script.id = id;
  parentO.appendChild(script);
}

function rowsToArray(t) {
  if (!t) return [];
  return t.replace(/\r\n|\r/g, '\n').split('\n');
}

main();
