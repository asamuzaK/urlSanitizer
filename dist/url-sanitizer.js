var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dompurify/dist/purify.js
var require_purify = __commonJS({
  "node_modules/dompurify/dist/purify.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.DOMPurify = factory());
    })(exports, function() {
      "use strict";
      function _typeof(obj) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
          return typeof obj2;
        } : function(obj2) {
          return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        }, _typeof(obj);
      }
      function _setPrototypeOf(o, p) {
        _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
          o2.__proto__ = p2;
          return o2;
        };
        return _setPrototypeOf(o, p);
      }
      function _isNativeReflectConstruct() {
        if (typeof Reflect === "undefined" || !Reflect.construct)
          return false;
        if (Reflect.construct.sham)
          return false;
        if (typeof Proxy === "function")
          return true;
        try {
          Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
          }));
          return true;
        } catch (e) {
          return false;
        }
      }
      function _construct(Parent, args, Class) {
        if (_isNativeReflectConstruct()) {
          _construct = Reflect.construct;
        } else {
          _construct = function _construct2(Parent2, args2, Class2) {
            var a = [null];
            a.push.apply(a, args2);
            var Constructor = Function.bind.apply(Parent2, a);
            var instance = new Constructor();
            if (Class2)
              _setPrototypeOf(instance, Class2.prototype);
            return instance;
          };
        }
        return _construct.apply(null, arguments);
      }
      function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
      }
      function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
      }
      function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr))
          return _arrayLikeToArray(arr);
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr))
          return arr;
      }
      function _iterableToArray(iter) {
        if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
          return Array.from(iter);
      }
      function _iterableToArrayLimit(arr, i) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null)
          return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i)
              break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null)
              _i["return"]();
          } finally {
            if (_d)
              throw _e;
          }
        }
        return _arr;
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o)
          return;
        if (typeof o === "string")
          return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor)
          n = o.constructor.name;
        if (n === "Map" || n === "Set")
          return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
          return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length)
          len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++)
          arr2[i] = arr[i];
        return arr2;
      }
      function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
        if (!it) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it)
              o = it;
            var i = 0;
            var F = function() {
            };
            return {
              s: F,
              n: function() {
                if (i >= o.length)
                  return {
                    done: true
                  };
                return {
                  done: false,
                  value: o[i++]
                };
              },
              e: function(e) {
                throw e;
              },
              f: F
            };
          }
          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return {
          s: function() {
            it = it.call(o);
          },
          n: function() {
            var step = it.next();
            normalCompletion = step.done;
            return step;
          },
          e: function(e) {
            didErr = true;
            err = e;
          },
          f: function() {
            try {
              if (!normalCompletion && it.return != null)
                it.return();
            } finally {
              if (didErr)
                throw err;
            }
          }
        };
      }
      var entries = Object.entries, setPrototypeOf = Object.setPrototypeOf, isFrozen = Object.isFrozen, getPrototypeOf = Object.getPrototypeOf, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
      var freeze = Object.freeze, seal = Object.seal, create = Object.create;
      var _ref = typeof Reflect !== "undefined" && Reflect, apply = _ref.apply, construct = _ref.construct;
      if (!apply) {
        apply = function apply2(fun, thisValue, args) {
          return fun.apply(thisValue, args);
        };
      }
      if (!freeze) {
        freeze = function freeze2(x) {
          return x;
        };
      }
      if (!seal) {
        seal = function seal2(x) {
          return x;
        };
      }
      if (!construct) {
        construct = function construct2(Func, args) {
          return _construct(Func, _toConsumableArray(args));
        };
      }
      var arrayForEach = unapply(Array.prototype.forEach);
      var arrayPop = unapply(Array.prototype.pop);
      var arrayPush = unapply(Array.prototype.push);
      var stringToLowerCase = unapply(String.prototype.toLowerCase);
      var stringToString = unapply(String.prototype.toString);
      var stringMatch = unapply(String.prototype.match);
      var stringReplace = unapply(String.prototype.replace);
      var stringIndexOf = unapply(String.prototype.indexOf);
      var stringTrim = unapply(String.prototype.trim);
      var regExpTest = unapply(RegExp.prototype.test);
      var typeErrorCreate = unconstruct(TypeError);
      function unapply(func) {
        return function(thisArg) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          return apply(func, thisArg, args);
        };
      }
      function unconstruct(func) {
        return function() {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }
          return construct(func, args);
        };
      }
      function addToSet(set, array, transformCaseFunc) {
        transformCaseFunc = transformCaseFunc ? transformCaseFunc : stringToLowerCase;
        if (setPrototypeOf) {
          setPrototypeOf(set, null);
        }
        var l = array.length;
        while (l--) {
          var element = array[l];
          if (typeof element === "string") {
            var lcElement = transformCaseFunc(element);
            if (lcElement !== element) {
              if (!isFrozen(array)) {
                array[l] = lcElement;
              }
              element = lcElement;
            }
          }
          set[element] = true;
        }
        return set;
      }
      function clone(object) {
        var newObject = create(null);
        var _iterator = _createForOfIteratorHelper(entries(object)), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var _step$value = _slicedToArray(_step.value, 2), property = _step$value[0], value = _step$value[1];
            newObject[property] = value;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return newObject;
      }
      function lookupGetter(object, prop) {
        while (object !== null) {
          var desc = getOwnPropertyDescriptor(object, prop);
          if (desc) {
            if (desc.get) {
              return unapply(desc.get);
            }
            if (typeof desc.value === "function") {
              return unapply(desc.value);
            }
          }
          object = getPrototypeOf(object);
        }
        function fallbackValue(element) {
          console.warn("fallback value for", element);
          return null;
        }
        return fallbackValue;
      }
      var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
      var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
      var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
      var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "fedropshadow", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
      var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover"]);
      var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
      var text = freeze(["#text"]);
      var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "xmlns", "slot"]);
      var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
      var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
      var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
      var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
      var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
      var TMPLIT_EXPR = seal(/\${[\w\W]*}/gm);
      var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]/);
      var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
      var IS_ALLOWED_URI = seal(
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
        // eslint-disable-line no-useless-escape
      );
      var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
      var ATTR_WHITESPACE = seal(
        /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
        // eslint-disable-line no-control-regex
      );
      var DOCTYPE_NAME = seal(/^html$/i);
      var getGlobal = function getGlobal2() {
        return typeof window === "undefined" ? null : window;
      };
      var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, document) {
        if (_typeof(trustedTypes) !== "object" || typeof trustedTypes.createPolicy !== "function") {
          return null;
        }
        var suffix = null;
        var ATTR_NAME = "data-tt-policy-suffix";
        if (document.currentScript && document.currentScript.hasAttribute(ATTR_NAME)) {
          suffix = document.currentScript.getAttribute(ATTR_NAME);
        }
        var policyName = "dompurify" + (suffix ? "#" + suffix : "");
        try {
          return trustedTypes.createPolicy(policyName, {
            createHTML: function createHTML(html2) {
              return html2;
            },
            createScriptURL: function createScriptURL(scriptUrl) {
              return scriptUrl;
            }
          });
        } catch (_) {
          console.warn("TrustedTypes policy " + policyName + " could not be created.");
          return null;
        }
      };
      function createDOMPurify() {
        var window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
        var DOMPurify = function DOMPurify2(root) {
          return createDOMPurify(root);
        };
        DOMPurify.version = "3.0.1";
        DOMPurify.removed = [];
        if (!window2 || !window2.document || window2.document.nodeType !== 9) {
          DOMPurify.isSupported = false;
          return DOMPurify;
        }
        var originalDocument = window2.document;
        var document = window2.document;
        var DocumentFragment = window2.DocumentFragment, HTMLTemplateElement = window2.HTMLTemplateElement, Node = window2.Node, Element = window2.Element, NodeFilter = window2.NodeFilter, _window$NamedNodeMap = window2.NamedNodeMap, NamedNodeMap = _window$NamedNodeMap === void 0 ? window2.NamedNodeMap || window2.MozNamedAttrMap : _window$NamedNodeMap, HTMLFormElement = window2.HTMLFormElement, DOMParser = window2.DOMParser, trustedTypes = window2.trustedTypes;
        var ElementPrototype = Element.prototype;
        var cloneNode = lookupGetter(ElementPrototype, "cloneNode");
        var getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
        var getChildNodes = lookupGetter(ElementPrototype, "childNodes");
        var getParentNode = lookupGetter(ElementPrototype, "parentNode");
        if (typeof HTMLTemplateElement === "function") {
          var template = document.createElement("template");
          if (template.content && template.content.ownerDocument) {
            document = template.content.ownerDocument;
          }
        }
        var trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, originalDocument);
        var emptyHTML = trustedTypesPolicy ? trustedTypesPolicy.createHTML("") : "";
        var _document = document, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
        var importNode = originalDocument.importNode;
        var hooks = {};
        DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && typeof implementation.createHTMLDocument !== "undefined";
        var MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE;
        var IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
        var ALLOWED_TAGS = null;
        var DEFAULT_ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray(html$1), _toConsumableArray(svg$1), _toConsumableArray(svgFilters), _toConsumableArray(mathMl$1), _toConsumableArray(text)));
        var ALLOWED_ATTR = null;
        var DEFAULT_ALLOWED_ATTR = addToSet({}, [].concat(_toConsumableArray(html), _toConsumableArray(svg), _toConsumableArray(mathMl), _toConsumableArray(xml)));
        var CUSTOM_ELEMENT_HANDLING = Object.seal(Object.create(null, {
          tagNameCheck: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: null
          },
          attributeNameCheck: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: null
          },
          allowCustomizedBuiltInElements: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: false
          }
        }));
        var FORBID_TAGS = null;
        var FORBID_ATTR = null;
        var ALLOW_ARIA_ATTR = true;
        var ALLOW_DATA_ATTR = true;
        var ALLOW_UNKNOWN_PROTOCOLS = false;
        var ALLOW_SELF_CLOSE_IN_ATTR = true;
        var SAFE_FOR_TEMPLATES = false;
        var WHOLE_DOCUMENT = false;
        var SET_CONFIG = false;
        var FORCE_BODY = false;
        var RETURN_DOM = false;
        var RETURN_DOM_FRAGMENT = false;
        var RETURN_TRUSTED_TYPE = false;
        var SANITIZE_DOM = true;
        var SANITIZE_NAMED_PROPS = false;
        var SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
        var KEEP_CONTENT = true;
        var IN_PLACE = false;
        var USE_PROFILES = {};
        var FORBID_CONTENTS = null;
        var DEFAULT_FORBID_CONTENTS = addToSet({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
        var DATA_URI_TAGS = null;
        var DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
        var URI_SAFE_ATTRIBUTES = null;
        var DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
        var MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
        var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
        var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
        var NAMESPACE = HTML_NAMESPACE;
        var IS_EMPTY_INPUT = false;
        var ALLOWED_NAMESPACES = null;
        var DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
        var PARSER_MEDIA_TYPE;
        var SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
        var DEFAULT_PARSER_MEDIA_TYPE = "text/html";
        var transformCaseFunc;
        var CONFIG = null;
        var formElement = document.createElement("form");
        var isRegexOrFunction = function isRegexOrFunction2(testValue) {
          return testValue instanceof RegExp || testValue instanceof Function;
        };
        var _parseConfig = function _parseConfig2(cfg) {
          if (CONFIG && CONFIG === cfg) {
            return;
          }
          if (!cfg || _typeof(cfg) !== "object") {
            cfg = {};
          }
          cfg = clone(cfg);
          PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
          SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? PARSER_MEDIA_TYPE = DEFAULT_PARSER_MEDIA_TYPE : PARSER_MEDIA_TYPE = cfg.PARSER_MEDIA_TYPE;
          transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
          ALLOWED_TAGS = "ALLOWED_TAGS" in cfg ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
          ALLOWED_ATTR = "ALLOWED_ATTR" in cfg ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
          ALLOWED_NAMESPACES = "ALLOWED_NAMESPACES" in cfg ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
          URI_SAFE_ATTRIBUTES = "ADD_URI_SAFE_ATTR" in cfg ? addToSet(
            clone(DEFAULT_URI_SAFE_ATTRIBUTES),
            // eslint-disable-line indent
            cfg.ADD_URI_SAFE_ATTR,
            // eslint-disable-line indent
            transformCaseFunc
            // eslint-disable-line indent
          ) : DEFAULT_URI_SAFE_ATTRIBUTES;
          DATA_URI_TAGS = "ADD_DATA_URI_TAGS" in cfg ? addToSet(
            clone(DEFAULT_DATA_URI_TAGS),
            // eslint-disable-line indent
            cfg.ADD_DATA_URI_TAGS,
            // eslint-disable-line indent
            transformCaseFunc
            // eslint-disable-line indent
          ) : DEFAULT_DATA_URI_TAGS;
          FORBID_CONTENTS = "FORBID_CONTENTS" in cfg ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
          FORBID_TAGS = "FORBID_TAGS" in cfg ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : {};
          FORBID_ATTR = "FORBID_ATTR" in cfg ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : {};
          USE_PROFILES = "USE_PROFILES" in cfg ? cfg.USE_PROFILES : false;
          ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
          ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
          ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
          ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
          SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
          WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
          RETURN_DOM = cfg.RETURN_DOM || false;
          RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
          RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
          FORCE_BODY = cfg.FORCE_BODY || false;
          SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
          SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
          KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
          IN_PLACE = cfg.IN_PLACE || false;
          IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI$1;
          NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
          CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
          if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
            CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
          }
          if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
            CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
          }
          if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") {
            CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
          }
          if (SAFE_FOR_TEMPLATES) {
            ALLOW_DATA_ATTR = false;
          }
          if (RETURN_DOM_FRAGMENT) {
            RETURN_DOM = true;
          }
          if (USE_PROFILES) {
            ALLOWED_TAGS = addToSet({}, _toConsumableArray(text));
            ALLOWED_ATTR = [];
            if (USE_PROFILES.html === true) {
              addToSet(ALLOWED_TAGS, html$1);
              addToSet(ALLOWED_ATTR, html);
            }
            if (USE_PROFILES.svg === true) {
              addToSet(ALLOWED_TAGS, svg$1);
              addToSet(ALLOWED_ATTR, svg);
              addToSet(ALLOWED_ATTR, xml);
            }
            if (USE_PROFILES.svgFilters === true) {
              addToSet(ALLOWED_TAGS, svgFilters);
              addToSet(ALLOWED_ATTR, svg);
              addToSet(ALLOWED_ATTR, xml);
            }
            if (USE_PROFILES.mathMl === true) {
              addToSet(ALLOWED_TAGS, mathMl$1);
              addToSet(ALLOWED_ATTR, mathMl);
              addToSet(ALLOWED_ATTR, xml);
            }
          }
          if (cfg.ADD_TAGS) {
            if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
              ALLOWED_TAGS = clone(ALLOWED_TAGS);
            }
            addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
          }
          if (cfg.ADD_ATTR) {
            if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
              ALLOWED_ATTR = clone(ALLOWED_ATTR);
            }
            addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
          }
          if (cfg.ADD_URI_SAFE_ATTR) {
            addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
          }
          if (cfg.FORBID_CONTENTS) {
            if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
              FORBID_CONTENTS = clone(FORBID_CONTENTS);
            }
            addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
          }
          if (KEEP_CONTENT) {
            ALLOWED_TAGS["#text"] = true;
          }
          if (WHOLE_DOCUMENT) {
            addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
          }
          if (ALLOWED_TAGS.table) {
            addToSet(ALLOWED_TAGS, ["tbody"]);
            delete FORBID_TAGS.tbody;
          }
          if (freeze) {
            freeze(cfg);
          }
          CONFIG = cfg;
        };
        var MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
        var HTML_INTEGRATION_POINTS = addToSet({}, ["foreignobject", "desc", "title", "annotation-xml"]);
        var COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
        var ALL_SVG_TAGS = addToSet({}, svg$1);
        addToSet(ALL_SVG_TAGS, svgFilters);
        addToSet(ALL_SVG_TAGS, svgDisallowed);
        var ALL_MATHML_TAGS = addToSet({}, mathMl$1);
        addToSet(ALL_MATHML_TAGS, mathMlDisallowed);
        var _checkValidNamespace = function _checkValidNamespace2(element) {
          var parent = getParentNode(element);
          if (!parent || !parent.tagName) {
            parent = {
              namespaceURI: NAMESPACE,
              tagName: "template"
            };
          }
          var tagName = stringToLowerCase(element.tagName);
          var parentTagName = stringToLowerCase(parent.tagName);
          if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
            return false;
          }
          if (element.namespaceURI === SVG_NAMESPACE) {
            if (parent.namespaceURI === HTML_NAMESPACE) {
              return tagName === "svg";
            }
            if (parent.namespaceURI === MATHML_NAMESPACE) {
              return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
            }
            return Boolean(ALL_SVG_TAGS[tagName]);
          }
          if (element.namespaceURI === MATHML_NAMESPACE) {
            if (parent.namespaceURI === HTML_NAMESPACE) {
              return tagName === "math";
            }
            if (parent.namespaceURI === SVG_NAMESPACE) {
              return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
            }
            return Boolean(ALL_MATHML_TAGS[tagName]);
          }
          if (element.namespaceURI === HTML_NAMESPACE) {
            if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
              return false;
            }
            if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
              return false;
            }
            return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
          }
          if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
            return true;
          }
          return false;
        };
        var _forceRemove = function _forceRemove2(node) {
          arrayPush(DOMPurify.removed, {
            element: node
          });
          try {
            node.parentNode.removeChild(node);
          } catch (_) {
            node.remove();
          }
        };
        var _removeAttribute = function _removeAttribute2(name, node) {
          try {
            arrayPush(DOMPurify.removed, {
              attribute: node.getAttributeNode(name),
              from: node
            });
          } catch (_) {
            arrayPush(DOMPurify.removed, {
              attribute: null,
              from: node
            });
          }
          node.removeAttribute(name);
          if (name === "is" && !ALLOWED_ATTR[name]) {
            if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
              try {
                _forceRemove(node);
              } catch (_) {
              }
            } else {
              try {
                node.setAttribute(name, "");
              } catch (_) {
              }
            }
          }
        };
        var _initDocument = function _initDocument2(dirty) {
          var doc;
          var leadingWhitespace;
          if (FORCE_BODY) {
            dirty = "<remove></remove>" + dirty;
          } else {
            var matches = stringMatch(dirty, /^[\r\n\t ]+/);
            leadingWhitespace = matches && matches[0];
          }
          if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
            dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
          }
          var dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
          if (NAMESPACE === HTML_NAMESPACE) {
            try {
              doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
            } catch (_) {
            }
          }
          if (!doc || !doc.documentElement) {
            doc = implementation.createDocument(NAMESPACE, "template", null);
            try {
              doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
            } catch (_) {
            }
          }
          var body = doc.body || doc.documentElement;
          if (dirty && leadingWhitespace) {
            body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
          }
          if (NAMESPACE === HTML_NAMESPACE) {
            return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
          }
          return WHOLE_DOCUMENT ? doc.documentElement : body;
        };
        var _createIterator = function _createIterator2(root) {
          return createNodeIterator.call(
            root.ownerDocument || root,
            root,
            // eslint-disable-next-line no-bitwise
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT,
            null,
            false
          );
        };
        var _isClobbered = function _isClobbered2(elm) {
          return elm instanceof HTMLFormElement && (typeof elm.nodeName !== "string" || typeof elm.textContent !== "string" || typeof elm.removeChild !== "function" || !(elm.attributes instanceof NamedNodeMap) || typeof elm.removeAttribute !== "function" || typeof elm.setAttribute !== "function" || typeof elm.namespaceURI !== "string" || typeof elm.insertBefore !== "function" || typeof elm.hasChildNodes !== "function");
        };
        var _isNode = function _isNode2(object) {
          return _typeof(Node) === "object" ? object instanceof Node : object && _typeof(object) === "object" && typeof object.nodeType === "number" && typeof object.nodeName === "string";
        };
        var _executeHook = function _executeHook2(entryPoint, currentNode, data) {
          if (!hooks[entryPoint]) {
            return;
          }
          arrayForEach(hooks[entryPoint], function(hook) {
            hook.call(DOMPurify, currentNode, data, CONFIG);
          });
        };
        var _sanitizeElements = function _sanitizeElements2(currentNode) {
          var content;
          _executeHook("beforeSanitizeElements", currentNode, null);
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
            return true;
          }
          var tagName = transformCaseFunc(currentNode.nodeName);
          _executeHook("uponSanitizeElement", currentNode, {
            tagName,
            allowedTags: ALLOWED_TAGS
          });
          if (currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && (!_isNode(currentNode.content) || !_isNode(currentNode.content.firstElementChild)) && regExpTest(/<[/\w]/g, currentNode.innerHTML) && regExpTest(/<[/\w]/g, currentNode.textContent)) {
            _forceRemove(currentNode);
            return true;
          }
          if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            if (!FORBID_TAGS[tagName] && _basicCustomElementTest(tagName)) {
              if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName))
                return false;
              if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName))
                return false;
            }
            if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
              var parentNode = getParentNode(currentNode) || currentNode.parentNode;
              var childNodes = getChildNodes(currentNode) || currentNode.childNodes;
              if (childNodes && parentNode) {
                var childCount = childNodes.length;
                for (var i = childCount - 1; i >= 0; --i) {
                  parentNode.insertBefore(cloneNode(childNodes[i], true), getNextSibling(currentNode));
                }
              }
            }
            _forceRemove(currentNode);
            return true;
          }
          if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
            _forceRemove(currentNode);
            return true;
          }
          if ((tagName === "noscript" || tagName === "noembed") && regExpTest(/<\/no(script|embed)/i, currentNode.innerHTML)) {
            _forceRemove(currentNode);
            return true;
          }
          if (SAFE_FOR_TEMPLATES && currentNode.nodeType === 3) {
            content = currentNode.textContent;
            content = stringReplace(content, MUSTACHE_EXPR$1, " ");
            content = stringReplace(content, ERB_EXPR$1, " ");
            content = stringReplace(content, TMPLIT_EXPR$1, " ");
            if (currentNode.textContent !== content) {
              arrayPush(DOMPurify.removed, {
                element: currentNode.cloneNode()
              });
              currentNode.textContent = content;
            }
          }
          _executeHook("afterSanitizeElements", currentNode, null);
          return false;
        };
        var _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
          if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) {
            return false;
          }
          if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR$1, lcName))
            ;
          else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName))
            ;
          else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
            if (
              // First condition does a very basic check if a) it's basically a valid custom element tagname AND
              // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
              // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
              _basicCustomElementTest(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName)) || // Alternative, second condition checks if it's an `is`-attribute, AND
              // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
              lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
            )
              ;
            else {
              return false;
            }
          } else if (URI_SAFE_ATTRIBUTES[lcName])
            ;
          else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, "")))
            ;
          else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag])
            ;
          else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, "")))
            ;
          else if (!value)
            ;
          else {
            return false;
          }
          return true;
        };
        var _basicCustomElementTest = function _basicCustomElementTest2(tagName) {
          return tagName.indexOf("-") > 0;
        };
        var _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
          var attr;
          var value;
          var lcName;
          var l;
          _executeHook("beforeSanitizeAttributes", currentNode, null);
          var attributes = currentNode.attributes;
          if (!attributes) {
            return;
          }
          var hookEvent = {
            attrName: "",
            attrValue: "",
            keepAttr: true,
            allowedAttributes: ALLOWED_ATTR
          };
          l = attributes.length;
          while (l--) {
            attr = attributes[l];
            var _attr = attr, name = _attr.name, namespaceURI = _attr.namespaceURI;
            value = name === "value" ? attr.value : stringTrim(attr.value);
            lcName = transformCaseFunc(name);
            hookEvent.attrName = lcName;
            hookEvent.attrValue = value;
            hookEvent.keepAttr = true;
            hookEvent.forceKeepAttr = void 0;
            _executeHook("uponSanitizeAttribute", currentNode, hookEvent);
            value = hookEvent.attrValue;
            if (hookEvent.forceKeepAttr) {
              continue;
            }
            _removeAttribute(name, currentNode);
            if (!hookEvent.keepAttr) {
              continue;
            }
            if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
              _removeAttribute(name, currentNode);
              continue;
            }
            if (SAFE_FOR_TEMPLATES) {
              value = stringReplace(value, MUSTACHE_EXPR$1, " ");
              value = stringReplace(value, ERB_EXPR$1, " ");
              value = stringReplace(value, TMPLIT_EXPR$1, " ");
            }
            var lcTag = transformCaseFunc(currentNode.nodeName);
            if (!_isValidAttribute(lcTag, lcName, value)) {
              continue;
            }
            if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
              _removeAttribute(name, currentNode);
              value = SANITIZE_NAMED_PROPS_PREFIX + value;
            }
            if (trustedTypesPolicy && _typeof(trustedTypes) === "object" && typeof trustedTypes.getAttributeType === "function") {
              if (namespaceURI)
                ;
              else {
                switch (trustedTypes.getAttributeType(lcTag, lcName)) {
                  case "TrustedHTML":
                    value = trustedTypesPolicy.createHTML(value);
                    break;
                  case "TrustedScriptURL":
                    value = trustedTypesPolicy.createScriptURL(value);
                    break;
                }
              }
            }
            try {
              if (namespaceURI) {
                currentNode.setAttributeNS(namespaceURI, name, value);
              } else {
                currentNode.setAttribute(name, value);
              }
              arrayPop(DOMPurify.removed);
            } catch (_) {
            }
          }
          _executeHook("afterSanitizeAttributes", currentNode, null);
        };
        var _sanitizeShadowDOM = function _sanitizeShadowDOM2(fragment) {
          var shadowNode;
          var shadowIterator = _createIterator(fragment);
          _executeHook("beforeSanitizeShadowDOM", fragment, null);
          while (shadowNode = shadowIterator.nextNode()) {
            _executeHook("uponSanitizeShadowNode", shadowNode, null);
            if (_sanitizeElements(shadowNode)) {
              continue;
            }
            if (shadowNode.content instanceof DocumentFragment) {
              _sanitizeShadowDOM2(shadowNode.content);
            }
            _sanitizeAttributes(shadowNode);
          }
          _executeHook("afterSanitizeShadowDOM", fragment, null);
        };
        DOMPurify.sanitize = function(dirty) {
          var cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          var body;
          var importedNode;
          var currentNode;
          var returnNode;
          IS_EMPTY_INPUT = !dirty;
          if (IS_EMPTY_INPUT) {
            dirty = "<!-->";
          }
          if (typeof dirty !== "string" && !_isNode(dirty)) {
            if (typeof dirty.toString !== "function") {
              throw typeErrorCreate("toString is not a function");
            } else {
              dirty = dirty.toString();
              if (typeof dirty !== "string") {
                throw typeErrorCreate("dirty is not a string, aborting");
              }
            }
          }
          if (!DOMPurify.isSupported) {
            return dirty;
          }
          if (!SET_CONFIG) {
            _parseConfig(cfg);
          }
          DOMPurify.removed = [];
          if (typeof dirty === "string") {
            IN_PLACE = false;
          }
          if (IN_PLACE) {
            if (dirty.nodeName) {
              var tagName = transformCaseFunc(dirty.nodeName);
              if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
                throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
              }
            }
          } else if (dirty instanceof Node) {
            body = _initDocument("<!---->");
            importedNode = body.ownerDocument.importNode(dirty, true);
            if (importedNode.nodeType === 1 && importedNode.nodeName === "BODY") {
              body = importedNode;
            } else if (importedNode.nodeName === "HTML") {
              body = importedNode;
            } else {
              body.appendChild(importedNode);
            }
          } else {
            if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
            dirty.indexOf("<") === -1) {
              return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
            }
            body = _initDocument(dirty);
            if (!body) {
              return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
            }
          }
          if (body && FORCE_BODY) {
            _forceRemove(body.firstChild);
          }
          var nodeIterator = _createIterator(IN_PLACE ? dirty : body);
          while (currentNode = nodeIterator.nextNode()) {
            if (_sanitizeElements(currentNode)) {
              continue;
            }
            if (currentNode.content instanceof DocumentFragment) {
              _sanitizeShadowDOM(currentNode.content);
            }
            _sanitizeAttributes(currentNode);
          }
          if (IN_PLACE) {
            return dirty;
          }
          if (RETURN_DOM) {
            if (RETURN_DOM_FRAGMENT) {
              returnNode = createDocumentFragment.call(body.ownerDocument);
              while (body.firstChild) {
                returnNode.appendChild(body.firstChild);
              }
            } else {
              returnNode = body;
            }
            if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmod) {
              returnNode = importNode.call(originalDocument, returnNode, true);
            }
            return returnNode;
          }
          var serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
          if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
            serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
          }
          if (SAFE_FOR_TEMPLATES) {
            serializedHTML = stringReplace(serializedHTML, MUSTACHE_EXPR$1, " ");
            serializedHTML = stringReplace(serializedHTML, ERB_EXPR$1, " ");
            serializedHTML = stringReplace(serializedHTML, TMPLIT_EXPR$1, " ");
          }
          return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
        };
        DOMPurify.setConfig = function(cfg) {
          _parseConfig(cfg);
          SET_CONFIG = true;
        };
        DOMPurify.clearConfig = function() {
          CONFIG = null;
          SET_CONFIG = false;
        };
        DOMPurify.isValidAttribute = function(tag, attr, value) {
          if (!CONFIG) {
            _parseConfig({});
          }
          var lcTag = transformCaseFunc(tag);
          var lcName = transformCaseFunc(attr);
          return _isValidAttribute(lcTag, lcName, value);
        };
        DOMPurify.addHook = function(entryPoint, hookFunction) {
          if (typeof hookFunction !== "function") {
            return;
          }
          hooks[entryPoint] = hooks[entryPoint] || [];
          arrayPush(hooks[entryPoint], hookFunction);
        };
        DOMPurify.removeHook = function(entryPoint) {
          if (hooks[entryPoint]) {
            return arrayPop(hooks[entryPoint]);
          }
        };
        DOMPurify.removeHooks = function(entryPoint) {
          if (hooks[entryPoint]) {
            hooks[entryPoint] = [];
          }
        };
        DOMPurify.removeAllHooks = function() {
          hooks = {};
        };
        return DOMPurify;
      }
      var purify = createDOMPurify();
      return purify;
    });
  }
});

// bundle/mjs/dompurify.js
var import_dompurify = __toESM(require_purify(), 1);

// bundle/mjs/common.js
var TYPE_FROM = 8;
var TYPE_TO = -1;
var getType = (o) => Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);
var isString = (o) => typeof o === "string" || o instanceof String;

// bundle/lib/file/text-chars.json
var text_chars_default = [7, 8, 9, 10, 11, 12, 13, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255];

// bundle/lib/iana/uri-schemes.json
var uri_schemes_default = ["aaa", "aaas", "about", "acap", "acct", "acd", "acr", "adiumxtra", "adt", "afp", "afs", "aim", "amss", "android", "appdata", "apt", "ar", "ark", "attachment", "aw", "barion", "beshare", "bitcoin", "bitcoincash", "blob", "bolo", "browserext", "cabal", "calculator", "callto", "cap", "cast", "casts", "chrome", "chrome-extension", "cid", "coap", "coaps", "com-eventbrite-attendee", "content", "content-type", "crid", "cstr", "cvs", "dab", "dat", "data", "dav", "diaspora", "dict", "did", "dis", "dlna-playcontainer", "dlna-playsingle", "dns", "dntp", "doi", "dpp", "drm", "dtmi", "dtn", "dvb", "dvx", "dweb", "ed2k", "eid", "elsi", "embedded", "ens", "ethereum", "example", "facetime", "feed", "feedready", "fido", "file", "finger", "first-run-pen-experience", "fish", "fm", "ftp", "fuchsia-pkg", "geo", "gg", "git", "gitoid", "gizmoproject", "go", "gopher", "graph", "gtalk", "h323", "ham", "hcap", "hcp", "http", "https", "hxxp", "hxxps", "hydrazone", "hyper", "iax", "icap", "icon", "im", "imap", "info", "iotdisco", "ipfs", "ipn", "ipns", "ipp", "ipps", "irc", "irc6", "ircs", "iris", "iris.beep", "iris.lwz", "iris.xpc", "iris.xpcs", "isostore", "itms", "jabber", "jar", "jms", "keyparc", "lastfm", "lbry", "ldap", "ldaps", "leaptofrogans", "lorawan", "lpa", "lvlt", "magnet", "mailto", "maps", "market", "matrix", "message", "microsoft.windows.camera", "microsoft.windows.camera.multipicker", "microsoft.windows.camera.picker", "mid", "mms", "mongodb", "moz", "moz-extension", "ms-access", "ms-appinstaller", "ms-browser-extension", "ms-calculator", "ms-drive-to", "ms-enrollment", "ms-excel", "ms-eyecontrolspeech", "ms-gamebarservices", "ms-gamingoverlay", "ms-getoffice", "ms-help", "ms-infopath", "ms-inputapp", "ms-lockscreencomponent-config", "ms-media-stream-id", "ms-meetnow", "ms-mixedrealitycapture", "ms-mobileplans", "ms-newsandinterests", "ms-officeapp", "ms-people", "ms-powerpoint", "ms-project", "ms-publisher", "ms-remotedesktop-launch", "ms-restoretabcompanion", "ms-screenclip", "ms-screensketch", "ms-search", "ms-search-repair", "ms-secondary-screen-controller", "ms-secondary-screen-setup", "ms-settings", "ms-settings-airplanemode", "ms-settings-bluetooth", "ms-settings-camera", "ms-settings-cellular", "ms-settings-cloudstorage", "ms-settings-connectabledevices", "ms-settings-displays-topology", "ms-settings-emailandaccounts", "ms-settings-language", "ms-settings-location", "ms-settings-lock", "ms-settings-nfctransactions", "ms-settings-notifications", "ms-settings-power", "ms-settings-privacy", "ms-settings-proximity", "ms-settings-screenrotation", "ms-settings-wifi", "ms-settings-workplace", "ms-spd", "ms-stickers", "ms-sttoverlay", "ms-transit-to", "ms-useractivityset", "ms-virtualtouchpad", "ms-visio", "ms-walk-to", "ms-whiteboard", "ms-whiteboard-cmd", "ms-word", "msnim", "msrp", "msrps", "mss", "mt", "mtqp", "mumble", "mupdate", "mvn", "news", "nfs", "ni", "nih", "nntp", "notes", "num", "ocf", "oid", "onenote", "onenote-cmd", "opaquelocktoken", "openpgp4fpr", "otpauth", "palm", "paparazzi", "payment", "payto", "pkcs11", "platform", "pop", "pres", "proxy", "psyc", "pttp", "pwid", "qb", "query", "quic-transport", "redis", "rediss", "reload", "res", "resource", "rmi", "rsync", "rtmfp", "rtmp", "rtsp", "rtsps", "rtspu", "sarif", "secondlife", "secret-token", "service", "session", "sftp", "sgn", "shc", "sieve", "simpleledger", "simplex", "sip", "sips", "skype", "smb", "smp", "sms", "smtp", "snmp", "soap.beep", "soap.beeps", "soldat", "spiffe", "spotify", "ssb", "ssh", "starknet", "steam", "stun", "stuns", "submit", "svn", "swh", "swid", "swidpath", "tag", "taler", "teamspeak", "tel", "teliaeid", "telnet", "tftp", "things", "thismessage", "tip", "tn3270", "tool", "turn", "turns", "tv", "udp", "unreal", "urn", "ut2004", "uuid-in-package", "v-event", "vemmi", "ventrilo", "ves", "view-source", "vnc", "vscode", "vscode-insiders", "vsls", "w3", "wcr", "web3", "webcal", "wifi", "ws", "wss", "wtai", "wyciwyg", "xcon", "xcon-userid", "xfire", "xmlrpc.beep", "xmlrpc.beeps", "xmpp", "xri", "ymsgr", "z39.50r", "z39.50s"];

// bundle/mjs/file-reader.js
var { FileReader } = globalThis;

// bundle/mjs/uri-util.js
var HEX = 16;
var REG_BASE64 = /^[\w+/\-=]+$/;
var REG_END_COLON = /:$/;
var REG_NUM_DECI = /^\d+/;
var REG_NUM_HEAD = /#x?$/;
var REG_NUM_HEAD_ASCII = /^#(?:x(?:00)?[2-7]|\d)/;
var REG_NUM_HEX = /^x[\dA-F]+/i;
var REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/gi;
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

// bundle/mjs/sanitizer.js
var HEX2 = 16;
var REG_DATA_URL = /data:[\w#&+\-./;=]*,/;
var REG_DATA_URL_BASE64 = /data:[\w#&+\-./;=]*base64,[\w+/\-=]+/i;
var REG_DATA_URL_G = /data:[\w#&+\-./;=]*,[^"]+/g;
var REG_END_COLON2 = /:$/;
var REG_END_NUM = /(?:#|%23)$/;
var REG_END_QUEST = /(?<!(?:#|%23).*)(?:\?|%3F)$/;
var REG_HTML_SP = /[<>"'\s]/g;
var REG_HTML_URL_ENC = /%(?:2(?:2|7)|3(?:C|E))/g;
var REG_MIME_DOM = /^(?:text\/(?:ht|x)ml|application\/(?:[\w#&\-.;]+\+)?xml|image\/svg\+xml)/;
var REG_SCRIPT_BLOB = /(?:java|vb)script|blob/;
var REG_TAG_QUOT = /%(?:2(?:2|7)|3(?:C|E))|[<>"']/;
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
    let purifiedDom = import_dompurify.default.sanitize(decodeURIComponent(dom));
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
        if (!isDataUrl && remove && REG_TAG_QUOT.test(urlToSanitize)) {
          const item = REG_TAG_QUOT.exec(urlToSanitize);
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
/*! Bundled license information:

dompurify/dist/purify.js:
  (*! @license DOMPurify 3.0.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.0.1/LICENSE *)
*/
//# sourceMappingURL=url-sanitizer.js.map
