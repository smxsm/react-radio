import { IcecastReadableStream } from 'https://unpkg.com/icecast-metadata-js';

type icyAudioInfo = {
  bitRate: number;
  quality: number;
  channels: number;
  sampleRate: number;
};

type StreamHeaders = {
  server: string;
  icyGenre: string[];
  icyAudioInfo: icyAudioInfo;
  icyName: string;
  icyDescription: string;
  icyUrl: string;
  icyBr: number;
  icySr: number;
  icyLogo: string;
  icyCountryCode: string;
  icyCountrySubdivisionCode: string;
  icyLanguageCodes: string[];
  icyGeoLatLong: string;
  contentType: string;
};

export default async function getIcecastMetadata(response: Response, icyMetaInt: number): Promise<{ title: string }> {
  const icyHeaders = parseHeaders(response.headers);
  return new Promise((resolve) => {
    new IcecastReadableStream(response, {
      onMetadata: ({ metadata }) => {
        resolve({ title: metadata.StreamTitle || metadata.TITLE, ...icyHeaders });
      },
      metadataTypes: ['icy', 'ogg'],
      icyMetaInt: icyMetaInt,
    });
  });
}

function parseHeaders(headers: Headers): StreamHeaders {
  const unicode = unicodeCoverter();
  unicode.load(880, 1791);
  return {
    server: headers.get('Server') || '',
    icyGenre: splitValues(headers.get('icy-genre') || '', ','),
    icyAudioInfo: parseAudioInfoString(headers.get('icy-audio-info') || headers.get('ice-audio-info') || ''),
    icyName: unicode.fix(headers.get('icy-name') || '').trim() || '',
    icyDescription: unicode.fix(headers.get('icy-description') || '').trim(),
    icyUrl: reconstructUrl(headers.get('icy-url')?.trim() || ''),
    icyBr: parseInt(headers.get('icy-br') || '0'),
    icySr: parseInt(headers.get('icy-sr') || '0'),
    icyLogo: headers.get('icy-logo')?.trim() || '',
    icyCountryCode: headers.get('icy-country-code')?.trim() || '',
    icyCountrySubdivisionCode: headers.get('icy-country-subdivison-code')?.trim() || '',
    icyLanguageCodes: splitValues(headers.get('icy-language-codes') || '', ','),
    icyGeoLatLong: headers.get('icy-geo-lat-long') || '',
    contentType: headers.get('Content-Type') || '',
  };
}

function splitValues(values: string, seperator: string) {
  return values.split(seperator).map((genre) => genre.trim()) || [];
}

function parseAudioInfoString(audioInfo: string) {
  const keyValueTupels = audioInfo.split(';').map((entry) => entry.split('='));

  const result: any = {};

  for (let [key, value] of keyValueTupels) {
    if (key.toLocaleLowerCase().includes('bitrate')) {
      result.bitRate = parseInt(value.trim()) || 0;
    }
    if (key.toLocaleLowerCase().includes('quality')) {
      result.quality = parseFloat(value.trim()) || 0;
    }
    if (key.toLocaleLowerCase().includes('channels')) {
      result.channels = parseInt(value.trim()) || 0;
    }
    if (key.toLocaleLowerCase().includes('samplerate')) {
      result.sampleRate = parseInt(value.trim()) || 0;
    }
  }

  return result;
}

function reconstructUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch (err) {
    return url;
  }
}

// NB -> copy/paste code: fixes non-latin header values
function unicodeCoverter() {
  var a = function (j: any, k: any) {
      for (var h = 0; h < j.length; h++) {
        if (h + 2 < j.length) {
          var l = j.charAt(h) + j.charAt(h + 1) + j.charAt(h + 2);
          if (l in k) {
            j = j.replace(l, k[l]);
            h += 2;
          }
        }
        if (h + 1 < j.length) {
          var l = j.charAt(h) + j.charAt(h + 1);
          if (l in k) {
            j = j.replace(l, k[l]);
            h++;
          }
        }
        if (j.charAt(h) in k) {
          j = j.replace(j.charAt(h), k[j.charAt(h)]);
        }
      }
      return j;
    },
    f = function (j: any) {
      var i: { [key: string]: any } = {};
      for (var h in j) {
        i[j[h]] = h;
      }
      return i;
    },
    c = function (l: any, m: number, h: number) {
      for (var j = m; j <= h; j++) {
        if (j > 65535) {
          break;
        }
        var k = String.fromCharCode(j);
        if (k) {
          l[k] = g(j);
        }
      }
      return l;
    },
    g = function (i: number) {
      if (i < 128) {
        return String.fromCharCode(i);
      } else {
        if (i < 2048) {
          var k = 192 + Math.floor(i / 64),
            j = 128 + (i % 64);
          return String.fromCharCode(k) + String.fromCharCode(j);
        } else {
          if (i < 65536) {
            var k = 224 + Math.floor(i / 4096),
              j = 128 + Math.floor((i % 4096) / 64),
              h = 128 + (i % 64);
            return String.fromCharCode(k) + String.fromCharCode(j) + String.fromCharCode(h);
          }
        }
      }
      return false;
    },
    b = function (k: any) {
      var j: { [key: string]: any } = {};
      for (var l in k) {
        for (var h = 0; h < k[l].length; h++) {
          j[String.fromCharCode(k[l][h])] = l;
        }
      }
      return j;
    };
  var e: { [key: string]: any } = {},
    d = b({
      a: [
        593, 592, 11365, 7681, 7853, 7863, 7841, 515, 513, 7843, 257, 261, 481, 551, 227, 479, 228, 507, 229, 462, 7849,
        7851, 7847, 7845, 226, 7859, 7861, 7857, 7855, 259, 224, 225, 7567,
      ],
      A: [
        11373, 11375, 570, 7680, 7852, 7862, 7840, 514, 512, 7842, 256, 260, 480, 550, 195, 478, 196, 506, 197, 461,
        7848, 7850, 7846, 7844, 194, 7858, 7860, 7856, 7854, 258, 192, 193, 8371,
      ],
      b: [387, 595, 384, 7687, 7685, 7683, 7552, 7532],
      B: [386, 385, 579, 7686, 7684, 7682, 3647],
      c: [392, 572, 7689, 231, 267, 269, 265, 263, 597, 162],
      C: [391, 571, 7688, 199, 266, 268, 264, 262, 8373, 8353, 8354],
      d: [396, 599, 598, 273, 7695, 7699, 7693, 7697, 7691, 271, 8706, 545, 7569, 7553, 7533, 8363],
      D: [395, 394, 393, 272, 7694, 7698, 7692, 7696, 7690, 270],
      e: [
        583, 7707, 7705, 7879, 7865, 519, 517, 7867, 7701, 7703, 275, 281, 7709, 553, 279, 7869, 235, 283, 7875, 7877,
        7873, 7871, 234, 277, 232, 233, 11384, 7570,
      ],
      E: [
        582, 7706, 7704, 7878, 7864, 518, 516, 7866, 7700, 7702, 274, 280, 7708, 552, 278, 7868, 203, 282, 7874, 7876,
        7872, 7870, 202, 276, 200, 201, 8364,
      ],
      f: [402, 7711, 7554, 7534],
      F: [401, 7710, 8355],
      g: [608, 485, 7713, 291, 289, 487, 285, 287, 501, 7555],
      G: [403, 484, 7712, 290, 288, 486, 284, 286, 500, 8370],
      h: [11368, 295, 7723, 7717, 7721, 7715, 7719, 543, 293],
      H: [11367, 294, 7722, 7716, 7720, 7714, 7718, 542, 292],
      i: [305, 105, 616, 7725, 7883, 523, 521, 7881, 299, 303, 297, 7727, 239, 464, 238, 301, 236, 237, 7574],
      I: [73, 304, 407, 7724, 7882, 522, 520, 7880, 298, 302, 296, 7726, 207, 463, 206, 300, 204, 205, 7547],
      j: [585, 309, 644, 607, 669],
      J: [584, 308, 567],
      k: [42817, 11370, 409, 7733, 7731, 311, 489, 7729, 7556],
      K: [42816, 11369, 408, 7732, 7730, 310, 488, 7728, 8365],
      l: [619, 11361, 410, 320, 322, 7739, 7741, 7737, 7735, 316, 318, 314, 564, 621, 7557, 620],
      L: [11362, 11360, 573, 319, 321, 7738, 7740, 7736, 7734, 315, 317, 313],
      m: [625, 7747, 7745, 7743, 7558, 7535, 8357],
      M: [11374, 7746, 7744, 7742, 8499],
      n: [42897, 331, 414, 626, 7753, 7755, 7751, 326, 7749, 241, 328, 505, 324, 565, 627, 7559, 7536],
      N: [42896, 330, 544, 413, 7752, 7754, 7750, 325, 7748, 209, 327, 504, 323, 8358],
      o: [
        596, 629, 7897, 7885, 7907, 7903, 7905, 7901, 7899, 417, 527, 525, 7887, 7761, 7763, 333, 493, 491, 511, 248,
        561, 559, 557, 7759, 7757, 245, 337, 555, 246, 466, 7893, 7895, 7891, 7889, 244, 335, 242, 243, 11386,
      ],
      O: [
        390, 415, 7896, 7884, 7906, 7902, 7904, 7900, 7898, 416, 526, 524, 7886, 7760, 7762, 332, 492, 490, 510, 216,
        560, 558, 556, 7758, 7756, 213, 336, 554, 214, 465, 7892, 7894, 7890, 7888, 212, 334, 210, 211,
      ],
      p: [421, 7549, 7767, 7765, 7560, 7537],
      P: [420, 11363, 7766, 7764, 8369],
      q: [419, 587, 672],
      Q: [418, 586],
      r: [637, 589, 7775, 7773, 7771, 531, 529, 343, 7769, 345, 341, 7539, 638, 636, 7561, 7538],
      R: [11364, 588, 7774, 7772, 7770, 530, 528, 342, 7768, 344, 340],
      s: [537, 7785, 7779, 351, 7783, 353, 349, 7781, 347, 575, 642, 7562, 7540],
      S: [536, 7784, 7778, 350, 7782, 352, 348, 7780, 346, 7776],
      t: [648, 429, 11366, 359, 7791, 7793, 539, 7789, 355, 7787, 357, 566, 427, 7541],
      T: [430, 428, 574, 358, 7790, 7792, 538, 7788, 354, 7786, 356],
      u: [
        649, 7797, 7799, 7795, 7909, 7921, 7917, 7919, 7915, 7913, 432, 535, 533, 7911, 7803, 363, 371, 7801, 361, 369,
        470, 474, 476, 472, 252, 367, 468, 251, 365, 249, 250, 7577, 7550,
      ],
      U: [
        580, 7796, 7798, 7794, 7908, 7920, 7916, 7918, 7914, 7912, 431, 534, 532, 7910, 7802, 362, 370, 7800, 360, 368,
        469, 473, 475, 471, 220, 366, 467, 219, 364, 217, 218,
      ],
      v: [651, 7807, 7805, 11380, 11377, 7564],
      V: [434, 7806, 7804],
      w: [11379, 7817, 7815, 7813, 373, 7809, 7811],
      W: [11378, 7816, 7814, 7812, 372, 7808, 7810, 8361],
      x: [7819, 7821, 7565],
      X: [7818, 7820],
      y: [436, 591, 7925, 7927, 563, 7823, 7929, 255, 375, 7923, 253],
      Y: [435, 590, 7924, 7926, 562, 7822, 7928, 376, 374, 7922, 221, 655, 165],
      z: [11372, 549, 438, 7829, 7827, 380, 382, 7825, 378, 576, 657, 656, 7566, 7542],
      Z: [11371, 548, 437, 7828, 7826, 379, 381, 7824, 377],
      "'": [8216, 8217, 8242],
      '"': [8220, 8221, 8243, 12291],
      '\'"': [8244],
      '(': [10216],
      ')': [10217],
      '-': [8208, 8210, 8211, 8212, 8213],
      '...': [8230],
      '<<': [171],
      '>>': [187],
      '/': [8260, 247],
      ' ': [8194, 8195],
      '.': [183],
      '*': [8226, 176],
      '!': [161],
      '?': [191],
      'No.': [8470],
      '|': [166],
      '0/00': [8240],
      '0/000': [8241],
      '(C)': [167],
      '(R)': [174],
      '(P)': [8471],
      ' SM': [8480],
      ' TM': [8482],
      CE: [8352],
      Dp: [8367],
      Pts: [8359],
      Rs: [8360],
      '!?': [8253],
      ',,': [8222],
    });
  return {
    fix: function (h: any) {
      while (h != a(h, f(e))) {
        h = a(h, f(e));
      }
      return h;
    },
    unfix: function (j: string) {
      var k = '';
      for (var h = 0; h < j.length; h++) {
        k += g(j.charCodeAt(h));
      }
      return k;
    },
    toASCII: function (h: any) {
      return a(h, d).replace(/[^\x00-\x7f\xa3]/, '');
    },
    load: function (i: number, h: number) {
      if (!h) {
        h = i;
        i = 0;
      }
      return c(e, i, h);
    },
    unload: function (k: number, h: number) {
      if (!h) {
        h = k;
        k = 0;
      }
      for (var j = k; j < h; j++) {
        var l = String.fromCharCode(j);
        if (l in e) {
          delete e[l];
        }
      }
      return e;
    },
    blocks: [
      { name: 'Basic Latin', start: 0, end: 127 },
      { name: 'Latin-1 Supplement', start: 128, end: 255 },
      { name: 'Latin Extended-A', start: 256, end: 383 },
      { name: 'Latin Extended-B', start: 384, end: 591 },
      { name: 'IPA Extensions', start: 592, end: 687 },
      { name: 'Spacing Modifier Letters', start: 688, end: 767 },
      { name: 'Combining Diacritical Marks', start: 768, end: 879 },
      { name: 'Greek and Coptic', start: 880, end: 1023 },
      { name: 'Cyrillic', start: 1024, end: 1279 },
      { name: 'Cyrillic Supplement', start: 1280, end: 1327 },
      { name: 'Armenian', start: 1328, end: 1423 },
      { name: 'Hebrew', start: 1424, end: 1535 },
      { name: 'Arabic', start: 1536, end: 1791 },
      { name: 'Syriac', start: 1792, end: 1871 },
      { name: 'Arabic Supplement', start: 1872, end: 1919 },
      { name: 'Thaana', start: 1920, end: 1983 },
      { name: 'NKo', start: 1984, end: 2047 },
      { name: 'Samaritan', start: 2048, end: 2111 },
      { name: 'Mandaic', start: 2112, end: 2143 },
      { name: 'Devanagari', start: 2304, end: 2431 },
      { name: 'Bengali', start: 2432, end: 2559 },
      { name: 'Gurmukhi', start: 2560, end: 2687 },
      { name: 'Gujarati', start: 2688, end: 2815 },
      { name: 'Oriya', start: 2816, end: 2943 },
      { name: 'Tamil', start: 2944, end: 3071 },
      { name: 'Telugu', start: 3072, end: 3199 },
      { name: 'Kannada', start: 3200, end: 3327 },
      { name: 'Malayalam', start: 3328, end: 3455 },
      { name: 'Sinhala', start: 3456, end: 3583 },
      { name: 'Thai', start: 3584, end: 3711 },
      { name: 'Lao', start: 3712, end: 3839 },
      { name: 'Tibetan', start: 3840, end: 4095 },
      { name: 'Myanmar', start: 4096, end: 4255 },
      { name: 'Georgian', start: 4256, end: 4351 },
      { name: 'Hangul Jamo', start: 4352, end: 4607 },
      { name: 'Ethiopic', start: 4608, end: 4991 },
      { name: 'Ethiopic Supplement', start: 4992, end: 5023 },
      { name: 'Cherokee', start: 5024, end: 5119 },
      { name: 'Unified Canadian Aboriginal Syllabics', start: 5120, end: 5759 },
      { name: 'Ogham', start: 5760, end: 5791 },
      { name: 'Runic', start: 5792, end: 5887 },
      { name: 'Tagalog', start: 5888, end: 5919 },
      { name: 'Hanunoo', start: 5920, end: 5951 },
      { name: 'Buhid', start: 5952, end: 5983 },
      { name: 'Tagbanwa', start: 5984, end: 6015 },
      { name: 'Khmer', start: 6016, end: 6143 },
      { name: 'Mongolian', start: 6144, end: 6319 },
      {
        name: 'Unified Canadian Aboriginal Syllabics Extended',
        start: 6320,
        end: 6399,
      },
      { name: 'Limbu', start: 6400, end: 6479 },
      { name: 'Tai Le', start: 6480, end: 6527 },
      { name: 'New Tai Lue', start: 6528, end: 6623 },
      { name: 'Khmer Symbols', start: 6624, end: 6655 },
      { name: 'Buginese', start: 6656, end: 6687 },
      { name: 'Tai Tham', start: 6688, end: 6831 },
      { name: 'Balinese', start: 6912, end: 7039 },
      { name: 'Sundanese', start: 7040, end: 7103 },
      { name: 'Batak', start: 7104, end: 7167 },
      { name: 'Lepcha', start: 7168, end: 7247 },
      { name: 'Ol Chiki', start: 7248, end: 7295 },
      { name: 'Vedic Extensions', start: 7376, end: 7423 },
      { name: 'Phonetic Extensions', start: 7424, end: 7551 },
      { name: 'Phonetic Extensions Supplement', start: 7552, end: 7615 },
      {
        name: 'Combining Diacritical Marks Supplement',
        start: 7616,
        end: 7679,
      },
      { name: 'Latin Extended Additional', start: 7680, end: 7935 },
      { name: 'Greek Extended', start: 7936, end: 8191 },
      { name: 'General Punctuation', start: 8192, end: 8303 },
      { name: 'Superscripts and Subscripts', start: 8304, end: 8351 },
      { name: 'Currency Symbols', start: 8352, end: 8399 },
      {
        name: 'Combining Diacritical Marks for Symbols',
        start: 8400,
        end: 8447,
      },
      { name: 'Letterlike Symbols', start: 8448, end: 8527 },
      { name: 'Number Forms', start: 8528, end: 8591 },
      { name: 'Arrows', start: 8592, end: 8703 },
      { name: 'Mathematical Operators', start: 8704, end: 8959 },
      { name: 'Miscellaneous Technical', start: 8960, end: 9215 },
      { name: 'Control Pictures', start: 9216, end: 9279 },
      { name: 'Optical Character Recognition', start: 9280, end: 9311 },
      { name: 'Enclosed Alphanumerics', start: 9312, end: 9471 },
      { name: 'Box Drawing', start: 9472, end: 9599 },
      { name: 'Block Elements', start: 9600, end: 9631 },
      { name: 'Geometric Shapes', start: 9632, end: 9727 },
      { name: 'Miscellaneous Symbols', start: 9728, end: 9983 },
      { name: 'Dingbats', start: 9984, end: 10175 },
      {
        name: 'Miscellaneous Mathematical Symbols-A',
        start: 10176,
        end: 10223,
      },
      { name: 'Supplemental Arrows-A', start: 10224, end: 10239 },
      { name: 'Braille Patterns', start: 10240, end: 10495 },
      { name: 'Supplemental Arrows-B', start: 10496, end: 10623 },
      {
        name: 'Miscellaneous Mathematical Symbols-B',
        start: 10624,
        end: 10751,
      },
      { name: 'Supplemental Mathematical Operators', start: 10752, end: 11007 },
      { name: 'Miscellaneous Symbols and Arrows', start: 11008, end: 11263 },
      { name: 'Glagolitic', start: 11264, end: 11359 },
      { name: 'Latin Extended-C', start: 11360, end: 11391 },
      { name: 'Coptic', start: 11392, end: 11519 },
      { name: 'Georgian Supplement', start: 11520, end: 11567 },
      { name: 'Tifinagh', start: 11568, end: 11647 },
      { name: 'Ethiopic Extended', start: 11648, end: 11743 },
      { name: 'Cyrillic Extended-A', start: 11744, end: 11775 },
      { name: 'Supplemental Punctuation', start: 11776, end: 11903 },
      { name: 'CJK Radicals Supplement', start: 11904, end: 12031 },
      { name: 'Kangxi Radicals', start: 12032, end: 12255 },
      { name: 'Ideographic Description Characters', start: 12272, end: 12287 },
      { name: 'CJK Symbols and Punctuation', start: 12288, end: 12351 },
      { name: 'Hiragana', start: 12352, end: 12447 },
      { name: 'Katakana', start: 12448, end: 12543 },
      { name: 'Bopomofo', start: 12544, end: 12591 },
      { name: 'Hangul Compatibility Jamo', start: 12592, end: 12687 },
      { name: 'Kanbun', start: 12688, end: 12703 },
      { name: 'Bopomofo Extended', start: 12704, end: 12735 },
      { name: 'CJK Strokes', start: 12736, end: 12783 },
      { name: 'Katakana Phonetic Extensions', start: 12784, end: 12799 },
      { name: 'Enclosed CJK Letters and Months', start: 12800, end: 13055 },
      { name: 'CJK Compatibility', start: 13056, end: 13311 },
      { name: 'CJK Unified Ideographs Extension A', start: 13312, end: 19903 },
      { name: 'Yijing Hexagram Symbols', start: 19904, end: 19967 },
      { name: 'CJK Unified Ideographs', start: 19968, end: 40959 },
      { name: 'Yi Syllables', start: 40960, end: 42127 },
      { name: 'Yi Radicals', start: 42128, end: 42191 },
      { name: 'Lisu', start: 42192, end: 42239 },
      { name: 'Vai', start: 42240, end: 42559 },
      { name: 'Cyrillic Extended-B', start: 42560, end: 42655 },
      { name: 'Bamum', start: 42656, end: 42751 },
      { name: 'Modifier Tone Letters', start: 42752, end: 42783 },
      { name: 'Latin Extended-D', start: 42784, end: 43007 },
      { name: 'Syloti Nagri', start: 43008, end: 43055 },
      { name: 'Common Indic Number Forms', start: 43056, end: 43071 },
      { name: 'Phags-pa', start: 43072, end: 43135 },
      { name: 'Saurashtra', start: 43136, end: 43231 },
      { name: 'Devanagari Extended', start: 43232, end: 43263 },
      { name: 'Kayah Li', start: 43264, end: 43311 },
      { name: 'Rejang', start: 43312, end: 43359 },
      { name: 'Hangul Jamo Extended-A', start: 43360, end: 43391 },
      { name: 'Javanese', start: 43392, end: 43487 },
      { name: 'Cham', start: 43520, end: 43615 },
      { name: 'Myanmar Extended-A', start: 43616, end: 43647 },
      { name: 'Tai Viet', start: 43648, end: 43743 },
      { name: 'Ethiopic Extended-A', start: 43776, end: 43823 },
      { name: 'Meetei Mayek', start: 43968, end: 44031 },
      { name: 'Hangul Syllables', start: 44032, end: 55215 },
      { name: 'Hangul Jamo Extended-B', start: 55216, end: 55295 },
      { name: 'High Surrogates', start: 55296, end: 56191 },
      { name: 'High Private Use Surrogates', start: 56192, end: 56319 },
      { name: 'Low Surrogates', start: 56320, end: 57343 },
      { name: 'Private Use Area', start: 57344, end: 63743 },
      { name: 'CJK Compatibility Ideographs', start: 63744, end: 64255 },
      { name: 'Alphabetic Presentation Forms', start: 64256, end: 64335 },
      { name: 'Arabic Presentation Forms-A', start: 64336, end: 65023 },
      { name: 'Variation Selectors', start: 65024, end: 65039 },
      { name: 'Vertical Forms', start: 65040, end: 65055 },
      { name: 'Combining Half Marks', start: 65056, end: 65071 },
      { name: 'CJK Compatibility Forms', start: 65072, end: 65103 },
      { name: 'Small Form Variants', start: 65104, end: 65135 },
      { name: 'Arabic Presentation Forms-B', start: 65136, end: 65279 },
      { name: 'Halfwidth and Fullwidth Forms', start: 65280, end: 65519 },
      { name: 'Specials', start: 65520, end: 65535 },
      { name: 'Linear B Syllabary', start: 65536, end: 65663 },
      { name: 'Linear B Ideograms', start: 65664, end: 65791 },
      { name: 'Aegean Numbers', start: 65792, end: 65855 },
      { name: 'Ancient Greek Numbers', start: 65856, end: 65935 },
      { name: 'Ancient Symbols', start: 65936, end: 65999 },
      { name: 'Phaistos Disc', start: 66000, end: 66047 },
      { name: 'Lycian', start: 66176, end: 66207 },
      { name: 'Carian', start: 66208, end: 66271 },
      { name: 'Old Italic', start: 66304, end: 66351 },
      { name: 'Gothic', start: 66352, end: 66383 },
      { name: 'Ugaritic', start: 66432, end: 66463 },
      { name: 'Old Persian', start: 66464, end: 66527 },
      { name: 'Deseret', start: 66560, end: 66639 },
      { name: 'Shavian', start: 66640, end: 66687 },
      { name: 'Osmanya', start: 66688, end: 66735 },
      { name: 'Cypriot Syllabary', start: 67584, end: 67647 },
      { name: 'Imperial Aramaic', start: 67648, end: 67679 },
      { name: 'Phoenician', start: 67840, end: 67871 },
      { name: 'Lydian', start: 67872, end: 67903 },
      { name: 'Kharoshthi', start: 68096, end: 68191 },
      { name: 'Old South Arabian', start: 68192, end: 68223 },
      { name: 'Avestan', start: 68352, end: 68415 },
      { name: 'Inscriptional Parthian', start: 68416, end: 68447 },
      { name: 'Inscriptional Pahlavi', start: 68448, end: 68479 },
      { name: 'Old Turkic', start: 68608, end: 68687 },
      { name: 'Rumi Numeral Symbols', start: 69216, end: 69247 },
      { name: 'Brahmi', start: 69632, end: 69759 },
      { name: 'Kaithi', start: 69760, end: 69839 },
      { name: 'Cuneiform', start: 73728, end: 74751 },
      { name: 'Cuneiform Numbers and Punctuation', start: 74752, end: 74879 },
      { name: 'Egyptian Hieroglyphs', start: 77824, end: 78895 },
      { name: 'Bamum Supplement', start: 92160, end: 92735 },
      { name: 'Kana Supplement', start: 110592, end: 110847 },
      { name: 'Byzantine Musical Symbols', start: 118784, end: 119039 },
      { name: 'Musical Symbols', start: 119040, end: 119295 },
      { name: 'Ancient Greek Musical Notation', start: 119296, end: 119375 },
      { name: 'Tai Xuan Jing Symbols', start: 119552, end: 119647 },
      { name: 'Counting Rod Numerals', start: 119648, end: 119679 },
      { name: 'Mathematical Alphanumeric Symbols', start: 119808, end: 120831 },
      { name: 'Mahjong Tiles', start: 126976, end: 127023 },
      { name: 'Domino Tiles', start: 127024, end: 127135 },
      { name: 'Playing Cards', start: 127136, end: 127231 },
      { name: 'Enclosed Alphanumeric Supplement', start: 127232, end: 127487 },
      { name: 'Enclosed Ideographic Supplement', start: 127488, end: 127743 },
      {
        name: 'Miscellaneous Symbols And Pictographs',
        start: 127744,
        end: 128511,
      },
      { name: 'Emoticons', start: 128512, end: 128591 },
      { name: 'Transport And Map Symbols', start: 128640, end: 128767 },
      { name: 'Alchemical Symbols', start: 128768, end: 128895 },
      {
        name: 'CJK Unified Ideographs Extension B',
        start: 131072,
        end: 173791,
      },
      {
        name: 'CJK Unified Ideographs Extension C',
        start: 173824,
        end: 177983,
      },
      {
        name: 'CJK Unified Ideographs Extension D',
        start: 177984,
        end: 178207,
      },
      {
        name: 'CJK Compatibility Ideographs Supplement',
        start: 194560,
        end: 195103,
      },
      { name: 'Tags', start: 917504, end: 917631 },
      { name: 'Variation Selectors Supplement', start: 917760, end: 917999 },
      { name: 'Supplementary Private Use Area-A', start: 983040, end: 1048575 },
      {
        name: 'Supplementary Private Use Area-B',
        start: 1048576,
        end: 1114111,
      },
    ],
  };
}
