const icsToJson = require('ics-to-json').default;
const fs = require('fs');

const { logsToMsg } = require('./lib/conversion');

const icsData = fs.readFileSync('./input/Calllog.google.com.ics', 'utf-8');
const data = icsToJson(icsData);

const result = logsToMsg(data);

console.log('result', result.length);

if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
}

fs.writeFileSync('./dist/callLogs_google_ics.json', JSON.stringify(result, null, 4));
