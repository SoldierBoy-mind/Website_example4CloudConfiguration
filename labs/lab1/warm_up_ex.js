"use strict";

let word = "gbo";
test(word);

function test(String) {
    let y = String.length;
    if ( y < 2 ) 
        console.log("String too short")

    else if ( y == 2) { 
        let doubleString = String + String;
        console.log(doubleString);

    }

    else if ( y >= 3 ) {
        let newStr = String.substring(0, 2) + String.substring(String.length - 2, String.length);
        console.log(newStr)
    }

}
