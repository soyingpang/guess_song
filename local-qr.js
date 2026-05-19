(function () {
  const VERSION = 6;
  const SIZE = VERSION * 4 + 17;
  const ERROR_CORRECTION_LEVEL = "M";
  const ECC_CODEWORDS_PER_BLOCK = 16;
  const NUM_BLOCKS = 4;
  const RAW_CODEWORDS = 172;
  const DATA_CODEWORDS = RAW_CODEWORDS - ECC_CODEWORDS_PER_BLOCK * NUM_BLOCKS;
  const ALIGNMENT_PATTERN_CENTERS = [6, 34];
  const FORMAT_LEVEL_BITS = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2,
  };

  function createLocalQrCodeDataUrl(text) {
    const matrix = createQrMatrix(String(text || ""));
    const svg = matrixToSvg(matrix, 4);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function createQrMatrix(text) {
    const dataCodewords = createDataCodewords(text);
    const codewords = addErrorCorrectionAndInterleave(dataCodewords);
    const base = createBaseMatrix();
    const candidates = [];

    for (let mask = 0; mask < 8; mask += 1) {
      const candidate = cloneMatrix(base);
      drawCodewords(candidate, codewords, mask);
      drawFormatBits(candidate, mask);
      candidates.push({ matrix: candidate.modules, penalty: calculatePenalty(candidate.modules) });
    }

    candidates.sort((a, b) => a.penalty - b.penalty);
    return candidates[0].matrix;
  }

  function createDataCodewords(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > 106) {
      throw new Error("QR code text is too long for the local QR generator.");
    }

    const bits = [];
    appendBits(bits, 0b0100, 4);
    appendBits(bits, bytes.length, 8);
    bytes.forEach((byte) => appendBits(bits, byte, 8));

    const maxBits = DATA_CODEWORDS * 8;
    appendBits(bits, 0, Math.min(4, maxBits - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      codewords.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
    }

    for (let pad = 0xec; codewords.length < DATA_CODEWORDS; pad = pad === 0xec ? 0x11 : 0xec) {
      codewords.push(pad);
    }

    return codewords;
  }

  function appendBits(bits, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) {
      bits.push((value >>> i) & 1);
    }
  }

  function addErrorCorrectionAndInterleave(dataCodewords) {
    const numShortBlocks = NUM_BLOCKS - (RAW_CODEWORDS % NUM_BLOCKS);
    const shortBlockLength = Math.floor(RAW_CODEWORDS / NUM_BLOCKS);
    const blocks = [];
    let dataOffset = 0;

    for (let blockIndex = 0; blockIndex < NUM_BLOCKS; blockIndex += 1) {
      const dataLength =
        shortBlockLength - ECC_CODEWORDS_PER_BLOCK + (blockIndex < numShortBlocks ? 0 : 1);
      const data = dataCodewords.slice(dataOffset, dataOffset + dataLength);
      dataOffset += dataLength;
      blocks.push({
        data,
        ecc: reedSolomonRemainder(data, ECC_CODEWORDS_PER_BLOCK),
      });
    }

    const result = [];
    const maxDataLength = Math.max(...blocks.map((block) => block.data.length));
    for (let i = 0; i < maxDataLength; i += 1) {
      blocks.forEach((block) => {
        if (i < block.data.length) result.push(block.data[i]);
      });
    }
    for (let i = 0; i < ECC_CODEWORDS_PER_BLOCK; i += 1) {
      blocks.forEach((block) => result.push(block.ecc[i]));
    }

    return result;
  }

  function reedSolomonRemainder(data, degree) {
    const generator = reedSolomonGenerator(degree);
    const result = new Array(degree).fill(0);

    data.forEach((byte) => {
      const factor = byte ^ result.shift();
      result.push(0);
      generator.slice(1).forEach((coefficient, index) => {
        result[index] ^= gfMultiply(coefficient, factor);
      });
    });

    return result;
  }

  function reedSolomonGenerator(degree) {
    let result = [1];
    for (let i = 0; i < degree; i += 1) {
      result = multiplyPolynomials(result, [1, gfPow(2, i)]);
    }
    return result;
  }

  function multiplyPolynomials(left, right) {
    const result = new Array(left.length + right.length - 1).fill(0);
    left.forEach((leftValue, leftIndex) => {
      right.forEach((rightValue, rightIndex) => {
        result[leftIndex + rightIndex] ^= gfMultiply(leftValue, rightValue);
      });
    });
    return result;
  }

  function gfPow(value, power) {
    let result = 1;
    for (let i = 0; i < power; i += 1) {
      result = gfMultiply(result, value);
    }
    return result;
  }

  function gfMultiply(left, right) {
    let result = 0;
    let a = left;
    let b = right;
    while (b > 0) {
      if (b & 1) result ^= a;
      a <<= 1;
      if (a & 0x100) a ^= 0x11d;
      b >>>= 1;
    }
    return result;
  }

  function createBaseMatrix() {
    const qr = {
      modules: Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
      isFunction: Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
    };

    drawFinderPattern(qr, 3, 3);
    drawFinderPattern(qr, SIZE - 4, 3);
    drawFinderPattern(qr, 3, SIZE - 4);
    drawAlignmentPatterns(qr);
    drawTimingPatterns(qr);
    reserveFormatAreas(qr);
    setFunctionModule(qr, 8, SIZE - 8, true);
    return qr;
  }

  function drawFinderPattern(qr, centerX, centerY) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (!isInBounds(x, y)) continue;

        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunctionModule(qr, x, y, distance === 3 || distance <= 1);
      }
    }
  }

  function drawAlignmentPatterns(qr) {
    ALIGNMENT_PATTERN_CENTERS.forEach((centerX) => {
      ALIGNMENT_PATTERN_CENTERS.forEach((centerY) => {
        const overlapsFinder =
          (centerX === 6 && centerY === 6) ||
          (centerX === 6 && centerY === SIZE - 7) ||
          (centerX === SIZE - 7 && centerY === 6);
        if (!overlapsFinder) drawAlignmentPattern(qr, centerX, centerY);
      });
    });
  }

  function drawAlignmentPattern(qr, centerX, centerY) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunctionModule(qr, centerX + dx, centerY + dy, distance === 2 || distance === 0);
      }
    }
  }

  function drawTimingPatterns(qr) {
    for (let i = 8; i < SIZE - 8; i += 1) {
      const isBlack = i % 2 === 0;
      setFunctionModule(qr, 6, i, isBlack);
      setFunctionModule(qr, i, 6, isBlack);
    }
  }

  function reserveFormatAreas(qr) {
    for (let i = 0; i <= 8; i += 1) {
      if (i !== 6) {
        setFunctionModule(qr, 8, i, false);
        setFunctionModule(qr, i, 8, false);
      }
    }
    for (let i = 0; i < 8; i += 1) {
      setFunctionModule(qr, SIZE - 1 - i, 8, false);
      setFunctionModule(qr, 8, SIZE - 1 - i, false);
    }
  }

  function drawCodewords(qr, codewords, mask) {
    let bitIndex = 0;
    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;

      for (let vertical = 0; vertical < SIZE; vertical += 1) {
        const y = ((right + 1) & 2) === 0 ? SIZE - 1 - vertical : vertical;

        for (let column = 0; column < 2; column += 1) {
          const x = right - column;
          if (qr.isFunction[y][x]) continue;

          const codeword = codewords[bitIndex >>> 3] || 0;
          const bit = ((codeword >>> (7 - (bitIndex & 7))) & 1) === 1;
          qr.modules[y][x] = bit !== maskApplies(mask, x, y);
          bitIndex += 1;
        }
      }
    }
  }

  function maskApplies(mask, x, y) {
    switch (mask) {
      case 0:
        return (x + y) % 2 === 0;
      case 1:
        return y % 2 === 0;
      case 2:
        return x % 3 === 0;
      case 3:
        return (x + y) % 3 === 0;
      case 4:
        return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
      case 5:
        return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6:
        return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      case 7:
        return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
      default:
        return false;
    }
  }

  function drawFormatBits(qr, mask) {
    const bits = getFormatBits(mask);

    for (let i = 0; i <= 5; i += 1) setFunctionModule(qr, 8, i, getBit(bits, i));
    setFunctionModule(qr, 8, 7, getBit(bits, 6));
    setFunctionModule(qr, 8, 8, getBit(bits, 7));
    setFunctionModule(qr, 7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i += 1) setFunctionModule(qr, 14 - i, 8, getBit(bits, i));

    for (let i = 0; i < 8; i += 1) setFunctionModule(qr, SIZE - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i += 1) setFunctionModule(qr, 8, SIZE - 15 + i, getBit(bits, i));
    setFunctionModule(qr, 8, SIZE - 8, true);
  }

  function getFormatBits(mask) {
    const data = (FORMAT_LEVEL_BITS[ERROR_CORRECTION_LEVEL] << 3) | mask;
    let remainder = data << 10;
    for (let i = 14; i >= 10; i -= 1) {
      if (((remainder >>> i) & 1) !== 0) {
        remainder ^= 0x537 << (i - 10);
      }
    }
    return ((data << 10) | remainder) ^ 0x5412;
  }

  function calculatePenalty(matrix) {
    return (
      adjacentPenalty(matrix) +
      blockPenalty(matrix) +
      finderLikePenalty(matrix) +
      darkRatioPenalty(matrix)
    );
  }

  function adjacentPenalty(matrix) {
    let penalty = 0;
    for (let y = 0; y < SIZE; y += 1) penalty += lineAdjacentPenalty(matrix[y]);
    for (let x = 0; x < SIZE; x += 1) {
      penalty += lineAdjacentPenalty(matrix.map((row) => row[x]));
    }
    return penalty;
  }

  function lineAdjacentPenalty(line) {
    let penalty = 0;
    let runColor = line[0];
    let runLength = 1;
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === runColor) {
        runLength += 1;
        if (runLength === 5) penalty += 3;
        else if (runLength > 5) penalty += 1;
      } else {
        runColor = line[i];
        runLength = 1;
      }
    }
    return penalty;
  }

  function blockPenalty(matrix) {
    let penalty = 0;
    for (let y = 0; y < SIZE - 1; y += 1) {
      for (let x = 0; x < SIZE - 1; x += 1) {
        const color = matrix[y][x];
        if (
          matrix[y][x + 1] === color &&
          matrix[y + 1][x] === color &&
          matrix[y + 1][x + 1] === color
        ) {
          penalty += 3;
        }
      }
    }
    return penalty;
  }

  function finderLikePenalty(matrix) {
    let penalty = 0;
    const patterns = ["10111010000", "00001011101"];

    for (let y = 0; y < SIZE; y += 1) {
      penalty += finderPatternCount(matrix[y], patterns) * 40;
    }
    for (let x = 0; x < SIZE; x += 1) {
      penalty += finderPatternCount(matrix.map((row) => row[x]), patterns) * 40;
    }
    return penalty;
  }

  function finderPatternCount(line, patterns) {
    const text = line.map((value) => (value ? "1" : "0")).join("");
    return patterns.reduce((count, pattern) => {
      let index = text.indexOf(pattern);
      while (index !== -1) {
        count += 1;
        index = text.indexOf(pattern, index + 1);
      }
      return count;
    }, 0);
  }

  function darkRatioPenalty(matrix) {
    const darkModules = matrix.flat().filter(Boolean).length;
    const totalModules = SIZE * SIZE;
    return Math.floor(Math.abs(darkModules * 20 - totalModules * 10) / totalModules) * 10;
  }

  function matrixToSvg(matrix, margin) {
    const imageSize = matrix.length + margin * 2;
    let path = "";

    matrix.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        if (!row[x]) {
          x += 1;
          continue;
        }

        const start = x;
        while (x < row.length && row[x]) x += 1;
        path += `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`;
      }
    });

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imageSize} ${imageSize}" shape-rendering="crispEdges">`,
      `<rect width="${imageSize}" height="${imageSize}" fill="#fff"/>`,
      `<path d="${path}" fill="#000"/>`,
      "</svg>",
    ].join("");
  }

  function cloneMatrix(qr) {
    return {
      modules: qr.modules.map((row) => row.slice()),
      isFunction: qr.isFunction.map((row) => row.slice()),
    };
  }

  function setFunctionModule(qr, x, y, isBlack) {
    if (!isInBounds(x, y)) return;
    qr.modules[y][x] = Boolean(isBlack);
    qr.isFunction[y][x] = true;
  }

  function isInBounds(x, y) {
    return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
  }

  function getBit(value, index) {
    return ((value >>> index) & 1) !== 0;
  }

  window.createLocalQrCodeDataUrl = createLocalQrCodeDataUrl;
})();
