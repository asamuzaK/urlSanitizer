// bundle_wo_dompurify/mjs/dompurify.js
var { DOMPurify } = window;

// bundle_wo_dompurify/mjs/common.js
var TYPE_FROM = 8;
var TYPE_TO = -1;
var getType = (o) => Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);
var isString = (o) => typeof o === "string" || o instanceof String;

// bundle_wo_dompurify/lib/file/text-chars.json
var text_chars_default = [7, 8, 9, 10, 11, 12, 13, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255];

// bundle_wo_dompurify/lib/iana/uri-schemes.json
var uri_schemes_default = ["aaa", "aaas", "about", "acap", "acct", "acd", "acr", "adiumxtra", "adt", "afp", "afs", "aim", "amss", "android", "appdata", "apt", "ar", "ark", "attachment", "aw", "barion", "beshare", "bitcoin", "bitcoincash", "blob", "bolo", "browserext", "cabal", "calculator", "callto", "cap", "cast", "casts", "chrome", "chrome-extension", "cid", "coap", "coaps", "com-eventbrite-attendee", "content", "content-type", "crid", "cstr", "cvs", "dab", "dat", "data", "dav", "diaspora", "dict", "did", "dis", "dlna-playcontainer", "dlna-playsingle", "dns", "dntp", "doi", "dpp", "drm", "dtmi", "dtn", "dvb", "dvx", "dweb", "ed2k", "eid", "elsi", "embedded", "ens", "ethereum", "example", "facetime", "feed", "feedready", "fido", "file", "finger", "first-run-pen-experience", "fish", "fm", "ftp", "fuchsia-pkg", "geo", "gg", "git", "gitoid", "gizmoproject", "go", "gopher", "graph", "gtalk", "h323", "ham", "hcap", "hcp", "http", "https", "hxxp", "hxxps", "hydrazone", "hyper", "iax", "icap", "icon", "im", "imap", "info", "iotdisco", "ipfs", "ipn", "ipns", "ipp", "ipps", "irc", "irc6", "ircs", "iris", "iris.beep", "iris.lwz", "iris.xpc", "iris.xpcs", "isostore", "itms", "jabber", "jar", "jms", "keyparc", "lastfm", "lbry", "ldap", "ldaps", "leaptofrogans", "lorawan", "lpa", "lvlt", "magnet", "mailto", "maps", "market", "matrix", "message", "microsoft.windows.camera", "microsoft.windows.camera.multipicker", "microsoft.windows.camera.picker", "mid", "mms", "mongodb", "moz", "moz-extension", "ms-access", "ms-appinstaller", "ms-browser-extension", "ms-calculator", "ms-drive-to", "ms-enrollment", "ms-excel", "ms-eyecontrolspeech", "ms-gamebarservices", "ms-gamingoverlay", "ms-getoffice", "ms-help", "ms-infopath", "ms-inputapp", "ms-lockscreencomponent-config", "ms-media-stream-id", "ms-meetnow", "ms-mixedrealitycapture", "ms-mobileplans", "ms-newsandinterests", "ms-officeapp", "ms-people", "ms-powerpoint", "ms-project", "ms-publisher", "ms-remotedesktop-launch", "ms-restoretabcompanion", "ms-screenclip", "ms-screensketch", "ms-search", "ms-search-repair", "ms-secondary-screen-controller", "ms-secondary-screen-setup", "ms-settings", "ms-settings-airplanemode", "ms-settings-bluetooth", "ms-settings-camera", "ms-settings-cellular", "ms-settings-cloudstorage", "ms-settings-connectabledevices", "ms-settings-displays-topology", "ms-settings-emailandaccounts", "ms-settings-language", "ms-settings-location", "ms-settings-lock", "ms-settings-nfctransactions", "ms-settings-notifications", "ms-settings-power", "ms-settings-privacy", "ms-settings-proximity", "ms-settings-screenrotation", "ms-settings-wifi", "ms-settings-workplace", "ms-spd", "ms-stickers", "ms-sttoverlay", "ms-transit-to", "ms-useractivityset", "ms-virtualtouchpad", "ms-visio", "ms-walk-to", "ms-whiteboard", "ms-whiteboard-cmd", "ms-word", "msnim", "msrp", "msrps", "mss", "mt", "mtqp", "mumble", "mupdate", "mvn", "news", "nfs", "ni", "nih", "nntp", "notes", "num", "ocf", "oid", "onenote", "onenote-cmd", "opaquelocktoken", "openpgp4fpr", "otpauth", "palm", "paparazzi", "payment", "payto", "pkcs11", "platform", "pop", "pres", "proxy", "psyc", "pttp", "pwid", "qb", "query", "quic-transport", "redis", "rediss", "reload", "res", "resource", "rmi", "rsync", "rtmfp", "rtmp", "rtsp", "rtsps", "rtspu", "sarif", "secondlife", "secret-token", "service", "session", "sftp", "sgn", "shc", "sieve", "simpleledger", "simplex", "sip", "sips", "skype", "smb", "smp", "sms", "smtp", "snmp", "soap.beep", "soap.beeps", "soldat", "spiffe", "spotify", "ssb", "ssh", "starknet", "steam", "stun", "stuns", "submit", "svn", "swh", "swid", "swidpath", "tag", "taler", "teamspeak", "tel", "teliaeid", "telnet", "tftp", "things", "thismessage", "tip", "tn3270", "tool", "turn", "turns", "tv", "udp", "unreal", "urn", "ut2004", "uuid-in-package", "v-event", "vemmi", "ventrilo", "ves", "view-source", "vnc", "vscode", "vscode-insiders", "vsls", "w3", "wcr", "web3", "webcal", "wifi", "ws", "wss", "wtai", "wyciwyg", "xcon", "xcon-userid", "xfire", "xmlrpc.beep", "xmlrpc.beeps", "xmpp", "xri", "ymsgr", "z39.50r", "z39.50s"];

// bundle_wo_dompurify/mjs/file-reader.js
var { FileReader } = window;

// bundle_wo_dompurify/mjs/uri-util.js
var HEX = 16;
var REG_BASE64 = /^[\da-z+/\-_=]+$/i;
var REG_END_COLON = /:$/;
var REG_NUM_DECI = /^\d+/;
var REG_NUM_HEAD = /#x?$/;
var REG_NUM_HEAD_ASCII = /^#(?:x(?:00)?[2-7]|\d)/;
var REG_NUM_HEX = /^x[\dA-F]+/i;
var REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/ig;
var REG_SCHEME = /^[a-z][\da-z+\-.]*$/;
var REG_SCHEME_CUSTOM = /^(?:ext|web)\+[a-z]+$/;
var REG_SCRIPT = /(?:java|vb)script/;
var REG_URL_ENC = /^%[\dA-F]{2}$/i;
var getURLEncodedString = (str) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  const chars = [];
  for (const ch of str) {
    chars.push(`%${ch.charCodeAt(0).toString(HEX).toUpperCase()}`);
  }
  return chars.join("");
};
var escapeURLEncodedHTMLChars = (ch) => {
  if (isString(ch) && REG_URL_ENC.test(ch)) {
    ch = ch.toUpperCase();
  }
  const [amp, num, lt, gt, quot, apos] = ["&", "#", "<", ">", '"', "'"].map(getURLEncodedString);
  let escapedChar;
  if (ch === amp) {
    escapedChar = `${amp}amp;`;
  } else if (ch === lt) {
    escapedChar = `${amp}lt;`;
  } else if (ch === gt) {
    escapedChar = `${amp}gt;`;
  } else if (ch === quot) {
    escapedChar = `${amp}quot;`;
  } else if (ch === apos) {
    escapedChar = `${amp}${num}39;`;
  } else {
    escapedChar = ch;
  }
  return escapedChar;
};
var parseBase64 = (data) => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  } else if (!REG_BASE64.test(data)) {
    throw new Error(`Invalid base64 data: ${data}`);
  }
  const bin = atob(data);
  const uint8arr = Uint8Array.from([...bin].map((c) => c.charCodeAt(0)));
  const textCharCodes = new Set(text_chars_default);
  let parsedData;
  if (uint8arr.every((c) => textCharCodes.has(c))) {
    parsedData = bin.replace(/\s/g, getURLEncodedString);
  } else {
    parsedData = data;
  }
  return parsedData;
};
var parseURLEncodedNumCharRef = (str, nest = 0) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  if (!Number.isInteger(nest)) {
    throw new TypeError(`Expected Number but got ${getType(nest)}.`);
  } else if (nest > HEX) {
    throw new Error("Character references nested too deeply.");
  }
  let res = decodeURIComponent(str);
  if (/&#/.test(res)) {
    const textCharCodes = new Set(text_chars_default);
    const items = [...res.matchAll(REG_NUM_REF)].reverse();
    for (const item of items) {
      const [numCharRef, value] = item;
      let num;
      if (REG_NUM_HEX.test(value)) {
        num = parseInt(`0${value}`, HEX);
      } else if (REG_NUM_DECI.test(value)) {
        num = parseInt(value);
      }
      if (Number.isInteger(num)) {
        const { index } = item;
        const [preNum, postNum] = [
          res.substring(0, index),
          res.substring(index + numCharRef.length)
        ];
        if (textCharCodes.has(num)) {
          res = `${preNum}${String.fromCharCode(num)}${postNum}`;
          if (REG_NUM_HEAD.test(preNum) || REG_NUM_HEAD_ASCII.test(postNum)) {
            res = parseURLEncodedNumCharRef(res, ++nest);
          }
        } else if (num < HEX * HEX) {
          res = `${preNum}${postNum}`;
        }
      }
    }
  }
  return res;
};
var createDataURLFromBlob = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener("error", () => reject(reader.error));
  reader.addEventListener("abort", () => resolve(reader.result));
  reader.addEventListener("load", () => resolve(reader.result));
  reader.readAsDataURL(blob);
});
var URISchemes = class {
  /* private fields */
  #schemes;
  /**
   * construct
   */
  constructor() {
    this.#schemes = new Set(uri_schemes_default);
  }
  /**
   * get schemes
   *
   * @see {@link https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml}
   *      - Historical schemes omitted
   *      - 'moz-extension' scheme added
   * @returns {Array.<string>} - array of schemes
   */
  get() {
    return [...this.#schemes];
  }
  /**
   * has scheme
   *
   * @param {string} scheme - scheme
   * @returns {boolean} - result
   */
  has(scheme) {
    return this.#schemes.has(scheme);
  }
  /**
   * add scheme
   * NOTE: `javascript` and/or `vbscript` schemes can not be registered
   *
   * @param {string} scheme - scheme
   * @returns {Array.<string>} - array of schemes
   */
  add(scheme) {
    if (!isString(scheme)) {
      throw new TypeError(`Expected String but got ${getType(scheme)}.`);
    } else if (REG_SCRIPT.test(scheme) || !REG_SCHEME.test(scheme)) {
      throw new Error(`Invalid scheme: ${scheme}`);
    }
    this.#schemes.add(scheme);
    return [...this.#schemes];
  }
  /**
   * remove scheme
   *
   * @param {string} scheme - scheme
   * @returns {boolean} - result
   */
  remove(scheme) {
    return this.#schemes.delete(scheme);
  }
  /**
   * verify URI
   *
   * @param {string} uri - URI
   * @returns {boolean} - result
   */
  verify(uri) {
    let res;
    if (isString(uri)) {
      try {
        const { protocol } = new URL(uri);
        const scheme = protocol.replace(REG_END_COLON, "");
        const schemeParts = scheme.split("+");
        res = !REG_SCRIPT.test(scheme) && REG_SCHEME_CUSTOM.test(scheme) || schemeParts.every((s) => this.#schemes.has(s));
      } catch (e) {
        res = false;
      }
    }
    return !!res;
  }
};

// bundle_wo_dompurify/mjs/sanitizer.js
var HEX2 = 16;
var REG_DATA_URL = /data:[^,]*,/;
var REG_DATA_URL_BASE64 = /data:[^,]*;?base64,[\da-z+/\-_=]+/i;
var REG_DATA_URL_G = /data:[^,]*,[^"]+/g;
var REG_END_COLON2 = /:$/;
var REG_END_NUM = /(?:#|%23)$/;
var REG_END_QUEST = /(?<!(?:#|%23).*)(?:\?|%3F)$/;
var REG_HTML_SP = /[<>"'\s]/g;
var REG_HTML_URL_ENC = /%(?:2(?:2|7)|3(?:C|E))/g;
var REG_HTML_URL_ENC_QUOT = /(?:%(?:2(?:2|7)|3(?:C|E))+?|["'])/;
var REG_MIME_DOM = /^(?:text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml)/;
var REG_SCRIPT_BLOB = /(?:java|vb)script|blob/;
var REG_URL_ENC_AMP = /%26/g;
var URLSanitizer = class extends URISchemes {
  /* private fields */
  #nest;
  #recurse;
  /**
   * construct
   */
  constructor() {
    super();
    this.#nest = 0;
    this.#recurse = /* @__PURE__ */ new Set();
  }
  /**
   * replace matched data URLs
   *
   * @param {string} data - data URL
   * @returns {string} - replaced data URL
   */
  replace(data) {
    if (!isString(data)) {
      throw new TypeError(`Expected String but got ${getType(data)}.`);
    }
    let replacedData = data;
    if (REG_DATA_URL.test(replacedData)) {
      const matchedDataUrls = replacedData.matchAll(REG_DATA_URL_G);
      const items = [...matchedDataUrls].reverse();
      for (const item of items) {
        let [dataUrl] = item;
        if (REG_DATA_URL_BASE64.test(dataUrl)) {
          [dataUrl] = REG_DATA_URL_BASE64.exec(dataUrl);
        }
        this.#nest++;
        this.#recurse.add(dataUrl);
        const parsedDataUrl = this.sanitize(dataUrl, {
          allow: ["data"]
        });
        const { index } = item;
        const [preDataUrl, postDataUrl] = [
          replacedData.substring(0, index),
          replacedData.substring(index + dataUrl.length)
        ];
        if (parsedDataUrl) {
          replacedData = `${preDataUrl}${parsedDataUrl}${postDataUrl}`;
        } else {
          replacedData = `${preDataUrl}${postDataUrl}`;
        }
      }
    }
    return replacedData;
  }
  /**
   * purify URL encoded DOM
   *
   * @param {string} dom - DOM string
   * @returns {string} - purified DOM string
   */
  purify(dom) {
    if (!isString(dom)) {
      throw new TypeError(`Expected String but got ${getType(dom)}.`);
    }
    let purifiedDom = DOMPurify.sanitize(decodeURIComponent(dom));
    if (purifiedDom && REG_DATA_URL.test(purifiedDom)) {
      purifiedDom = this.replace(purifiedDom);
    }
    purifiedDom = purifiedDom.replace(REG_END_NUM, "").replace(REG_END_QUEST, "");
    return encodeURI(purifiedDom);
  }
  /**
   * sanitize URL
   * NOTE: `data` and `file` schemes must be explicitly allowed
   *       `blob` URLs should be converted to `data` URLs
   *       `javascript` and `vbscript` schemes can not be allowed
   *
   * @param {string} url - URL
   * @param {object} [opt] - options
   * @param {Array.<string>} [opt.allow] - array of allowed schemes
   * @param {Array.<string>} [opt.deny] - array of denied schemes
   * @param {Array.<string>} [opt.only] - array of specific schemes to allow
   * @param {boolean} [opt.remove] - remove tag and/or quote and the rest
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt) {
    if (this.#nest > HEX2) {
      this.#nest = 0;
      throw new Error("Data URLs nested too deeply.");
    }
    const { allow, deny, only, remove } = opt ?? {};
    const schemeMap = /* @__PURE__ */ new Map([
      ["blob", false],
      ["data", false],
      ["file", false],
      ["javascrpt", false],
      ["vbscript", false]
    ]);
    let restrictScheme = false;
    if (Array.isArray(only) && only.length) {
      const schemes = super.get();
      for (const item of schemes) {
        schemeMap.set(item, false);
      }
      const items = Object.values(only);
      for (let item of items) {
        if (isString(item)) {
          item = item.trim();
          if (!REG_SCRIPT_BLOB.test(item)) {
            if (super.has(item)) {
              schemeMap.set(item, true);
            } else {
              try {
                super.add(item);
              } catch (e) {
              }
              if (super.has(item)) {
                schemeMap.set(item, true);
              }
            }
            if (!restrictScheme && schemeMap.has(item)) {
              restrictScheme = schemeMap.get(item);
            }
          }
        }
      }
    } else {
      if (Array.isArray(allow) && allow.length) {
        const items = Object.values(allow);
        for (let item of items) {
          if (isString(item)) {
            item = item.trim();
            if (!REG_SCRIPT_BLOB.test(item)) {
              if (super.has(item)) {
                schemeMap.set(item, true);
              } else {
                try {
                  super.add(item);
                } catch (e) {
                }
                if (super.has(item)) {
                  schemeMap.set(item, true);
                }
              }
            }
          }
        }
      }
      if (Array.isArray(deny) && deny.length) {
        const items = Object.values(deny);
        for (let item of items) {
          if (isString(item)) {
            item = item.trim();
            if (item) {
              schemeMap.set(item, false);
            }
          }
        }
      }
    }
    let sanitizedUrl;
    if (super.verify(url)) {
      const { hash, href, pathname, protocol, search } = new URL(url);
      const scheme = protocol.replace(REG_END_COLON2, "");
      const schemeParts = scheme.split("+");
      let bool;
      if (restrictScheme) {
        bool = schemeParts.every((s) => schemeMap.get(s));
      } else {
        for (const [key, value] of schemeMap.entries()) {
          bool = value || scheme !== key && schemeParts.every((s) => s !== key);
          if (!bool) {
            break;
          }
        }
      }
      if (bool) {
        const isDataUrl = schemeParts.includes("data");
        let finalize;
        let urlToSanitize = href;
        if (isDataUrl) {
          const [mediaType, ...dataParts] = pathname.split(",");
          const data = `${dataParts.join(",")}${search}${hash}`;
          const mediaTypes = mediaType.split(";");
          const isBase64 = mediaTypes[mediaTypes.length - 1] === "base64";
          let parsedData = data;
          if (isBase64) {
            parsedData = parseBase64(data);
          }
          try {
            const decodedData = parseURLEncodedNumCharRef(parsedData).trim();
            const { protocol: dataScheme } = new URL(decodedData);
            const dataSchemeParts = dataScheme.replace(REG_END_COLON2, "").split("+");
            if (dataSchemeParts.some((s) => REG_SCRIPT_BLOB.test(s))) {
              urlToSanitize = "";
            }
          } catch (e) {
          }
          const containsDataUrl = REG_DATA_URL.test(parsedData);
          if (parsedData !== data || containsDataUrl) {
            if (containsDataUrl) {
              parsedData = this.replace(parsedData);
            } else if (this.#recurse.has(url)) {
              this.#recurse.delete(url);
            } else {
              finalize = true;
            }
          } else if (this.#recurse.has(url)) {
            this.#recurse.delete(url);
          } else {
            finalize = true;
          }
          if (!mediaType || REG_MIME_DOM.test(mediaType)) {
            parsedData = this.purify(parsedData);
          }
          if (urlToSanitize && parsedData) {
            if (isBase64 && parsedData !== data) {
              mediaTypes.pop();
            }
            urlToSanitize = `${scheme}:${mediaTypes.join(";")},${parsedData}`;
          } else {
            urlToSanitize = "";
          }
        } else {
          finalize = true;
        }
        if (!isDataUrl && remove && REG_HTML_URL_ENC_QUOT.test(urlToSanitize)) {
          const item = REG_HTML_URL_ENC_QUOT.exec(urlToSanitize);
          const { index } = item;
          urlToSanitize = urlToSanitize.substring(0, index);
        }
        if (urlToSanitize) {
          sanitizedUrl = urlToSanitize.replace(REG_HTML_SP, getURLEncodedString).replace(REG_URL_ENC_AMP, escapeURLEncodedHTMLChars);
          if (finalize) {
            if (!isDataUrl) {
              sanitizedUrl = sanitizedUrl.replace(REG_HTML_URL_ENC, escapeURLEncodedHTMLChars);
            }
            this.#nest = 0;
          }
        } else {
          this.#nest = 0;
        }
      }
    }
    return sanitizedUrl || null;
  }
  /**
   * parse sanitized URL
   *
   * @param {string} url - URL
   * @param {object} [opt] - options
   * @param {Array.<string>} [opt.allow] - array of allowed schemes
   * @param {Array.<string>} [opt.deny] - array of denied schemes
   * @param {Array.<string>} [opt.only] - array of specific schemes to allow
   * @param {boolean} [opt.remove] - remove tag and/or quote and the rest
   * @returns {ParsedURL} - result with additional props based on URL API
   */
  parse(url, opt) {
    if (!isString(url)) {
      throw new TypeError(`Expected String but got ${getType(url)}.`);
    }
    const parsedUrl = /* @__PURE__ */ new Map([
      ["input", url]
    ]);
    let sanitizedUrl;
    if (this.verify(url)) {
      const { protocol } = new URL(url);
      if (protocol === "blob:") {
        sanitizedUrl = url;
      } else {
        sanitizedUrl = this.sanitize(url, opt ?? {
          allow: ["data", "file"]
        });
      }
    }
    if (sanitizedUrl) {
      const urlObj = new URL(sanitizedUrl);
      const { pathname, protocol } = urlObj;
      const schemeParts = protocol.replace(REG_END_COLON2, "").split("+");
      const isDataUrl = schemeParts.includes("data");
      parsedUrl.set("valid", true);
      if (isDataUrl) {
        const dataUrl = /* @__PURE__ */ new Map();
        const [mediaType, ...dataParts] = pathname.split(",");
        const data = `${dataParts.join(",")}`;
        const mediaTypes = mediaType.split(";");
        const isBase64 = mediaTypes[mediaTypes.length - 1] === "base64";
        if (isBase64) {
          mediaTypes.pop();
        }
        dataUrl.set("mime", mediaTypes.join(";"));
        dataUrl.set("base64", isBase64);
        dataUrl.set("data", data);
        parsedUrl.set("data", Object.fromEntries(dataUrl));
      } else {
        parsedUrl.set("data", null);
      }
      for (const key in urlObj) {
        const value = urlObj[key];
        if (isString(value)) {
          parsedUrl.set(key, value);
        }
      }
    } else {
      parsedUrl.set("valid", false);
    }
    return Object.fromEntries(parsedUrl);
  }
};
var urlSanitizer = new URLSanitizer();
var sanitizeURL = async (url, opt = {
  allow: [],
  deny: [],
  only: []
}) => {
  let res;
  if (urlSanitizer.verify(url)) {
    const { protocol } = new URL(url);
    if (protocol === "blob:") {
      const { allow, deny, only } = opt;
      if (Array.isArray(allow) && allow.includes("blob") && !(Array.isArray(deny) && deny.includes("blob")) || Array.isArray(only) && only.includes("blob")) {
        let data;
        try {
          data = await fetch(url).then((r) => r.blob()).then(createDataURLFromBlob);
        } catch (e) {
        }
        if (data) {
          if (Array.isArray(only)) {
            if (!only.includes("data")) {
              only.push("data");
            }
          } else if (Array.isArray(allow)) {
            if (!allow.includes("data")) {
              allow.push("data");
            }
            if (Array.isArray(deny) && deny.includes("data")) {
              const i = deny.indexOf("data");
              deny.splice(i, 1);
            }
          }
          res = urlSanitizer.sanitize(data, opt);
        }
      }
      URL.revokeObjectURL(url);
    } else {
      res = urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};
var sanitizeURLSync = (url, opt) => {
  let res;
  if (urlSanitizer.verify(url)) {
    const { protocol } = new URL(url);
    if (protocol === "blob:") {
      URL.revokeObjectURL(url);
    } else {
      res = urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};
var parseURL = async (url) => {
  const res = urlSanitizer.parse(url);
  return res;
};
var parseURLSync = (url) => urlSanitizer.parse(url);
var isURI = async (uri) => {
  const res = urlSanitizer.verify(uri);
  return res;
};
var isURISync = (uri) => urlSanitizer.verify(uri);
export {
  urlSanitizer as default,
  isURI,
  isURISync,
  parseURL,
  parseURLSync,
  sanitizeURL,
  sanitizeURLSync
};
/*!
 * URL Sanitizer
 *
 * @license MIT
 * @copyright asamuzaK (Kazz)
 * @see {@link https://github.com/asamuzaK/urlSanitizer/blob/main/LICENSE}
 */
//# sourceMappingURL=url-sanitizer-wo-dompurify.js.map
