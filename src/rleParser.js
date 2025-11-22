// rleParser.js

const ESCAPE_CHAR = '~'; 


function decodeRLE(encodedStr) {
    const chars = Array.from(encodedStr); // full characters array (emojis OK)
    let decodedStr = '';
    let i = 0;

    while (i < chars.length) {
        if (chars[i] === ESCAPE_CHAR) {
            let numberStart = i + 1;

            //I have to manually check since i dont have indexOf
            let numberEnd = numberStart;
            while (numberEnd < chars.length && chars[numberEnd] !== ':') {
                numberEnd++;
            }

            if (numberEnd >= chars.length) {
                throw new Error("Invalid format: missing ':' after '~number'");
            }

            const number = parseInt(chars.slice(numberStart, numberEnd).join(''), 10);

            if (isNaN(number) || number < 1) {
                throw new Error("Invalid format: number should be a positive integer");
            }

            const char = chars[numberEnd + 1];

            if (!char) throw new Error("Invalid format: missing character after ':'");

            decodedStr += char.repeat(number);

            i = numberEnd + 2;
        } else {
            throw new Error("Invalid format: string must start with '~'");
        }
    }

    return decodedStr;
}


function encodeRLE(str) {
    const chars = Array.from(str);     //safe emojis (hate emojis)
    let compressed = '';
    let i = 0;

    while (i < chars.length) {
        const currentChar = chars[i];
        let count = 1;

        if(currentChar === '') {
            throw new Error("Empty character encountered, invalid input string");
        }
        while (i + count < chars.length && chars[i + count] === currentChar) {
            count++;
        }


        compressed += `~${count}:${currentChar}`;

        i += count;
    }

    const originalLength = chars.length;
    let compressedLength = Array.from(compressed).length; //emoji-safe or UTF-16 safe
    let compressionRatio = compressedLength / originalLength;

    if(compressionRatio >= 1) {
        console.warn("Warning: Compression ratio is >= 1, compression ineffective.");
        compressed = str;
        compressedLength = compressed.length;
        compressionRatio = 1;
    }

    compressionRatio = compressionRatio.toFixed(2)*100 + "%";

    return {
        compressed,
        compressedLength,
        originalLength,
        compressionRatio
    };
}


export async function parse_file(file) {
  const text = await file.text();
  const decoded = decodeRLE(text);
  console.log("Decoded content:", decoded);
  try {
    return {"string": decoded, "length": decoded.length};
  } catch (e) {
    throw new Error("Decoded content is not valid JSON");
  }
}

export async function compress_file(file) {
  const text = await file.text();
  return encodeRLE(text);
}