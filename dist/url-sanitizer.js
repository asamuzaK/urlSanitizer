// src/mjs/common.js
var TYPE_FROM = 8;
var TYPE_TO = -1;
var getType = (o) => Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);
var isString = (o) => typeof o === "string" || o instanceof String;

// src/lib/file/text-chars.json
var text_chars_default = [
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  27,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  64,
  65,
  66,
  67,
  68,
  69,
  70,
  71,
  72,
  73,
  74,
  75,
  76,
  77,
  78,
  79,
  80,
  81,
  82,
  83,
  84,
  85,
  86,
  87,
  88,
  89,
  90,
  91,
  92,
  93,
  94,
  95,
  96,
  97,
  98,
  99,
  100,
  101,
  102,
  103,
  104,
  105,
  106,
  107,
  108,
  109,
  110,
  111,
  112,
  113,
  114,
  115,
  116,
  117,
  118,
  119,
  120,
  121,
  122,
  123,
  124,
  125,
  126,
  128,
  129,
  130,
  131,
  132,
  133,
  134,
  135,
  136,
  137,
  138,
  139,
  140,
  141,
  142,
  143,
  144,
  145,
  146,
  147,
  148,
  149,
  150,
  151,
  152,
  153,
  154,
  155,
  156,
  157,
  158,
  159,
  160,
  161,
  162,
  163,
  164,
  165,
  166,
  167,
  168,
  169,
  170,
  171,
  172,
  173,
  174,
  175,
  176,
  177,
  178,
  179,
  180,
  181,
  182,
  183,
  184,
  185,
  186,
  187,
  188,
  189,
  190,
  191,
  192,
  193,
  194,
  195,
  196,
  197,
  198,
  199,
  200,
  201,
  202,
  203,
  204,
  205,
  206,
  207,
  208,
  209,
  210,
  211,
  212,
  213,
  214,
  215,
  216,
  217,
  218,
  219,
  220,
  221,
  222,
  223,
  224,
  225,
  226,
  227,
  228,
  229,
  230,
  231,
  232,
  233,
  234,
  235,
  236,
  237,
  238,
  239,
  240,
  241,
  242,
  243,
  244,
  245,
  246,
  247,
  248,
  249,
  250,
  251,
  252,
  253,
  254,
  255
];

// src/lib/iana/uri-schemes.json
var uri_schemes_default = [
  "aaa",
  "aaas",
  "about",
  "acap",
  "acct",
  "acd",
  "acr",
  "adiumxtra",
  "adt",
  "afp",
  "afs",
  "aim",
  "amss",
  "android",
  "appdata",
  "apt",
  "ar",
  "ark",
  "attachment",
  "aw",
  "barion",
  "beshare",
  "bitcoin",
  "bitcoincash",
  "blob",
  "bolo",
  "browserext",
  "cabal",
  "calculator",
  "callto",
  "cap",
  "cast",
  "casts",
  "chrome",
  "chrome-extension",
  "cid",
  "coap",
  "coaps",
  "com-eventbrite-attendee",
  "content",
  "content-type",
  "crid",
  "cstr",
  "cvs",
  "dab",
  "dat",
  "data",
  "dav",
  "diaspora",
  "dict",
  "did",
  "dis",
  "dlna-playcontainer",
  "dlna-playsingle",
  "dns",
  "dntp",
  "doi",
  "dpp",
  "drm",
  "dtmi",
  "dtn",
  "dvb",
  "dvx",
  "dweb",
  "ed2k",
  "eid",
  "elsi",
  "embedded",
  "ens",
  "ethereum",
  "example",
  "facetime",
  "feed",
  "feedready",
  "fido",
  "file",
  "finger",
  "first-run-pen-experience",
  "fish",
  "fm",
  "ftp",
  "fuchsia-pkg",
  "geo",
  "gg",
  "git",
  "gitoid",
  "gizmoproject",
  "go",
  "gopher",
  "graph",
  "gtalk",
  "h323",
  "ham",
  "hcap",
  "hcp",
  "http",
  "https",
  "hxxp",
  "hxxps",
  "hydrazone",
  "hyper",
  "iax",
  "icap",
  "icon",
  "im",
  "imap",
  "info",
  "iotdisco",
  "ipfs",
  "ipn",
  "ipns",
  "ipp",
  "ipps",
  "irc",
  "irc6",
  "ircs",
  "iris",
  "iris.beep",
  "iris.lwz",
  "iris.xpc",
  "iris.xpcs",
  "isostore",
  "itms",
  "jabber",
  "jar",
  "jms",
  "keyparc",
  "lastfm",
  "lbry",
  "ldap",
  "ldaps",
  "leaptofrogans",
  "lorawan",
  "lpa",
  "lvlt",
  "magnet",
  "mailto",
  "maps",
  "market",
  "matrix",
  "message",
  "microsoft.windows.camera",
  "microsoft.windows.camera.multipicker",
  "microsoft.windows.camera.picker",
  "mid",
  "mms",
  "mongodb",
  "moz",
  "moz-extension",
  "ms-access",
  "ms-appinstaller",
  "ms-browser-extension",
  "ms-calculator",
  "ms-drive-to",
  "ms-enrollment",
  "ms-excel",
  "ms-eyecontrolspeech",
  "ms-gamebarservices",
  "ms-gamingoverlay",
  "ms-getoffice",
  "ms-help",
  "ms-infopath",
  "ms-inputapp",
  "ms-lockscreencomponent-config",
  "ms-media-stream-id",
  "ms-meetnow",
  "ms-mixedrealitycapture",
  "ms-mobileplans",
  "ms-newsandinterests",
  "ms-officeapp",
  "ms-people",
  "ms-powerpoint",
  "ms-project",
  "ms-publisher",
  "ms-remotedesktop-launch",
  "ms-restoretabcompanion",
  "ms-screenclip",
  "ms-screensketch",
  "ms-search",
  "ms-search-repair",
  "ms-secondary-screen-controller",
  "ms-secondary-screen-setup",
  "ms-settings",
  "ms-settings-airplanemode",
  "ms-settings-bluetooth",
  "ms-settings-camera",
  "ms-settings-cellular",
  "ms-settings-cloudstorage",
  "ms-settings-connectabledevices",
  "ms-settings-displays-topology",
  "ms-settings-emailandaccounts",
  "ms-settings-language",
  "ms-settings-location",
  "ms-settings-lock",
  "ms-settings-nfctransactions",
  "ms-settings-notifications",
  "ms-settings-power",
  "ms-settings-privacy",
  "ms-settings-proximity",
  "ms-settings-screenrotation",
  "ms-settings-wifi",
  "ms-settings-workplace",
  "ms-spd",
  "ms-stickers",
  "ms-sttoverlay",
  "ms-transit-to",
  "ms-useractivityset",
  "ms-virtualtouchpad",
  "ms-visio",
  "ms-walk-to",
  "ms-whiteboard",
  "ms-whiteboard-cmd",
  "ms-word",
  "msnim",
  "msrp",
  "msrps",
  "mss",
  "mt",
  "mtqp",
  "mumble",
  "mupdate",
  "mvn",
  "news",
  "nfs",
  "ni",
  "nih",
  "nntp",
  "notes",
  "num",
  "ocf",
  "oid",
  "onenote",
  "onenote-cmd",
  "opaquelocktoken",
  "openpgp4fpr",
  "otpauth",
  "palm",
  "paparazzi",
  "payment",
  "payto",
  "pkcs11",
  "platform",
  "pop",
  "pres",
  "proxy",
  "psyc",
  "pttp",
  "pwid",
  "qb",
  "query",
  "quic-transport",
  "redis",
  "rediss",
  "reload",
  "res",
  "resource",
  "rmi",
  "rsync",
  "rtmfp",
  "rtmp",
  "rtsp",
  "rtsps",
  "rtspu",
  "sarif",
  "secondlife",
  "secret-token",
  "service",
  "session",
  "sftp",
  "sgn",
  "shc",
  "sieve",
  "simpleledger",
  "simplex",
  "sip",
  "sips",
  "skype",
  "smb",
  "smp",
  "sms",
  "smtp",
  "snmp",
  "soap.beep",
  "soap.beeps",
  "soldat",
  "spiffe",
  "spotify",
  "ssb",
  "ssh",
  "starknet",
  "steam",
  "stun",
  "stuns",
  "submit",
  "svn",
  "swh",
  "swid",
  "swidpath",
  "tag",
  "taler",
  "teamspeak",
  "tel",
  "teliaeid",
  "telnet",
  "tftp",
  "things",
  "thismessage",
  "tip",
  "tn3270",
  "tool",
  "turn",
  "turns",
  "tv",
  "udp",
  "unreal",
  "urn",
  "ut2004",
  "uuid-in-package",
  "v-event",
  "vemmi",
  "ventrilo",
  "ves",
  "view-source",
  "vnc",
  "vscode",
  "vscode-insiders",
  "vsls",
  "w3",
  "wcr",
  "web3",
  "webcal",
  "wifi",
  "ws",
  "wss",
  "wtai",
  "wyciwyg",
  "xcon",
  "xcon-userid",
  "xfire",
  "xmlrpc.beep",
  "xmlrpc.beeps",
  "xmpp",
  "xri",
  "ymsgr",
  "z39.50r",
  "z39.50s"
];

// src/mjs/uri-util.js
var HEX = 16;
var REG_BASE64 = /^[\da-z+/\-_=]+$/i;
var REG_DATA_URL = /data:[^,]*,[^"]+/g;
var REG_DATA_URL_BASE64 = /data:[^,]*;?base64,[\da-z+/\-_=]+/i;
var REG_HTML_SP = /[<>"'\s]/g;
var REG_HTML_SP_URL_ENC = /%(?:2(?:2|7)|3(?:C|E))/g;
var REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/ig;
var REG_SCHEME = /^[a-z][\da-z+\-.]*$/;
var REG_SCHEME_CUSTOM = /^(?:ext|web)\+[a-z]+$/;
var REG_SCRIPT = /(?:java|vb)script/;
var REG_URL_ENC = /^%[\dA-F]{2}$/i;
var REG_URL_ENC_AMP = /%26/g;
var getUrlEncodedString = (str) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  const chars = [];
  for (const ch of str) {
    chars.push(`%${ch.charCodeAt(0).toString(HEX).toUpperCase()}`);
  }
  return chars.join("");
};
var escapeUrlEncodedHtmlChars = (ch) => {
  if (isString(ch)) {
    if (REG_URL_ENC.test(ch)) {
      ch = ch.toUpperCase();
    } else {
      throw new Error(`Invalid URL encoded character: ${ch}`);
    }
  } else {
    throw new TypeError(`Expected String but got ${getType(ch)}.`);
  }
  const [amp, num, lt, gt, quot, apos] = ["&", "#", "<", ">", '"', "'"].map(getUrlEncodedString);
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
    parsedData = bin.replace(/\s/g, getUrlEncodedString);
  } else {
    parsedData = data;
  }
  return parsedData;
};
var parseUrlEncodedNumCharRef = (str, nest = 0) => {
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
      if (/^x[\dA-F]+/i.test(value)) {
        num = parseInt(`0${value}`, HEX);
      } else if (/^[\d]+/.test(value)) {
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
          if (/#x?$/.test(preNum) || /^#(?:x(?:00)?[2-7]|\d)/.test(postNum)) {
            res = parseUrlEncodedNumCharRef(res, ++nest);
          }
        } else if (num < HEX * HEX) {
          res = `${preNum}${postNum}`;
        }
      }
    }
  }
  return res;
};
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
   * is URI
   *
   * @param {string} uri - URI input
   * @returns {boolean} - result
   */
  isURI(uri) {
    let res;
    if (isString(uri)) {
      try {
        const { protocol } = new URL(uri);
        const scheme = protocol.replace(/:$/, "");
        const schemeParts = scheme.split("+");
        res = !REG_SCRIPT.test(scheme) && REG_SCHEME_CUSTOM.test(scheme) || schemeParts.every((s) => this.#schemes.has(s));
      } catch (e) {
        res = false;
      }
    }
    return !!res;
  }
};
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
   * sanitize URL
   * NOTE: `data` and/or `file` schemes must be explicitly allowed
   *       `javascript` and/or `vbscript` schemes can not be allowed
   *
   * @param {string} url - URL input
   * @param {object} opt - options
   * @param {Array.<string>} opt.allow - array of allowed schemes
   * @param {Array.<string>} opt.deny - array of denied schemes
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt = { allow: [], deny: [] }) {
    if (this.#nest > HEX) {
      this.#nest = 0;
      throw new Error("Data URLs nested too deeply.");
    }
    let sanitizedUrl;
    if (super.isURI(url)) {
      const { allow, deny } = opt ?? {};
      const { hash, href, pathname, protocol, search } = new URL(url);
      const scheme = protocol.replace(/:$/, "");
      const schemeParts = scheme.split("+");
      const schemeMap = /* @__PURE__ */ new Map([
        ["data", false],
        ["file", false],
        ["javascrpt", false],
        ["vbscript", false]
      ]);
      if (Array.isArray(allow) && allow.length) {
        const items = Object.values(allow);
        for (let item of items) {
          if (isString(item)) {
            item = item.trim();
            if (!REG_SCRIPT.test(item)) {
              schemeMap.set(item, true);
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
      let bool;
      for (const [key, value] of schemeMap.entries()) {
        bool = value || scheme !== key && schemeParts.every((s) => s !== key);
        if (!bool) {
          break;
        }
      }
      if (bool) {
        let escapeHtml;
        let urlToSanitize = href;
        if (schemeParts.includes("data")) {
          const [head, ...body] = pathname.split(",");
          const data = `${body.join(",")}${search}${hash}`;
          const mediaType = head.split(";");
          let parsedData = data;
          if (mediaType[mediaType.length - 1] === "base64") {
            mediaType.pop();
            parsedData = parseBase64(data);
          } else {
            try {
              const decodedData = parseUrlEncodedNumCharRef(parsedData);
              const { protocol: dataScheme } = new URL(decodedData.trim());
              const dataSchemeParts = dataScheme.replace(/:$/, "").split("+");
              if (dataSchemeParts.some((s) => REG_SCRIPT.test(s))) {
                urlToSanitize = "";
              }
            } catch (e) {
            }
          }
          const containsDataUrl = /data:[^,]*,/.test(parsedData);
          if (parsedData !== data || containsDataUrl) {
            if (containsDataUrl) {
              const matchedDataUrls = parsedData.matchAll(REG_DATA_URL);
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
                if (parsedDataUrl) {
                  const { index } = item;
                  const [preDataUrl, postDataUrl] = [
                    parsedData.substring(0, index),
                    parsedData.substring(index + dataUrl.length)
                  ];
                  parsedData = `${preDataUrl}${parsedDataUrl}${postDataUrl}`;
                }
              }
              if (this.#recurse.has(url)) {
                this.#recurse.delete(url);
              } else {
                escapeHtml = true;
              }
            } else if (this.#recurse.has(url)) {
              this.#recurse.delete(url);
            } else {
              escapeHtml = true;
            }
            urlToSanitize = `${scheme}:${mediaType.join(";")},${parsedData}`;
          } else if (this.#recurse.has(url)) {
            this.#recurse.delete(url);
          } else {
            escapeHtml = true;
          }
        } else {
          escapeHtml = true;
        }
        if (urlToSanitize) {
          sanitizedUrl = urlToSanitize.replace(REG_HTML_SP, getUrlEncodedString).replace(REG_URL_ENC_AMP, escapeUrlEncodedHtmlChars);
          if (escapeHtml) {
            sanitizedUrl = sanitizedUrl.replace(REG_HTML_SP_URL_ENC, escapeUrlEncodedHtmlChars);
            this.#nest = 0;
          }
        } else {
          sanitizedUrl = urlToSanitize;
          this.#nest = 0;
        }
      }
    }
    return sanitizedUrl || null;
  }
};
var urlSanitizer = new URLSanitizer();
var isUri = (uri) => urlSanitizer.isURI(uri);
var isURI = async (uri) => {
  const res = await isUri(uri);
  return res;
};
var sanitizeUrl = (url, opt) => urlSanitizer.sanitize(url, opt ?? {
  allow: [],
  deny: []
});
var sanitizeURL = async (url, opt) => {
  const res = await sanitizeUrl(url, opt);
  return res;
};
export {
  urlSanitizer as default,
  isURI,
  isUri as isURISync,
  sanitizeURL,
  sanitizeUrl as sanitizeURLSync
};
//# sourceMappingURL=url-sanitizer.js.map
