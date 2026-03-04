"use strict";

const userName = 'Luigi Ponsini, Luca Burioli, Lydia Pisani, Andrea Bobò, Perla Madonna Puttana';

// console.log(userName);

const copy = userName;

let names = userName.split(",");
console.log(names);

for(let i=0; i<names.length;i++)
    names[i] = names[i].trim();

//console.log(names);

const acronyms = [];
for(const name in names) {
    let s = name[0].toUpperCase();
    for(let i=0; i<name.length;i++) {
        if (name[i-1] === ' ') {
            s = s + name[i].toUpperCase();
        //console.log(s)
        }
    }
    acronyms.push(s);
}

console.log(acronyms)

