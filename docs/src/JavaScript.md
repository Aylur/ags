If you don't know any JavaScript, this is a quick 5 minute course explaining most things you will need to understand.
# Docs
If you need a more in depth explanation you can look up anything on [developer.mozilla.org](https://developer.mozilla.org/en-US/), everything except for the [dom](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) will apply to gjs.

## Semicolons
Semicolons are optional, as there is [automatic semicolon insertions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#automatic_semicolon_insertion)

## Logging, printing
```js
// in gjs and other runtimes
console.log('hello')

// in gjs
print('hello')
```

## Variables
To define a variable use the `let` or `const` keyword
```js
let someString = 'some-string'
let someNumber = 69
let someBool = true

const array = ['string', 69, true]

const object = {
    key: 'value',
    'key-word': 'value',
}
```

## Flow control
if else
```js
let i = 0
if (i < 0) {
    print('its negative')
}
else if(i > 0) {
    print('its more than 0')
}
else {
    print('its 0')
}
```

while loop
```js
let i = 0
while (i < 5) {
    print(i)
    i++;
}
```

for loop
```js
for (let i = 0; 0 < 5; i++) {
    print(i)
}
```

for of loop
```js
const array = [0, 1, 2, 3, 4]
for (const item of array) {
    print(item)
}
```

## Functions
There are multiple ways to define functions, with the `function` keyword or with [fat arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)


named function
```js
function fn(param1, param2) {
    print(param1, param2)
}
```

nameless function assigned to a const variable
```js
const fn = function(param1, param2) {
    print(param1, param2)
}
```

fat arrow function also known as lambda in other languages
```js
const fn = (param1, param2) => {
    print(param1, param2)
}
```

invoke all of them like any other function
```js
fn('hi', 'mom')
```

default parameter value
```js
function fn(param1, param2 = 'hello') {
    print(param1, param2)
}

fn() // undefined, hello
```

## Destructuring
arrays
```js
const array = [1, 2, 3, 4, 5]
const [elem1, elem2, ...rest] = array
print(elem1, elem2, rest) // 1, 2, [3, 4, 5]
```

objects
```js
const object = {one: 1, two: 2, three: 3, four: 4}
const {one, two, ...rest} = object
print(one, two, rest) // 1, 2, {three: 3, four: 4}
```

useful in function definitions
```js
function fn({ one, two }) {
    print(one, two)
}

fn({ one: 'hello', two: 'mom' }) // hello, mom
fn() // throws error because undefined can't be destructued
```
## Modules
exporting
```js
export default 'hello'
export const hi = 'mom'
export function fn(...params) {
    print(...params)
}
```

importing 
```js
import hi, { string, fn } from './path-to-file.js'
fn(hi, string) // hello, mom
```

## String formatting
use `backticks` and `${}`
```js
const string = 'mom'
const formatted = `hi ${string}`
print(formatted) // hi mom
```