
const { readFileSync, writeFileSync } = require('fs');

const data = JSON.parse(readFileSync('./data.json'));
delete data['2022'];


writeFileSync('extract.json', JSON.stringify(data['2020']));
