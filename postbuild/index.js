const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../dist/styles/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Adjust font paths\
css = css.replace(/url\(\.\.\/\.\.\//g, "url(../");

fs.writeFileSync(cssPath, css);
