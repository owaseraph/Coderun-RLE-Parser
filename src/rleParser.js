// rleParser.js


const isLetter = (char) => /[a-zA-Z]/.test(char);
const isDigit = (char) => /\d/.test(char);

const ESCAPE_CHAR = '~'; 

//smart decoder
export function decodeRLE(encodedData) {
  let decoded = '';
  let i = 0;

  while (i < encodedData.length) {
    const char = encodedData[i];

    
    if (char === ESCAPE_CHAR) {
      let tempI = i + 1;
      let numStr = '';
      
      while (tempI < encodedData.length && isDigit(encodedData[tempI])) {
        numStr += encodedData[tempI];
        tempI++;
      }

      
      if (numStr.length > 0 && encodedData[tempI] === ':') {
        const count = parseInt(numStr, 10);
        const digitToRepeat = encodedData[tempI + 1]; 
        
        if (digitToRepeat) {
           decoded += digitToRepeat.repeat(count);
           i = tempI + 2; 
        } else {
           i++; 
        }
      } 
      else {
        i++; 
        if (i < encodedData.length) {
          decoded += encodedData[i]; 
          i++;
        }
      }
    }
    else if (isDigit(char)) {
      let numStr = '';
      let tempI = i;
      while (tempI < encodedData.length && isDigit(encodedData[tempI])) {
        numStr += encodedData[tempI];
        tempI++;
      }
      if (tempI < encodedData.length && isLetter(encodedData[tempI])) {
        const count = parseInt(numStr, 10);
        const charToRepeat = encodedData[tempI];
        decoded += charToRepeat.repeat(count);
        i = tempI + 1;
      } else {
        decoded += char;
        i++;
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
  let encoded = '';
  let i = 0;

  while (i < inputData.length) {
    
    if (isDigit(inputData[i])) {
      let char = inputData[i];
      let count = 1;
      
      while (i + 1 < inputData.length && inputData[i + 1] === char) {
        count++;
        i++;
      }
      if (count > 1) {
        encoded += `${ESCAPE_CHAR}${count}:${char}`;
      } 
      else {
        if (i + 1 < inputData.length && isLetter(inputData[i + 1])) {
           encoded += `${ESCAPE_CHAR}${char}`;
        } else {
           encoded += char;
        }
      }
      i++;
    }
    else if (inputData[i] === ESCAPE_CHAR) {
      encoded += ESCAPE_CHAR + ESCAPE_CHAR;
      i++;
    }
    else if (isLetter(inputData[i])) {
       let char = inputData[i];
       let count = 1;
       while (i + 1 < inputData.length && inputData[i + 1] === char) {
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
    else {
      encoded += inputData[i];
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
    throw new Error("Decoded content is not valid JSON");
  }
}

export async function compress_file(file) {
  const text = await file.text();
  return encodeRLE(text);
}