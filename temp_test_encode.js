function encodeRLE(str) {
  const ESCAPE_CHAR = '~';
  if (typeof str !== 'string') {
    throw new TypeError('encodeRLE expects a string');
  }
  const chars = Array.from(str);
  const originalLength = chars.length;
  if (originalLength === 0) {
    return {
      compressed: '',
      compressedLength: 0,
      originalLength: 0,
      compressionRatio: 0,
    };
  }
  let compressed = '';
  let i = 0;
  while (i < chars.length) {
    const currentChar = chars[i];
    let count = 1;
    while (i + count < chars.length && chars[i + count] === currentChar) {
      count += 1;
    }
    if (count === 1) {
      // For singletons, emit char directly, but escape the ESCAPE_CHAR
      if (currentChar === ESCAPE_CHAR) compressed += `${ESCAPE_CHAR}1:${ESCAPE_CHAR}`;
      else compressed += currentChar;
    } else {
      compressed += `${ESCAPE_CHAR}${count}:${currentChar}`;
    }
    i += count;
  }
  const compressedLength = Array.from(compressed).length;
  const compressionRatio = Number(((compressedLength / originalLength) * 100).toFixed(2));
  return {
    compressed,
    compressedLength,
    originalLength,
    compressionRatio,
  };
}

const sample = "aaaaaaabbbbbbbbbbbbbbbv3333zzffffffffaaaaaaaaaagFFF222244444444fg44444444444422hhhhhhhhaBc1aaa3bbbffffffffffffff";
console.log(JSON.stringify(encodeRLE(sample), null, 2));
