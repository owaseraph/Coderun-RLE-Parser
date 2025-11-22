import GraphemeSplitter from 'grapheme-splitter';

const isDigit = (char) => /\d/.test(char);

const ESCAPE_CHAR = '~'; 

const splitter = new GraphemeSplitter();


const getGraphemes = (str) => {
  return splitter.splitGraphemes(str);
};


export function decodeRLE(encodedData) {
  
  const chars = getGraphemes(encodedData);
  let decoded = '';
  let i = 0;

  while (i < chars.length) {
    const char = chars[i];

    if (char === ESCAPE_CHAR) {
      if (i + 1 < chars.length && chars[i+1] === ESCAPE_CHAR) {
         decoded += ESCAPE_CHAR;
         i += 2;
         continue;
      }

      let tempI = i + 1;
      let numStr = '';
      
      
      while (tempI < chars.length && isDigit(chars[tempI])) {
        numStr += chars[tempI];
        tempI++;
      }

      if (numStr.length > 0) {
        
        if (tempI < chars.length && chars[tempI] === ':') {
            const count = parseInt(numStr, 10);
            const digitToRepeat = chars[tempI + 1]; 
            
            if (digitToRepeat) {
                decoded += digitToRepeat.repeat(count);
                i = tempI + 2; 
            } else {
                i = tempI; 
            }
        } else {
            decoded += numStr;
            i = tempI; 
        }
      } else {
         i++; 
      }
    } 
    else if (isDigit(char)) {
      let numStr = '';
      let tempI = i;
      
      while (tempI < chars.length && isDigit(chars[tempI])) {
        numStr += chars[tempI];
        tempI++;
      }
      
      if (tempI < chars.length) {
         const count = parseInt(numStr, 10);
         const charToRepeat = chars[tempI]; 
         decoded += charToRepeat.repeat(count);
         i = tempI + 1;
      } else {
         decoded += numStr;
         i = tempI;
      }
    } 
    else {
      decoded += char;
      i++;
    }
  }
  return decoded;
}

 
export function encodeRLE(inputData) {
  const chars = getGraphemes(inputData);
  let encoded = '';
  let i = 0;

  while (i < chars.length) {
    const char = chars[i];

    if (isDigit(char)) {
      let count = 1;
      while (i + 1 < chars.length && chars[i + 1] === char) {
        count++;
        i++;
      }
      
      if (count > 1) {
        encoded += `${ESCAPE_CHAR}${count}:${char}`;
      } else {
        encoded += `${ESCAPE_CHAR}${char}`;
      }
      i++;
    }
    else if (char === ESCAPE_CHAR) {
      encoded += ESCAPE_CHAR + ESCAPE_CHAR;
      i++;
    }
    else {
      let count = 1;
      
      while (i + 1 < chars.length && chars[i + 1] === char) {
        count++;
        i++;
      }
      
      if (count > 1) { 
        encoded += `${count}${char}`;
      } else {
        encoded += char;
      }
      i++;
    }
  }
  return encoded;
}

export async function parse_file(file) {
  const text = await file.text();
  const decoded = decodeRLE(text);
  try {
    return JSON.parse(decoded);
  } catch (e) {
    return decoded;
  }
}

export async function compress_file(file) {
  const text = await file.text();
  return encodeRLE(text);
}