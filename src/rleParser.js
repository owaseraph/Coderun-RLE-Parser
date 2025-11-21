//@param {string} encodedData //encoded string
//@returns {string} //decoded string

export function decodeRLE(encodedData){
    let decoded ='';
    let i=0;

    while(i<encodedData.length){
        //check for digits
        if(/\d/.test(encodedData[i])){
            //extract number
            let numStr='';
            while(i<encodedData.length && /\d/.test(encodedData[i])){
                numStr+=encodedData[i];
                i++;
            }
            const count = parseInt(numStr,10);
            const char = encodedData[i];

            decoded+=char.repeat(count);
            i++;
        }
        else{
            decoded+=encodedData[i];
            i++;
        }
    }

    return decoded;
}


//parsing the JSON file

export async function parse_file(file){
    const text = await file.text();
    const decodedJson = decodeRLE(text);
    return JSON.parse(decodedJson);
}